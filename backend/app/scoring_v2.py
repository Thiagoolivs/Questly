"""Pontuação multidimensional do Questly.

Duas moedas, de propósito:

- **XP** é evolução pessoal. Cresce com o que a pessoa realmente fez e nunca
  diminui. Não entra em ranking, então não precisa de teto.
- **Score competitivo** é o que ordena o ranking do grupo. Esse sim é
  disputado, então tem teto diário, retorno decrescente e validação de
  plausibilidade — senão quem registra mais ganha, e não quem se esforça mais.

O esforço tem duas bases, conforme a modalidade. Onde há percurso (corrida,
caminhada, bike, natação) ele acompanha a **distância**, com o ritmo como
modificador — do contrário arrastar os mesmos 10 km por duas horas renderia
mais que fazê-los forte. Onde não há (musculação, jiu-jitsu, dança), vale
MET × **duração**.

A intensidade declarada pelo usuário *não* é suficiente para mexer no score:
quando há dado objetivo (distância e tempo → ritmo), é ele que manda, e a
declaração vira desempate com peso pequeno.
"""
from __future__ import annotations

# MET aproximado por modalidade em esforço moderado (Compendium of Physical
# Activities). O que importa aqui é a proporção entre modalidades, não o número
# absoluto: 30 min de jiu-jitsu custam mais que 30 min de caminhada.
MODALITY_MET = {
    "corrida": 9.8,
    "caminhada": 3.5,
    "ciclismo": 7.5,
    "natacao": 7.0,
    "musculacao": 5.0,
    "funcional": 8.0,
    "crossfit": 8.0,
    "jiu-jitsu": 10.3,
    "luta": 10.0,
    "danca": 5.5,
    "yoga": 2.5,
    "pilates": 3.0,
    "alongamento": 2.3,
    "esporte": 7.0,
}
DEFAULT_MET = 4.0

# Velocidade máxima plausível (km/h). Acima disso o registro é tratado como
# erro de digitação e a distância é limitada ao que caberia no tempo informado.
MAX_SPEED_KMH = {
    "corrida": 25.0,      # recorde mundial de maratona ≈ 21 km/h
    "caminhada": 9.0,
    "ciclismo": 60.0,
    "natacao": 8.0,
}

# Ritmo (min/km) que separa as faixas de intensidade, por modalidade.
# Do mais rápido para o mais lento.
PACE_BANDS = {
    "corrida": [(4.0, 1.30), (5.0, 1.15), (6.0, 1.00), (7.5, 0.88), (99.0, 0.78)],
    "caminhada": [(9.0, 1.25), (11.0, 1.10), (13.0, 1.00), (16.0, 0.88), (99.0, 0.78)],
    "ciclismo": [(1.5, 1.30), (2.0, 1.15), (2.5, 1.00), (3.5, 0.88), (99.0, 0.78)],
}

# Modalidades em que o gasto acompanha a DISTÂNCIA, não o tempo parado no
# relógio. Pontuar MET × tempo aqui premiaria arrastar o mesmo percurso por
# mais tempo — correr 10 km devagar renderia mais que 10 km forte, que é
# exatamente o contrário do que o app quer incentivar.
POINTS_PER_KM = {
    "corrida": 9.0,
    "caminhada": 3.5,
    "ciclismo": 2.5,
    "natacao": 30.0,
}

# Quanto a intensidade declarada pode mexer, quando não há dado objetivo.
# A faixa é estreita de propósito: declarar "extremo" em tudo rende pouco.
DECLARED_FACTOR = {"leve": 0.85, "moderado": 1.0, "intenso": 1.15, "extremo": 1.25}

# Peso da declaração quando existe dado objetivo — vira só desempate.
DECLARED_WEIGHT_WITH_EVIDENCE = 0.25

MAX_DURATION_MIN = 600          # 10 h; acima disso é registro errado
MAX_EFFORT_PER_ACTIVITY = 150.0  # teto por registro
MAX_EFFORT_PER_DAY = 300.0       # teto diário que entra no ranking
XP_PER_EFFORT = 10               # 1 ponto de esforço = 10 XP
XP_PER_LEVEL = 1000

