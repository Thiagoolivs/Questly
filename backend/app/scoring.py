"""Regras do jogo: geração dos desafios, pontuação, sequências e conquistas.

Pontuação (por dia):
  - Hábito cumprido: 10 pts cada (o grupo define quantos quiser).
  - Desafio de área: pontos pela dificuldade — Fácil 10 / Médio 25 / Difícil 45.
    Cada dia gera 1 desafio por área ativa (até 5). Só pontua COM foto-prova.
  - Bônus de equilíbrio: +20 por fechar TODAS as áreas do dia.
  - Bônus de dia perfeito: +10 quando fecha as áreas E todos os hábitos.

Os desafios são determinísticos por data (os dois jogadores recebem os mesmos),
mas cada um pode "rerolar" 1 desafio por dia (offset por área).
"""
import hashlib
from datetime import date, timedelta

from .data import (
    ACHIEVEMENTS,
    CATEGORY_EMOJI,
    CATEGORY_ORDER,
    CHALLENGE_POOLS,
    DEFAULT_HABITS,
    DIFFICULTIES,
    DIFFICULTY_LABEL,
    DIFFICULTY_POINTS,
    MOTD_POOL,
)

HABIT_POINTS = 10
HABIT_PROOF_POINTS = 12  # hábito marcado + foto-prova
BALANCE_BONUS = 20
PERFECT_BONUS = 10
TOGETHER_BONUS = 10  # bônus por concluir um desafio em dupla ("juntos")
MAX_REROLLS = 1  # trocas de desafio por dia


def _seed(d: date, salt: str) -> int:
    """Inteiro determinístico a partir de uma data + um 'sal'."""
    raw = f"{d.isoformat()}:{salt}".encode()
    return int(hashlib.sha256(raw).hexdigest(), 16)


def active_categories(settings) -> list[str]:
    """Áreas em jogo (remove Espiritual se desativada nas configs)."""
    return [
        c for c in CATEGORY_ORDER
        if not (c == "Espiritual" and not settings.spiritual_enabled)
    ]


def day_number(settings, d: date) -> int:
    return (d - settings.start_date).days + 1


def _catalog(cat: str) -> list[tuple[str, str]]:
    """Lista achatada (dificuldade, texto) de uma área, em ordem estável."""
    return [(diff, t) for diff in DIFFICULTIES for t in CHALLENGE_POOLS[cat][diff]]


def challenge_for(d: date, cat: str, cat_index: int, offset: int = 0) -> dict:
    """Desafio de uma área num dia.

    A dificuldade base rotaciona pela posição da área (``cat_index``) somada a um
    deslocamento diário — garante um MIX de níveis no mesmo dia e variação de dia
    para dia. Cada troca (``offset`` > 0) avança para o próximo item do catálogo,
    garantindo um desafio diferente (e possivelmente outra dificuldade).
    """
    items = _catalog(cat)
    base_tier = DIFFICULTIES[(_seed(d, "tier") + cat_index) % len(DIFFICULTIES)]
    base_pool = CHALLENGE_POOLS[cat][base_tier]
    base_text = base_pool[_seed(d, f"text:{cat}") % len(base_pool)]
    base_pos = items.index((base_tier, base_text))
    diff, text = items[(base_pos + offset) % len(items)]
    return {
        "category": cat,
        "emoji": CATEGORY_EMOJI[cat],
        "difficulty": diff,
        "difficulty_label": DIFFICULTY_LABEL[diff],
        "points": DIFFICULTY_POINTS[diff],
        "text": text,
    }


def daily_challenges(settings, d: date, rerolls: dict | None = None) -> list[dict]:
    """Os desafios do dia (um por área ativa), aplicando as trocas do membro."""
    rerolls = rerolls or {}
    return [
        challenge_for(d, cat, i, int(rerolls.get(cat, 0) or 0))
        for i, cat in enumerate(active_categories(settings))
    ]


def motd(d: date) -> str:
    return MOTD_POOL[_seed(d, "motd") % len(MOTD_POOL)]


def _fixed_habits(settings) -> list:
    return settings.fixed_habits or DEFAULT_HABITS


def _is_rest_day(settings, d: date) -> bool:
    """Dia de descanso do grupo (convenção JS: 0=Dom..6=Sáb)."""
    return ((d.weekday() + 1) % 7) in set(settings.rest_days or [])


