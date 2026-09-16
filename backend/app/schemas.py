"""Schemas Pydantic para os corpos de request."""
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


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
    group_type: Literal["individual", "couple", "group"] = "group"


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
    icon: Optional[str] = Field(None, max_length=24)
    image: Optional[str] = None  # comprovação opcional


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    icon: Optional[str] = Field(None, max_length=24)
    duration_days: int = Field(30, ge=1, le=365)


class GoalCheckinRequest(BaseModel):
    date: str


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
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


class MealTextCreate(BaseModel):
    date: str
    text: str = Field(..., min_length=2, max_length=400)  # ex: "um pão de queijo e um café com leite"


class MealFoodItem(BaseModel):
    """Um alimento escolhido pelo nome, com a quantidade em gramas.

    Quando `food_id` está na tabela local, os macros vêm de lá — o cliente não
    decide quanto tem num ovo. Os campos por 100 g existem só para itens de
    fora dela (Open Food Facts), que o servidor não guarda.
    """

    food_id: str = Field(..., min_length=1, max_length=80)
    grams: float = Field(..., gt=0, le=5000)
    name: Optional[str] = Field(None, max_length=120)
    calories: Optional[float] = Field(None, ge=0, le=1000)
    protein_g: Optional[float] = Field(None, ge=0, le=100)
    carbs_g: Optional[float] = Field(None, ge=0, le=100)
    fat_g: Optional[float] = Field(None, ge=0, le=100)


class MealFoodsCreate(BaseModel):
    date: str
    items: list[MealFoodItem] = Field(..., min_length=1, max_length=25)
    label: Optional[str] = Field(None, max_length=120)


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
    icon: str = "check-circle"
    category: str = "Geral"


class SettingsUpdate(BaseModel):
    timezone: Optional[str] = Field(None, max_length=40)
    # Janela do desafio do grupo, com hora (ISO 8601). Enviar as duas juntas;
    # start_date/duration_days passam a ser derivados delas.
    challenge_start: Optional[str] = None
    challenge_end: Optional[str] = None
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
    # Desafios do próprio grupo: {categoria: {facil|medio|dificil: [textos], only: bool}}
    custom_challenges: Optional[dict] = None
    # Áreas desligadas (nomes de categoria)
    disabled_areas: Optional[list[str]] = None


# --- Fase 2: Calendário, Rotinas e Hábitos ---------------------------------

class CalendarActivityCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    category: Optional[str] = None
    start_datetime: Optional[str] = None  # ISO format
    end_datetime: Optional[str] = None
    duration_min: Optional[int] = None
    recurrence_rule: dict = Field(default_factory=dict)
    reminder_minutes: list[int] = Field(default_factory=list)
    visibility: Literal["private", "group"] = "private"


class CalendarActivityUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = None
    category: Optional[str] = None
    start_datetime: Optional[str] = None
    end_datetime: Optional[str] = None
    duration_min: Optional[int] = None
    recurrence_rule: Optional[dict] = None
    reminder_minutes: Optional[list[int]] = None
    visibility: Optional[Literal["private", "group"]] = None
    status: Optional[Literal["pending", "done", "skipped"]] = None


class RoutineStepCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    duration_min: Optional[int] = None
    is_required: bool = True
    order: int = 0


class RoutineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    category: Optional[str] = None
    frequency: dict = Field(default_factory=dict)
    time_slot: Optional[str] = None
    steps: list[RoutineStepCreate] = Field(default_factory=list)


class RoutineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    category: Optional[str] = None
    frequency: Optional[dict] = None
    time_slot: Optional[str] = None
    active: Optional[bool] = None
    order: Optional[int] = None


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    category: Optional[str] = None
    icon: Optional[str] = None
    frequency: str = "daily"
    custom_days: list[int] = Field(default_factory=list)
    time: Optional[str] = None
    goal_qty: Optional[float] = None
    goal_unit: Optional[str] = None
    reminder_minutes: Optional[int] = None


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    category: Optional[str] = None
    icon: Optional[str] = None
    frequency: Optional[str] = None
    custom_days: Optional[list[int]] = None
    time: Optional[str] = None
    goal_qty: Optional[float] = None
    goal_unit: Optional[str] = None
    reminder_minutes: Optional[int] = None
    active: Optional[bool] = None


class HabitLogUpdate(BaseModel):
    date: str
    completed: Optional[bool] = None
    value: Optional[float] = None


class RoutineLogUpdate(BaseModel):
    date: str
    steps_done: Optional[list[int]] = None  # List of step IDs completed
    completed: Optional[bool] = None


# --- Fase 3: Scoring V2 e Atividades ---------------------------------------

class ActivityRecordCreate(BaseModel):
    # Sem data = hoje (no fuso do grupo). Registrar o que acabou de fazer é o
    # caso comum e não deve exigir campo nenhum além do essencial.
    date: Optional[str] = None
    modality: str = Field(..., max_length=40)
    category: Optional[str] = None
    params: dict = Field(default_factory=dict)
    proof_image: Optional[str] = None


class ActivityRecordResponse(BaseModel):
    id: int
    user_id: int
    group_id: Optional[int]
    date: str
    modality: str
    category: Optional[str]
    params: dict
    effort_score: float
    xp_earned: int
    score_earned: int
    proof_image: Optional[str]


class UserProgressResponse(BaseModel):
    id: int
    user_id: int
    total_xp: int
    level: int
    effort_total: float
    consistency_total: float
    challenges_total: int


class CompetitiveScoreResponse(BaseModel):
    membership_id: int
    period_start: str
    period_end: str
    effort_score: float
    consistency_score: float
    challenge_score: float
    total_score: float


# --- Fase 4: dia agregado, descanso planejado ------------------------------

class RestDayCreate(BaseModel):
    date: str
    reason: Optional[str] = Field(default=None, max_length=120)


class HabitLogToggle(BaseModel):
    """Marca/desmarca um hábito num dia. Sem `completed` o valor é invertido."""

    date: Optional[str] = None
    completed: Optional[bool] = None
    value: Optional[float] = None


class RoutineStepToggle(BaseModel):
    """Marca/desmarca um passo de rotina num dia."""

    date: Optional[str] = None
    step_id: int
    done: Optional[bool] = None


# --- Fase 5: treino com IA --------------------------------------------------

class TrainingPlanCreate(BaseModel):
    modality: str = Field(..., max_length=40)
    goal: Optional[str] = Field(None, max_length=200)
    level: Literal["iniciante", "intermediario", "avancado"] = "iniciante"
    days_per_week: int = Field(3, ge=1, le=7)
    weeks: int = Field(4, ge=1, le=12)
    constraints: Optional[str] = Field(None, max_length=200)


class TrainingItemToggle(BaseModel):
    item_index: int = Field(..., ge=0)
    done: Optional[bool] = None


class TrainingSessionUpdate(BaseModel):
    status: Optional[Literal["pending", "done", "skipped"]] = None
    scheduled_date: Optional[str] = None


class TrainingAdaptRequest(BaseModel):
    """Pede à IA para refazer o restante do plano a partir do que aconteceu."""

    feedback: str = Field(..., min_length=3, max_length=300)


class RoutineFromAI(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    context: Optional[str] = Field(None, max_length=200)
    steps: int = Field(5, ge=2, le=12)


class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)

    @field_validator("text")
    @classmethod
    def _sem_texto_vazio(cls, v: str) -> str:
        # min_length conta os espaços, então "   " passaria e viraria um
        # comentário vazio no feed.
        limpo = v.strip()
        if not limpo:
            raise ValueError("Escreva alguma coisa.")
        return limpo
