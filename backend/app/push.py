"""Web Push (notificações) via VAPID.

As chaves ficam em variáveis de ambiente:
  - VAPID_PUBLIC_KEY  (base64url, também exposta ao frontend)
  - VAPID_PRIVATE_KEY (base64url do valor privado de 32 bytes)
  - VAPID_SUBJECT     (ex: mailto:voce@email.com) — opcional

Sem as chaves configuradas, o push fica desativado silenciosamente (o app
continua funcionando normalmente).
"""
import json
import os

from sqlalchemy.orm import Session

try:
    from py_vapid import Vapid01
    from pywebpush import WebPushException, webpush
    _PUSH_LIB = True
except Exception:  # pragma: no cover - lib ausente
    _PUSH_LIB = False

from .models import PushSubscription

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:questly@example.com")

_vapid = None


def push_enabled() -> bool:
    return bool(_PUSH_LIB and VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY)


def _get_vapid():
    global _vapid
    if _vapid is None:
        _vapid = Vapid01.from_raw(VAPID_PRIVATE_KEY.encode())
    return _vapid


def send_to_user(db: Session, user_id: int, title: str, body: str, url: str = "/") -> None:
    """Envia uma notificação para todas as inscrições do usuário (best-effort)."""
    if not push_enabled():
        return
    payload = json.dumps({"title": title, "body": body, "url": url})
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    dead = []
    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=_get_vapid(),
                vapid_claims={"sub": VAPID_SUBJECT},
                timeout=10,
            )
        except WebPushException as e:
            status = getattr(e.response, "status_code", None)
            if status in (404, 410):  # inscrição expirada/removida
                dead.append(sub)
        except Exception:
            # Falha de rede pontual — ignora (é best-effort).
            pass
    for sub in dead:
        db.delete(sub)
    if dead:
        db.commit()
