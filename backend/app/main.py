"""API do Questly (FastAPI) — multi-tenant com auth e grupos (Fase 1)."""
import asyncio
import logging
import os
import re
import secrets
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

DEFAULT_TZ = "America/Sao_Paulo"

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from . import ai
from . import mailer
from . import nutrition
from . import scoring
from .auth import (
    create_token,
    generate_invite_code,
    get_current_user,
    google_enabled,
    hash_password,
    hash_token,
    verify_google_token,
    verify_password,
)
from . import push as pushmod
from .data import CATEGORY_EMOJI, DEFAULT_HABITS, FEED_REACTIONS, HABITS_MENU, JOINT_SUGGESTIONS, MOODS
from .database import SessionLocal, get_db
from .models import (
    Activity,
    ActivityReaction,
    DayEntry,
    Goal,
    GoalCheckin,
    Group,
    JointActivity,
    Meal,
    Membership,
    Message,
    PasswordReset,
    PushSubscription,
    ScheduledTask,
    Settings,
    TaskCompletion,
    User,
)
from .schemas import (
    ChallengeProofRequest,
    ForgotPasswordRequest,
    GoalCheckinRequest,
    GoalCreate,
    GoogleAuthRequest,
    GroupCreate,
    GroupJoin,
    ResetPasswordRequest,
    HabitPhotoRequest,
    JointActivityCreate,
    MealCreate,
    MealUpdate,
    ReactRequest,
    WaterRequest,
    TaskCompleteRequest,
    TaskCreate,
    LoginRequest,
    MessageCreate,
    MoodRequest,
    PushSubscribe,
    RegisterRequest,
    RerollRequest,
    SettingsUpdate,
    ToggleRequest,
    UserUpdate,
)

JOINT_ACTIVITY_POINTS = 20  # pontos por atividade em dupla (para cada membro)
from .seed import init_db

# Limite defensivo p/ imagens em data URL (o cliente já reduz antes de enviar).
MAX_IMAGE_CHARS = 3_500_000
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

