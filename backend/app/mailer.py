"""Envio de e-mail — usado na recuperação de senha.

Importante: o Railway (e muitos PaaS) **bloqueiam a saída SMTP** (portas 25/465/
587), então preferimos APIs HTTP (porta 443, não bloqueadas). Ordem de escolha:

1. Resend  — ``RESEND_API_KEY`` (mais simples).
2. Brevo   — ``BREVO_API_KEY`` (permite usar seu próprio e-mail como remetente
             e enviar para qualquer destinatário, sem domínio próprio).
3. SMTP    — ``SMTP_HOST/PORT/USER/PASS`` (só onde a saída SMTP é liberada).

Remetente: ``MAIL_FROM`` (ou ``SMTP_FROM``/``SMTP_USER``). Para o Resend sem domínio
verificado, use ``onboarding@resend.dev``.
"""
import json
import os
import smtplib
import ssl
import urllib.error
import urllib.request
from email.message import EmailMessage


def _from() -> str:
    return os.getenv("MAIL_FROM") or os.getenv("SMTP_FROM") or os.getenv("SMTP_USER") or "onboarding@resend.dev"


def _smtp_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))


def email_enabled() -> bool:
    return bool(os.getenv("RESEND_API_KEY") or os.getenv("BREVO_API_KEY") or _smtp_configured())


def _http_post(url: str, headers: dict, body: dict) -> None:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode(errors='ignore')[:300]}")


def _send_resend(to: str, subject: str, text: str, html: str) -> None:
    _http_post(
        "https://api.resend.com/emails",
        {"Authorization": f"Bearer {os.getenv('RESEND_API_KEY')}"},
        {"from": _from(), "to": [to], "subject": subject, "text": text, "html": html},
    )


def _send_brevo(to: str, subject: str, text: str, html: str) -> None:
    _http_post(
        "https://api.brevo.com/v3/smtp/email",
        {"api-key": os.getenv("BREVO_API_KEY")},
        {
            "sender": {"email": _from(), "name": os.getenv("MAIL_FROM_NAME", "Questly")},
            "to": [{"email": to}],
            "subject": subject,
            "textContent": text,
            "htmlContent": html,
        },
    )


def _send_smtp(to: str, subject: str, text: str, html: str) -> None:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    msg = EmailMessage()
    msg["From"] = _from()
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    ctx = ssl.create_default_context()
    if port == 465:
        with smtplib.SMTP_SSL(host, port, context=ctx, timeout=15) as s:
            s.login(user, password)
            s.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=15) as s:
            s.ehlo()
            s.starttls(context=ctx)
            s.login(user, password)
            s.send_message(msg)


def send_email(to: str, subject: str, text: str, html: str | None = None) -> None:
    html = html or text
    if os.getenv("RESEND_API_KEY"):
        _send_resend(to, subject, text, html)
    elif os.getenv("BREVO_API_KEY"):
        _send_brevo(to, subject, text, html)
    elif _smtp_configured():
        _send_smtp(to, subject, text, html)
    else:
        raise RuntimeError("Nenhum provedor de e-mail configurado.")
