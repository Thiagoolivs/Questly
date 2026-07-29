"""Regras do jogo: seleção de desafios, pontuação, sequências e conquistas.

Pontuação (por dia):
  - Hábito fixo cumprido: 10 pts (padrão: 5 hábitos = 50 pts)
  - Desafio do dia: 30 pts
  - Desafio surpresa (quando aparece): 20 pts
  - Bônus por cumprir tudo do dia: 20 pts
  - Máximo diário: 120 pts (num dia com surpresa) — nunca há pontuação negativa.

Os desafios do dia e da surpresa são determinísticos por data, então os dois
jogadores recebem exatamente o mesmo desafio (competição justa).
"""
import hashlib
from datetime import date, timedelta

from .data import (
    ACHIEVEMENTS,
    CATEGORY_EMOJI,
    CATEGORY_ORDER,
    CHALLENGE_POOLS,
    DEFAULT_HABITS,
    MOTD_POOL,
    SURPRISE_POOL,
)

DAILY_POINTS = 30
SURPRISE_POINTS = 20
BONUS_POINTS = 20
HABIT_POINTS = 10


def _seed(d: date, salt: str) -> int:
    """Inteiro determinístico a partir de uma data + um 'sal'."""
    raw = f"{d.isoformat()}:{salt}".encode()
    return int(hashlib.sha256(raw).hexdigest(), 16)


def active_categories(settings) -> list[str]:
    """Categorias em rotação (remove Espiritual se desativada nas configs)."""
    return [
        c for c in CATEGORY_ORDER
        if not (c == "Espiritual" and not settings.spiritual_enabled)
    ]


def day_number(settings, d: date) -> int:
    """Número do dia dentro do desafio (1-based)."""
    return (d - settings.start_date).days + 1


def daily_challenge(settings, d: date) -> dict:
    """Desafio variável do dia (categoria em rotação, item determinístico)."""
    cats = active_categories(settings)
    cat = cats[(d - settings.start_date).days % len(cats)]
    pool = CHALLENGE_POOLS[cat]
    text = pool[_seed(d, "daily") % len(pool)]
    return {"category": cat, "emoji": CATEGORY_EMOJI[cat], "text": text}


def surprise_challenge(settings, d: date):
    """Desafio surpresa do dia, ou ``None`` se não houver surpresa nesse dia."""
    freq = max(0.0, min(1.0, settings.surprise_frequency or 0.0))
    chance = (_seed(d, "surprise-present") % 1000) / 1000.0
    if chance >= freq:
        return None
    text = SURPRISE_POOL[_seed(d, "surprise-pick") % len(SURPRISE_POOL)]
    return {"emoji": "🔥", "text": text}


def motd(d: date) -> str:
    """Mensagem do dia (determinística por data)."""
    return MOTD_POOL[_seed(d, "motd") % len(MOTD_POOL)]


def _fixed_habits(settings) -> list:
    return settings.fixed_habits or DEFAULT_HABITS


def compute_day(settings, entry, d: date) -> dict:
    """Calcula o resumo pontuado de um dia (entry pode ser ``None``)."""
    habits = _fixed_habits(settings)
    keys = {h["key"] for h in habits}
    total_habits = len(habits)

    done_raw = entry.habits_done if entry else []
    done = [k for k in done_raw if k in keys]
    n_done = len(done)

    daily = daily_challenge(settings, d)
    surprise = surprise_challenge(settings, d)
    surprise_present = surprise is not None

    daily_done = bool(entry.daily_done) if entry else False
    surprise_done = (bool(entry.surprise_done) if entry else False) and surprise_present

    all_habits = total_habits > 0 and n_done >= total_habits
    everything = all_habits and daily_done and (surprise_done if surprise_present else True)

    habit_pts = n_done * HABIT_POINTS
    daily_pts = DAILY_POINTS if daily_done else 0
    surprise_pts = SURPRISE_POINTS if surprise_done else 0
    bonus = BONUS_POINTS if everything else 0
    points = habit_pts + daily_pts + surprise_pts + bonus

    max_points = (
        total_habits * HABIT_POINTS
        + DAILY_POINTS
        + (SURPRISE_POINTS if surprise_present else 0)
        + BONUS_POINTS
    )

    return {
        "date": d.isoformat(),
        "day_number": day_number(settings, d),
        "points": points,
        "max_points": max_points,
        "completion_pct": round(points / max_points * 100) if max_points else 0,
        "habit_pts": habit_pts,
        "daily_pts": daily_pts,
        "surprise_pts": surprise_pts,
        "bonus": bonus,
        "habits": habits,
        "habits_done": done,
        "n_habits": total_habits,
        "n_done": n_done,
        "daily": daily,
        "daily_done": daily_done,
        "daily_proof": entry.daily_proof if entry else None,
        "surprise": surprise,
        "surprise_present": surprise_present,
        "surprise_done": surprise_done,
        "surprise_proof": entry.surprise_proof if entry else None,
        "mood": entry.mood if entry else None,
        "completed": all_habits and daily_done,  # conta para a sequência
        "perfect": everything,                    # dia perfeito (ganhou o bônus)
    }