# Retorno decrescente: o 2º registro da mesma modalidade no mesmo dia vale
# metade, o 3º um quarto, e assim por diante. Corta o farming por repetição
# sem impedir quem treina duas vezes no dia de verdade.
REPEAT_FACTORS = [1.0, 0.5, 0.25, 0.1]


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _as_float(params: dict, key: str) -> float:
    try:
        return float(params.get(key) or 0)
    except (TypeError, ValueError):
        return 0.0


def normalize_params(params: dict, modality: str) -> tuple[dict, list[str]]:
    """Ajusta valores impossíveis antes de pontuar.

    Devolve os parâmetros saneados e a lista do que foi corrigido, para a
    interface poder avisar em vez de pontuar silenciosamente errado.
    """
    modality = (modality or "").lower()
    clean = dict(params or {})
    notes: list[str] = []

    duration = _as_float(clean, "duration")
    if duration < 0:
        duration = 0.0
    if duration > MAX_DURATION_MIN:
        notes.append(f"Duração limitada a {MAX_DURATION_MIN} min.")
        duration = float(MAX_DURATION_MIN)
    if duration:
        clean["duration"] = duration

    distance = _as_float(clean, "distance")
    if distance < 0:
        distance = 0.0
    max_speed = MAX_SPEED_KMH.get(modality)
    if max_speed and distance and duration:
        limit = max_speed * (duration / 60.0)
        if distance > limit:
            notes.append(
                f"Distância acima do possível para {int(duration)} min; "
                f"considerada {limit:.1f} km."
            )
            distance = limit
    if distance:
        clean["distance"] = distance

    for key in ("rolas", "series", "reps"):
        value = _as_float(clean, key)
        if value < 0:
            clean[key] = 0

    return clean, notes


def intensity_factor(params: dict, modality: str) -> tuple[float, bool]:
    """Fator de intensidade e se ele veio de dado objetivo.

    Com distância e tempo dá para calcular o ritmo, e aí o número manda. Sem
    isso, sobra a declaração — que mexe pouco, justamente para não virar
    alavanca de manipulação.
    """
    modality = (modality or "").lower()
    declared = DECLARED_FACTOR.get(str(params.get("intensity", "moderado")).lower(), 1.0)

    duration = _as_float(params, "duration")
    distance = _as_float(params, "distance")
    bands = PACE_BANDS.get(modality)

    if bands and duration > 0 and distance > 0:
        pace = duration / distance  # min/km
        objective = bands[-1][1]
        for limit, factor in bands:
            if pace <= limit:
                objective = factor
                break
        # A declaração ainda conta um pouco: separa quem correu o mesmo ritmo
        # doente de quem correu inteiro, sem deixar inventar pontuação.
        blended = (
            objective * (1 - DECLARED_WEIGHT_WITH_EVIDENCE)
            + declared * DECLARED_WEIGHT_WITH_EVIDENCE
        )
        return blended, True

    return declared, False


def compute_effort_score(params: dict, modality: str) -> float:
    """Esforço de uma atividade, com teto por registro.

    Percurso pontua por distância × ritmo; o resto, por MET × duração.
    """
    modality = (modality or "").lower()
    clean, _ = normalize_params(params, modality)

    duration = _as_float(clean, "duration")
    if duration <= 0:
        return 0.0

    factor, _ = intensity_factor(clean, modality)
    distance = _as_float(clean, "distance")
    per_km = POINTS_PER_KM.get(modality)

    if per_km and distance > 0:
        # Percurso: a distância é a base e o ritmo é o modificador.
        score = distance * per_km * factor
    else:
        met = MODALITY_MET.get(modality, DEFAULT_MET)
        score = met * (duration / 60.0) * factor * 10.0

    # Volume específico soma um pouco, mas não domina: rolas de jiu-jitsu e
    # séries de musculação já estão majoritariamente no tempo.
    score += _as_float(clean, "rolas") * 2.0
    score += _as_float(clean, "series") * 0.5

    return round(_clamp(score, 0.0, MAX_EFFORT_PER_ACTIVITY), 2)


def repeat_factor(same_modality_today: int) -> float:
    """Peso do n-ésimo registro da mesma modalidade no mesmo dia."""
    if same_modality_today < 0:
        same_modality_today = 0
    if same_modality_today < len(REPEAT_FACTORS):
        return REPEAT_FACTORS[same_modality_today]
    return REPEAT_FACTORS[-1]