app = FastAPI(title="Questly API", version="0.3.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# Horas (UTC) em que o lembrete diário dispara. Padrão ≈ 9h e 20h no horário de
# Brasília (UTC-3). Ajuste com a variável REMINDER_HOURS (ex: "12,23").
REMINDER_HOURS = {
    int(h) for h in os.getenv("REMINDER_HOURS", "12,23").split(",") if h.strip().isdigit()
}


def _run_daily_reminders() -> None:
    """Manda um push de lembrete para todo usuário inscrito (best-effort).

    Se o usuário tiver tarefas agendadas pendentes hoje, o texto menciona isso.
    """
    if not pushmod.push_enabled():
        return
    db = SessionLocal()
    try:
        today = date.today()
        user_ids = {row.user_id for row in db.query(PushSubscription).all()}
        for uid in user_ids:
            pending = 0
            for m in db.query(Membership).filter(Membership.user_id == uid).all():
                for t in tasks_due(db, m.group_id, today):
                    done = (
                        db.query(TaskCompletion)
                        .filter(TaskCompletion.task_id == t.id, TaskCompletion.membership_id == m.id, TaskCompletion.date == today)
                        .first()
                    )
                    if not done:
                        pending += 1
            body = (
                f"Você tem {pending} tarefa(s) agendada(s) pra hoje. Bora?"
                if pending
                else "Bora fechar o dia? Seus desafios de hoje te esperam."
            )
            pushmod.send_to_user(db, uid, "Questly", body, "/")
    finally:
        db.close()


async def _reminder_loop() -> None:
    fired: set[tuple[str, int]] = set()
    while True:
        try:
            now = datetime.utcnow()
            key = (now.date().isoformat(), now.hour)
            if now.hour in REMINDER_HOURS and now.minute < 5 and key not in fired:
                fired.add(key)
                if len(fired) > 100:
                    fired.clear()
                    fired.add(key)
                await asyncio.to_thread(_run_daily_reminders)
        except Exception:
            pass
        await asyncio.sleep(60)


def _run_weekly_challenge_batch() -> None:
    """Gera um lote novo de desafios por IA para todos os grupos (best-effort)."""
    if not ai.ai_enabled():
        return
    db = SessionLocal()
    try:
        for s in db.query(Settings).all():
            try:
                regenerate_challenge_pool(db, s, _group_ai_context(db, s.group_id))
            except Exception:
                db.rollback()  # um grupo que falha não derruba os outros
    finally:
        db.close()


async def _weekly_challenge_loop() -> None:
    """Segunda-feira ~06h UTC (≈3h Brasília): renova o lote de desafios por IA."""
    fired: set[str] = set()
    while True:
        try:
            now = datetime.utcnow()
            if now.weekday() == 0 and now.hour == 6 and now.minute < 10:
                key = now.date().isoformat()
                if key not in fired:
                    fired.add(key)
                    if len(fired) > 10:
                        fired.clear()
                        fired.add(key)
                    await asyncio.to_thread(_run_weekly_challenge_batch)
        except Exception:
            pass
        await asyncio.sleep(300)


@app.on_event("startup")
async def _start_reminders() -> None:
    if pushmod.push_enabled() and REMINDER_HOURS:
        asyncio.create_task(_reminder_loop())
    if ai.ai_enabled():
        asyncio.create_task(_weekly_challenge_loop())


# --- helpers genéricos -----------------------------------------------------
def _zone(tz: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(tz or DEFAULT_TZ)
    except (ZoneInfoNotFoundError, ValueError, KeyError):
        return ZoneInfo(DEFAULT_TZ)


def today_of(settings: Settings) -> date:
    """Data de 'hoje' no fuso do grupo (evita o dia virar à meia-noite UTC)."""
    return datetime.now(_zone(getattr(settings, "timezone", None))).date()


def ensure_today(d: date, today: date) -> None:
    """Só permite registrar no dia de hoje (evita 'gaming' com datas passadas/futuras)."""
    if d != today:
        raise HTTPException(400, "Só é possível registrar no dia de hoje.")


def parse_date(value: str | None, default: date | None = None) -> date:
    if not value:
        return default or date.today()
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(400, f"Data inválida: {value!r} (use YYYY-MM-DD).")


def validate_image(image: str | None) -> None:
    if image and len(image) > MAX_IMAGE_CHARS:
        raise HTTPException(413, "Imagem muito grande. Tente uma foto menor.")


def parse_time(value: str | None) -> str | None:
    """Valida e normaliza um horário 'HH:MM' (24h). None/'' → None."""
    if not value or not value.strip():
        return None
    v = value.strip()
    try:
        hh, mm = v.split(":")
        h, m = int(hh), int(mm)
        if not (0 <= h < 24 and 0 <= m < 60):
            raise ValueError
    except ValueError:
        raise HTTPException(400, f"Horário inválido: {value!r} (use HH:MM).")
    return f"{h:02d}:{m:02d}"


def user_public(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "avatar": u.avatar,
        "photo": u.photo,
        "objetivo": u.objetivo,
        "peso": u.peso,
        "altura_cm": u.altura_cm,
        "sexo": u.sexo,
        "idade": u.idade,
        "nivel_atividade": u.nivel_atividade,
        "objetivo_tipo": u.objetivo_tipo,
        "meta_kcal": u.meta_kcal,
        "meta_proteina_g": u.meta_proteina_g,
        "meta_carbo_g": u.meta_carbo_g,
        "meta_gordura_g": u.meta_gordura_g,
        "meta_agua_l": u.meta_agua_l,
        "nutrition_targets": nutrition.compute_targets(u),
    }


# --- helpers de grupo ------------------------------------------------------
def get_membership(db: Session, user: User, group_id: int) -> Membership:
    m = (
        db.query(Membership)
        .filter(Membership.user_id == user.id, Membership.group_id == group_id)
        .first()
    )
    if m is None:
        raise HTTPException(403, "Você não faz parte deste grupo.")
    return m


def get_group_member(db: Session, group_id: int, membership_id: int) -> Membership:
    m = db.get(Membership, membership_id)
    if m is None or m.group_id != group_id:
        raise HTTPException(404, "Membro não encontrado neste grupo.")
    return m


def get_group_settings(db: Session, group_id: int) -> Settings:
    s = db.query(Settings).filter(Settings.group_id == group_id).first()
    if s is None:
        raise HTTPException(500, "Configurações do grupo não inicializadas.")
    return s


def group_members(db: Session, group_id: int) -> list[Membership]:
    return (
        db.query(Membership)
        .filter(Membership.group_id == group_id)
        .order_by(Membership.id)
        .all()
    )


def group_summary(group: Group, role: str, member_count: int) -> dict:
    return {
        "id": group.id,
        "name": group.name,
        "invite_code": group.invite_code,
        "role": role,
        "member_count": member_count,
    }


def joint_points_map(db: Session, group_id: int) -> dict:
    """Pontos de atividades em dupla por data (iguais para todos os membros)."""
    out: dict[str, int] = {}
    for a in db.query(JointActivity).filter(JointActivity.group_id == group_id).all():
        key = a.date.isoformat()
        out[key] = out.get(key, 0) + a.points
    return out


def build_member_days(settings: Settings, membership: Membership, joint_points: dict, today: date) -> list[dict]:
    """Dias do membro com os pontos das atividades em dupla somados."""
    days = scoring.build_days(settings, {e.date: e for e in membership.days}, today)
    for cd in days:
        jp = joint_points.get(cd["date"], 0)
        cd["joint_pts"] = jp
        if jp:
            cd["points"] += jp
            cd["max_points"] += jp
    return days


def member_payload(settings: Settings, membership: Membership, joint_points: dict, today: date) -> dict:
    days = build_member_days(settings, membership, joint_points, today)
    stats = scoring.player_stats(settings, days, today)
    today_cd = next((cd for cd in days if cd["date"] == today.isoformat()), None)
    u = membership.user
    return {
        "id": membership.id,
        "user_id": u.id,
        "name": u.name,
        "avatar": u.avatar,
        "photo": u.photo,
        "objetivo": u.objetivo,
        "peso": u.peso,
        "role": membership.role,
        "stats": stats,
        "today": today_cd,
    }


def get_or_create_entry(db: Session, membership: Membership, d: date) -> DayEntry:
    entry = next((e for e in membership.days if e.date == d), None)
    if entry is None:
        entry = DayEntry(membership_id=membership.id, date=d, habits_done=[])
        db.add(entry)
        db.flush()
    return entry


def casal_perfect_days(settings: Settings, members: list[Membership], today: date) -> int:
    """Datas em que TODOS os membros tiveram dia perfeito."""
    if len(members) < 2:
        return 0
    per = [
        {cd["date"]: cd["perfect"] for cd in scoring.build_days(settings, {e.date: e for e in m.days}, today)}
        for m in members
    ]
    dates = set(per[0])
    for pp in per[1:]:
        dates &= set(pp)
    return sum(1 for d in dates if all(pp.get(d) for pp in per))


def serialize_message(m: Message, members_by_id: dict) -> dict:
    mem = members_by_id.get(m.membership_id)
    u = mem.user if mem else None
    return {
        "id": m.id,
        "membership_id": m.membership_id,
        "player_id": m.membership_id,  # compat com o frontend antigo
        "name": u.name if u else "?",
        "avatar": u.avatar if u else "❓",
        "photo": u.photo if u else None,
        "text": m.text,
        "image": m.image,
        "created_at": m.created_at.isoformat() + "Z",
    }


def notify_group_others(db: Session, group_id: int, actor_user_id: int, title: str, body: str, url: str = "/") -> None:
    """Envia push para os demais membros do grupo (menos quem disparou a ação)."""
    if not pushmod.push_enabled():
        return
    rows = db.query(Membership).filter(Membership.group_id == group_id).all()
    for uid in {m.user_id for m in rows if m.user_id != actor_user_id}:
        pushmod.send_to_user(db, uid, title, body, url)


def upsert_activity(db: Session, gid: int, membership: Membership, kind: str, emoji: str, text: str,
                    ref: str | None = None, image: str | None = None, day: date | None = None) -> None:
    """Registra/atualiza um evento no feed. Com `ref`, faz upsert por dia
    (evita duplicar ao remarcar o mesmo item) e sobe o evento pro topo."""
    day = day or date.today()
    existing = None
    if ref:
        existing = (
            db.query(Activity)
            .filter(Activity.group_id == gid, Activity.membership_id == membership.id,
                    Activity.ref == ref, Activity.day == day)
            .first()
        )
    if existing:
        existing.emoji = emoji
        existing.text = text
        existing.image = image
        existing.created_at = datetime.utcnow()
    else:
        db.add(Activity(group_id=gid, membership_id=membership.id, kind=kind, emoji=emoji,
                        text=text, image=image, ref=ref, day=day))
    db.commit()


def _purge_activity_reactions(db: Session, activity_query) -> None:
    """Apaga as reações dos itens de feed prestes a serem removidos."""
    ids = [a.id for a in activity_query.all()]
    if ids:
        db.query(ActivityReaction).filter(ActivityReaction.activity_id.in_(ids)).delete(synchronize_session=False)


def remove_activity(db: Session, gid: int, membership: Membership, ref: str, day: date | None = None) -> None:
    day = day or date.today()
    q = db.query(Activity).filter(
        Activity.group_id == gid, Activity.membership_id == membership.id,
        Activity.ref == ref, Activity.day == day,
    )
    _purge_activity_reactions(db, q)
    q.delete(synchronize_session=False)
    db.commit()


def remove_activities_by_ref(db: Session, gid: int, ref: str) -> None:
    """Remove do feed TODOS os eventos com este ref (qualquer membro/dia).

    Usado quando o item de origem é excluído (tarefa agendada, atividade em dupla),
    para que ele não continue aparecendo no feed."""
    q = db.query(Activity).filter(Activity.group_id == gid, Activity.ref == ref)
    _purge_activity_reactions(db, q)
    q.delete(synchronize_session=False)
    db.commit()


def reactions_map(db: Session, activity_ids: list[int], me_id: int) -> dict:
    """Para cada activity: {counts: {key: n}, mine: key|None, total: n}."""
    out = {aid: {"counts": {}, "mine": None, "total": 0} for aid in activity_ids}
    if not activity_ids:
        return out
    for r in db.query(ActivityReaction).filter(ActivityReaction.activity_id.in_(activity_ids)).all():
        e = out.get(r.activity_id)
        if e is None:
            continue
        e["counts"][r.reaction] = e["counts"].get(r.reaction, 0) + 1
        e["total"] += 1
        if r.membership_id == me_id:
            e["mine"] = r.reaction
    return out


def serialize_activity(a: Activity, members_by_id: dict, reactions: dict | None = None) -> dict:
    mem = members_by_id.get(a.membership_id)
    u = mem.user if mem else None
    return {
        "id": a.id,
        "kind": a.kind,
        "emoji": a.emoji,
        "text": a.text,
        "image": a.image,
        "author": u.name if u else "?",
        "avatar": u.avatar if u else "❓",
        "photo": u.photo if u else None,
        "day": a.day.isoformat() if a.day else None,
        "created_at": a.created_at.isoformat() + "Z",
        "reactions": (reactions or {}).get(a.id) or {"counts": {}, "mine": None, "total": 0},
    }


def _ai_pool_count(s: Settings) -> int:
    pool = getattr(s, "challenge_pool", None) or {}
    if not isinstance(pool, dict):
        return 0
    return sum(len(v) for cat in pool.values() if isinstance(cat, dict) for v in cat.values() if isinstance(v, list))


def settings_public(s: Settings) -> dict:
    updated = getattr(s, "challenge_pool_updated", None)
    return {
        "timezone": getattr(s, "timezone", None) or DEFAULT_TZ,
        "start_date": s.start_date.isoformat(),
        "duration_days": s.duration_days,
        "water_goal_l": s.water_goal_l,
        "steps_goal": s.steps_goal,
        "protein_goal_g": s.protein_goal_g,
        "calories_goal": s.calories_goal,
        "sleep_goal_h": s.sleep_goal_h,
        "rest_days": s.rest_days,
        "spiritual_enabled": s.spiritual_enabled,
        "surprise_frequency": s.surprise_frequency,
        "fixed_habits": s.fixed_habits,
        "habits_menu": HABITS_MENU,
        "ai_enabled": ai.ai_enabled(),
        "ai_pool_count": _ai_pool_count(s),
        "ai_pool_updated": updated.isoformat() + "Z" if updated else None,
    }


# --- rotas: saúde ----------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


# --- rotas: push -----------------------------------------------------------
@app.get("/api/push/key")
def push_key():
    return {"enabled": pushmod.push_enabled(), "public_key": pushmod.VAPID_PUBLIC_KEY}


@app.post("/api/push/subscribe")
def push_subscribe(payload: PushSubscribe, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == payload.endpoint).first()
    if existing:
        existing.user_id = user.id
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
    else:
        db.add(PushSubscription(
            user_id=user.id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth,
        ))
    db.commit()
    return {"ok": True}


@app.post("/api/push/unsubscribe")
def push_unsubscribe(payload: PushSubscribe, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == payload.endpoint, PushSubscription.user_id == user.id
    ).delete()
    db.commit()
    return {"ok": True}


# --- rotas: auth -----------------------------------------------------------
@app.post("/api/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "E-mail inválido.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Já existe uma conta com esse e-mail.")
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
        avatar=payload.avatar or "",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id), "user": user_public(user)}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "E-mail ou senha incorretos.")
    return {"token": create_token(user.id), "user": user_public(user)}