def nudge(today_cd: dict, my_total: int, partner_total=None, partner_name=None) -> dict:
    """Mensagem de incentivo/lembrete contextual para o dia de hoje."""
    if today_cd["perfect"]:
        base = "Dia perfeito! Você fechou tudo hoje. Orgulho! ⭐"
    else:
        parts = []
        pend = today_cd["n_habits"] - today_cd["n_done"]
        if pend > 0:
            parts.append(f"{pend} hábito(s)")
        if not today_cd["daily_done"]:
            parts.append("o desafio do dia")
        if today_cd["surprise_present"] and not today_cd["surprise_done"]:
            parts.append("a surpresa 🔥")
        base = (
            "Faltam " + " e ".join(parts) + " pra fechar o dia. Bora! 💪"
            if parts else "Tudo em ordem por hoje. 👏"
        )

    if partner_total is not None:
        if partner_total > my_total:
            base += f" {partner_name or 'Seu par'} tá {partner_total - my_total} pts na frente 👀"
        elif my_total > partner_total:
            base += " Você tá liderando! 👑"

    return {"emoji": "📣", "text": base}


def _challenge_window(settings, today: date):
    """Datas do início do desafio até hoje (limitado à duração configurada)."""
    last = min(today, settings.start_date + timedelta(days=settings.duration_days - 1))
    d = settings.start_date
    while d <= last:
        yield d
        d += timedelta(days=1)


def _current_streak(days: list[dict]) -> int:
    """Sequência de dias concluídos até hoje (hoje pode estar em andamento)."""
    if not days:
        return 0
    i = len(days) - 1
    if not days[i]["completed"]:  # hoje ainda não fechou: olha de ontem pra trás
        i -= 1
    streak = 0
    while i >= 0 and days[i]["completed"]:
        streak += 1
        i -= 1
    return streak


def _best_streak(days: list[dict]) -> int:
    best = run = 0
    for cd in days:
        if cd["completed"]:
            run += 1
            best = max(best, run)
        else:
            run = 0
    return best


def build_days(settings, entries_by_date: dict, today: date) -> list[dict]:
    """Lista de resumos por dia do início do desafio até hoje."""
    return [
        compute_day(settings, entries_by_date.get(d), d)
        for d in _challenge_window(settings, today)
    ]


def player_stats(settings, days: list[dict], today: date) -> dict:
    """Agrega as estatísticas de um jogador a partir dos dias calculados."""
    total = sum(cd["points"] for cd in days)
    possible = sum(cd["max_points"] for cd in days)
    weekly = sum(cd["points"] for cd in days[-7:])
    completed_days = sum(1 for cd in days if cd["completed"])
    perfect_days = sum(1 for cd in days if cd["perfect"])

    today_iso = today.isoformat()
    today_cd = next((cd for cd in days if cd["date"] == today_iso), None)

    return {
        "total": total,
        "possible": possible,
        "weekly": weekly,
        "today": today_cd["points"] if today_cd else 0,
        "today_max": today_cd["max_points"] if today_cd else 0,
        "completed_days": completed_days,
        "perfect_days": perfect_days,
        "streak": _current_streak(days),
        "best_streak": _best_streak(days),
        "completion_pct": round(total / possible * 100) if possible else 0,
    }


def _metric_value(metric: str, days: list[dict], stats: dict) -> int:
    """Valor atual de uma métrica usada pelas conquistas."""
    if metric.startswith("habit:"):
        key = metric.split(":", 1)[1]
        return sum(1 for cd in days if key in cd["habits_done"])
    if metric.startswith("cat:"):
        cat = metric.split(":", 1)[1]
        return sum(1 for cd in days if cd["daily_done"] and cd["daily"]["category"] == cat)
    if metric == "surprise_done":
        return sum(1 for cd in days if cd["surprise_done"])
    if metric == "all_habits_days":
        return sum(1 for cd in days if cd["n_habits"] > 0 and cd["n_done"] >= cd["n_habits"])
    return stats.get(metric, 0)


def achievements_for(days: list[dict], stats: dict, casal_days: int = 0) -> list[dict]:
    """Lista de conquistas com progresso e status de desbloqueio."""
    result = []
    for a in ACHIEVEMENTS:
        current = casal_days if a["metric"] == "casal" else _metric_value(a["metric"], days, stats)
        target = a["target"]
        result.append({
            "key": a["key"],
            "name": a["name"],
            "emoji": a["emoji"],
            "desc": a["desc"],
            "current": min(current, target),
            "target": target,
            "unlocked": current >= target,
        })
    return result
