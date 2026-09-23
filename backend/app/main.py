"""API do Questly (FastAPI) — multi-tenant com auth e grupos (Fase 1)."""
import asyncio
import logging
import os
import re
import secrets
import calendar
from datetime import date, datetime, time as dtime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

DEFAULT_TZ = "America/Sao_Paulo"

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import ai
from . import foods
from . import mailer
from . import openfoodfacts
from . import nutrition
from . import scoring
from . import scoring_v2
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
from . import presets
from . import push as pushmod
from .data import (
    CATEGORY_ICON,
    CATEGORY_ORDER,
    DEFAULT_HABITS,
    DIFFICULTIES,
    DIFFICULTY_LABEL,
    DIFFICULTY_POINTS,
    FEED_REACTIONS,
    HABITS_MENU,
    JOINT_SUGGESTIONS,
    MOODS,
)
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
    MealFoodsCreate,
    MealTextCreate,
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
from . import schemas as s, models as m

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
            # Uma sequência em risco vale mais que qualquer frase de incentivo:
            # é a única coisa que a pessoa tem a perder ainda hoje, e é o aviso
            # que ela quer receber. Só troca o texto quando há corrente de pé e
            # o dia ainda está aberto.
            titulo, body = _aviso_de_sequencia(db, uid, today) or ("Questly", body)
            pushmod.send_to_user(db, uid, titulo, body, "/")
    finally:
        db.close()


def _aviso_de_sequencia(db: Session, user_id: int, hoje: date) -> tuple[str, str] | None:
    """Texto do lembrete quando a sequência está para ser perdida hoje."""
    try:
        janela = consistency_window(db, user_id, hoje, hoje)
        dia = janela.get(hoje)
        if not dia or dia["rest"] or dia["planned"] == 0 or dia["full"]:
            return None  # nada em risco: descanso, dia vazio ou já fechado

        sequencia = personal_streak(db, user_id, hoje)
        if sequencia < 2:
            return None  # ainda não há corrente que doa perder

        faltam = dia["planned"] - dia["done"]
        marco = scoring_v2.next_streak_milestone(sequencia)
        alvo = f" Faltam {marco['missing']} dias para +{marco['points']} pts." if marco else ""
        return (
            f"{sequencia} dias seguidos em jogo",
            f"{faltam} {'item' if faltam == 1 else 'itens'} para fechar o dia e manter a sequência.{alvo}",
        )
    except Exception:  # noqa: BLE001 — o lembrete genérico ainda sai
        return None


# Horas (UTC) do empurrão de água. Padrão ≈ 15h e 18h de Brasília — a tarde é
# quando o copo para de ser lembrado sozinho.
WATER_REMINDER_HOURS = {
    int(h) for h in os.getenv("WATER_REMINDER_HOURS", "18,21").split(",") if h.strip().isdigit()
}
# Abaixo disso a meta ainda está longe o bastante para o aviso ser útil.
WATER_NUDGE_BELOW = 0.7


def _run_water_reminders() -> None:
    """Lembra de beber água só quem está atrasado na própria meta.

    A meta de água existia sem nada que a lembrasse — era o hábito com mais a
    ganhar com um empurrão no meio da tarde. Quem já bateu (ou está perto) não
    recebe nada: aviso que chega depois de pronto ensina a ignorar os próximos.
    """
    if not pushmod.push_enabled():
        return
    db = SessionLocal()
    try:
        inscritos = {row.user_id for row in db.query(PushSubscription).all()}
        for uid in inscritos:
            membership = (
                db.query(Membership).filter(Membership.user_id == uid).order_by(Membership.id).first()
            )
            if membership is None:
                continue
            s_obj = get_group_settings(db, membership.group_id)
            hoje = today_of(s_obj)
            if is_rest_day(db, uid, hoje):
                continue

            dados = nutrition_payload(db, membership.group_id, membership, hoje, s_obj)
            meta = dados["water_goal_l"] or 0
            if not meta or dados["water_l"] >= meta * WATER_NUDGE_BELOW:
                continue

            faltam = round(meta - dados["water_l"], 1)
            pushmod.send_to_user(
                db,
                uid,
                "Água",
                f"Faltam {faltam} L para sua meta de hoje. Um copo agora resolve boa parte.",
                "/nutricao",
            )
    finally:
        db.close()


async def _reminder_loop() -> None:
    fired: set[tuple] = set()
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
            chave_agua = ("agua", now.date().isoformat(), now.hour)
            if now.hour in WATER_REMINDER_HOURS and now.minute < 5 and chave_agua not in fired:
                fired.add(chave_agua)
                await asyncio.to_thread(_run_water_reminders)
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


MESES_PT = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]


def month_bounds(d: date) -> tuple[date, date]:
    """Primeiro e último dia do mês de `d` — o período do ranking."""
    last = calendar.monthrange(d.year, d.month)[1]
    return d.replace(day=1), d.replace(day=last)


def parse_datetime(value: str | None, default: datetime | None = None) -> datetime:
    """Lê um ISO 8601 e devolve datetime ingênuo (o fuso é o do grupo)."""
    if not value:
        if default is None:
            raise HTTPException(400, "Data e hora são obrigatórias.")
        return default
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, f"Data/hora inválida: {value!r} (use ISO 8601).")
    return parsed.replace(tzinfo=None)


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


# O tipo escolhido na criação decide o que o espaço é. Um espaço individual não
# tem com quem competir; um casal tem atividade em dupla; um grupo tem ranking,
# mas não dupla — dupla dentro de grupo sempre vira panelinha de dois.
GROUP_RULES = {
    "individual": {"max_members": 1, "joint": False, "ranking": False, "invite": False},
    "couple": {"max_members": 2, "joint": True, "ranking": True, "invite": True},
    "group": {"max_members": 50, "joint": False, "ranking": True, "invite": True},
}
DEFAULT_GROUP_RULES = GROUP_RULES["group"]


def group_rules(group: Group) -> dict:
    return GROUP_RULES.get(getattr(group, "group_type", None) or "group", DEFAULT_GROUP_RULES)