def compute_day(settings, entry, d: date) -> dict:
    """Resumo pontuado de um dia (entry pode ser ``None``)."""
    habits = _fixed_habits(settings)
    keys = {h["key"] for h in habits}
    total_habits = len(habits)
    done_raw = entry.habits_done if entry else []
    habits_done = [k for k in done_raw if k in keys]
    n_done = len(habits_done)
    habit_proofs = (entry.habit_proofs or {}) if entry else {}
    # Hábito marcado vale 10; marcado + foto-prova vale 12.
    habit_pts = sum(HABIT_PROOF_POINTS if habit_proofs.get(k) else HABIT_POINTS for k in habits_done)

    proofs = (entry.challenge_proofs or {}) if entry else {}
    rerolls = (entry.challenge_rerolls or {}) if entry else {}
    together = (entry.challenge_together or {}) if entry else {}

    challenges = []
    challenge_pts = 0
    together_pts = 0
    areas_done = 0
    hard_done = 0
    done_cats = []
    for i, cat in enumerate(active_categories(settings)):
        offset = int(rerolls.get(cat, 0) or 0)
        ch = challenge_for(d, cat, i, offset)
        proof = proofs.get(cat)
        done = bool(proof)
        is_together = done and bool(together.get(cat))
        ch["done"] = done
        ch["proof"] = proof
        ch["rerolled"] = offset > 0
        ch["together"] = is_together
        if done:
            challenge_pts += ch["points"]
            areas_done += 1
            done_cats.append(cat)
            if ch["difficulty"] == "dificil":
                hard_done += 1
            if is_together:
                together_pts += TOGETHER_BONUS
        challenges.append(ch)

    areas_total = len(challenges)
    all_habits = total_habits > 0 and n_done >= total_habits
    all_areas = areas_total > 0 and areas_done >= areas_total
    balance_bonus = BALANCE_BONUS if all_areas else 0
    perfect = all_areas and all_habits
    perfect_bonus = PERFECT_BONUS if perfect else 0

    points = habit_pts + challenge_pts + together_pts + balance_bonus + perfect_bonus
    max_challenge_pts = sum(c["points"] for c in challenges)
    max_points = total_habits * HABIT_PROOF_POINTS + max_challenge_pts + BALANCE_BONUS + PERFECT_BONUS

    rerolls_used = sum(1 for v in rerolls.values() if v)

    return {
        "date": d.isoformat(),
        "day_number": day_number(settings, d),
        "is_rest": _is_rest_day(settings, d),
        "points": points,
        "max_points": max_points,
        "completion_pct": min(100, round(points / max_points * 100)) if max_points else 0,
        "habit_pts": habit_pts,
        "challenge_pts": challenge_pts,
        "together_pts": together_pts,
        "balance_bonus": balance_bonus,
        "perfect_bonus": perfect_bonus,
        "habits": habits,
        "habits_done": habits_done,
        "habit_proofs": {k: habit_proofs[k] for k in habits_done if habit_proofs.get(k)},
        "n_habits": total_habits,
        "n_done": n_done,
        "challenges": challenges,
        "done_cats": done_cats,
        "hard_done": hard_done,
        "areas_total": areas_total,
        "areas_done": areas_done,
        "rerolls_used": rerolls_used,
        "rerolls_left": max(0, MAX_REROLLS - rerolls_used),
        "moods": (entry.moods or []) if entry else [],
        "mood_note": (entry.mood_note if entry else None),
        "mood": (entry.moods[0] if entry and entry.moods else None),  # compat
        "completed": all_areas,   # conta para a sequência (fechou as áreas)
        "perfect": perfect,        # áreas + hábitos (ganhou o bônus perfeito)
    }


def nudge(today_cd: dict, my_total: int, partner_total=None, partner_name=None) -> dict:
    """Incentivo/lembrete contextual para o dia de hoje."""
    if today_cd["perfect"]:
        base = "Dia perfeito! Você fechou tudo hoje. Orgulho! ⭐"
    else:
        parts = []
        pend_areas = today_cd["areas_total"] - today_cd["areas_done"]
        pend_habits = today_cd["n_habits"] - today_cd["n_done"]
        if pend_areas > 0:
            parts.append(f"{pend_areas} área(s)")
        if pend_habits > 0:
            parts.append(f"{pend_habits} hábito(s)")
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
    last = min(today, settings.start_date + timedelta(days=settings.duration_days - 1))
    d = settings.start_date
    while d <= last:
        yield d
        d += timedelta(days=1)


def _current_streak(days: list[dict]) -> int:
    """Sequência atual. Dias de descanso são transparentes: não contam como
    ponto na sequência, mas também não a quebram."""
    streak = 0
    started = False  # já passou do dia de hoje (que pode estar em andamento)?
    for cd in reversed(days):
        if cd.get("is_rest"):
            continue  # descanso não conta nem quebra
        if cd["completed"]:
            streak += 1
            started = True
        elif not started:
            # Primeiro dia útil a partir do fim (hoje) ainda em andamento: ignora.
            started = True
        else:
            break
    return streak


def _best_streak(days: list[dict]) -> int:
    best = run = 0
    for cd in days:
        if cd.get("is_rest"):
            continue  # descanso não quebra a maior sequência
        if cd["completed"]:
            run += 1
            best = max(best, run)
        else:
            run = 0
    return best


def _category_streaks(days: list[dict], cats: list[str]) -> dict:
    """Sequência atual de dias com o desafio concluído, por área."""
    out = {}
    for cat in cats:
        i = len(days) - 1
        if i >= 0 and cat not in days[i]["done_cats"]:
            i -= 1  # hoje ainda em andamento
        streak = 0
        while i >= 0 and cat in days[i]["done_cats"]:
            streak += 1
            i -= 1
        out[cat] = streak
    return out


def build_days(settings, entries_by_date: dict, today: date) -> list[dict]:
    return [
        compute_day(settings, entries_by_date.get(d), d)
        for d in _challenge_window(settings, today)
    ]


def player_stats(settings, days: list[dict], today: date) -> dict:
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
        "completion_pct": min(100, round(total / possible * 100)) if possible else 0,
        "category_streaks": _category_streaks(days, active_categories(settings)),
    }


def _metric_value(metric: str, days: list[dict], stats: dict) -> int:
    if metric.startswith("habit:"):
        key = metric.split(":", 1)[1]
        return sum(1 for cd in days if key in cd["habits_done"])
    if metric.startswith("cat:"):
        cat = metric.split(":", 1)[1]
        return sum(1 for cd in days if cat in cd["done_cats"])
    if metric == "hard_done":
        return sum(cd["hard_done"] for cd in days)
    if metric == "balance_days":
        return sum(1 for cd in days if cd["completed"])
    if metric == "all_habits_days":
        return sum(1 for cd in days if cd["n_habits"] > 0 and cd["n_done"] >= cd["n_habits"])
    return stats.get(metric, 0)


def achievements_for(days: list[dict], stats: dict, casal_days: int = 0) -> list[dict]:
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
