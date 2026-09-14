"""Lógica de pontuação multidimensional (Fase 3)."""

def compute_effort_score(params: dict, modality: str) -> float:
    """Calcula a pontuação de esforço de uma atividade física.
    
    A pontuação é baseada na modalidade e parâmetros específicos, 
    focada no esforço real, evitando farming.
    """
    score = 0.0
    modality = modality.lower()
    
    intensity_multiplier = {
        "leve": 0.8,
        "moderado": 1.0,
        "intenso": 1.5,
        "extremo": 2.0
    }
    
    intensity = params.get("intensity", "moderado").lower()
    mult = intensity_multiplier.get(intensity, 1.0)
    
    duration = float(params.get("duration", 0))  # em minutos
    
    if modality in ["corrida", "caminhada", "ciclismo"]:
        distance = float(params.get("distance", 0))  # em km
        # Combina distância e duração
        score = (distance * 10) + (duration * 0.5) * mult
        
    elif modality == "musculacao":
        # Baseado em duração e intensidade
        score = (duration * 1.5) * mult
        
    elif modality == "jiu-jitsu":
        # Baseado no número de rolas e duração
        rolas = int(params.get("rolas", 0))
        score = (duration * 1.0) + (rolas * 5) * mult
        
    else:
        # Default fallback
        score = (duration * 1.0) * mult
        
    # Cap de effort score por atividade para evitar farming (ex: max 200 pontos por registro)
    return min(score, 200.0)


def compute_consistency_score(habit_logs: list, target_days: int) -> float:
    """Calcula pontuação de consistência (hábitos)."""
    if not habit_logs or target_days <= 0:
        return 0.0
    
    completed = len([log for log in habit_logs if log.completed])
    return (completed / target_days) * 100.0


def compute_challenge_score(challenges_completed: list) -> float:
    """Calcula pontuação de desafios oficiais."""
    # Simples por enquanto: cada desafio vale 50 pontos
    return len(challenges_completed) * 50.0