def group_summary(group: Group, role: str, member_count: int) -> dict:
    rules = group_rules(group)
    return {
        "id": group.id,
        "name": group.name,
        "invite_code": group.invite_code,
        "role": role,
        "member_count": member_count,
        "group_type": getattr(group, "group_type", None) or "group",
        # A interface se adapta por aqui em vez de repetir a regra por tela.
        "rules": rules,
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


def upsert_activity(db: Session, gid: int, membership: Membership, kind: str, icon: str, text: str,
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
        existing.icon = icon
        existing.text = text
        existing.image = image
        existing.created_at = datetime.utcnow()
    else:
        db.add(Activity(group_id=gid, membership_id=membership.id, kind=kind, icon=icon,
                        text=text, image=image, ref=ref, day=day))
    db.commit()


def _purge_activity_children(db: Session, activity_query) -> None:
    """Apaga reações e comentários dos itens de feed prestes a sumir.

    Vive num lugar só porque os dois caminhos de remoção passam por aqui —
    esquecer um deles deixaria comentário órfão apontando para item inexistente.
    """
    ids = [a.id for a in activity_query.all()]
    if not ids:
        return
    db.query(ActivityReaction).filter(
        ActivityReaction.activity_id.in_(ids)
    ).delete(synchronize_session=False)
    db.query(m.ActivityComment).filter(
        m.ActivityComment.activity_id.in_(ids)
    ).delete(synchronize_session=False)


def remove_activity(db: Session, gid: int, membership: Membership, ref: str, day: date | None = None) -> None:
    day = day or date.today()
    q = db.query(Activity).filter(
        Activity.group_id == gid, Activity.membership_id == membership.id,
        Activity.ref == ref, Activity.day == day,
    )
    _purge_activity_children(db, q)
    q.delete(synchronize_session=False)
    db.commit()


def remove_activities_by_ref(db: Session, gid: int, ref: str) -> None:
    """Remove do feed TODOS os eventos com este ref (qualquer membro/dia).

    Usado quando o item de origem é excluído (tarefa agendada, atividade em dupla),
    para que ele não continue aparecendo no feed."""
    q = db.query(Activity).filter(Activity.group_id == gid, Activity.ref == ref)
    _purge_activity_children(db, q)
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


def comments_map(db: Session, activity_ids: list[int], members_by_id: dict) -> dict:
    """Para cada activity: lista de comentários em ordem cronológica."""
    out: dict[int, list] = {aid: [] for aid in activity_ids}
    if not activity_ids:
        return out
    rows = (
        db.query(m.ActivityComment)
        .filter(m.ActivityComment.activity_id.in_(activity_ids))
        .order_by(m.ActivityComment.id)
        .all()
    )
    for c in rows:
        mem = members_by_id.get(c.membership_id)
        out.setdefault(c.activity_id, []).append({
            "id": c.id,
            "text": c.text,
            "author": mem.user.name if mem and mem.user else "?",
            "photo": mem.user.photo if mem and mem.user else None,
            "membership_id": c.membership_id,
            "created_at": c.created_at.isoformat() + "Z",
        })
    return out


def serialize_activity(a: Activity, members_by_id: dict, reactions: dict | None = None,
                       comments: dict | None = None) -> dict:
    mem = members_by_id.get(a.membership_id)
    u = mem.user if mem else None
    return {
        "id": a.id,
        "kind": a.kind,
        "icon": a.icon,
        "text": a.text,
        "image": a.image,
        "membership_id": a.membership_id,
        "author": u.name if u else "?",
        "photo": u.photo if u else None,
        "day": a.day.isoformat() if a.day else None,
        "created_at": a.created_at.isoformat() + "Z",
        "reactions": (reactions or {}).get(a.id) or {"counts": {}, "mine": None, "total": 0},
        "comments": (comments or {}).get(a.id) or [],
    }


def _ai_pool_count(s: Settings) -> int:
    pool = getattr(s, "challenge_pool", None) or {}
    if not isinstance(pool, dict):
        return 0
    return sum(len(v) for cat in pool.values() if isinstance(cat, dict) for v in cat.values() if isinstance(v, list))


MAX_CUSTOM_PER_TIER = 30


def _clean_custom_challenges(raw: dict) -> dict:
    """Valida os desafios escritos pelo grupo: só áreas/dificuldades conhecidas,
    textos limpos, sem duplicatas e com limite por dificuldade."""
    out: dict = {}
    if not isinstance(raw, dict):
        return out
    for cat in CATEGORY_ORDER:
        block = raw.get(cat)
        if not isinstance(block, dict):
            continue
        clean: dict = {}
        for diff in DIFFICULTIES:
            items = block.get(diff)
            if not isinstance(items, list):
                continue
            seen: list[str] = []
            for t in items:
                if not isinstance(t, str):
                    continue
                t = " ".join(t.split())[:160]
                if t and t not in seen:
                    seen.append(t)
            if seen:
                clean[diff] = seen[:MAX_CUSTOM_PER_TIER]
        if block.get("only"):
            clean["only"] = True
        if clean:
            out[cat] = clean
    return out


def challenge_window(s: Settings) -> tuple[datetime, datetime]:
    """Início e fim do desafio do grupo, com hora.

    Grupos criados antes da janela só têm start_date + duration_days; para eles
    a janela é derivada (começa 00:00 do primeiro dia, termina 23:59:59 do
    último), então nada precisa ser migrado à mão.
    """
    start = getattr(s, "challenge_start", None)
    end = getattr(s, "challenge_end", None)
    if start and end:
        return start, end
    inicio = start or datetime.combine(s.start_date, dtime.min)
    fim = end or datetime.combine(
        s.start_date + timedelta(days=max(1, s.duration_days) - 1), dtime.max
    )
    return inicio, fim


def challenge_status(s: Settings, now: datetime | None = None) -> str:
    """'scheduled' antes de começar, 'active' durante, 'ended' depois."""
    now = now or datetime.now(_zone(getattr(s, "timezone", None))).replace(tzinfo=None)
    inicio, fim = challenge_window(s)
    if now < inicio:
        return "scheduled"
    if now > fim:
        return "ended"
    return "active"


def ensure_challenge_active(s: Settings) -> None:
    """Fora da janela não se registra desafio — nem antes, nem depois."""
    estado = challenge_status(s)
    if estado == "scheduled":
        inicio, _ = challenge_window(s)
        raise HTTPException(400, f"O desafio começa em {inicio.strftime('%d/%m às %H:%M')}.")
    if estado == "ended":
        _, fim = challenge_window(s)
        raise HTTPException(400, f"O desafio terminou em {fim.strftime('%d/%m às %H:%M')}.")


def settings_public(s: Settings) -> dict:
    updated = getattr(s, "challenge_pool_updated", None)
    return {
        "timezone": getattr(s, "timezone", None) or DEFAULT_TZ,
        "start_date": s.start_date.isoformat(),
        "duration_days": s.duration_days,
        "challenge_start": challenge_window(s)[0].isoformat(),
        "challenge_end": challenge_window(s)[1].isoformat(),
        "challenge_status": challenge_status(s),
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
        "custom_challenges": getattr(s, "custom_challenges", None) or {},
        "disabled_areas": getattr(s, "disabled_areas", None) or [],
        "areas": CATEGORY_ORDER,
        "active_areas": scoring.active_categories(s),
        "difficulties": [{"key": d, "label": DIFFICULTY_LABEL[d], "points": DIFFICULTY_POINTS[d]} for d in DIFFICULTIES],
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
    group = Group(name=payload.name.strip(), invite_code=code, group_type=payload.group_type)
    db.add(group)
    db.flush()
    inicio = datetime.combine(date.today(), dtime.min)
    fim = datetime.combine(date.today() + timedelta(days=29), dtime.max)
    db.add(Settings(
        group_id=group.id,
        challenge_start=inicio,
        challenge_end=fim,
        start_date=inicio.date(),
        duration_days=30,
        fixed_habits=DEFAULT_HABITS,
    ))
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
        rules = group_rules(group)
        atuais = db.query(Membership).filter(Membership.group_id == group.id).count()
        if not rules["invite"]:
            raise HTTPException(400, "Este é um espaço individual e não aceita outras pessoas.")
        if atuais >= rules["max_members"]:
            raise HTTPException(400, f"Este espaço já está completo ({rules['max_members']} pessoas).")
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
    if data.get("custom_challenges") is not None:
        data["custom_challenges"] = _clean_custom_challenges(data["custom_challenges"])
    if data.get("disabled_areas") is not None:
        off = [a for a in data["disabled_areas"] if a in CATEGORY_ORDER]
        if len(off) >= len(CATEGORY_ORDER):
            raise HTTPException(400, "Deixe pelo menos uma área ativa.")
        data["disabled_areas"] = off

    # A janela manda: quando vem, start_date e duration_days são recalculados a
    # partir dela, para o resto do app (day_number, metas) continuar coerente.
    if "challenge_start" in data or "challenge_end" in data:
        inicio_atual, fim_atual = challenge_window(s)
        inicio = parse_datetime(data.pop("challenge_start", None), inicio_atual)
        fim = parse_datetime(data.pop("challenge_end", None), fim_atual)
        if fim <= inicio:
            raise HTTPException(400, "O fim do desafio precisa ser depois do início.")
        if (fim - inicio).days > 365:
            raise HTTPException(400, "O desafio pode durar no máximo 365 dias.")
        s.challenge_start = inicio
        s.challenge_end = fim
        s.start_date = inicio.date()
        s.duration_days = max(1, (fim.date() - inicio.date()).days + 1)
        data.pop("duration_days", None)

    for field, value in data.items():
        setattr(s, field, value)
    db.commit()
    return settings_public(s)


# --- rotas: grupo (desafios/dia) -------------------------------------------
@app.get("/api/groups/{gid}/challenges/today")
def challenges_today(gid: int, day: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    d = parse_date(day, today_of(s))
    inicio, fim = challenge_window(s)

    # Os desafios são por pessoa: as trocas que ela fez mudam o que aparece, e
    # o que ela já comprovou vem marcado — senão a tela oferece "cumprir" algo
    # que já está cumprido.
    entry = next((e for e in membership.days if e.date == d), None)
    rerolls = (entry.challenge_rerolls or {}) if entry else {}
    proofs = (entry.challenge_proofs or {}) if entry else {}

    desafios = [
        {**ch, "done": bool(proofs.get(ch["category"]))}
        for ch in scoring.daily_challenges(s, d, rerolls)
    ]

    return {
        "date": d.isoformat(),
        "day_number": scoring.day_number(s, d),
        "duration_days": s.duration_days,
        "challenge_start": inicio.isoformat(),
        "challenge_end": fim.isoformat(),
        "challenge_status": challenge_status(s),
        "challenges": desafios,
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
    return {"key": key, "label": key, "icon": "check-circle"}


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
    upsert_activity(db, gid, membership, "habit", h.get("icon", "check-circle"),
                    f"cumpriu: {h.get('label', req.habit_key)}",
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
        upsert_activity(db, gid, membership, "habit", h.get("icon", "check-circle"),
                        f"cumpriu: {h.get('label', req.habit_key)}",
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
    ensure_challenge_active(s)
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
    icone = CATEGORY_ICON.get(req.category, "target")
    if req.image:
        extra = " (juntos)" if req.together else ""
        text = f"fechou o desafio de {req.category}{extra}"
        upsert_activity(db, gid, membership, "challenge", icone, text, ref=ref, image=req.image, day=d)
        if not was_done:
            notify_group_others(db, gid, membership.user_id, membership.group.name,
                                f"{membership.user.name} {text}", "/")
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
    if not group_rules(membership.group)["joint"]:
        raise HTTPException(400, "Atividade em dupla existe só em espaço de Casal.")
    s = get_group_settings(db, gid)
    today = today_of(s)
    d = parse_date(payload.date, today)
    ensure_today(d, today)
    a = JointActivity(
        group_id=gid,
        date=d,
        label=payload.label.strip(),
        icon=(payload.icon or "heart").strip() or "heart",
        points=JOINT_ACTIVITY_POINTS,
        image=payload.image,
        created_by=membership.id,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    text = f"registrou em dupla: {a.label} (+{a.points} para os dois)"
    upsert_activity(db, gid, membership, "joint", a.icon, text, ref=f"joint:{a.id}", image=a.image, day=d)
    notify_group_others(db, gid, membership.user_id, membership.group.name,
                        f"{membership.user.name} {text}", "/")
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
        icon=(payload.icon or "target").strip() or "target",
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
        icon=(payload.icon or "calendar").strip() or "calendar",
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
    upsert_activity(db, gid, me, "task", task.icon, f"concluiu a tarefa: {task.title}",
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
        raise HTTPException(503, "Contador por IA indisponível (configure GEMINI_API_KEY, OPENAI_API_KEY ou GROQ_API_KEY no servidor).")
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


@app.post("/api/groups/{gid}/meals/manual")
def create_meal_manual(gid: int, payload: s.MealManualCreate, user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """Registra uma refeição com os valores já informados, sem IA.

    Serve para quem tem o rótulo na mão e para desfazer uma exclusão: apagar uma
    refeição só é reversível se existir um caminho que a recrie exatamente como
    estava — pela foto, a IA estimaria valores diferentes na volta.
    """
    validate_image(payload.image)
    me = get_membership(db, user, gid)
    s_obj = get_group_settings(db, gid)
    today = today_of(s_obj)
    d = parse_date(payload.date, today)
    ensure_today(d, today)

    meal = Meal(
        group_id=gid,
        membership_id=me.id,
        date=d,
        label=payload.label.strip(),
        calories=payload.calories,
        protein_g=payload.protein_g,
        carbs_g=payload.carbs_g,
        fat_g=payload.fat_g,
        image=payload.image,
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return {"meal": serialize_meal(meal), "nutrition": nutrition_payload(db, gid, me, d, s_obj)}


@app.post("/api/groups/{gid}/meals/text")
def create_meal_text(gid: int, payload: MealTextCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Registra uma refeição descrita em TEXTO (sem foto). Ex.: 'comi um pão de
    queijo e um copo de leite com café' — a IA estima calorias e macros."""
    me = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = today_of(s)
    d = parse_date(payload.date, today)
    ensure_today(d, today)
    if not ai.ai_enabled():
        raise HTTPException(503, "Contador por IA indisponível (configure GEMINI_API_KEY, OPENAI_API_KEY ou GROQ_API_KEY no servidor).")
    try:
        est = ai.estimate_meal_text(payload.text)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"Falha ao interpretar a refeição: {e}")
    meal = Meal(
        group_id=gid,
        membership_id=me.id,
        date=d,
        label=est["label"],
        calories=est["calories"],
        protein_g=est["protein_g"],
        carbs_g=est["carbs_g"],
        fat_g=est["fat_g"],
        ai_confidence=est.get("confidence"),
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return {"meal": serialize_meal(meal), "nutrition": nutrition_payload(db, gid, me, d, s)}


@app.get("/api/foods")
def search_foods(q: str = "", user: User = Depends(get_current_user)):
    """Busca alimento por nome para registrar refeição sem depender de IA.

    A tabela local (TACO) responde primeiro e sozinha resolve comida de verdade.
    Só quando ela traz pouca coisa é que o Open Food Facts entra, para produto
    de marca — e se ele estiver fora do ar a busca local segue valendo.
    """
    locais = foods.buscar(q)
    resultado = list(locais)
    if len(locais) < 5:
        vistos = {f["id"] for f in locais}
        for item in openfoodfacts.buscar(q, limite=8 - len(locais)):
            if item["id"] not in vistos:
                resultado.append(item)
    return {"foods": resultado}


@app.post("/api/groups/{gid}/meals/foods")
def create_meal_foods(gid: int, payload: MealFoodsCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Registra refeição a partir de alimentos e quantidades — número exato,
    sem estimativa e sem chave de IA."""
    me = get_membership(db, user, gid)
    s_obj = get_group_settings(db, gid)
    today = today_of(s_obj)
    d = parse_date(payload.date, today)
    ensure_today(d, today)

    calculados = []
    for item in payload.items:
        exato = foods.macros(item.food_id, item.grams)
        if exato is None:
            # Item de fora da tabela (Open Food Facts): os valores por 100 g
            # vêm no corpo, porque o servidor não guarda cópia daquela base.
            if item.calories is None:
                raise HTTPException(400, f"Alimento desconhecido: {item.food_id}")
            fator = item.grams / 100.0
            exato = {
                "id": item.food_id,
                "name": (item.name or "Alimento").strip()[:120],
                "grams": round(item.grams, 1),
                "calories": round(item.calories * fator),
                "protein_g": round((item.protein_g or 0) * fator, 1),
                "carbs_g": round((item.carbs_g or 0) * fator, 1),
                "fat_g": round((item.fat_g or 0) * fator, 1),
            }
        calculados.append(exato)

    total = foods.somar(calculados)
    meal = Meal(
        group_id=gid,
        membership_id=me.id,
        date=d,
        label=(payload.label or foods.rotulo(calculados)).strip()[:120],
        calories=total["calories"],
        protein_g=total["protein_g"],
        carbs_g=total["carbs_g"],
        fat_g=total["fat_g"],
        ai_confidence=None,  # tabelado, não estimado
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return {"meal": serialize_meal(meal), "items": calculados, "nutrition": nutrition_payload(db, gid, me, d, s_obj)}


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
    preview = m.text if m.text else "Enviou uma foto"
    notify_group_others(db, gid, membership.user_id, membership.user.name, preview[:120], "/chat")
    return serialize_message(m, {membership.id: membership})


@app.delete("/api/groups/{gid}/messages/{mid}")
def delete_message(gid: int, mid: int, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """Apaga uma mensagem sua do chat do grupo."""
    membership = get_membership(db, user, gid)
    msg = db.get(Message, mid)
    if msg is None or msg.group_id != gid:
        raise HTTPException(404, "Mensagem não encontrada.")
    if msg.membership_id != membership.id:
        raise HTTPException(403, "Só dá para apagar a própria mensagem.")
    db.delete(msg)
    db.commit()
    return {"ok": True}


@app.post("/api/groups/{gid}/activity-record")
def create_activity_record(gid: int, payload: s.ActivityRecordCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Registra o que a pessoa realmente fez.

    O XP é pessoal e vai inteiro. Já o que entra no ranking passa pelos limites
    do scoring_v2 (retorno decrescente por repetição + teto diário), senão quem
    registra mais vence, e não quem se esforça mais.
    """
    membership = get_membership(db, user, gid)

    s_obj = get_group_settings(db, gid)
    today = today_of(s_obj)
    d = parse_date(payload.date, today)
    ensure_today(d, today)

    if payload.proof_image:
        validate_image(payload.proof_image)

    params, notes = scoring_v2.normalize_params(payload.params, payload.modality)
    effort = scoring_v2.compute_effort_score(params, payload.modality)
    if effort <= 0:
        raise HTTPException(400, "Informe ao menos a duração da atividade.")

    # Quanto desse esforço conta para o ranking, dado o que já foi registrado hoje.
    same_today = db.query(m.ActivityRecord).filter(
        m.ActivityRecord.user_id == user.id,
        m.ActivityRecord.date == d,
        m.ActivityRecord.modality == payload.modality,
    ).count()
    effort_today = sum(
        r.score_earned for r in db.query(m.ActivityRecord).filter(
            m.ActivityRecord.user_id == user.id, m.ActivityRecord.date == d
        ).all()
    )
    competitive = scoring_v2.competitive_effort(effort, same_today, effort_today)

    ar = m.ActivityRecord(
        user_id=user.id,
        group_id=gid,
        date=d,
        modality=payload.modality,
        category=payload.category,
        params=params,
        effort_score=effort,
        xp_earned=scoring_v2.xp_for(effort),
        score_earned=int(competitive),
        proof_image=payload.proof_image,
    )
    db.add(ar)

    period_start, period_end = month_bounds(d)
    # Guardado antes de somar: sem o placar anterior não dá para saber quem foi
    # ultrapassado por este registro.
    placar_antes = _placar_do_periodo(db, gid, period_start, period_end)
    meu_antes = placar_antes.get(membership.id, 0.0)

    db.flush()
    recompute_user_progress(db, user.id)
    cs = sync_competitive_score(db, user.id, membership, d)

    db.commit()
    db.refresh(ar)

    _avisar_ultrapassados(db, gid, membership, placar_antes, meu_antes, cs.total_score)

    text = f"registrou {payload.modality} (+{ar.score_earned} pts)"
    upsert_activity(db, gid, membership, "record", "activity", text,
                    ref=f"record:{ar.id}", image=ar.proof_image, day=d)

    return {
        "id": ar.id,
        "modality": ar.modality,
        "effort_score": ar.effort_score,
        "xp_earned": ar.xp_earned,
        "score_earned": ar.score_earned,
        # O que foi limitado é dito na cara: pontuação silenciosamente cortada
        # parece bug.
        "capped": round(effort - competitive, 2),
        "notes": notes,
        **_constancia_publica(db, user, d),
    }


@app.delete("/api/groups/{gid}/activity-record/{rid}")
def delete_activity_record(gid: int, rid: int, user: User = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    """Apaga um registro de atividade e devolve tudo o que ele deu.

    Registrar errado (distância trocada, modalidade errada, duplicado) é comum,
    e sem apagar a única saída era conviver com a pontuação torta para sempre.
    Como XP e placar são derivados do que está gravado, basta recalcular: a
    devolução é exata, sem operação inversa escrita à mão.
    """
    membership = get_membership(db, user, gid)
    registro = db.get(m.ActivityRecord, rid)
    if registro is None or registro.group_id != gid:
        raise HTTPException(404, "Registro não encontrado.")
    if registro.user_id != user.id:
        raise HTTPException(403, "Só dá para apagar o próprio registro.")

    d = registro.date
    db.delete(registro)
    db.flush()
    recompute_user_progress(db, user.id)
    sync_competitive_score(db, user.id, membership, d)
    db.commit()

    remove_activities_by_ref(db, gid, f"record:{rid}")  # sai do feed junto
    return {"ok": True, **_constancia_publica(db, user, d)}


# --- rotas: grupo (ranking e feed) -------------------------------------
def _placar_do_periodo(db: Session, gid: int, inicio: date, fim: date) -> dict[int, float]:
    """Pontuação competitiva de cada membro do grupo no período."""
    ids = [x.id for x in group_members(db, gid)]
    if not ids:
        return {}
    linhas = (
        db.query(m.CompetitiveScore)
        .filter(
            m.CompetitiveScore.membership_id.in_(ids),
            m.CompetitiveScore.period_start == inicio,
            m.CompetitiveScore.period_end == fim,
        )
        .all()
    )
    placar = {i: 0.0 for i in ids}
    for linha in linhas:
        placar[linha.membership_id] = linha.total_score or 0.0
    return placar


def _avisar_ultrapassados(
    db: Session,
    gid: int,
    membership: Membership,
    antes: dict[int, float],
    meu_antes: float,
    meu_depois: float,
) -> None:
    """Avisa quem acabou de ser passado no placar.

    É a notificação que faz o placar valer alguma coisa: sem ela a pessoa só
    descobre que perdeu a posição se abrir o app por conta própria. Só dispara
    em espaço onde há disputa, e só para quem estava à frente e não está mais.
    """
    if meu_depois <= meu_antes:
        return
    grupo = db.get(Group, gid)
    if grupo is None or not group_rules(grupo)["ranking"]:
        return

    passados = [
        mid for mid, pontos in antes.items()
        if mid != membership.id and meu_antes <= pontos < meu_depois
    ]
    if not passados:
        return

    quem = membership.user.name.split(" ")[0]
    por_id = {x.id: x for x in group_members(db, gid)}
    for mid in passados:
        alvo = por_id.get(mid)
        if alvo is None:
            continue
        atras = round(meu_depois - antes[mid])
        try:
            pushmod.send_to_user(
                db,
                alvo.user_id,
                f"{quem} passou você",
                f"{quem} está {atras} pts à frente em {grupo.name}. Sua vez.",
                "/grupo",
            )
        except Exception:  # noqa: BLE001 — notificação nunca derruba o registro
            pass


@app.get("/api/groups/{gid}/ranking")
def get_ranking(gid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Placar do mês.

    Devolve tudo o que a tela do grupo precisa para parecer uma disputa: posição,
    distância para quem está na frente, sequência e o recorte por origem do
    ponto. Antes ela montava isso sozinha a partir de campos que não existiam.
    """
    me = get_membership(db, user, gid)
    group = db.get(Group, gid)
    settings = get_group_settings(db, gid)
    today = today_of(settings)
    period_start, period_end = month_bounds(today)

    members = group_members(db, gid)
    joint = joint_points_map(db, gid)

    ranking = []
    for m_obj in members:
        cs = (
            db.query(m.CompetitiveScore)
            .filter(
                m.CompetitiveScore.membership_id == m_obj.id,
                m.CompetitiveScore.period_start == period_start,
                m.CompetitiveScore.period_end == period_end,
            )
            .first()
        )
        up = db.query(m.UserProgress).filter(m.UserProgress.user_id == m_obj.user_id).first()
        days = build_member_days(settings, m_obj, joint, today)
        stats = scoring.player_stats(settings, days, today)

        ranking.append(
            {
                "membership_id": m_obj.id,
                "user_id": m_obj.user.id,
                "name": m_obj.user.name,
                "photo": m_obj.user.photo,
                "level": (up.level if up else 1) or 1,
                "xp": (up.total_xp if up else 0) or 0,
                "streak": stats["streak"],
                "effort_score": round(cs.effort_score if cs else 0.0),
                "consistency_score": round(cs.consistency_score if cs else 0.0),
                "habit_score": round((cs.habit_score or 0.0) if cs else 0.0),
                "challenge_score": round(cs.challenge_score if cs else 0.0),
                "total_score": round(cs.total_score if cs else 0.0),
                "is_me": m_obj.id == me.id,
            }
        )

    ranking.sort(key=lambda x: (-x["total_score"], x["name"].lower()))
    lider = ranking[0]["total_score"] if ranking else 0
    for i, r in enumerate(ranking):
        r["position"] = i + 1
        # Distância para quem está imediatamente à frente: é o número que faz
        # alguém sair para correr, não o total do líder.
        r["gap_to_next"] = 0 if i == 0 else ranking[i - 1]["total_score"] - r["total_score"]
        r["gap_to_leader"] = lider - r["total_score"]

    eu = next((r for r in ranking if r["is_me"]), None)
    return {
        "period": f"{MESES_PT[period_start.month - 1]} de {period_start.year}",
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "days_left": (period_end - today).days,
        "ranking": ranking,
        "total_score": sum(r["total_score"] for r in ranking),
        "me": eu,
        # Um espaço individual não tem contra quem competir; a tela usa isto
        # para trocar o placar por progresso pessoal em vez de mostrar um
        # ranking de uma pessoa só.
        "competitive": bool(group_rules(group)["ranking"]) and len(ranking) > 1,
    }


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
    ids = [a.id for a in rows]
    rmap = reactions_map(db, ids, me.id)
    cmap = comments_map(db, ids, members_by_id)
    return {
        "activities": [serialize_activity(a, members_by_id, rmap, cmap) for a in rows],
        "reaction_types": FEED_REACTIONS,
    }


@app.delete("/api/groups/{gid}/activities/{aid}")
def delete_activity(gid: int, aid: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """Tira do feed um item publicado por você (com a foto, reações e comentários).

    O feed é público para o grupo e boa parte dele é foto: sem apagar, um envio
    errado fica exposto para sempre. Remove só a publicação — o que ela contava
    (treino, tarefa, desafio) continua onde foi registrado, e é lá que se desfaz.
    """
    membership = get_membership(db, user, gid)
    item = db.get(Activity, aid)
    if item is None or item.group_id != gid:
        raise HTTPException(404, "Item do feed não encontrado.")
    if item.membership_id != membership.id:
        raise HTTPException(403, "Só dá para apagar a própria publicação.")

    q = db.query(Activity).filter(Activity.id == aid)
    _purge_activity_children(db, q)
    q.delete(synchronize_session=False)
    db.commit()
    return {"ok": True}


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
    tipo = getattr(membership.group, "group_type", None) or "group"
    return {"achievements": scoring.achievements_for(days, stats, casal, s, tipo)}


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
    return {"categories": cats, "icons": [CATEGORY_ICON[c] for c in cats], "members": out}


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
                    "icon": CATEGORY_ICON.get(cat, "target"),
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
                    "emoji": h.get("icon", "check-circle"),
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
            row["nudge"] = {"icon": "flag", "text": "Desafio concluído!"}

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
        # O resumo completo (com `rules` e `member_count`): a tela do grupo lê o
        # grupo daqui, e sem as regras ela não sabia se havia convite nem quantas
        # pessoas competiam — mostrava "0 pessoas" e escondia o código.
        "group": group_summary(membership.group, membership.role, len(members)),
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
        "category_icon": CATEGORY_ICON,
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


# --- rotas: calendário (Fase 2) --------------------------------------------
@app.get("/api/calendar")
def list_calendar(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(m.CalendarActivity).filter(m.CalendarActivity.user_id == user.id).all()
    return {"activities": items}

def _com_datas(dados: dict) -> dict:
    """Converte os campos de data/hora que chegam como texto ISO.

    Sem isto o SQLAlchemy recebe str numa coluna DateTime e estoura — era o que
    derrubava qualquer criação de compromisso com horário.
    """
    for campo in ("start_datetime", "end_datetime"):
        if dados.get(campo) is not None:
            dados[campo] = parse_datetime(dados[campo])
    return dados


@app.post("/api/calendar")
def create_calendar(payload: s.CalendarActivityCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dados = _com_datas(payload.model_dump(exclude_unset=True))
    item = m.CalendarActivity(user_id=user.id, **dados)
    if item.start_datetime and item.end_datetime and item.end_datetime < item.start_datetime:
        raise HTTPException(400, "O fim do compromisso precisa ser depois do início.")
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.put("/api/calendar/{item_id}")
def update_calendar(item_id: int, payload: s.CalendarActivityUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(m.CalendarActivity).filter(m.CalendarActivity.id == item_id, m.CalendarActivity.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "Atividade não encontrada.")
    for key, value in _com_datas(payload.model_dump(exclude_unset=True)).items():
        setattr(item, key, value)
    if item.start_datetime and item.end_datetime and item.end_datetime < item.start_datetime:
        raise HTTPException(400, "O fim do compromisso precisa ser depois do início.")
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/calendar/{item_id}")
def delete_calendar(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(m.CalendarActivity).filter(m.CalendarActivity.id == item_id, m.CalendarActivity.user_id == user.id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}

# --- rotas: rotinas (Fase 2) -----------------------------------------------
def serialize_routine(db: Session, r: m.Routine) -> dict:
    """Rotina sem os passos não é rotina: quem cria precisa ver o que criou."""
    steps = (
        db.query(m.RoutineStep)
        .filter(m.RoutineStep.routine_id == r.id)
        .order_by(m.RoutineStep.order)
        .all()
    )
    out = {c.name: getattr(r, c.name) for c in r.__table__.columns}
    out["steps"] = [{c.name: getattr(st, c.name) for c in st.__table__.columns} for st in steps]
    return out


@app.get("/api/routines")
def list_routines(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    routines = db.query(m.Routine).filter(m.Routine.user_id == user.id).all()
    return {"routines": [serialize_routine(db, r) for r in routines]}

@app.post("/api/routines")
def create_routine(payload: s.RoutineCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    steps_data = payload.steps
    data = payload.model_dump(exclude={"steps"}, exclude_unset=True)
    routine = m.Routine(user_id=user.id, **data)
    db.add(routine)
    db.flush()
    for idx, step_data in enumerate(steps_data):
        sd = step_data.model_dump()
        sd["order"] = sd.get("order", idx)
        db.add(m.RoutineStep(routine_id=routine.id, **sd))
    db.commit()
    db.refresh(routine)
    return serialize_routine(db, routine)

@app.put("/api/routines/{routine_id}")
def update_routine(routine_id: int, payload: s.RoutineUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    routine = db.query(m.Routine).filter(m.Routine.id == routine_id, m.Routine.user_id == user.id).first()
    if not routine:
        raise HTTPException(404, "Rotina não encontrada.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(routine, key, value)
    db.flush()
    sync_constancy(db, user)  # pausar ou mudar a frequência muda o que vencia
    db.commit()
    db.refresh(routine)
    return serialize_routine(db, routine)

@app.delete("/api/routines/{routine_id}")
def delete_routine(routine_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Apaga a rotina, os passos e o histórico de execução dela.

    O log tem de ir junto: ele é o que vira ponto e XP, e log órfão de rotina
    que não existe mais continuaria pontuando sem nenhuma tela onde desfazer.
    """
    routine = db.query(m.Routine).filter(m.Routine.id == routine_id, m.Routine.user_id == user.id).first()
    if routine:
        db.query(m.RoutineStep).filter(m.RoutineStep.routine_id == routine.id).delete()
        db.query(m.RoutineLog).filter(m.RoutineLog.routine_id == routine.id).delete()
        db.query(m.ActivityLinkedRoutine).filter(
            m.ActivityLinkedRoutine.routine_id == routine.id
        ).delete()
        db.delete(routine)
        db.flush()
        sync_constancy(db, user)
        db.commit()
    return {"ok": True, **_constancia_publica(db, user)}

# --- rotas: hábitos recorrentes (Fase 2) -----------------------------------
@app.get("/api/habits")
def list_habits(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habits = db.query(m.Habit).filter(m.Habit.user_id == user.id).all()
    return {"habits": habits}

@app.post("/api/habits")
def create_habit(payload: s.HabitCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = m.Habit(user_id=user.id, **payload.model_dump(exclude_unset=True))
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit

@app.put("/api/habits/{habit_id}")
def update_habit(habit_id: int, payload: s.HabitUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(m.Habit).filter(m.Habit.id == habit_id, m.Habit.user_id == user.id).first()
    if not habit:
        raise HTTPException(404, "Hábito não encontrado.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(habit, key, value)
    db.flush()
    sync_constancy(db, user)  # pausar ou mudar a frequência muda o que vencia
    db.commit()
    db.refresh(habit)
    return habit

@app.delete("/api/habits/{habit_id}")
def delete_habit(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Apaga o hábito e o histórico dele.

    Quem só quer parar por um tempo usa "pausar" (`active: false`), que preserva
    o passado. Apagar é para o hábito que não deveria existir — e aí o que ele
    pontuou some junto, senão ficaria ponto sem origem e sem como desfazer.
    """
    habit = db.query(m.Habit).filter(m.Habit.id == habit_id, m.Habit.user_id == user.id).first()
    if habit:
        db.query(m.HabitLog).filter(m.HabitLog.habit_id == habit.id).delete()
        db.delete(habit)
        db.flush()
        sync_constancy(db, user)
        db.commit()
    return {"ok": True, **_constancia_publica(db, user)}



# --- Fase 4: dia pessoal (hábitos, rotinas, agenda, descanso) --------------
# Convenção de dia da semana nos campos `custom_days`/`frequency.days`:
# 0=domingo … 6=sábado (igual ao getDay() do JS), para o front não precisar converter.
def _js_dow(d: date) -> int:
    return (d.weekday() + 1) % 7


def habit_due_on(habit: m.Habit, d: date) -> bool:
    """Um hábito vence hoje conforme sua frequência."""
    freq = (habit.frequency or "daily").lower()
    if freq == "daily":
        return True
    if freq == "weekdays":
        return d.weekday() < 5  # seg–sex
    if freq == "custom":
        return _js_dow(d) in (habit.custom_days or [])
    return True


def routine_due_on(routine: m.Routine, d: date) -> bool:
    """Rotinas guardam frequência como {"type": ..., "days": [...]}."""
    freq = routine.frequency or {}
    kind = (freq.get("type") or "daily").lower()
    if kind == "daily":
        return True
    if kind == "weekdays":
        return d.weekday() < 5
    if kind == "custom":
        return _js_dow(d) in (freq.get("days") or [])
    return True


def is_rest_day(db: Session, user_id: int, d: date) -> bool:
    return db.query(m.RestDay).filter(
        m.RestDay.user_id == user_id, m.RestDay.date == d
    ).first() is not None


def _habit_log(db: Session, habit: m.Habit, d: date) -> m.HabitLog:
    log = db.query(m.HabitLog).filter(
        m.HabitLog.habit_id == habit.id, m.HabitLog.date == d
    ).first()
    if not log:
        log = m.HabitLog(habit_id=habit.id, user_id=habit.user_id, date=d, completed=False)
        db.add(log)
        db.flush()
    return log


def _routine_log(db: Session, routine: m.Routine, d: date) -> m.RoutineLog:
    log = db.query(m.RoutineLog).filter(
        m.RoutineLog.routine_id == routine.id, m.RoutineLog.date == d
    ).first()
    if not log:
        log = m.RoutineLog(routine_id=routine.id, user_id=routine.user_id, date=d,
                           steps_done=[], completed=False)
        db.add(log)
        db.flush()
    return log


def _own_habit(db: Session, user: User, habit_id: int) -> m.Habit:
    habit = db.query(m.Habit).filter(
        m.Habit.id == habit_id, m.Habit.user_id == user.id
    ).first()
    if not habit:
        raise HTTPException(404, "Hábito não encontrado.")
    return habit


def _own_routine(db: Session, user: User, routine_id: int) -> m.Routine:
    routine = db.query(m.Routine).filter(
        m.Routine.id == routine_id, m.Routine.user_id == user.id
    ).first()
    if not routine:
        raise HTTPException(404, "Rotina não encontrada.")
    return routine


# --- constância: pontos por hábito, rotina e sequência ---------------------
# O placar de constância é *derivado*: nada aqui soma ponto incrementalmente.
# É o que faz "desfazer" funcionar de graça — desmarcar um hábito recalcula e o
# ponto some, sem contabilidade paralela para sair do lugar.
STREAK_WINDOW_DAYS = 400  # até onde a sequência é procurada para trás


def _existia_em(obj, d: date) -> bool:
    """Um hábito/rotina só é cobrado a partir do dia em que foi criado.

    Sem isto, criar um hábito hoje reprovaria retroativamente todos os dias
    anteriores e derrubaria a sequência de quem estava indo bem — o oposto do
    que adicionar um hábito deveria provocar.
    """
    criado = getattr(obj, "created_at", None)
    return criado is None or criado.date() <= d


def consistency_window(db: Session, user_id: int, start: date, end: date) -> dict[date, dict]:
    """Por dia do intervalo: o que vencia, o que saiu e se o dia fechou.

    Carrega tudo de uma vez (hábitos, rotinas, logs e descansos) porque esta
    função roda a cada marcação — uma consulta por dia seria proibitivo.
    """
    if end < start:
        return {}

    habitos = db.query(m.Habit).filter(
        m.Habit.user_id == user_id, m.Habit.active.is_(True)
    ).all()
    rotinas = db.query(m.Routine).filter(
        m.Routine.user_id == user_id, m.Routine.active.is_(True)
    ).all()

    feitos_h: dict[date, set[int]] = {}
    for log in db.query(m.HabitLog).filter(
        m.HabitLog.user_id == user_id, m.HabitLog.date >= start,
        m.HabitLog.date <= end, m.HabitLog.completed.is_(True),
    ).all():
        feitos_h.setdefault(log.date, set()).add(log.habit_id)

    feitas_r: dict[date, set[int]] = {}
    for log in db.query(m.RoutineLog).filter(
        m.RoutineLog.user_id == user_id, m.RoutineLog.date >= start,
        m.RoutineLog.date <= end, m.RoutineLog.completed.is_(True),
    ).all():
        feitas_r.setdefault(log.date, set()).add(log.routine_id)

    descansos = {
        r.date for r in db.query(m.RestDay).filter(
            m.RestDay.user_id == user_id, m.RestDay.date >= start, m.RestDay.date <= end
        ).all()
    }

    janela: dict[date, dict] = {}
    d = start
    while d <= end:
        vence_h = [h for h in habitos if _existia_em(h, d) and habit_due_on(h, d)]
        vence_r = [r for r in rotinas if _existia_em(r, d) and routine_due_on(r, d)]
        # Ponto ganho é ponto ganho: a contagem vem dos logs, não do que hoje
        # ainda vence. Sem isso, pausar um hábito apagaria retroativamente tudo
        # o que ele já tinha rendido — e pausar existe justamente para ser a
        # alternativa sem perdas a apagar.
        fez_h = len(feitos_h.get(d, ()))
        fez_r = len(feitas_r.get(d, ()))
        # Já o "dia fechado" olha só o que estava marcado para o dia: é ele que
        # define a sequência, e um hábito pausado não pode cobrar nada de hoje.
        no_prazo = (
            len([h for h in vence_h if h.id in feitos_h.get(d, ())])
            + len([r for r in vence_r if r.id in feitas_r.get(d, ())])
        )
        previstos = len(vence_h) + len(vence_r)
        janela[d] = {
            "planned": previstos,
            "done": no_prazo,
            "habits_done": fez_h,
            "routines_done": fez_r,
            # Dia fechado = fez alguma coisa e não deixou nada do dia pendente.
            # A segunda metade sozinha diria que um dia vazio está fechado; a
            # primeira sozinha daria o dia por fechado com pendência na lista.
            "full": (fez_h + fez_r) > 0 and no_prazo == previstos,
            "rest": d in descansos,
        }
        d += timedelta(days=1)
    return janela


def personal_streak(db: Session, user_id: int, today: date) -> int:
    """Dias seguidos fechando tudo que vencia.

    Um dia só quebra a corrente se havia algo a fazer e ficou pendente: descanso
    planejado e dia sem nada previsto atravessam sem somar nem zerar. O dia de
    hoje também não quebra enquanto não acabar — a sequência começa a ser lida
    de ontem quando hoje ainda está aberto.
    """
    inicio = today - timedelta(days=STREAK_WINDOW_DAYS)
    janela = consistency_window(db, user_id, inicio, today)
    if not janela:
        return 0

    d = today
    hoje = janela.get(today) or {}
    if not hoje.get("full"):
        d = today - timedelta(days=1)

    sequencia = 0
    while d in janela:
        info = janela[d]
        if info["rest"] or info["planned"] == 0:
            d -= timedelta(days=1)
            continue
        if not info["full"]:
            break
        sequencia += 1
        d -= timedelta(days=1)
    return sequencia


def consistency_summary(db: Session, user_id: int, start: date, end: date, today: date,
                        streak: int | None = None) -> dict:
    """Pontos de constância do período + a sequência atual.

    `streak` entra pronto quando quem chama já o calculou: a sequência varre até
    400 dias para trás e é a mesma em todos os espaços da pessoa, então
    recalculá-la por espaço seria repetir a varredura à toa.
    """
    janela = consistency_window(db, user_id, start, min(end, today))
    habitos = sum(v["habits_done"] for v in janela.values())
    rotinas = sum(v["routines_done"] for v in janela.values())
    completos = sum(1 for v in janela.values() if v["full"])
    # Dia de descanso sai da conta da razão: descansar de propósito não é falha.
    previstos = sum(v["planned"] for v in janela.values() if not v["rest"])
    feitos = sum(v["done"] for v in janela.values() if not v["rest"])

    sequencia = personal_streak(db, user_id, today) if streak is None else streak
    return {
        "habits_done": habitos,
        "routines_done": rotinas,
        "full_days": completos,
        "streak": sequencia,
        "streak_bonus": scoring_v2.streak_bonus(sequencia),
        "next_milestone": scoring_v2.next_streak_milestone(sequencia),
        "points": round(
            scoring_v2.habit_points(habitos, rotinas, completos)
            + scoring_v2.streak_bonus(sequencia),
            2,
        ),
        "consistency": scoring_v2.compute_consistency_score(previstos, feitos),
    }


def recompute_user_progress(db: Session, user_id: int) -> m.UserProgress:
    """Refaz o XP e o nível a partir do que está registrado.

    Derivado de propósito: apagar um registro tem de devolver exatamente o XP
    que ele deu, e somar/subtrair à mão acumula erro a cada caminho novo.
    """
    up = db.query(m.UserProgress).filter(m.UserProgress.user_id == user_id).first()
    if not up:
        up = m.UserProgress(user_id=user_id, total_xp=0, effort_total=0.0, level=1)
        db.add(up)

    esforco, xp_registros = (
        db.query(func.sum(m.ActivityRecord.effort_score), func.sum(m.ActivityRecord.xp_earned))
        .filter(m.ActivityRecord.user_id == user_id)
        .one()
    )
    habitos = db.query(func.count(m.HabitLog.id)).filter(
        m.HabitLog.user_id == user_id, m.HabitLog.completed.is_(True)
    ).scalar() or 0
    rotinas = db.query(func.count(m.RoutineLog.id)).filter(
        m.RoutineLog.user_id == user_id, m.RoutineLog.completed.is_(True)
    ).scalar() or 0

    up.effort_total = float(esforco or 0.0)
    up.total_xp = int(xp_registros or 0) + scoring_v2.xp_for(
        scoring_v2.habit_points(habitos, rotinas, full_days=0)
    )
    up.level = scoring_v2.level_for(up.total_xp)
    return up


def sync_competitive_score(db: Session, user_id: int, membership: Membership, d: date,
                           streak: int | None = None) -> m.CompetitiveScore:
    """Refaz a linha do placar do mês de `d` a partir do que está registrado.

    Esforço vem dos registros de atividade; constância, dos hábitos e rotinas.
    Nenhum dos dois é acumulado em coluna — por isso apagar qualquer um deles
    devolve o placar ao que era, sem operação inversa escrita à mão.
    """
    inicio, fim = month_bounds(d)
    cs = (
        db.query(m.CompetitiveScore)
        .filter(
            m.CompetitiveScore.membership_id == membership.id,
            m.CompetitiveScore.period_start == inicio,
            m.CompetitiveScore.period_end == fim,
        )
        .first()
    )
    if not cs:
        cs = m.CompetitiveScore(
            membership_id=membership.id, period_start=inicio, period_end=fim,
            effort_score=0.0, consistency_score=0.0, habit_score=0.0, challenge_score=0.0,
        )
        db.add(cs)

    esforco = (
        db.query(func.sum(m.ActivityRecord.score_earned))
        .filter(
            m.ActivityRecord.user_id == user_id,
            m.ActivityRecord.group_id == membership.group_id,
            m.ActivityRecord.date >= inicio,
            m.ActivityRecord.date <= fim,
        )
        .scalar()
    )
    resumo = consistency_summary(
        db, user_id, inicio, fim,
        today_of(get_group_settings(db, membership.group_id)), streak=streak,
    )

    cs.effort_score = float(esforco or 0.0)
    cs.habit_score = resumo["points"]
    cs.consistency_score = resumo["consistency"]
    cs.challenge_score = cs.challenge_score or 0.0
    cs.total_score = scoring_v2.total_competitive(
        cs.effort_score, cs.consistency_score, cs.challenge_score, cs.habit_score
    )
    return cs


def _constancia_publica(db: Session, user: User, hoje: date | None = None) -> dict:
    """Sequência, nível e próximo marco — o que a tela mostra depois de marcar."""
    hoje = hoje or date.today()
    inicio, fim = month_bounds(hoje)
    resumo = consistency_summary(db, user.id, inicio, fim, hoje)
    up = db.query(m.UserProgress).filter(m.UserProgress.user_id == user.id).first()
    return {
        "streak": resumo["streak"],
        "next_milestone": resumo["next_milestone"],
        "xp": (up.total_xp if up else 0) or 0,
        "level": (up.level if up else 1) or 1,
    }


def sync_constancy(db: Session, user: User) -> None:
    """Propaga hábitos e rotinas para o XP e para o placar de cada espaço.

    Hábito é pessoal, mas o placar é por espaço: quem está em três grupos leva a
    mesma constância para os três. Não é ponto dobrado — são três disputas
    diferentes, cada uma com o seu próprio recorte.
    """
    recompute_user_progress(db, user.id)
    sequencia = personal_streak(db, user.id, date.today())
    for membership in db.query(Membership).filter(Membership.user_id == user.id).all():
        try:
            hoje = today_of(get_group_settings(db, membership.group_id))
            sync_competitive_score(db, user.id, membership, hoje, streak=sequencia)
        except HTTPException:
            continue  # grupo sem settings: não pode impedir a marcação do hábito


@app.post("/api/habits/{habit_id}/log")
def log_habit(habit_id: int, payload: s.HabitLogToggle,
              user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Marca/desmarca um hábito num dia. É isto que alimenta a consistência."""
    habit = _own_habit(db, user, habit_id)
    d = parse_date(payload.date, date.today())
    log = _habit_log(db, habit, d)
    log.completed = (not log.completed) if payload.completed is None else payload.completed
    if payload.value is not None:
        log.value = payload.value
    db.flush()
    sync_constancy(db, user)
    db.commit()
    db.refresh(log)
    return {"habit_id": habit.id, "date": log.date.isoformat(),
            "completed": log.completed, "value": log.value,
            # Marcar e não ganhar nada é o caminho mais curto para parar de
            # marcar: o ponto ganho volta na resposta para a tela poder dizê-lo.
            "points": scoring_v2.HABIT_POINTS if log.completed else 0,
            **_constancia_publica(db, user)}


@app.post("/api/routines/{routine_id}/log")
def log_routine_step(routine_id: int, payload: s.RoutineStepToggle,
                     user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Marca/desmarca um passo da rotina. A rotina fecha quando os obrigatórios saem."""
    routine = _own_routine(db, user, routine_id)
    step = db.query(m.RoutineStep).filter(
        m.RoutineStep.id == payload.step_id, m.RoutineStep.routine_id == routine.id
    ).first()
    if not step:
        raise HTTPException(404, "Passo não encontrado nesta rotina.")

    d = parse_date(payload.date, date.today())
    log = _routine_log(db, routine, d)
    done = set(log.steps_done or [])
    want = (step.id not in done) if payload.done is None else payload.done
    done.add(step.id) if want else done.discard(step.id)
    log.steps_done = sorted(done)

    required = [
        st.id for st in db.query(m.RoutineStep)
        .filter(m.RoutineStep.routine_id == routine.id, m.RoutineStep.is_required.is_(True)).all()
    ]
    antes = log.completed
    log.completed = bool(required) and all(sid in done for sid in required)
    db.flush()
    sync_constancy(db, user)
    db.commit()
    db.refresh(log)
    return {"routine_id": routine.id, "date": log.date.isoformat(),
            "steps_done": log.steps_done, "completed": log.completed,
            "points": scoring_v2.ROUTINE_POINTS if (log.completed and not antes) else 0,
            **_constancia_publica(db, user)}


@app.get("/api/rest-days")
def list_rest_days(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(m.RestDay).filter(m.RestDay.user_id == user.id).order_by(m.RestDay.date.desc()).all()
    return {"rest_days": [{"date": r.date.isoformat(), "reason": r.reason} for r in rows]}


@app.post("/api/rest-days")
def add_rest_day(payload: s.RestDayCreate,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Descanso planejado: o dia deixa de contar como falha na consistência."""
    d = parse_date(payload.date, date.today())
    row = db.query(m.RestDay).filter(m.RestDay.user_id == user.id, m.RestDay.date == d).first()
    if not row:
        row = m.RestDay(user_id=user.id, date=d)
        db.add(row)
    row.reason = payload.reason
    db.flush()
    sync_constancy(db, user)
    db.commit()
    return {"date": d.isoformat(), "reason": row.reason, **_constancia_publica(db, user)}


@app.delete("/api/rest-days/{day}")
def remove_rest_day(day: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = parse_date(day, date.today())
    db.query(m.RestDay).filter(m.RestDay.user_id == user.id, m.RestDay.date == d).delete()
    db.flush()
    sync_constancy(db, user)
    db.commit()
    return {"ok": True, **_constancia_publica(db, user)}


def _treino_de_hoje(db: Session, user: User, d: date, records: list) -> dict | None:
    """O treino do dia: a sessão marcada para hoje, ou a próxima pendente.

    Devolve None quando não há plano — a Home então convida a montar um em vez
    de mostrar um cartão vazio.
    """
    plano = (
        db.query(m.TrainingPlan)
        .filter(m.TrainingPlan.user_id == user.id, m.TrainingPlan.status == "active")
        .order_by(m.TrainingPlan.id.desc())
        .first()
    )
    if plano is None:
        return None

    sessoes = (
        db.query(m.TrainingSession)
        .filter(m.TrainingSession.plan_id == plano.id)
        .order_by(m.TrainingSession.week, m.TrainingSession.order)
        .all()
    )
    feitas = len([x for x in sessoes if x.status == "done"])
    hoje = next((x for x in sessoes if x.scheduled_date == d), None)
    proxima = hoje or next((x for x in sessoes if x.status == "pending"), None)

    return {
        "plan_id": plano.id,
        "modality": plano.modality,
        "goal": plano.goal,
        "done": feitas,
        "total": len(sessoes),
        "percent": round(feitas / len(sessoes) * 100) if sessoes else 0,
        "today": None if proxima is None else {
            "id": proxima.id,
            "title": proxima.title,
            "focus": proxima.focus,
            "duration_min": proxima.duration_min,
            "status": proxima.status,
            "items": len(proxima.items or []),
            "scheduled_for_today": proxima.scheduled_date == d,
        },
        # Atividade solta registrada hoje conta como treino feito, mesmo fora do plano.
        "logged_today": len(records),
    }


def _nutricao_de_hoje(db: Session, user: User, d: date, gid: int | None) -> dict | None:
    """Resumo de calorias e água do dia, do espaço atual da pessoa."""
    q = db.query(Membership).filter(Membership.user_id == user.id)
    membership = q.filter(Membership.group_id == gid).first() if gid else None
    if membership is None:
        membership = q.order_by(Membership.id).first()
    if membership is None:
        return None

    s_obj = get_group_settings(db, membership.group_id)
    dados = nutrition_payload(db, membership.group_id, membership, d, s_obj)
    return {
        "group_id": membership.group_id,
        "calories": dados["calories"],
        "calories_goal": dados["calories_goal"],
        "protein_g": dados["protein_g"],
        "protein_goal_g": dados["protein_goal_g"],
        "water_l": dados["water_l"],
        "water_goal_l": dados["water_goal_l"],
        "meals": dados["count"],
    }


@app.get("/api/today")
def my_day(day: str | None = None, group: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Tudo que o usuário precisa fazer hoje, numa chamada só.

    É o payload do Meu Dia: agenda, rotinas e hábitos do dia já cruzados com o
    que foi registrado. Não depende de grupo — o Questly funciona sozinho.

    `group` é opcional e só serve para a alimentação, que é registrada dentro
    de um espaço. Sem ele, usa o primeiro espaço da pessoa.
    """
    d = parse_date(day, date.today())
    resting = is_rest_day(db, user.id, d)

    # Agenda do dia (inclui itens sem horário definido, que viram "sem hora").
    day_start = datetime.combine(d, dtime.min)
    day_end = datetime.combine(d, dtime.max)
    events = db.query(m.CalendarActivity).filter(
        m.CalendarActivity.user_id == user.id,
        m.CalendarActivity.start_datetime >= day_start,
        m.CalendarActivity.start_datetime <= day_end,
    ).order_by(m.CalendarActivity.start_datetime).all()

    linked = {}
    if events:
        for row in db.query(m.ActivityLinkedRoutine).filter(
            m.ActivityLinkedRoutine.activity_id.in_([e.id for e in events])
        ).all():
            linked.setdefault(row.activity_id, []).append(
                {"routine_id": row.routine_id, "timing": row.timing}
            )

    agenda = [{
        "id": e.id,
        "title": e.title,
        "description": e.description,
        "category": e.category,
        "start": e.start_datetime.isoformat() if e.start_datetime else None,
        "end": e.end_datetime.isoformat() if e.end_datetime else None,
        "duration_min": e.duration_min,
        "visibility": e.visibility,
        "status": e.status,
        "reminder_minutes": e.reminder_minutes or [],
        "routines": linked.get(e.id, []),
    } for e in events]

    # Hábitos que vencem hoje + o que já foi marcado.
    habits_all = db.query(m.Habit).filter(
        m.Habit.user_id == user.id, m.Habit.active.is_(True)
    ).all()
    due_habits = [h for h in habits_all if habit_due_on(h, d)]
    hlogs = {
        l.habit_id: l for l in db.query(m.HabitLog).filter(
            m.HabitLog.user_id == user.id, m.HabitLog.date == d
        ).all()
    }
    habits = [{
        "id": h.id,
        "name": h.name,
        "category": h.category,
        "icon": h.icon,
        "time": h.time,
        "goal_qty": h.goal_qty,
        "goal_unit": h.goal_unit,
        "completed": bool(hlogs[h.id].completed) if h.id in hlogs else False,
        "value": hlogs[h.id].value if h.id in hlogs else None,
    } for h in due_habits]

    # Rotinas que vencem hoje, com passos e progresso.
    routines_all = db.query(m.Routine).filter(
        m.Routine.user_id == user.id, m.Routine.active.is_(True)
    ).order_by(m.Routine.order).all()
    due_routines = [r for r in routines_all if routine_due_on(r, d)]
    rlogs = {
        l.routine_id: l for l in db.query(m.RoutineLog).filter(
            m.RoutineLog.user_id == user.id, m.RoutineLog.date == d
        ).all()
    }
    steps_by_routine = {}
    if due_routines:
        for st in db.query(m.RoutineStep).filter(
            m.RoutineStep.routine_id.in_([r.id for r in due_routines])
        ).order_by(m.RoutineStep.order).all():
            steps_by_routine.setdefault(st.routine_id, []).append(st)

    routines = []
    for r in due_routines:
        done = set((rlogs[r.id].steps_done or []) if r.id in rlogs else [])
        steps = steps_by_routine.get(r.id, [])
        routines.append({
            "id": r.id,
            "name": r.name,
            "category": r.category,
            "time_slot": r.time_slot,
            "completed": bool(rlogs[r.id].completed) if r.id in rlogs else False,
            "steps": [{
                "id": st.id,
                "name": st.name,
                "duration_min": st.duration_min,
                "is_required": st.is_required,
                "done": st.id in done,
            } for st in steps],
            "done_count": len([st for st in steps if st.id in done]),
            "total_count": len(steps),
        })

    records = db.query(m.ActivityRecord).filter(
        m.ActivityRecord.user_id == user.id, m.ActivityRecord.date == d
    ).all()

    progress = db.query(m.UserProgress).filter(m.UserProgress.user_id == user.id).first()
    inicio_mes, fim_mes = month_bounds(d)
    constancia = consistency_summary(db, user.id, inicio_mes, fim_mes, d)

    # O "feito de hoje" ignora o que já está fechado; num dia de descanso
    # planejado nada fica pendente, por isso ele não conta como falha.
    open_habits = len([h for h in habits if not h["completed"]])
    open_routines = len([r for r in routines if not r["completed"]])
    open_events = len([e for e in agenda if e["status"] == "pending"])
    total_items = len(habits) + len(routines) + len(agenda)
    done_items = total_items - (open_habits + open_routines + open_events)

    return {
        "date": d.isoformat(),
        "rest_day": resting,
        "agenda": agenda,
        "habits": habits,
        "routines": routines,
        "records": [{
            "id": r.id,
            "modality": r.modality,
            "category": r.category,
            "params": r.params,
            "xp_earned": r.xp_earned,
            "score_earned": r.score_earned,
            # O espaço onde o registro entrou: é por ele que a tela consegue
            # apagá-lo, mesmo quando a pessoa está olhando outro espaço.
            "group_id": r.group_id,
            "proof_image": r.proof_image,
        } for r in records],
        # Treino e alimentação aparecem na Home porque são o que a pessoa
        # realmente faz no dia. O planejamento dos dois fica no Meu Plano.
        "training": _treino_de_hoje(db, user, d, records),
        "nutrition": _nutricao_de_hoje(db, user, d, group),
        "summary": {
            "total": total_items,
            "done": done_items,
            "pending": 0 if resting else (open_habits + open_routines + open_events),
            "xp": progress.total_xp if progress else 0,
            "level": progress.level if progress else 1,
            # A sequência é a única métrica que a pessoa tem medo de perder, e
            # era a que não aparecia em lugar nenhum do dia a dia.
            "streak": constancia["streak"],
            "streak_bonus": constancia["streak_bonus"],
            "next_milestone": constancia["next_milestone"],
            "points": constancia["points"],
            "habit_points": scoring_v2.HABIT_POINTS,
            "routine_points": scoring_v2.ROUTINE_POINTS,
        },
    }


@app.get("/api/presets")
def list_presets(user: User = Depends(get_current_user)):
    """Hábitos, rotinas, compromissos e metas prontos para usar.

    A tela em branco é o que mais afasta quem abre o app pela primeira vez.
    Digitar continua valendo em todas as telas — isto é só o atalho.
    """
    return presets.catalog()


@app.post("/api/habits/bulk")
def create_habits_bulk(payload: s.HabitBulkCreate, user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """Cria vários hábitos de uma vez (o caminho de quem escolheu prontos).

    Hábito com o mesmo nome que já existe é ignorado em vez de duplicar: voltar
    à lista de prontos e tocar de novo é fácil demais para virar bagunça.
    """
    existentes = {
        (h.name or "").strip().lower()
        for h in db.query(m.Habit).filter(m.Habit.user_id == user.id).all()
    }
    criados = []
    for item in payload.habits:
        if item.name.strip().lower() in existentes:
            continue
        habit = m.Habit(user_id=user.id, **item.model_dump(exclude_unset=True))
        db.add(habit)
        criados.append(habit)
        existentes.add(item.name.strip().lower())
    db.commit()
    for h in criados:
        db.refresh(h)
    return {"created": len(criados), "skipped": len(payload.habits) - len(criados),
            "habits": criados}


@app.get("/api/modalities")
def list_modalities(user: User = Depends(get_current_user)):
    """Modalidades e seus parâmetros, direto de quem calcula a pontuação.

    O formulário de registro se monta a partir daqui, então não há como ele
    pedir um campo que o cálculo ignora — nem esquecer um que ele usa.
    """
    return {"modalities": scoring_v2.modality_catalog()}


# --- Fase 5: treino com IA -------------------------------------------------
def _own_plan(db: Session, user: User, plan_id: int) -> m.TrainingPlan:
    plano = db.query(m.TrainingPlan).filter(
        m.TrainingPlan.id == plan_id, m.TrainingPlan.user_id == user.id
    ).first()
    if not plano:
        raise HTTPException(404, "Plano não encontrado.")
    return plano


def serialize_plan(db: Session, plano: m.TrainingPlan, com_sessoes: bool = True) -> dict:
    sessoes = db.query(m.TrainingSession).filter(
        m.TrainingSession.plan_id == plano.id
    ).order_by(m.TrainingSession.week, m.TrainingSession.order).all()

    feitas = len([x for x in sessoes if x.status == "done"])
    out = {
        "id": plano.id,
        "modality": plano.modality,
        "goal": plano.goal,
        "level": plano.level,
        "days_per_week": plano.days_per_week,
        "weeks": plano.weeks,
        "notes": plano.notes,
        "source": plano.source,
        "status": plano.status,
        "start_date": plano.start_date.isoformat() if plano.start_date else None,
        "progress": {
            "total": len(sessoes),
            "done": feitas,
            "percent": round(feitas / len(sessoes) * 100) if sessoes else 0,
        },
    }
    if com_sessoes:
        out["sessions"] = [{
            "id": x.id,
            "week": x.week,
            "order": x.order,
            "title": x.title,
            "focus": x.focus,
            "duration_min": x.duration_min,
            "items": x.items or [],
            "status": x.status,
            "scheduled_date": x.scheduled_date.isoformat() if x.scheduled_date else None,
        } for x in sessoes]
    return out


def _materializar_plano(db: Session, plano: m.TrainingPlan, estrutura: dict) -> None:
    """Transforma o JSON da IA nas sessões do plano (substituindo as pendentes).

    As sessões já concluídas ficam: adaptar o plano no meio do caminho não pode
    apagar o que a pessoa já fez.
    """
    db.query(m.TrainingSession).filter(
        m.TrainingSession.plan_id == plano.id,
        m.TrainingSession.status != "done",
    ).delete(synchronize_session=False)

    plano.notes = estrutura.get("notes") or plano.notes
    for semana in estrutura["weeks"]:
        for i, sessao in enumerate(semana["sessions"]):
            db.add(m.TrainingSession(
                plan_id=plano.id,
                user_id=plano.user_id,
                week=semana["week"],
                order=i,
                title=sessao["title"],
                focus=sessao.get("focus"),
                duration_min=sessao.get("duration_min"),
                items=sessao["items"],
            ))


@app.get("/api/training/plans")
def list_training_plans(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    planos = db.query(m.TrainingPlan).filter(
        m.TrainingPlan.user_id == user.id
    ).order_by(m.TrainingPlan.created_at.desc()).all()
    return {
        "plans": [serialize_plan(db, p, com_sessoes=False) for p in planos],
        "ai_enabled": ai.ai_enabled(),
    }


@app.get("/api/training/plans/{plan_id}")
def read_training_plan(plan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_plan(db, _own_plan(db, user, plan_id))


@app.post("/api/training/plans")
def create_training_plan(payload: s.TrainingPlanCreate,
                         user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """A IA devolve o plano inteiro montado — semanas, sessões e itens."""
    if not ai.ai_enabled():
        raise HTTPException(503, "A IA não está configurada neste ambiente.")

    # O que o app já sabe da pessoa entra no pedido: plano de treino que ignora
    # objetivo e peso é conselho genérico, não plano.
    contexto = [payload.constraints] if payload.constraints else []
    if user.objetivo:
        contexto.append(f"objetivo declarado: {user.objetivo}")

    try:
        estrutura = ai.generate_training_plan(
            modality=payload.modality,
            goal=payload.goal or user.objetivo,
            level=payload.level,
            days_per_week=payload.days_per_week,
            weeks=payload.weeks,
            constraints="; ".join(contexto) or None,
        )
    except ValueError as e:
        raise HTTPException(502, str(e))

    plano = m.TrainingPlan(
        user_id=user.id,
        modality=payload.modality,
        goal=payload.goal or user.objetivo,
        level=payload.level,
        days_per_week=payload.days_per_week,
        weeks=len(estrutura["weeks"]),
        source="ai",
        start_date=date.today(),
    )
    db.add(plano)
    db.flush()
    _materializar_plano(db, plano, estrutura)
    db.commit()
    db.refresh(plano)
    return serialize_plan(db, plano)


@app.post("/api/training/plans/{plan_id}/adapt")
def adapt_training_plan(plan_id: int, payload: s.TrainingAdaptRequest,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Refaz o que falta do plano a partir do que a pessoa relatou.

    O plano vivo é o ponto: se está pesado demais ou fácil demais, a IA remonta
    o restante em vez de a pessoa abandonar e começar outro.
    """
    if not ai.ai_enabled():
        raise HTTPException(503, "A IA não está configurada neste ambiente.")
    plano = _own_plan(db, user, plan_id)

    feitas = db.query(m.TrainingSession).filter(
        m.TrainingSession.plan_id == plano.id, m.TrainingSession.status == "done"
    ).count()
    restantes = max(1, plano.weeks - (feitas // max(1, plano.days_per_week)))

    try:
        estrutura = ai.generate_training_plan(
            modality=plano.modality,
            goal=plano.goal,
            level=plano.level,
            days_per_week=plano.days_per_week,
            weeks=restantes,
            constraints=(
                f"Adaptação de um plano em andamento. Sessões já concluídas: {feitas}. "
                f"A pessoa relatou: {payload.feedback}"
            ),
        )
    except ValueError as e:
        raise HTTPException(502, str(e))

    _materializar_plano(db, plano, estrutura)
    db.commit()
    db.refresh(plano)
    return serialize_plan(db, plano)


@app.post("/api/training/sessions/{session_id}/item")
def toggle_training_item(session_id: int, payload: s.TrainingItemToggle,
                         user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Marca um item da sessão. A sessão fecha sozinha quando todos saem."""
    sessao = db.query(m.TrainingSession).filter(
        m.TrainingSession.id == session_id, m.TrainingSession.user_id == user.id
    ).first()
    if not sessao:
        raise HTTPException(404, "Sessão não encontrada.")

    itens = [dict(x) for x in (sessao.items or [])]
    if payload.item_index >= len(itens):
        raise HTTPException(400, "Item inexistente nesta sessão.")

    atual = bool(itens[payload.item_index].get("done"))
    itens[payload.item_index]["done"] = (not atual) if payload.done is None else payload.done
    sessao.items = itens

    tudo = bool(itens) and all(x.get("done") for x in itens)
    if tudo and sessao.status != "done":
        sessao.status = "done"
        sessao.completed_at = datetime.utcnow()
    elif not tudo and sessao.status == "done":
        sessao.status = "pending"
        sessao.completed_at = None

    db.commit()
    db.refresh(sessao)
    return {
        "id": sessao.id,
        "items": sessao.items,
        "status": sessao.status,
        "plan": serialize_plan(db, _own_plan(db, user, sessao.plan_id), com_sessoes=False),
    }


@app.put("/api/training/sessions/{session_id}")
def update_training_session(session_id: int, payload: s.TrainingSessionUpdate,
                            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessao = db.query(m.TrainingSession).filter(
        m.TrainingSession.id == session_id, m.TrainingSession.user_id == user.id
    ).first()
    if not sessao:
        raise HTTPException(404, "Sessão não encontrada.")

    if payload.status is not None:
        sessao.status = payload.status
        sessao.completed_at = datetime.utcnow() if payload.status == "done" else None
        # Fechar a sessão marca tudo; reabrir desmarca tudo. Guardar quais itens
        # estavam marcados antes do "concluí" exigiria uma segunda coluna só
        # para isso — e reabrir com metade marcada por engano é pior que
        # recomeçar a sessão limpa.
        marcado = payload.status == "done"
        if payload.status in ("done", "pending"):
            sessao.items = [{**x, "done": marcado} for x in (sessao.items or [])]
    if payload.scheduled_date is not None:
        sessao.scheduled_date = parse_date(payload.scheduled_date, date.today())
    db.commit()
    db.refresh(sessao)
    # Devolve a sessão inteira e o progresso do plano: a tela precisa dos dois
    # para se redesenhar sem recarregar o plano todo.
    return {
        "id": sessao.id,
        "items": sessao.items,
        "status": sessao.status,
        "scheduled_date": sessao.scheduled_date.isoformat() if sessao.scheduled_date else None,
        "plan": serialize_plan(db, _own_plan(db, user, sessao.plan_id), com_sessoes=False),
    }


@app.delete("/api/training/plans/{plan_id}")
def delete_training_plan(plan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plano = _own_plan(db, user, plan_id)
    db.query(m.TrainingSession).filter(m.TrainingSession.plan_id == plano.id).delete()
    db.delete(plano)
    db.commit()
    return {"ok": True}


@app.post("/api/routines/ai")
def create_routine_with_ai(payload: s.RoutineFromAI,
                           user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """A IA também monta rotina: mesma estrutura de passos que a pessoa criaria."""
    if not ai.ai_enabled():
        raise HTTPException(503, "A IA não está configurada neste ambiente.")
    try:
        gerada = ai.generate_routine(payload.name, payload.context, payload.steps)
    except ValueError as e:
        raise HTTPException(502, str(e))

    rotina = m.Routine(user_id=user.id, name=gerada["name"], frequency={"type": "daily"})
    db.add(rotina)
    db.flush()
    for i, passo in enumerate(gerada["steps"]):
        db.add(m.RoutineStep(
            routine_id=rotina.id,
            name=passo["name"],
            order=i,
            duration_min=passo["duration_min"],
            is_required=passo["is_required"],
        ))
    db.commit()
    db.refresh(rotina)
    return {"id": rotina.id, "name": rotina.name, "steps": gerada["steps"]}


# --- Fase 6: comentários no feed -------------------------------------------
def _activity_do_grupo(db: Session, gid: int, aid: int) -> Activity:
    item = db.query(Activity).filter(Activity.id == aid, Activity.group_id == gid).first()
    if not item:
        raise HTTPException(404, "Item do feed não encontrado.")
    return item


@app.get("/api/groups/{gid}/activities/{aid}/comments")
def list_comments(gid: int, aid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    _activity_do_grupo(db, gid, aid)
    members_by_id = {x.id: x for x in group_members(db, gid)}
    return {"comments": comments_map(db, [aid], members_by_id)[aid]}


@app.post("/api/groups/{gid}/activities/{aid}/comments")
def add_comment(gid: int, aid: int, payload: s.CommentCreate,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_membership(db, user, gid)
    _activity_do_grupo(db, gid, aid)

    comentario = m.ActivityComment(
        activity_id=aid,
        membership_id=membership.id,
        text=payload.text.strip(),
    )
    db.add(comentario)
    db.commit()
    db.refresh(comentario)

    members_by_id = {x.id: x for x in group_members(db, gid)}
    return {"comments": comments_map(db, [aid], members_by_id)[aid]}


@app.delete("/api/groups/{gid}/activities/{aid}/comments/{cid}")
def delete_comment(gid: int, aid: int, cid: int,
                   user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Só o autor apaga o próprio comentário."""
    membership = get_membership(db, user, gid)
    comentario = db.query(m.ActivityComment).filter(
        m.ActivityComment.id == cid, m.ActivityComment.activity_id == aid
    ).first()
    if not comentario:
        raise HTTPException(404, "Comentário não encontrado.")
    if comentario.membership_id != membership.id:
        raise HTTPException(403, "Só dá para apagar o próprio comentário.")

    db.delete(comentario)
    db.commit()
    members_by_id = {x.id: x for x in group_members(db, gid)}
    return {"comments": comments_map(db, [aid], members_by_id)[aid]}


# --- IA lendo o que de fato aconteceu --------------------------------------
def _resumo_para_ia(db: Session, user: User, d: date) -> dict:
    """O que a pessoa realmente fez — a matéria-prima da leitura do dia.

    É aqui que a IA deixa de ser chatbot: ela não pergunta como foi, ela lê.
    """
    inicio = d - timedelta(days=6)

    habitos = db.query(m.Habit).filter(
        m.Habit.user_id == user.id, m.Habit.active.is_(True)
    ).all()
    logs = db.query(m.HabitLog).filter(
        m.HabitLog.user_id == user.id, m.HabitLog.date >= inicio, m.HabitLog.date <= d
    ).all()
    descansos = db.query(m.RestDay).filter(
        m.RestDay.user_id == user.id, m.RestDay.date >= inicio, m.RestDay.date <= d
    ).count()

    # Consistência olha só os dias em que algo era esperado, e desconta o
    # descanso planejado — descansar de propósito não é falha.
    esperados = len([h for h in habitos if habit_due_on(h, d)]) * 7
    feitos = len([x for x in logs if x.completed])
    consistencia = scoring_v2.compute_consistency_score(esperados, feitos, descansos)

    registros = db.query(m.ActivityRecord).filter(
        m.ActivityRecord.user_id == user.id,
        m.ActivityRecord.date >= inicio,
        m.ActivityRecord.date <= d,
    ).all()
    modalidades = sorted({r.modality for r in registros})

    dia = my_day(day=d.isoformat(), user=user, db=db)
    plano = db.query(m.TrainingPlan).filter(
        m.TrainingPlan.user_id == user.id, m.TrainingPlan.status == "active"
    ).first()

    dados = {
        "pendente hoje": dia["summary"]["pending"],
        "concluído hoje": f"{dia['summary']['done']} de {dia['summary']['total']}",
        "hoje é descanso planejado": "sim" if dia["rest_day"] else "não",
        "consistência de hábitos (7 dias)": f"{consistencia:.0f}%",
        "treinos registrados (7 dias)": len(registros),
        "modalidades (7 dias)": ", ".join(modalidades) or "nenhuma",
        "dias de descanso planejados (7 dias)": descansos,
        "objetivo declarado": user.objetivo or "não informado",
    }
    if plano:
        progresso = serialize_plan(db, plano, com_sessoes=False)["progress"]
        dados["plano de treino"] = (
            f"{plano.modality}, {progresso['done']} de {progresso['total']} sessões"
        )
    if dia["agenda"]:
        dados["agenda de hoje"] = ", ".join(e["title"] for e in dia["agenda"][:3])
    return dados


@app.get("/api/today/insight")
def daily_insight(day: str | None = None, refresh: bool = False,
                  user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Uma frase da IA sobre o dia, a partir dos dados reais da pessoa.

    Gerada uma vez por dia: o Meu Dia é a tela mais aberta do app, e refazer a
    cada visita seria desperdício sem ganho nenhum.
    """
    d = parse_date(day, date.today())
    existente = db.query(m.DailyInsight).filter(
        m.DailyInsight.user_id == user.id, m.DailyInsight.date == d
    ).first()
    if existente and not refresh:
        return {"text": existente.text, "date": d.isoformat(), "cached": True}

    if not ai.ai_enabled():
        return {"text": None, "date": d.isoformat(), "ai_enabled": False}

    dados = _resumo_para_ia(db, user, d)
    try:
        texto = ai.generate_daily_insight(dados)
    except Exception:
        # A leitura é um extra: se a IA falhar, o Meu Dia segue inteiro.
        return {"text": None, "date": d.isoformat(), "ai_enabled": True}

    if existente:
        existente.text = texto
        existente.context = dados
    else:
        db.add(m.DailyInsight(user_id=user.id, date=d, text=texto, context=dados))
    db.commit()
    return {"text": texto, "date": d.isoformat(), "cached": False}

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