def competitive_effort(effort: float, same_modality_today: int, effort_today: float) -> float:
    """Quanto desse esforço entra no ranking, depois dos limites."""
    adjusted = effort * repeat_factor(same_modality_today)
    remaining = max(0.0, MAX_EFFORT_PER_DAY - effort_today)
    return round(min(adjusted, remaining), 2)


def xp_for(effort: float) -> int:
    """XP é pessoal: não sofre teto diário nem retorno decrescente."""
    return int(round(effort * XP_PER_EFFORT))


def level_for(total_xp: int) -> int:
    return max(1, int(total_xp) // XP_PER_LEVEL + 1)


def compute_consistency_score(planned: int, done: int, rest_days: int = 0) -> float:
    """Consistência = o que foi cumprido do que foi planejado, de 0 a 100.

    É uma razão, não uma contagem: criar trinta hábitos triviais não rende mais
    que manter três. Dias de descanso planejado saem da conta — descansar de
    propósito não é falha.
    """
    planned = max(0, int(planned) - max(0, int(rest_days)))
    if planned <= 0:
        return 0.0
    return round(_clamp(int(done) / planned, 0.0, 1.0) * 100.0, 2)


def compute_challenge_score(challenges_completed: list | int) -> float:
    """Desafios oficiais cumpridos, com comprovação."""
    count = challenges_completed if isinstance(challenges_completed, int) else len(challenges_completed or [])
    return float(max(0, count) * 50.0)


def total_competitive(effort: float, consistency: float, challenge: float) -> float:
    """Ranking = esforço + consistência + desafios.

    A consistência entra com peso menor porque é limitada a 100 por período:
    sem isso ela viraria o atalho para o topo sem sair do lugar.
    """
    return round(effort + consistency * 0.5 + challenge, 2)


# Catálogo exposto ao app. Fica aqui, junto das regras de pontuação, para o
# formulário não perguntar parâmetro que o cálculo ignora — nem deixar de
# perguntar o que ele usa.
FIELD_LABELS = {
    "distance": {"key": "distance", "label": "Distância", "unit": "km", "type": "number", "step": "0.1"},
    "duration": {"key": "duration", "label": "Duração", "unit": "min", "type": "number", "step": "1"},
    "intensity": {"key": "intensity", "label": "Intensidade", "type": "choice",
                  "options": ["leve", "moderado", "intenso", "extremo"]},
    "rolas": {"key": "rolas", "label": "Rolas", "type": "number", "step": "1"},
    "series": {"key": "series", "label": "Séries", "type": "number", "step": "1"},
}

_PERCURSO = ["distance", "duration", "intensity"]
_TEMPO = ["duration", "intensity"]

MODALITIES = [
    {"id": "corrida", "label": "Corrida", "icon": "footprints", "fields": _PERCURSO},
    {"id": "caminhada", "label": "Caminhada", "icon": "footprints", "fields": _PERCURSO},
    {"id": "ciclismo", "label": "Ciclismo", "icon": "bike", "fields": _PERCURSO},
    {"id": "natacao", "label": "Natação", "icon": "droplet", "fields": _PERCURSO},
    {"id": "musculacao", "label": "Musculação", "icon": "dumbbell", "fields": ["duration", "series", "intensity"]},
    {"id": "funcional", "label": "Funcional", "icon": "zap", "fields": _TEMPO},
    {"id": "crossfit", "label": "CrossFit", "icon": "zap", "fields": _TEMPO},
    {"id": "jiu-jitsu", "label": "Jiu-Jitsu", "icon": "shield" , "fields": ["duration", "rolas", "intensity"]},
    {"id": "luta", "label": "Luta", "icon": "zap", "fields": ["duration", "rolas", "intensity"]},
    {"id": "danca", "label": "Dança", "icon": "activity", "fields": _TEMPO},
    {"id": "yoga", "label": "Yoga", "icon": "leaf", "fields": _TEMPO},
    {"id": "pilates", "label": "Pilates", "icon": "leaf", "fields": _TEMPO},
    {"id": "alongamento", "label": "Alongamento", "icon": "leaf", "fields": _TEMPO},
    {"id": "esporte", "label": "Esporte", "icon": "activity", "fields": _TEMPO},
]


def modality_catalog() -> list[dict]:
    """Modalidades com os campos que cada uma realmente usa na pontuação."""
    return [
        {**mod, "fields": [FIELD_LABELS[f] for f in mod["fields"] if f in FIELD_LABELS]}
        for mod in MODALITIES
    ]
