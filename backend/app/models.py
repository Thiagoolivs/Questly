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
    daily_done: Mapped[bool] = mapped_column(Boolean, default=False)
    surprise_done: Mapped[bool] = mapped_column(Boolean, default=False)
    mood: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    # Comprovações (imagens em data URL base64).
    daily_proof: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    surprise_proof: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
