"""Schemas Pydantic para os corpos de request."""
from typing import Literal, Optional

from pydantic import BaseModel, Field


# --- auth / usuário --------------------------------------------------------
class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=1, max_length=60)
    avatar: str = Field("", max_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # ID token do Google Identity Services


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=60)
    avatar: Optional[str] = Field(None, max_length=8)
    photo: Optional[str] = None  # data URL base64; None remove a foto
    objetivo: Optional[str] = Field(None, max_length=200)
    peso: Optional[float] = Field(None, ge=0, le=500)
    # Perfil de nutrição (tudo opcional; None limpa o campo)
    altura_cm: Optional[float] = Field(None, ge=0, le=260)
    sexo: Optional[str] = Field(None, max_length=1)  # 'M' | 'F' | ''
    idade: Optional[int] = Field(None, ge=0, le=120)
    nivel_atividade: Optional[str] = Field(None, max_length=20)
    objetivo_tipo: Optional[str] = Field(None, max_length=10)  # perder|manter|ganhar
    # Ajustes manuais das metas (None = volta para a estimativa automática)
    meta_kcal: Optional[int] = Field(None, ge=0, le=10000)
    meta_proteina_g: Optional[int] = Field(None, ge=0, le=600)
    meta_carbo_g: Optional[int] = Field(None, ge=0, le=1200)
    meta_gordura_g: Optional[int] = Field(None, ge=0, le=600)
    meta_agua_l: Optional[float] = Field(None, ge=0, le=15)


# --- grupos ----------------------------------------------------------------
class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)


class GroupJoin(BaseModel):
    invite_code: str = Field(..., min_length=4, max_length=12)


# --- desafios / dia --------------------------------------------------------
class ToggleRequest(BaseModel):
    date: str = Field(..., description="Data no formato ISO (YYYY-MM-DD).")
    type: Literal["habit"] = "habit"
    habit_key: Optional[str] = None


class HabitPhotoRequest(BaseModel):
    date: str
    habit_key: str
    image: Optional[str] = None  # data URL; None remove a foto (mantém marcado)


class MoodRequest(BaseModel):
    date: str
    moods: list[str] = Field(default_factory=list)  # emoções selecionadas
    note: Optional[str] = Field(None, max_length=280)  # texto livre opcional


class ChallengeProofRequest(BaseModel):
    date: str
    category: str
    image: Optional[str] = None  # data URL (base64); None desfaz o desafio
    together: bool = False        # feito em dupla → bônus "juntos"


class RerollRequest(BaseModel):
    date: str
    category: str


class JointActivityCreate(BaseModel):
    date: str
    label: str = Field(..., min_length=1, max_length=120)
    emoji: str = Field("💞", max_length=8)
    icon: Optional[str] = Field(None, max_length=24)
    image: Optional[str] = None  # comprovação opcional


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    emoji: str = Field("🎯", max_length=8)
    icon: Optional[str] = Field(None, max_length=24)
    duration_days: int = Field(30, ge=1, le=365)


class GoalCheckinRequest(BaseModel):
    date: str


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    emoji: str = Field("🗓️", max_length=8)
    icon: Optional[str] = Field(None, max_length=24)
    kind: Literal["once", "weekly"] = "once"
    date: Optional[str] = None          # para 'once' (YYYY-MM-DD)
    time: Optional[str] = Field(None, max_length=5)  # "HH:MM" opcional
    weekdays: list[int] = Field(default_factory=list)  # para 'weekly' (0=Dom..6=Sáb)


class TaskCompleteRequest(BaseModel):
    date: str
    image: Optional[str] = None  # foto-prova opcional


class MealCreate(BaseModel):
    date: str
    image: str  # data URL (base64) da foto — a IA estima os valores


class WaterRequest(BaseModel):
    date: str
    delta_ml: int = Field(..., ge=-5000, le=5000)  # ex.: +500 / -500


class ReactRequest(BaseModel):
    reaction: Optional[str] = Field(None, max_length=16)  # None/"" remove a reação


class MealUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=120)
    calories: Optional[int] = Field(None, ge=0, le=6000)
    protein_g: Optional[int] = Field(None, ge=0, le=600)
    carbs_g: Optional[int] = Field(None, ge=0, le=600)
    fat_g: Optional[int] = Field(None, ge=0, le=600)


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribe(BaseModel):
    endpoint: str
    keys: PushKeys


class MessageCreate(BaseModel):
    text: str = ""
    image: Optional[str] = None  # data URL (base64), anexo opcional


class HabitDef(BaseModel):
    key: str
    label: str
    emoji: str = "✅"
    icon: Optional[str] = None
    category: str = "Geral"


class SettingsUpdate(BaseModel):
    timezone: Optional[str] = Field(None, max_length=40)
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    water_goal_l: Optional[float] = None
    steps_goal: Optional[int] = None
    protein_goal_g: Optional[int] = None
    calories_goal: Optional[int] = None
    sleep_goal_h: Optional[float] = None
    rest_days: Optional[list[int]] = None
    spiritual_enabled: Optional[bool] = None
    surprise_frequency: Optional[float] = Field(None, ge=0.0, le=1.0)
    fixed_habits: Optional[list[HabitDef]] = None