@app.get("/api/auth/config")
def auth_config():
    """Config pública da tela de login (o front usa para mostrar o botão Google)."""
    return {
        "google_enabled": google_enabled(),
        "google_client_id": os.getenv("GOOGLE_CLIENT_ID") or None,
        "email_enabled": mailer.email_enabled(),
    }


@app.post("/api/auth/google")
def google_login(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Login/cadastro com Google: valida o ID token e acha-ou-cria o usuário."""
    data = verify_google_token(payload.credential)
    sub = str(data["sub"])
    email = (data.get("email") or "").strip().lower()
    user = db.query(User).filter(User.google_sub == sub).first()
    if user is None:
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            user.google_sub = sub  # vincula ao login e-mail/senha existente
        else:
            user = User(
                email=email,
                password_hash=hash_password(secrets.token_urlsafe(24)),  # senha aleatória (não usada)
                google_sub=sub,
                name=(data.get("name") or email.split("@")[0]).strip()[:60],
                avatar="",
                photo=data.get("picture") or None,
            )
            db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id), "user": user_public(user)}


def _app_base_url(request: Request) -> str:
    base = os.getenv("APP_BASE_URL")
    if base:
        return base.rstrip("/")
    return str(request.base_url).rstrip("/")


@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Gera um link de redefinição e envia por e-mail. Resposta genérica (não revela
    se o e-mail existe)."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is not None:
        token = secrets.token_urlsafe(32)
        db.add(PasswordReset(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=datetime.utcnow() + timedelta(hours=1),
        ))
        db.commit()
        link = f"{_app_base_url(request)}/reset?token={token}"
        subject = "Redefinição de senha — Questly"
        text = (
            f"Olá!\n\nRecebemos um pedido para redefinir sua senha no Questly.\n"
            f"Abra o link abaixo (válido por 1 hora):\n\n{link}\n\n"
            f"Se não foi você, pode ignorar este e-mail."
        )
        html = (
            f"<p>Olá!</p><p>Recebemos um pedido para redefinir sua senha no <b>Questly</b>.</p>"
            f"<p><a href=\"{link}\">Clique aqui para criar uma nova senha</a> (válido por 1 hora).</p>"
            f"<p style=\"color:#888;font-size:13px\">Se não foi você, pode ignorar este e-mail.</p>"
        )
        if mailer.email_enabled():
            try:
                mailer.send_email(user.email, subject, text, html)
            except Exception as e:  # noqa: BLE001
                logging.getLogger(__name__).warning("Falha ao enviar e-mail de reset: %s", e)
        else:
            # Sem SMTP configurado: registra no log do servidor (só o dono vê).
            logging.getLogger(__name__).warning("[reset] SMTP off — link para %s: %s", user.email, link)
    return {"ok": True}


@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Valida o token, troca a senha e já devolve uma sessão (auto-login)."""
    row = (
        db.query(PasswordReset)
        .filter(PasswordReset.token_hash == hash_token(payload.token), PasswordReset.used == False)  # noqa: E712
        .order_by(PasswordReset.id.desc())
        .first()
    )
    if row is None or row.expires_at < datetime.utcnow():
        raise HTTPException(400, "Link inválido ou expirado. Peça um novo.")
    user = db.get(User, row.user_id)
    if user is None:
        raise HTTPException(400, "Usuário não encontrado.")
    user.password_hash = hash_password(payload.password)
    row.used = True
    # Invalida outros pedidos pendentes do mesmo usuário.
    db.query(PasswordReset).filter(
        PasswordReset.user_id == user.id, PasswordReset.used == False  # noqa: E712
    ).update({"used": True})
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id), "user": user_public(user)}


@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    groups = []
    for m in db.query(Membership).filter(Membership.user_id == user.id).order_by(Membership.id).all():
        count = db.query(Membership).filter(Membership.group_id == m.group_id).count()
        groups.append(group_summary(m.group, m.role, count))
    return {"user": user_public(user), "groups": groups}


