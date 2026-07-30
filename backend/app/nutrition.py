"""Estimativa de metas de nutrição por usuário.

São ESTIMATIVAS (fórmula de Mifflin-St Jeor + fatores de atividade). Não
substituem acompanhamento de um nutricionista. O usuário pode ajustar cada
valor manualmente (os ajustes sobrescrevem a estimativa).
"""

# Fatores de atividade (multiplicam a taxa metabólica basal para chegar no gasto).
ACTIVITY_FACTORS = {
    "sedentario": 1.2,
    "leve": 1.375,
    "moderado": 1.55,
    "intenso": 1.725,
    "muito_intenso": 1.9,
}
DEFAULT_ACTIVITY = 1.375  # ~"leve" quando não informado

# Ajuste calórico por objetivo (kcal/dia sobre o gasto estimado).
OBJETIVO_ADJUST = {"perder": -500, "manter": 0, "ganhar": 350}


def _bmi(weight_kg, height_cm):
    if not weight_kg or not height_cm:
        return None
    m = height_cm / 100.0
    if m <= 0:
        return None
    return round(weight_kg / (m * m), 1)


def _bmi_class(bmi):
    if bmi is None:
        return None
    if bmi < 18.5:
        return "abaixo"
    if bmi < 25:
        return "normal"
    if bmi < 30:
        return "sobrepeso"
    return "obesidade"


def _auto_estimate(user) -> dict | None:
    """Estima kcal/macros/água a partir do perfil. None se faltar peso/altura."""
    w = user.peso
    h = getattr(user, "altura_cm", None)
    if not w or not h:
        return None
    age = getattr(user, "idade", None) or 30
    sex = (getattr(user, "sexo", None) or "").upper()
    # Offset de sexo na fórmula (neutro quando não informado: média de M e F).
    sex_offset = 5 if sex == "M" else (-161 if sex == "F" else -78)
    bmr = 10 * w + 6.25 * h - 5 * age + sex_offset
    tdee = bmr * ACTIVITY_FACTORS.get(getattr(user, "nivel_atividade", None), DEFAULT_ACTIVITY)
    obj = getattr(user, "objetivo_tipo", None) or "manter"
    kcal = max(1200, round(tdee + OBJETIVO_ADJUST.get(obj, 0)))
    # Proteína por kg (mais alta ao perder/ganhar; preserva massa magra).
    ppk = 2.0 if obj in ("perder", "ganhar") else 1.6
    protein = round(w * ppk)
    fat = round(kcal * 0.25 / 9)  # ~25% das calorias em gordura
    carbs = max(0, round((kcal - protein * 4 - fat * 9) / 4))  # resto em carboidrato
    water = round(max(2.0, w * 0.035), 1)  # ~35 ml/kg, mínimo 2 L
    return {
        "kcal": kcal,
        "protein_g": protein,
        "carbs_g": carbs,
        "fat_g": fat,
        "water_l": water,
        "bmr": round(bmr),
        "tdee": round(tdee),
    }


def compute_targets(user, group_settings=None) -> dict:
    """Metas finais + info para a UI.

    ``targets`` = ajuste manual quando houver, senão a estimativa automática,
    senão as metas do grupo (compatibilidade). ``auto`` traz a estimativa pura
    (para a UI mostrar "estimado: X") e ``custom`` diz quais campos foram
    ajustados à mão.
    """
    auto = _auto_estimate(user)
    gs = group_settings
    fb_kcal = gs.calories_goal if gs else 2000
    fb_protein = gs.protein_goal_g if gs else 120
    fb_water = gs.water_goal_l if gs else 2.5
    base = auto or {
        "kcal": fb_kcal,
        "protein_g": fb_protein,
        "carbs_g": round(fb_kcal * 0.5 / 4),
        "fat_g": round(fb_kcal * 0.25 / 9),
        "water_l": fb_water,
        "bmr": None,
        "tdee": None,
    }
    overrides = {
        "kcal": getattr(user, "meta_kcal", None),
        "protein_g": getattr(user, "meta_proteina_g", None),
        "carbs_g": getattr(user, "meta_carbo_g", None),
        "fat_g": getattr(user, "meta_gordura_g", None),
        "water_l": getattr(user, "meta_agua_l", None),
    }
    keys = ("kcal", "protein_g", "carbs_g", "fat_g", "water_l")
    targets = {k: (overrides[k] if overrides[k] is not None else base[k]) for k in keys}
    bmi = _bmi(user.peso, getattr(user, "altura_cm", None))
    return {
        "bmi": bmi,
        "bmi_class": _bmi_class(bmi),
        "bmr": base.get("bmr"),
        "tdee": base.get("tdee"),
        "auto": auto,
        "targets": targets,
        "custom": {k: overrides[k] is not None for k in keys},
        "has_profile": bool(user.peso and getattr(user, "altura_cm", None)),
    }
