"""Models ORM do Questly."""
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


class Player(Base):
    """Cada participante do desafio (a ideia é serem dois: o casal)."""

    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    avatar: Mapped[str] = mapped_column(String(8), default="🎮")
    objetivo: Mapped[str] = mapped_column(String(200), default="")
    peso: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    days: Mapped[list["DayEntry"]] = relationship(
        back_populates="player", cascade="all, delete-orphan"
    )


class DayEntry(Base):
    """O registro de um dia para um jogador (hábitos + desafios + humor + provas)."""

    __tablename__ = "day_entries"
    __table_args__ = (UniqueConstraint("player_id", "date", name="uq_player_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    date: Mapped[date] = mapped_column(Date, index=True)
    habits_done: Mapped[list] = mapped_column(JSON, default=list)
    daily_done: Mapped[bool] = mapped_column(Boolean, default=False)
    surprise_done: Mapped[bool] = mapped_column(Boolean, default=False)
    mood: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    # Comprovações (imagens em data URL base64).
    daily_proof: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    surprise_proof: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    player: Mapped["Player"] = relationship(back_populates="days")


class Settings(Base):
    """Configurações globais do desafio (singleton, id=1)."""

    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
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


class Message(Base):
    """Mensagem do chat entre os participantes (texto + anexo opcional)."""

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    text: Mapped[str] = mapped_column(Text, default="")
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # data URL base64
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