@app.put("/api/users/me")
def update_me(payload: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    if "photo" in data:
        validate_image(data["photo"])
    # Normaliza os campos de perfil (valores fora do conjunto viram None).
    if "sexo" in data:
        sx = (data["sexo"] or "").upper()
        data["sexo"] = sx if sx in ("M", "F") else None
    if "nivel_atividade" in data and data["nivel_atividade"] not in nutrition.ACTIVITY_FACTORS:
        data["nivel_atividade"] = None
    if "objetivo_tipo" in data and data["objetivo_tipo"] not in ("perder", "manter", "ganhar"):
        data["objetivo_tipo"] = None
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user_public(user)


# --- rotas: grupos ---------------------------------------------------------
@app.get("/api/groups")
def list_groups(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    out = []
    for m in db.query(Membership).filter(Membership.user_id == user.id).order_by(Membership.id).all():
        count = db.query(Membership).filter(Membership.group_id == m.group_id).count()
        out.append(group_summary(m.group, m.role, count))
    return {"groups": out}


@app.post("/api/groups")
def create_group(payload: GroupCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = generate_invite_code()
    while db.query(Group).filter(Group.invite_code == code).first():
        code = generate_invite_code()
    group = Group(name=payload.name.strip(), invite_code=code)
    db.add(group)
    db.flush()
    db.add(Settings(group_id=group.id, start_date=date.today(), duration_days=30, fixed_habits=DEFAULT_HABITS))
    db.add(Membership(user_id=user.id, group_id=group.id, role="owner"))
    db.commit()
    db.refresh(group)
    return group_summary(group, "owner", 1)


@app.post("/api/groups/join")
def join_group(payload: GroupJoin, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = payload.invite_code.strip().upper()
    group = db.query(Group).filter(Group.invite_code == code).first()
    if group is None:
        raise HTTPException(404, "Código de convite inválido.")
    existing = get_membership_or_none(db, user, group.id)
    if existing is None:
        db.add(Membership(user_id=user.id, group_id=group.id, role="member"))
        db.commit()
    count = db.query(Membership).filter(Membership.group_id == group.id).count()
    role = existing.role if existing else "member"
    return group_summary(group, role, count)


def get_membership_or_none(db: Session, user: User, group_id: int) -> Membership | None:
    return (
        db.query(Membership)
        .filter(Membership.user_id == user.id, Membership.group_id == group_id)
        .first()
    )


# --- rotas: grupo (config) -------------------------------------------------
@app.get("/api/groups/{gid}/settings")
def read_settings(gid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    return settings_public(get_group_settings(db, gid))


@app.put("/api/groups/{gid}/settings")
def update_settings(gid: int, payload: SettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    data = payload.model_dump(exclude_unset=True)
    if data.get("timezone"):
        try:
            ZoneInfo(data["timezone"])
        except (ZoneInfoNotFoundError, ValueError, KeyError):
            raise HTTPException(400, f"Fuso horário inválido: {data['timezone']!r}.")
    if "fixed_habits" in data and data["fixed_habits"] is not None:
        data["fixed_habits"] = [h.model_dump() if hasattr(h, "model_dump") else h for h in payload.fixed_habits]
    for field, value in data.items():
        setattr(s, field, value)
    db.commit()
    return settings_public(s)


# --- rotas: grupo (desafios/dia) -------------------------------------------
@app.get("/api/groups/{gid}/challenges/today")
def challenges_today(gid: int, day: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    d = parse_date(day, today_of(s))
    return {
        "date": d.isoformat(),
        "day_number": scoring.day_number(s, d),
        "duration_days": s.duration_days,
        "challenges": scoring.daily_challenges(s, d),
        "motd": scoring.motd(d),
    }


def _group_ai_context(db: Session, gid: int) -> str | None:
    """Contexto leve (objetivos dos membros) para personalizar o lote de desafios."""
    goals = [m.user.objetivo for m in group_members(db, gid) if m.user and m.user.objetivo]
    return "; ".join(dict.fromkeys(g.strip() for g in goals if g and g.strip())) or None


def regenerate_challenge_pool(db: Session, s: Settings, context: str | None = None) -> int:
    """Gera um novo lote de desafios por IA e o guarda em ``settings.challenge_pool``.

    Substitui o lote anterior (os fixos continuam via merge). Retorna a quantidade
    gerada. Levanta exceção em erro — o chamador decide como reportar.
    """
    cats = scoring.active_categories(s)
    pool = ai.generate_challenge_pool(cats, per_diff=6, context=context)
    s.challenge_pool = pool
    s.challenge_pool_updated = datetime.utcnow()
    db.commit()
    return _ai_pool_count(s)


@app.post("/api/groups/{gid}/challenges/generate")
def generate_challenges(gid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Gera um novo lote de desafios por IA (só o dono do grupo)."""
    m = get_membership(db, user, gid)
    if m.role != "owner":
        raise HTTPException(403, "Só o dono do grupo pode gerar novos desafios.")
    if not ai.ai_enabled():
        raise HTTPException(503, "Geração por IA indisponível (configure GROQ_API_KEY ou OPENAI_API_KEY no servidor).")
    s = get_group_settings(db, gid)
    try:
        count = regenerate_challenge_pool(db, s, _group_ai_context(db, gid))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"Falha ao gerar desafios: {e}")
    return {"ok": True, "count": count, **settings_public(s)}


@app.get("/api/groups/{gid}/members/{mid}")
def read_member(gid: int, mid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    membership = get_group_member(db, gid, mid)
    s = get_group_settings(db, gid)
    return member_payload(s, membership, joint_points_map(db, gid), today_of(s))


@app.get("/api/groups/{gid}/day/{mid}")
def read_day(gid: int, mid: int, day: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    membership = get_group_member(db, gid, mid)
    s = get_group_settings(db, gid)
    d = parse_date(day, today_of(s))
    entry = next((e for e in membership.days if e.date == d), None)
    return scoring.compute_day(s, entry, d)


def _day_result(db: Session, settings: Settings, membership: Membership, entry: DayEntry, d: date):
    db.commit()
    db.refresh(membership)
    today = today_of(settings)
    joint = joint_points_map(db, membership.group_id)
    days = build_member_days(settings, membership, joint, today)
    day_cd = scoring.compute_day(settings, entry, d)
    day_cd["joint_pts"] = joint.get(d.isoformat(), 0)
    if day_cd["joint_pts"]:
        day_cd["points"] += day_cd["joint_pts"]
        day_cd["max_points"] += day_cd["joint_pts"]
    return {"day": day_cd, "stats": scoring.player_stats(settings, days, today)}


def _habit_info(settings: Settings, key: str) -> dict:
    for h in (settings.fixed_habits or DEFAULT_HABITS):
        if h.get("key") == key:
            return h
    return {"key": key, "label": key, "emoji": "✅"}


@app.post("/api/groups/{gid}/day/toggle")
def toggle(gid: int, req: ToggleRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    d = parse_date(req.date, today)
    ensure_today(d, today)
    if not req.habit_key:
        raise HTTPException(400, "habit_key é obrigatório.")
    entry = get_or_create_entry(db, membership, d)
    current = list(entry.habits_done or [])
    h = _habit_info(s, req.habit_key)
    ref = f"habit:{req.habit_key}"
    if req.habit_key in current:
        current.remove(req.habit_key)
        # Ao desmarcar, remove a foto-prova associada e o item do feed.
        proofs = dict(entry.habit_proofs or {})
        if proofs.pop(req.habit_key, None) is not None:
            entry.habit_proofs = proofs
        entry.habits_done = current
        result = _day_result(db, s, membership, entry, d)
        remove_activity(db, gid, membership, ref, day=d)
        return result
    current.append(req.habit_key)
    entry.habits_done = current
    result = _day_result(db, s, membership, entry, d)
    # Hábito concluído → vai pro feed (com foto, se houver).
    img = (entry.habit_proofs or {}).get(req.habit_key)
    upsert_activity(db, gid, membership, "habit", h.get("emoji", "✅"),
                    f"{membership.user.name} cumpriu: {h.get('label', req.habit_key)}",
                    ref=ref, image=img, day=d)
    return result


@app.post("/api/groups/{gid}/day/habit-photo")
def set_habit_photo(gid: int, req: HabitPhotoRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Anexa (ou remove) a foto-prova de um hábito. Com foto, o hábito vale +2."""
    validate_image(req.image)
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    d = parse_date(req.date, today)
    ensure_today(d, today)
    entry = get_or_create_entry(db, membership, d)
    proofs = dict(entry.habit_proofs or {})
    if req.image:
        proofs[req.habit_key] = req.image
        # Anexar foto marca o hábito como feito.
        if req.habit_key not in (entry.habits_done or []):
            entry.habits_done = list(entry.habits_done or []) + [req.habit_key]
    else:
        proofs.pop(req.habit_key, None)
    entry.habit_proofs = proofs
    result = _day_result(db, s, membership, entry, d)
    # Mantém o item do feed em sincronia com a foto (se o hábito está feito).
    if req.habit_key in (entry.habits_done or []):
        h = _habit_info(s, req.habit_key)
        upsert_activity(db, gid, membership, "habit", h.get("emoji", "✅"),
                        f"{membership.user.name} cumpriu: {h.get('label', req.habit_key)}",
                        ref=f"habit:{req.habit_key}", image=req.image, day=d)
    return result


@app.post("/api/groups/{gid}/day/mood")
def set_mood(gid: int, req: MoodRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    valid = {m["key"] for m in MOODS}
    moods = [m for m in dict.fromkeys(req.moods) if m in valid]  # únicos e válidos
    today = today_of(s)
    d = parse_date(req.date, today)
    ensure_today(d, today)
    entry = get_or_create_entry(db, membership, d)
    entry.moods = moods
    entry.mood_note = (req.note or "").strip() or None
    return _day_result(db, s, membership, entry, d)


@app.post("/api/groups/{gid}/day/challenge")
def set_challenge(gid: int, req: ChallengeProofRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Conclui (ou desfaz) o desafio de uma área. Só pontua com foto-prova."""
    validate_image(req.image)
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    if req.category not in scoring.active_categories(s):
        raise HTTPException(400, "Área inválida.")
    today = today_of(s)
    d = parse_date(req.date, today)
    ensure_today(d, today)
    entry = get_or_create_entry(db, membership, d)
    was_done = bool((entry.challenge_proofs or {}).get(req.category))
    proofs = dict(entry.challenge_proofs or {})
    together = dict(entry.challenge_together or {})
    if req.image:
        proofs[req.category] = req.image
        if req.together:
            together[req.category] = True
        else:
            together.pop(req.category, None)
    else:
        proofs.pop(req.category, None)
        together.pop(req.category, None)
    entry.challenge_proofs = proofs
    entry.challenge_together = together
    result = _day_result(db, s, membership, entry, d)

    ref = f"challenge:{req.category}"
    emoji = CATEGORY_EMOJI.get(req.category, "🎯")
    if req.image:
        extra = " (juntos 💞)" if req.together else ""
        text = f"{membership.user.name} fechou o desafio de {req.category}!{extra}"
        upsert_activity(db, gid, membership, "challenge", emoji, text, ref=ref, image=req.image, day=d)
        if not was_done:
            notify_group_others(db, gid, membership.user_id, membership.group.name, f"{emoji} {text}", "/")
    else:
        remove_activity(db, gid, membership, ref, day=d)
    return result


@app.post("/api/groups/{gid}/day/reroll")
def reroll_challenge(gid: int, req: RerollRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Troca o desafio de uma área (limite de trocas por dia)."""
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    if req.category not in scoring.active_categories(s):
        raise HTTPException(400, "Área inválida.")
    today = today_of(s)
    d = parse_date(req.date, today)
    ensure_today(d, today)
    entry = get_or_create_entry(db, membership, d)
    if (entry.challenge_proofs or {}).get(req.category):
        raise HTTPException(400, "Desafio já concluído — não dá para trocar.")
    rerolls = dict(entry.challenge_rerolls or {})
    used = sum(1 for v in rerolls.values() if v)
    if not rerolls.get(req.category) and used >= scoring.MAX_REROLLS:
        raise HTTPException(400, "Você já usou sua troca de hoje.")
    rerolls[req.category] = int(rerolls.get(req.category, 0)) + 1
    entry.challenge_rerolls = rerolls
    return _day_result(db, s, membership, entry, d)


# --- rotas: grupo (atividades em dupla) ------------------------------------
def serialize_joint(a: JointActivity, members_by_id: dict) -> dict:
    mem = members_by_id.get(a.created_by)
    return {
        "id": a.id,
        "date": a.date.isoformat(),
        "label": a.label,
        "emoji": a.emoji,
        "icon": a.icon,
        "points": a.points,
        "image": a.image,
        "created_by": a.created_by,
        "author": mem.user.name if mem else "?",
    }


@app.get("/api/groups/{gid}/joint")
def list_joint(gid: int, day: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    d = parse_date(day, today_of(get_group_settings(db, gid)))
    members_by_id = {m.id: m for m in group_members(db, gid)}
    rows = (
        db.query(JointActivity)
        .filter(JointActivity.group_id == gid, JointActivity.date == d)
        .order_by(JointActivity.id)
        .all()
    )
    return {
        "date": d.isoformat(),
        "points_each": JOINT_ACTIVITY_POINTS,
        "activities": [serialize_joint(a, members_by_id) for a in rows],
        "suggestions": JOINT_SUGGESTIONS,
    }


@app.post("/api/groups/{gid}/joint")
def create_joint(gid: int, payload: JointActivityCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    validate_image(payload.image)
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    d = parse_date(payload.date, today)
    ensure_today(d, today)
    a = JointActivity(
        group_id=gid,
        date=d,
        label=payload.label.strip(),
        emoji=(payload.emoji or "💞").strip() or "💞",
        icon=payload.icon,
        points=JOINT_ACTIVITY_POINTS,
        image=payload.image,
        created_by=membership.id,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    text = f"{membership.user.name} registrou em dupla: {a.label} (+{a.points} pra vocês!)"
    upsert_activity(db, gid, membership, "joint", a.emoji, text, ref=f"joint:{a.id}", image=a.image, day=d)
    notify_group_others(db, gid, membership.user_id, membership.group.name, f"💞 {text}", "/")
    return serialize_joint(a, {membership.id: membership})


@app.delete("/api/groups/{gid}/joint/{aid}")
def delete_joint(gid: int, aid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    a = db.get(JointActivity, aid)
    if a is None or a.group_id != gid:
        raise HTTPException(404, "Atividade não encontrada.")
    db.delete(a)
    db.commit()
    remove_activities_by_ref(db, gid, f"joint:{aid}")  # tira do feed também
    return {"ok": True}


# --- rotas: grupo (metas mensais) ------------------------------------------
def _goal_member_progress(db: Session, goal: Goal, membership: Membership, today: date) -> dict:
    dates = {
        c.date
        for c in db.query(GoalCheckin).filter(
            GoalCheckin.goal_id == goal.id, GoalCheckin.membership_id == membership.id
        ).all()
    }
    window_end = goal.start_date + timedelta(days=goal.duration_days)
    count = sum(1 for d in dates if goal.start_date <= d < window_end)
    i = today if today in dates else today - timedelta(days=1)
    streak = 0
    while i in dates and i >= goal.start_date:
        streak += 1
        i -= timedelta(days=1)
    return {
        "membership_id": membership.id,
        "name": membership.user.name,
        "count": count,
        "streak": streak,
        "done": count >= goal.duration_days,
        "checked_today": today in dates,
    }


def serialize_goal(db: Session, goal: Goal, members: list[Membership], me: Membership, today: date) -> dict:
    elapsed = (today - goal.start_date).days + 1
    progress = [_goal_member_progress(db, goal, m, today) for m in members]
    mine = next((p for p in progress if p["membership_id"] == me.id), None)
    return {
        "id": goal.id,
        "title": goal.title,
        "emoji": goal.emoji,
        "icon": goal.icon,
        "duration_days": goal.duration_days,
        "start_date": goal.start_date.isoformat(),
        "day_index": min(max(1, elapsed), goal.duration_days),
        "days_left": max(0, goal.duration_days - elapsed),
        "ended": elapsed > goal.duration_days,
        "members": progress,
        "me": mine,
    }


def active_goals(db: Session, gid: int) -> list[Goal]:
    return (
        db.query(Goal)
        .filter(Goal.group_id == gid, Goal.active == True)  # noqa: E712
        .order_by(Goal.id)
        .all()
    )


@app.get("/api/groups/{gid}/goals")
def list_goals(gid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    members = group_members(db, gid)
    today = today_of(get_group_settings(db, gid))
    return {"goals": [serialize_goal(db, g, members, me, today) for g in active_goals(db, gid)]}


@app.post("/api/groups/{gid}/goals")
def create_goal(gid: int, payload: GoalCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    today = today_of(get_group_settings(db, gid))
    goal = Goal(
        group_id=gid,
        title=payload.title.strip(),
        emoji=(payload.emoji or "🎯").strip() or "🎯",
        icon=payload.icon,
        start_date=today,
        duration_days=payload.duration_days,
        created_by=me.id,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return serialize_goal(db, goal, group_members(db, gid), me, today)


@app.post("/api/groups/{gid}/goals/{goal_id}/checkin")
def goal_checkin(gid: int, goal_id: int, req: GoalCheckinRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    goal = db.get(Goal, goal_id)
    if goal is None or goal.group_id != gid:
        raise HTTPException(404, "Meta não encontrada.")
    today = today_of(get_group_settings(db, gid))
    d = parse_date(req.date, today)
    ensure_today(d, today)
    existing = (
        db.query(GoalCheckin)
        .filter(GoalCheckin.goal_id == goal_id, GoalCheckin.membership_id == me.id, GoalCheckin.date == d)
        .first()
    )
    if existing:
        db.delete(existing)
    else:
        db.add(GoalCheckin(goal_id=goal_id, membership_id=me.id, date=d))
    db.commit()
    return serialize_goal(db, goal, group_members(db, gid), me, today)


@app.delete("/api/groups/{gid}/goals/{goal_id}")
def end_goal(gid: int, goal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    goal = db.get(Goal, goal_id)
    if goal is None or goal.group_id != gid:
        raise HTTPException(404, "Meta não encontrada.")
    goal.active = False
    db.commit()
    return {"ok": True}


# --- rotas: grupo (tarefas agendadas) --------------------------------------
def _task_due(task: ScheduledTask, d: date) -> bool:
    if task.kind == "once":
        return task.date == d
    # weekly: weekdays em convenção JS (0=Dom..6=Sáb)
    return ((d.weekday() + 1) % 7) in (task.weekdays or [])


def serialize_task(db: Session, task: ScheduledTask, members: list[Membership], me: Membership, d: date) -> dict:
    done_rows = db.query(TaskCompletion).filter(TaskCompletion.task_id == task.id, TaskCompletion.date == d).all()
    done_by = {r.membership_id for r in done_rows}
    my_image = next((r.image for r in done_rows if r.membership_id == me.id), None)
    return {
        "id": task.id,
        "title": task.title,
        "emoji": task.emoji,
        "icon": task.icon,
        "kind": task.kind,
        "date": task.date.isoformat() if task.date else None,
        "time": getattr(task, "time", None),
        "weekdays": task.weekdays or [],
        "due": _task_due(task, d),
        "checked_today": me.id in done_by,
        "image": my_image,
        "members_done": [{"name": m.user.name, "done": m.id in done_by} for m in members],
    }


def _task_sort_key(t: ScheduledTask):
    """Ordena por horário (as sem horário vão para o fim), depois por id."""
    return (getattr(t, "time", None) or "99:99", t.id)


def tasks_due(db: Session, gid: int, d: date) -> list[ScheduledTask]:
    rows = (
        db.query(ScheduledTask)
        .filter(ScheduledTask.group_id == gid, ScheduledTask.active == True)  # noqa: E712
        .all()
    )
    return sorted((t for t in rows if _task_due(t, d)), key=_task_sort_key)


@app.get("/api/groups/{gid}/tasks")
def list_tasks(gid: int, day: str | None = None, all: bool = False, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    members = group_members(db, gid)
    d = parse_date(day, today_of(get_group_settings(db, gid)))
    if all:
        rows = (
            db.query(ScheduledTask)
            .filter(ScheduledTask.group_id == gid, ScheduledTask.active == True)  # noqa: E712
            .order_by(ScheduledTask.id)
            .all()
        )
    else:
        rows = tasks_due(db, gid, d)
    return {"date": d.isoformat(), "tasks": [serialize_task(db, t, members, me, d) for t in rows]}


@app.post("/api/groups/{gid}/tasks")
def create_task(gid: int, payload: TaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    if payload.kind == "once" and not payload.date:
        raise HTTPException(400, "Data obrigatória para tarefa única.")
    if payload.kind == "weekly" and not payload.weekdays:
        raise HTTPException(400, "Selecione ao menos um dia da semana.")
    task = ScheduledTask(
        group_id=gid,
        title=payload.title.strip(),
        emoji=(payload.emoji or "🗓️").strip() or "🗓️",
        icon=payload.icon,
        kind=payload.kind,
        date=parse_date(payload.date) if (payload.kind == "once" and payload.date) else None,
        time=parse_time(payload.time),
        weekdays=sorted(set(payload.weekdays)) if payload.kind == "weekly" else [],
        created_by=me.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return serialize_task(db, task, group_members(db, gid), me, today_of(get_group_settings(db, gid)))


@app.post("/api/groups/{gid}/tasks/{task_id}/complete")
def complete_task(gid: int, task_id: int, req: TaskCompleteRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    validate_image(req.image)
    me = get_membership(db, user, gid)
    task = db.get(ScheduledTask, task_id)
    if task is None or task.group_id != gid:
        raise HTTPException(404, "Tarefa não encontrada.")
    today = today_of(get_group_settings(db, gid))
    d = parse_date(req.date, today)
    ensure_today(d, today)
    existing = (
        db.query(TaskCompletion)
        .filter(TaskCompletion.task_id == task_id, TaskCompletion.membership_id == me.id, TaskCompletion.date == d)
        .first()
    )
    ref = f"task:{task_id}"
    # Toggle: se já concluída e não veio foto nova, desfaz; senão marca/atualiza.
    if existing and not req.image:
        db.delete(existing)
        db.commit()
        remove_activity(db, gid, me, ref, day=d)
        return serialize_task(db, task, group_members(db, gid), me, d)
    if existing:
        existing.image = req.image
    else:
        db.add(TaskCompletion(task_id=task_id, membership_id=me.id, date=d, image=req.image))
    db.commit()
    upsert_activity(db, gid, me, "task", task.emoji, f"{me.user.name} concluiu a tarefa: {task.title}",
                    ref=ref, image=req.image, day=d)
    return serialize_task(db, task, group_members(db, gid), me, d)


@app.delete("/api/groups/{gid}/tasks/{task_id}")
def delete_task(gid: int, task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    task = db.get(ScheduledTask, task_id)
    if task is None or task.group_id != gid:
        raise HTTPException(404, "Tarefa não encontrada.")
    task.active = False
    # Some da UI: tira as conclusões (some do Mural) e os eventos do feed.
    db.query(TaskCompletion).filter(TaskCompletion.task_id == task_id).delete()
    db.commit()
    remove_activities_by_ref(db, gid, f"task:{task_id}")
    return {"ok": True}


# --- rotas: grupo (contador de calorias por foto) --------------------------
def serialize_meal(m: Meal) -> dict:
    return {
        "id": m.id,
        "membership_id": m.membership_id,
        "date": m.date.isoformat(),
        "label": m.label,
        "calories": m.calories,
        "protein_g": m.protein_g,
        "carbs_g": m.carbs_g,
        "fat_g": m.fat_g,
        "image": m.image,
        "confidence": m.ai_confidence,
    }


def meals_of(db: Session, gid: int, membership_id: int, d: date) -> list[Meal]:
    return (
        db.query(Meal)
        .filter(Meal.group_id == gid, Meal.membership_id == membership_id, Meal.date == d)
        .order_by(Meal.id)
        .all()
    )


def nutrition_payload(db: Session, gid: int, membership: Membership, d: date, s: Settings) -> dict:
    rows = meals_of(db, gid, membership.id, d)
    t = nutrition.compute_targets(membership.user, s)
    tg = t["targets"]
    entry = (
        db.query(DayEntry)
        .filter(DayEntry.membership_id == membership.id, DayEntry.date == d)
        .first()
    )
    water_ml = (entry.water_ml or 0) if entry else 0
    return {
        "date": d.isoformat(),
        "calories": sum(m.calories for m in rows),
        "protein_g": sum(m.protein_g for m in rows),
        "carbs_g": sum(m.carbs_g for m in rows),
        "fat_g": sum(m.fat_g for m in rows),
        "calories_goal": tg["kcal"],
        "protein_goal_g": tg["protein_g"],
        "carbs_goal_g": tg["carbs_g"],
        "fat_goal_g": tg["fat_g"],
        "water_goal_l": tg["water_l"],
        "water_ml": water_ml,
        "water_l": round(water_ml / 1000, 2),
        "count": len(rows),
        "meals": [serialize_meal(m) for m in rows],
        "targets": t,
    }


def get_own_meal(db: Session, gid: int, meal_id: int, me: Membership) -> Meal:
    m = db.get(Meal, meal_id)
    if m is None or m.group_id != gid:
        raise HTTPException(404, "Refeição não encontrada.")
    if m.membership_id != me.id:
        raise HTTPException(403, "Você só pode alterar as suas refeições.")
    return m


@app.get("/api/groups/{gid}/meals")
def list_meals(gid: int, day: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    d = parse_date(day, today_of(s))
    return nutrition_payload(db, gid, me, d, s)


@app.post("/api/groups/{gid}/meals")
def create_meal(gid: int, payload: MealCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Analisa a foto da refeição por IA e registra a estimativa (ajustável depois)."""
    validate_image(payload.image)
    me = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    d = parse_date(payload.date, today)
    ensure_today(d, today)
    if not ai.ai_enabled():
        raise HTTPException(503, "Contador por IA indisponível (configure OPENAI_API_KEY ou GROQ_API_KEY no servidor).")
    try:
        est = ai.estimate_meal(payload.image)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"Falha ao analisar a foto: {e}")
    meal = Meal(
        group_id=gid,
        membership_id=me.id,
        date=d,
        label=est["label"],
        calories=est["calories"],
        protein_g=est["protein_g"],
        carbs_g=est["carbs_g"],
        fat_g=est["fat_g"],
        image=payload.image,
        ai_confidence=est.get("confidence"),
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return {"meal": serialize_meal(meal), "nutrition": nutrition_payload(db, gid, me, d, s)}


@app.patch("/api/groups/{gid}/meals/{meal_id}")
def update_meal(gid: int, meal_id: int, payload: MealUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    meal = get_own_meal(db, gid, meal_id, me)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(meal, field, value)
    if data:
        meal.ai_confidence = None  # ajustado à mão → não é mais estimativa pura
    db.commit()
    return {"meal": serialize_meal(meal), "nutrition": nutrition_payload(db, gid, me, meal.date, s)}


@app.delete("/api/groups/{gid}/meals/{meal_id}")
def delete_meal(gid: int, meal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    meal = get_own_meal(db, gid, meal_id, me)
    d = meal.date
    db.delete(meal)
    db.commit()
    return {"ok": True, "nutrition": nutrition_payload(db, gid, me, d, s)}


@app.post("/api/groups/{gid}/water")
def add_water(gid: int, req: WaterRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Ajusta o consumo de água do dia (de 500 em 500 ml, só no dia de hoje)."""
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    d = parse_date(req.date, today)
    ensure_today(d, today)
    entry = get_or_create_entry(db, membership, d)
    entry.water_ml = max(0, (entry.water_ml or 0) + req.delta_ml)
    db.commit()
    return nutrition_payload(db, gid, membership, d, s)


# --- rotas: grupo (chat) ---------------------------------------------------
@app.get("/api/groups/{gid}/messages")
def list_messages(gid: int, after_id: int = 0, limit: int = 200, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    members_by_id = {m.id: m for m in group_members(db, gid)}
    q = db.query(Message).filter(Message.group_id == gid)
    if after_id:
        q = q.filter(Message.id > after_id)
    rows = q.order_by(Message.id.asc()).limit(min(limit, 500)).all()
    return {"messages": [serialize_message(m, members_by_id) for m in rows]}


@app.post("/api/groups/{gid}/messages")
def create_message(gid: int, payload: MessageCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    validate_image(payload.image)
    membership = get_membership(db, user, gid)
    if not (payload.text or "").strip() and not payload.image:
        raise HTTPException(400, "Mensagem vazia.")
    m = Message(group_id=gid, membership_id=membership.id, text=(payload.text or "").strip(), image=payload.image)
    db.add(m)
    db.commit()
    db.refresh(m)
    preview = m.text if m.text else "📷 Foto"
    notify_group_others(db, gid, membership.user_id, f"💬 {membership.user.name}", preview[:120], "/chat")
    return serialize_message(m, {membership.id: membership})


# --- rotas: grupo (feed de atividades) -------------------------------------
@app.get("/api/groups/{gid}/activities")
def list_activities(gid: int, limit: int = 40, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_membership(db, user, gid)
    members_by_id = {m.id: m for m in group_members(db, gid)}
    rows = (
        db.query(Activity)
        .filter(Activity.group_id == gid)
        .order_by(Activity.id.desc())
        .limit(min(limit, 200))
        .all()
    )
    rmap = reactions_map(db, [a.id for a in rows], me.id)
    return {
        "activities": [serialize_activity(a, members_by_id, rmap) for a in rows],
        "reaction_types": FEED_REACTIONS,
    }


@app.post("/api/groups/{gid}/activities/{aid}/react")
def react_activity(gid: int, aid: int, req: ReactRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Define/troca/remove a reação do membro num item do feed."""
    me = get_membership(db, user, gid)
    a = db.get(Activity, aid)
    if a is None or a.group_id != gid:
        raise HTTPException(404, "Item do feed não encontrado.")
    valid = {r["key"] for r in FEED_REACTIONS}
    key = (req.reaction or "").strip() or None
    existing = (
        db.query(ActivityReaction)
        .filter(ActivityReaction.activity_id == aid, ActivityReaction.membership_id == me.id)
        .first()
    )
    if key is None or (existing and existing.reaction == key):
        if existing:
            db.delete(existing)  # toggle off / remover
    elif key in valid:
        if existing:
            existing.reaction = key
        else:
            db.add(ActivityReaction(activity_id=aid, membership_id=me.id, reaction=key))
    else:
        raise HTTPException(400, "Reação inválida.")
    db.commit()
    return reactions_map(db, [aid], me.id)[aid]


# --- rotas: grupo (histórico/conquistas/ranking) ---------------------------
@app.get("/api/groups/{gid}/history/{mid}")
def history(gid: int, mid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    membership = get_group_member(db, gid, mid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    days = build_member_days(s, membership, joint_points_map(db, gid), today)
    stats = scoring.player_stats(s, days, today)
    calendar = [
        {
            "date": cd["date"],
            "day_number": cd["day_number"],
            "points": cd["points"],
            "max_points": cd["max_points"],
            "completed": cd["completed"],
            "perfect": cd["perfect"],
            "areas_done": cd["areas_done"],
            "areas_total": cd["areas_total"],
            "mood": cd["mood"],
        }
        for cd in days
    ]
    return {"stats": stats, "calendar": calendar}


@app.get("/api/groups/{gid}/achievements/{mid}")
def achievements(gid: int, mid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    membership = get_group_member(db, gid, mid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    days = build_member_days(s, membership, joint_points_map(db, gid), today)
    stats = scoring.player_stats(s, days, today)
    casal = casal_perfect_days(s, group_members(db, gid), today)
    return {"achievements": scoring.achievements_for(days, stats, casal)}


_MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


def _week_label(mon: date) -> str:
    end = mon + timedelta(days=6)
    if mon.month == end.month:
        return f"{mon.day}–{end.day} {_MONTHS_PT[mon.month - 1]}"
    return f"{mon.day} {_MONTHS_PT[mon.month - 1]} – {end.day} {_MONTHS_PT[end.month - 1]}"


@app.get("/api/groups/{gid}/radar")
def radar(gid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Desafios concluídos por área e por membro (para o gráfico de radar)."""
    get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    cats = scoring.active_categories(s)
    today = today_of(s)
    members = group_members(db, gid)
    out = []
    for m in members:
        days = scoring.build_days(s, {e.date: e for e in m.days}, today)
        counts = {c: 0 for c in cats}
        for cd in days:
            for c in cd["done_cats"]:
                if c in counts:
                    counts[c] += 1
        out.append({
            "id": m.id,
            "name": m.user.name,
            "avatar": m.user.avatar,
            "values": [counts[c] for c in cats],
        })
    return {"categories": cats, "emojis": [CATEGORY_EMOJI[c] for c in cats], "members": out}


@app.get("/api/groups/{gid}/gallery")
def gallery(gid: int, weeks_limit: int = 8, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mural de fotos das provas + atividades em dupla, com retrospectiva semanal."""
    get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    members = group_members(db, gid)
    members_by_id = {m.id: m for m in members}
    joint = joint_points_map(db, gid)

    member_cd = {m.id: {cd["date"]: cd for cd in build_member_days(s, m, joint, today)} for m in members}

    def monday_of(d: date) -> date:
        return d - timedelta(days=d.weekday())

    weeks: dict[date, list] = {}
    for m in members:
        for e in m.days:
            for cat, img in (e.challenge_proofs or {}).items():
                if not img:
                    continue
                weeks.setdefault(monday_of(e.date), []).append({
                    "date": e.date.isoformat(),
                    "author": m.user.name,
                    "kind": "challenge",
                    "emoji": CATEGORY_EMOJI.get(cat, "🎯"),
                    "label": cat,
                    "image": img,
                })
            for key, img in (e.habit_proofs or {}).items():
                if not img:
                    continue
                h = _habit_info(get_group_settings(db, gid), key)
                weeks.setdefault(monday_of(e.date), []).append({
                    "date": e.date.isoformat(),
                    "author": m.user.name,
                    "kind": "habit",
                    "emoji": h.get("emoji", "✅"),
                    "label": h.get("label", key),
                    "image": img,
                })
    for a in db.query(JointActivity).filter(JointActivity.group_id == gid).all():
        if a.image:
            mem = members_by_id.get(a.created_by)
            weeks.setdefault(monday_of(a.date), []).append({
                "date": a.date.isoformat(),
                "author": mem.user.name if mem else "?",
                "kind": "joint",
                "emoji": a.emoji,
                "label": a.label,
                "image": a.image,
            })

    # Fotos das tarefas concluídas.
    task_rows = (
        db.query(TaskCompletion, ScheduledTask)
        .join(ScheduledTask, TaskCompletion.task_id == ScheduledTask.id)
        .filter(ScheduledTask.group_id == gid, TaskCompletion.image.isnot(None))
        .all()
    )
    for comp, task in task_rows:
        mem = members_by_id.get(comp.membership_id)
        weeks.setdefault(monday_of(comp.date), []).append({
            "date": comp.date.isoformat(),
            "author": mem.user.name if mem else "?",
            "kind": "task",
            "emoji": task.emoji,
            "label": task.title,
            "image": comp.image,
        })

    result = []
    for mon in sorted(weeks.keys(), reverse=True)[:weeks_limit]:
        wk_dates = {(mon + timedelta(days=i)).isoformat() for i in range(7)}
        retro_members = []
        for m in members:
            cdmap = member_cd[m.id]
            retro_members.append({
                "name": m.user.name,
                "points": sum(cdmap[d]["points"] for d in wk_dates if d in cdmap),
                "perfect_days": sum(1 for d in wk_dates if d in cdmap and cdmap[d]["perfect"]),
                "challenges": sum(cdmap[d]["areas_done"] for d in wk_dates if d in cdmap),
            })
        jcount = (
            db.query(JointActivity)
            .filter(JointActivity.group_id == gid, JointActivity.date >= mon, JointActivity.date <= mon + timedelta(days=6))
            .count()
        )
        photos = sorted(weeks[mon], key=lambda p: p["date"], reverse=True)
        result.append({
            "week_start": mon.isoformat(),
            "label": _week_label(mon),
            "retro": {
                "members": retro_members,
                "joint_count": jcount,
                "group_points": sum(r["points"] for r in retro_members),
                "photo_count": len(photos),
            },
            "photos": photos[:48],
        })
    return {"weeks": result}


@app.get("/api/groups/{gid}/ranking")
def ranking(gid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    members = group_members(db, gid)
    joint = joint_points_map(db, gid)
    rows = [member_payload(s, m, joint, today) for m in members]
    rows.sort(key=lambda r: r["stats"]["total"], reverse=True)
    return {"ranking": rows, "casal_perfect_days": casal_perfect_days(s, members, today)}


@app.get("/api/groups/{gid}/state")
def state(gid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Payload agregado que abastece a tela inicial em uma única chamada."""
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    members = group_members(db, gid)
    joint = joint_points_map(db, gid)
    player_rows = [member_payload(s, m, joint, today) for m in members]

    for row in player_rows:
        others = [r for r in player_rows if r["id"] != row["id"]]
        partner = max(others, key=lambda r: r["stats"]["total"]) if others else None
        if row["today"]:
            row["nudge"] = scoring.nudge(
                row["today"], row["stats"]["total"],
                partner["stats"]["total"] if partner else None,
                partner["name"] if partner else None,
            )
        else:
            row["nudge"] = {"emoji": "🏁", "text": "Desafio concluído! 🎉"}

    leaderboard = sorted(player_rows, key=lambda r: r["stats"]["total"], reverse=True)

    members_by_id = {m.id: m for m in members}
    joint_today = (
        db.query(JointActivity)
        .filter(JointActivity.group_id == gid, JointActivity.date == today)
        .order_by(JointActivity.id)
        .all()
    )
    recent_activities = (
        db.query(Activity)
        .filter(Activity.group_id == gid)
        .order_by(Activity.id.desc())
        .limit(12)
        .all()
    )
    act_reactions = reactions_map(db, [a.id for a in recent_activities], membership.id)

    return {
        "date": today.isoformat(),
        "group": {"id": gid, "name": membership.group.name, "invite_code": membership.group.invite_code, "role": membership.role},
        "me_id": membership.id,
        "day_number": scoring.day_number(s, today),
        "duration_days": s.duration_days,
        "spiritual_enabled": s.spiritual_enabled,
        "categories": scoring.active_categories(s),
        "motd": scoring.motd(today),
        "moods": MOODS,
        "players": player_rows,
        "leaderboard": leaderboard,
        "casal_perfect_days": casal_perfect_days(s, members, today),
        "category_emoji": CATEGORY_EMOJI,
        "joint": {
            "points_each": JOINT_ACTIVITY_POINTS,
            "activities": [serialize_joint(a, members_by_id) for a in joint_today],
            "suggestions": JOINT_SUGGESTIONS,
        },
        "activities": [serialize_activity(a, members_by_id, act_reactions) for a in recent_activities],
        "reaction_types": FEED_REACTIONS,
        "goals": [serialize_goal(db, g, members, membership, today) for g in active_goals(db, gid)],
        "tasks": [serialize_task(db, t, members, membership, today) for t in tasks_due(db, gid, today)],
        "nutrition": nutrition_payload(db, gid, membership, today, s),
        "ai_enabled": ai.ai_enabled(),
    }


# --- frontend estático (SPA) -----------------------------------------------
# Em produção o backend também serve o frontend já buildado (dist), então tudo
# roda num único serviço e numa única porta ($PORT): sem CORS, sem VITE_API_URL
# e sem 502 por descasamento de porta. Se o dist não existir (ex.: backend
# rodando sozinho em dev), a API segue funcionando normalmente.
_dist_env = os.getenv("FRONTEND_DIST")
FRONTEND_DIST = (
    Path(_dist_env)
    if _dist_env
    else Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
)

if FRONTEND_DIST.is_dir():
    _dist_root = FRONTEND_DIST.resolve()

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        # Rotas de API não resolvidas não devem cair no index.html.
        if full_path.startswith("api"):
            raise HTTPException(404, "Not Found")
        candidate = (_dist_root / full_path).resolve()
        if full_path and candidate.is_file() and _dist_root in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(_dist_root / "index.html")

else:

    @app.get("/")
    def root():
        return {"app": "Questly", "version": "0.3.1", "docs": "/docs"}
