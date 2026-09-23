"""Catálogo pronto: hábitos, rotinas, compromissos e metas prontos para usar.

A tela em branco é o que mais mata app de hábito. Quem abre o Questly pela
primeira vez não sabe *o que* colocar — e digitar cinco hábitos num teclado de
celular é trabalho antes de qualquer recompensa. Aqui ficam opções prontas,
para começar com dois toques.

Nada disto é obrigatório nem fechado: tudo é só um ponto de partida que a
pessoa pode editar depois, e o campo livre continua em todas as telas.

Convenção de dias da semana: 0=domingo … 6=sábado (igual ao getDay() do JS),
a mesma usada em ``Habit.custom_days`` e ``Routine.frequency['days']``.
"""
from __future__ import annotations

# --- Hábitos prontos -------------------------------------------------------
# `key` é só para o app não duplicar ao adicionar de novo; o que vai para o
# banco são os campos de Habit.
HABIT_PRESETS = [
    # Corpo
    {"key": "agua", "name": "Beber água", "category": "corpo", "icon": "droplet",
     "frequency": "daily", "goal_qty": 2.5, "goal_unit": "L"},
    {"key": "passos", "name": "Caminhar 8 mil passos", "category": "corpo", "icon": "footprints",
     "frequency": "daily", "goal_qty": 8000, "goal_unit": "passos"},
    {"key": "treinar", "name": "Treinar", "category": "corpo", "icon": "dumbbell",
     "frequency": "custom", "custom_days": [1, 3, 5]},
    {"key": "alongar", "name": "Alongar 10 minutos", "category": "corpo", "icon": "activity",
     "frequency": "daily", "goal_qty": 10, "goal_unit": "min"},
    {"key": "sol", "name": "Pegar sol pela manhã", "category": "corpo", "icon": "sunrise",
     "frequency": "daily", "time": "07:30"},
    {"key": "postura", "name": "Levantar e mexer o corpo a cada hora", "category": "corpo",
     "icon": "refresh-cw", "frequency": "weekdays"},

    # Sono
    {"key": "dormir_cedo", "name": "Dormir antes das 23h", "category": "sono", "icon": "moon",
     "frequency": "daily", "time": "22:30", "reminder_minutes": 30},
    {"key": "sem_tela", "name": "Sem telas 1h antes de dormir", "category": "sono",
     "icon": "smartphone", "frequency": "daily"},
    {"key": "acordar", "name": "Acordar no primeiro despertador", "category": "sono",
     "icon": "clock", "frequency": "weekdays"},

    # Alimentação
    {"key": "proteina", "name": "Bater a meta de proteína", "category": "alimentacao",
     "icon": "utensils", "frequency": "daily", "goal_qty": 120, "goal_unit": "g"},
    {"key": "fruta", "name": "Comer fruta ou verdura em toda refeição", "category": "alimentacao",
     "icon": "apple", "frequency": "daily"},
    {"key": "sem_refri", "name": "Nada de refrigerante", "category": "alimentacao",
     "icon": "ban", "frequency": "daily"},
    {"key": "cafe_manha", "name": "Tomar café da manhã", "category": "alimentacao",
     "icon": "utensils", "frequency": "daily", "time": "08:00"},
    {"key": "marmita", "name": "Levar a comida de casa", "category": "alimentacao",
     "icon": "package", "frequency": "weekdays"},

    # Mente
    {"key": "leitura", "name": "Ler 10 páginas", "category": "mente", "icon": "book-open",
     "frequency": "daily", "goal_qty": 10, "goal_unit": "páginas"},
    {"key": "meditar", "name": "Meditar 10 minutos", "category": "mente", "icon": "brain",
     "frequency": "daily", "goal_qty": 10, "goal_unit": "min"},
    {"key": "gratidao", "name": "Escrever 3 gratidões", "category": "mente", "icon": "feather",
     "frequency": "daily", "time": "21:00"},
    {"key": "estudar", "name": "Estudar 30 minutos", "category": "mente", "icon": "graduation-cap",
     "frequency": "weekdays", "goal_qty": 30, "goal_unit": "min"},
    {"key": "sem_rede", "name": "Ficar 2h fora das redes sociais", "category": "mente",
     "icon": "smartphone", "frequency": "daily"},
    {"key": "planejar", "name": "Planejar o dia seguinte", "category": "mente",
     "icon": "clipboard-list", "frequency": "weekdays", "time": "21:30"},

    # Outros
    {"key": "cama", "name": "Arrumar a cama", "category": "outro", "icon": "bed",
     "frequency": "daily", "time": "07:00"},
    {"key": "louca", "name": "Deixar a pia limpa", "category": "outro", "icon": "sparkles",
     "frequency": "daily"},
    {"key": "orar", "name": "Orar / devocional", "category": "outro", "icon": "heart-handshake",
     "frequency": "daily", "time": "06:30"},
    {"key": "ligar", "name": "Falar com alguém da família", "category": "outro",
     "icon": "phone", "frequency": "custom", "custom_days": [0]},
    {"key": "gastos", "name": "Anotar os gastos do dia", "category": "outro",
     "icon": "wallet", "frequency": "daily", "time": "22:00"},
]

