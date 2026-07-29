"""API do Questly (FastAPI) — multi-tenant com auth e grupos (Fase 1)."""
import os
import re
from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from . import scoring
from .auth import (
    create_token,
    generate_invite_code,
    get_current_user,
    hash_password,
    verify_password,
)
from .data import CATEGORY_EMOJI, DEFAULT_HABITS, HABITS_MENU, JOINT_SUGGESTIONS, MOODS
from .database import get_db
from .models import DayEntry, Group, JointActivity, Membership, Message, Settings, User
from .schemas import (
    ChallengeProofRequest,
    GroupCreate,
    GroupJoin,
    JointActivityCreate,
    LoginRequest,
    MessageCreate,
    MoodRequest,
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

app = FastAPI(title="Questly API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# --- helpers genéricos -----------------------------------------------------
def parse_date(value: str | None) -> date:
    if not value:
        return date.today()
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(400, f"Data inválida: {value!r} (use YYYY-MM-DD).")


def validate_image(image: str | None) -> None:
    if image and len(image) > MAX_IMAGE_CHARS:
        raise HTTPException(413, "Imagem muito grande. Tente uma foto menor.")


def user_public(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "avatar": u.avatar,
        "photo": u.photo,
        "objetivo": u.objetivo,
        "peso": u.peso,
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


def settings_public(s: Settings) -> dict:
    return {
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
    }


# --- rotas: saúde ----------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


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
        avatar=payload.avatar or "🎮",
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
    d = parse_date(day)
    return {
        "date": d.isoformat(),
        "day_number": scoring.day_number(s, d),
        "duration_days": s.duration_days,
        "challenges": scoring.daily_challenges(s, d),
        "motd": scoring.motd(d),
    }


@app.get("/api/groups/{gid}/members/{mid}")
def read_member(gid: int, mid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    membership = get_group_member(db, gid, mid)
    return member_payload(get_group_settings(db, gid), membership, joint_points_map(db, gid), date.today())


@app.get("/api/groups/{gid}/day/{mid}")
def read_day(gid: int, mid: int, day: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    membership = get_group_member(db, gid, mid)
    s = get_group_settings(db, gid)
    d = parse_date(day)
    entry = next((e for e in membership.days if e.date == d), None)
    return scoring.compute_day(s, entry, d)


def _day_result(db: Session, settings: Settings, membership: Membership, entry: DayEntry, d: date):
    db.commit()
    db.refresh(membership)
    today = date.today()
    joint = joint_points_map(db, membership.group_id)
    days = build_member_days(settings, membership, joint, today)
    day_cd = scoring.compute_day(settings, entry, d)
    day_cd["joint_pts"] = joint.get(d.isoformat(), 0)
    if day_cd["joint_pts"]:
        day_cd["points"] += day_cd["joint_pts"]
        day_cd["max_points"] += day_cd["joint_pts"]
    return {"day": day_cd, "stats": scoring.player_stats(settings, days, today)}


@app.post("/api/groups/{gid}/day/toggle")
def toggle(gid: int, req: ToggleRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    d = parse_date(req.date)
    if not req.habit_key:
        raise HTTPException(400, "habit_key é obrigatório.")
    entry = get_or_create_entry(db, membership, d)
    current = list(entry.habits_done or [])
    if req.habit_key in current:
        current.remove(req.habit_key)
    else:
        current.append(req.habit_key)
    entry.habits_done = current
    return _day_result(db, s, membership, entry, d)


@app.post("/api/groups/{gid}/day/mood")
def set_mood(gid: int, req: MoodRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    valid = {m["key"] for m in MOODS}
    if req.mood is not None and req.mood not in valid:
        raise HTTPException(400, "Humor inválido.")
    d = parse_date(req.date)
    entry = get_or_create_entry(db, membership, d)
    entry.mood = req.mood
    return _day_result(db, s, membership, entry, d)


@app.post("/api/groups/{gid}/day/challenge")
def set_challenge(gid: int, req: ChallengeProofRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Conclui (ou desfaz) o desafio de uma área. Só pontua com foto-prova."""
    validate_image(req.image)
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    if req.category not in scoring.active_categories(s):
        raise HTTPException(400, "Área inválida.")
    d = parse_date(req.date)
    entry = get_or_create_entry(db, membership, d)
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
    return _day_result(db, s, membership, entry, d)


@app.post("/api/groups/{gid}/day/reroll")
def reroll_challenge(gid: int, req: RerollRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Troca o desafio de uma área (limite de trocas por dia)."""
    membership = get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    if req.category not in scoring.active_categories(s):
        raise HTTPException(400, "Área inválida.")
    d = parse_date(req.date)
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
        "points": a.points,
        "image": a.image,
        "created_by": a.created_by,
        "author": mem.user.name if mem else "?",
    }


@app.get("/api/groups/{gid}/joint")
def list_joint(gid: int, day: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    d = parse_date(day)
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
    d = parse_date(payload.date)
    a = JointActivity(
        group_id=gid,
        date=d,
        label=payload.label.strip(),
        emoji=(payload.emoji or "💞").strip() or "💞",
        points=JOINT_ACTIVITY_POINTS,
        image=payload.image,
        created_by=membership.id,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return serialize_joint(a, {membership.id: membership})


@app.delete("/api/groups/{gid}/joint/{aid}")
def delete_joint(gid: int, aid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    a = db.get(JointActivity, aid)
    if a is None or a.group_id != gid:
        raise HTTPException(404, "Atividade não encontrada.")
    db.delete(a)
    db.commit()
    return {"ok": True}


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
    return serialize_message(m, {membership.id: membership})


# --- rotas: grupo (histórico/conquistas/ranking) ---------------------------
@app.get("/api/groups/{gid}/history/{mid}")
def history(gid: int, mid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    membership = get_group_member(db, gid, mid)
    s = get_group_settings(db, gid)
    today = date.today()
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
    today = date.today()
    days = build_member_days(s, membership, joint_points_map(db, gid), today)
    stats = scoring.player_stats(s, days, today)
    casal = casal_perfect_days(s, group_members(db, gid), today)
    return {"achievements": scoring.achievements_for(days, stats, casal)}


@app.get("/api/groups/{gid}/ranking")
def ranking(gid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_membership(db, user, gid)
    s = get_group_settings(db, gid)
    today = date.today()
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
    today = date.today()
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
        return {"app": "Questly", "version": "0.3.0", "docs": "/docs"}
