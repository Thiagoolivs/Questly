"""Schemas Pydantic para os corpos de request."""
from typing import Literal, Optional

from pydantic import BaseModel, Field


# --- auth / usuário --------------------------------------------------------
class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=1, max_length=60)
    avatar: str = Field("🎮", max_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=60)
    avatar: Optional[str] = Field(None, max_length=8)
    photo: Optional[str] = None  # data URL base64; None remove a foto
    objetivo: Optional[str] = Field(None, max_length=200)
    peso: Optional[float] = None


# --- grupos ----------------------------------------------------------------
class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)


class GroupJoin(BaseModel):
    invite_code: str = Field(..., min_length=4, max_length=12)


# --- desafios / dia --------------------------------------------------------
class ToggleRequest(BaseModel):
    date: str = Field(..., description="Data no formato ISO (YYYY-MM-DD).")
    type: Literal["habit", "daily", "surprise"]
    habit_key: Optional[str] = None


class MoodRequest(BaseModel):
    date: str
    mood: Optional[str] = None  # None limpa o humor do dia


class ProofRequest(BaseModel):
    date: str
    type: Literal["daily", "surprise"]
    image: Optional[str] = None  # data URL (base64); None remove a comprovação


class MessageCreate(BaseModel):
    text: str = ""
    image: Optional[str] = None  # data URL (base64), anexo opcional


class HabitDef(BaseModel):
    key: str
    label: str
    emoji: str = "✅"
    category: str = "Geral"


class SettingsUpdate(BaseModel):
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