# --- Rotinas prontas -------------------------------------------------------
# Uma rotina é uma sequência: o valor está na ordem, não em cada passo isolado.
ROUTINE_PRESETS = [
    {
        "key": "manha",
        "name": "Manhã",
        "category": "corpo",
        "time_slot": "morning",
        "frequency": {"type": "daily", "days": []},
        "description": "Sair da cama já tendo ganhado o dia.",
        "steps": [
            {"name": "Beber um copo de água", "duration_min": 1, "is_required": True},
            {"name": "Arrumar a cama", "duration_min": 2, "is_required": True},
            {"name": "Alongar", "duration_min": 5, "is_required": True},
            {"name": "Tomar sol", "duration_min": 10, "is_required": False},
            {"name": "Olhar o plano do dia", "duration_min": 3, "is_required": True},
        ],
    },
    {
        "key": "noite",
        "name": "Antes de dormir",
        "category": "sono",
        "time_slot": "evening",
        "frequency": {"type": "daily", "days": []},
        "description": "Desligar o dia para o sono vir sem briga.",
        "steps": [
            {"name": "Guardar o celular longe da cama", "duration_min": 1, "is_required": True},
            {"name": "Deixar a roupa de amanhã separada", "duration_min": 3, "is_required": False},
            {"name": "Anotar 3 gratidões", "duration_min": 3, "is_required": True},
            {"name": "Ler algumas páginas", "duration_min": 15, "is_required": False},
        ],
    },
    {
        "key": "pre-treino",
        "name": "Pré-treino",
        "category": "corpo",
        "time_slot": "pre-workout",
        "frequency": {"type": "custom", "days": [1, 3, 5]},
        "description": "Chegar pronto e sair inteiro.",
        "steps": [
            {"name": "Hidratar", "duration_min": 2, "is_required": True},
            {"name": "Mobilidade de ombro e quadril", "duration_min": 8, "is_required": True},
            {"name": "Aquecimento leve", "duration_min": 8, "is_required": True},
            {"name": "Revisar o treino do dia", "duration_min": 2, "is_required": False},
        ],
    },
    {
        "key": "pos-treino",
        "name": "Pós-treino",
        "category": "corpo",
        "time_slot": "post-workout",
        "frequency": {"type": "custom", "days": [1, 3, 5]},
        "description": "O que acelera a recuperação, feito enquanto está fresco.",
        "steps": [
            {"name": "Alongar o que trabalhou", "duration_min": 10, "is_required": True},
            {"name": "Refeição com proteína", "duration_min": 15, "is_required": True},
            {"name": "Registrar o treino no app", "duration_min": 2, "is_required": True},
        ],
    },
    {
        "key": "foco",
        "name": "Bloco de foco",
        "category": "mente",
        "time_slot": "morning",
        "frequency": {"type": "weekdays", "days": []},
        "description": "Uma hora sem interrupção vale uma tarde picada.",
        "steps": [
            {"name": "Escolher UMA tarefa", "duration_min": 2, "is_required": True},
            {"name": "Silenciar notificações", "duration_min": 1, "is_required": True},
            {"name": "50 minutos de trabalho", "duration_min": 50, "is_required": True},
            {"name": "Pausa de 10 minutos de pé", "duration_min": 10, "is_required": False},
        ],
    },
    {
        "key": "domingo",
        "name": "Organizar a semana",
        "category": "mente",
        "time_slot": "evening",
        "frequency": {"type": "custom", "days": [0]},
        "description": "Meia hora no domingo que devolve a semana inteira.",
        "steps": [
            {"name": "Revisar o que aconteceu na semana", "duration_min": 10, "is_required": True},
            {"name": "Marcar os treinos na agenda", "duration_min": 5, "is_required": True},
            {"name": "Planejar as refeições", "duration_min": 10, "is_required": False},
            {"name": "Escolher a prioridade da semana", "duration_min": 5, "is_required": True},
        ],
    },
    {
        "key": "desacelerar",
        "name": "Desacelerar",
        "category": "mente",
        "time_slot": "afternoon",
        "frequency": {"type": "daily", "days": []},
        "description": "Para os dias em que a cabeça não para.",
        "steps": [
            {"name": "Respiração 4-7-8", "duration_min": 4, "is_required": True},
            {"name": "Caminhar sem o celular", "duration_min": 10, "is_required": True},
            {"name": "Escrever o que está pesando", "duration_min": 5, "is_required": False},
        ],
    },
]

