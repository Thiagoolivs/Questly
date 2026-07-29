"""Models ORM do Questly.

Modelo multi-tenant (Fase 1): usuários autenticados que pertencem a um ou mais
grupos (um casal é só um grupo de 2). Todo o progresso é por *membership*
(a identidade de um usuário dentro de um grupo).
"""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    """Conta com login próprio. Um usuário pode estar em vários grupos."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(60))
    avatar: Mapped[str] = mapped_column(String(8), default="🎮")
    photo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # data URL base64 (opcional)
    objetivo: Mapped[str] = mapped_column(String(200), default="")
    peso: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    memberships: Mapped[list["Membership"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Group(Base):
    """Grupo (casal ou grupo de accountability). Entra-se via código de convite."""

    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    invite_code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    memberships: Mapped[list["Membership"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )
    settings: Mapped["Settings"] = relationship(
        back_populates="group", uselist=False, cascade="all, delete-orphan"
    )


class Membership(Base):
    """Vínculo usuário↔grupo. É aqui que mora o progresso de cada um no grupo."""

    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", "group_id", name="uq_user_group"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    role: Mapped[str] = mapped_column(String(16), default="member")  # owner|member
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="memberships")
    group: Mapped["Group"] = relationship(back_populates="memberships")
    days: Mapped[list["DayEntry"]] = relationship(
        back_populates="membership", cascade="all, delete-orphan"
    )


class DayEntry(Base):
    """Registro de um dia para um membership (hábitos + desafios + humor + provas)."""

    __tablename__ = "day_entries"
    __table_args__ = (UniqueConstraint("membership_id", "date", name="uq_membership_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    membership_id: Mapped[int] = mapped_column(ForeignKey("memberships.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    habits_done: Mapped[list] = mapped_column(JSON, default=list)
    # Foto-prova opcional por hábito: {key: data_url}. Hábito com foto vale +2.
    habit_proofs: Mapped[dict] = mapped_column(JSON, default=dict)
    # Comprovações dos desafios por área: {categoria: data_url}. A presença da
    # foto = desafio concluído (só pontua com prova).
    challenge_proofs: Mapped[dict] = mapped_column(JSON, default=dict)
    # Trocas (reroll) por área: {categoria: offset}.
    challenge_rerolls: Mapped[dict] = mapped_column(JSON, default=dict)
    # Desafios feitos em dupla: {categoria: true} — rende bônus "juntos".
    challenge_together: Mapped[dict] = mapped_column(JSON, default=dict)
    # Humor do dia: lista de emoções nomeadas + nota livre opcional.
    moods: Mapped[list] = mapped_column(JSON, default=list)
    mood_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    membership: Mapped["Membership"] = relationship(back_populates="days")


class Settings(Base):
    """Configurações do desafio — uma por grupo."""

    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), unique=True, index=True)
    start_date: Mapped[date] = mapped_column(Date, default=date.today)
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    water_goal_l: Mapped[float] = mapped_column(Float, default=2.5)
    steps_goal: Mapped[int] = mapped_column(Integer, default=8000)
    protein_goal_g: Mapped[int] = mapped_column(Integer, default=120)
    calories_goal: Mapped[int] = mapped_column(Integer, default=2000)
    sleep_goal_h: Mapped[float] = mapped_column(Float, default=7.5)
    rest_days: Mapped[list] = mapped_column(JSON, default=list)
    spiritual_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    surprise_frequency: Mapped[float] = mapped_column(Float, default=0.34)
    fixed_habits: Mapped[list] = mapped_column(JSON, default=list)

    group: Mapped["Group"] = relationship(back_populates="settings")


class Message(Base):
    """Mensagem do chat de um grupo (texto + anexo opcional)."""

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    membership_id: Mapped[int] = mapped_column(ForeignKey("memberships.id"))
    text: Mapped[str] = mapped_column(Text, default="")
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # data URL base64
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Activity(Base):
    """Evento do feed do grupo (conclusão de desafio, atividade em dupla…).

    Separado do chat: o chat fica livre para conversa, e os avisos automáticos
    vão para este feed.
    """

    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    membership_id: Mapped[int] = mapped_column(ForeignKey("memberships.id"))
    kind: Mapped[str] = mapped_column(String(20))  # challenge | joint | habit | task
    emoji: Mapped[str] = mapped_column(String(8), default="🎯")
    text: Mapped[str] = mapped_column(Text, default="")
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # foto opcional
    ref: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # p/ upsert/dedupe
    day: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Goal(Base):
    """Meta de período (ex: 'sem refrigerante por 30 dias'). Fica fixada no topo
    até terminar. Cada membro faz check-in diário."""

    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    emoji: Mapped[str] = mapped_column(String(8), default="🎯")
    icon: Mapped[Optional[str]] = mapped_column(String(24), nullable=True)  # nome de ícone SVG (opcional)
    start_date: Mapped[date] = mapped_column(Date, default=date.today)
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("memberships.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GoalCheckin(Base):
    """Check-in diário de um membro numa meta."""

    __tablename__ = "goal_checkins"
    __table_args__ = (UniqueConstraint("goal_id", "membership_id", "date", name="uq_goal_member_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id"), index=True)
    membership_id: Mapped[int] = mapped_column(ForeignKey("memberships.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)


class ScheduledTask(Base):
    """Tarefa agendada para uma data específica ou recorrente (dias da semana)."""

    __tablename__ = "scheduled_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    emoji: Mapped[str] = mapped_column(String(8), default="🗓️")
    icon: Mapped[Optional[str]] = mapped_column(String(24), nullable=True)
    kind: Mapped[str] = mapped_column(String(10), default="once")  # once | weekly
    date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)  # para 'once'
    weekdays: Mapped[list] = mapped_column(JSON, default=list)  # para 'weekly' (0=Dom..6=Sáb)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("memberships.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TaskCompletion(Base):
    """Conclusão de uma tarefa agendada por um membro num dia."""

    __tablename__ = "task_completions"
    __table_args__ = (UniqueConstraint("task_id", "membership_id", "date", name="uq_task_member_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("scheduled_tasks.id"), index=True)
    membership_id: Mapped[int] = mapped_column(ForeignKey("memberships.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # foto-prova opcional


class PushSubscription(Base):
    """Inscrição de Web Push de um usuário (um por dispositivo/navegador)."""

    __tablename__ = "push_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    endpoint: Mapped[str] = mapped_column(Text, unique=True)
    p256dh: Mapped[str] = mapped_column(String(255))
    auth: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class JointActivity(Base):
    """Atividade feita em dupla/grupo — pontua para TODOS os membros do dia."""

    __tablename__ = "joint_activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    label: Mapped[str] = mapped_column(String(120))
    emoji: Mapped[str] = mapped_column(String(8), default="💞")
    points: Mapped[int] = mapped_column(Integer, default=20)
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # comprovação opcional
    created_by: Mapped[int] = mapped_column(ForeignKey("memberships.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