# --- Compromissos prontos (agenda) -----------------------------------------
ACTIVITY_PRESETS = [
    {"key": "treino", "title": "Treino", "category": "treino", "duration_min": 60},
    {"key": "corrida", "title": "Corrida", "category": "treino", "duration_min": 40},
    {"key": "jiu-jitsu", "title": "Jiu-Jitsu", "category": "treino", "duration_min": 90},
    {"key": "caminhada", "title": "Caminhada", "category": "treino", "duration_min": 30},
    {"key": "preparar-comida", "title": "Preparar as refeições", "category": "alimentacao",
     "duration_min": 60},
    {"key": "mercado", "title": "Ir ao mercado", "category": "alimentacao", "duration_min": 45},
    {"key": "terapia", "title": "Terapia", "category": "mente", "duration_min": 50},
    {"key": "estudo", "title": "Estudar", "category": "mente", "duration_min": 60},
    {"key": "leitura", "title": "Ler", "category": "mente", "duration_min": 30},
    {"key": "descanso", "title": "Descanso de verdade", "category": "descanso", "duration_min": 60},
    {"key": "soneca", "title": "Soneca", "category": "descanso", "duration_min": 20},
    {"key": "encontro", "title": "Encontro com alguém", "category": "social", "duration_min": 120},
    {"key": "familia", "title": "Tempo com a família", "category": "social", "duration_min": 90},
    {"key": "medico", "title": "Consulta médica", "category": "outro", "duration_min": 60},
]

# --- Metas de período prontas ----------------------------------------------
GOAL_PRESETS = [
    {"key": "sem-refri", "title": "Sem refrigerante", "icon": "ban", "duration_days": 30},
    {"key": "sem-alcool", "title": "Sem álcool", "icon": "ban", "duration_days": 30},
    {"key": "treino-30", "title": "Treinar todo dia útil", "icon": "dumbbell", "duration_days": 30},
    {"key": "agua-21", "title": "Bater a meta de água", "icon": "droplet", "duration_days": 21},
    {"key": "ler-30", "title": "Ler todo dia", "icon": "book-open", "duration_days": 30},
    {"key": "acordar-cedo", "title": "Acordar às 6h", "icon": "sunrise", "duration_days": 21},
    {"key": "sem-acucar", "title": "Sem açúcar refinado", "icon": "ban", "duration_days": 30},
    {"key": "gratidao-30", "title": "Anotar gratidões todo dia", "icon": "feather",
     "duration_days": 30},
]

# Rótulos das categorias, para o app agrupar sem ter a lista duplicada em JS.
HABIT_CATEGORIES = [
    {"value": "corpo", "label": "Corpo"},
    {"value": "sono", "label": "Sono"},
    {"value": "alimentacao", "label": "Alimentação"},
    {"value": "mente", "label": "Mente"},
    {"value": "outro", "label": "Outro"},
]


def catalog() -> dict:
    """Tudo que o app oferece pronto, numa chamada só."""
    return {
        "habits": HABIT_PRESETS,
        "routines": ROUTINE_PRESETS,
        "activities": ACTIVITY_PRESETS,
        "goals": GOAL_PRESETS,
        "habit_categories": HABIT_CATEGORIES,
    }


def habit_by_key(key: str) -> dict | None:
    return next((h for h in HABIT_PRESETS if h["key"] == key), None)


def routine_by_key(key: str) -> dict | None:
    return next((r for r in ROUTINE_PRESETS if r["key"] == key), None)
