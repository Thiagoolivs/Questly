"""Geração de desafios por IA (em lote) via Groq.

Opcional e degradável: só funciona quando ``GROQ_API_KEY`` está definido e o
pacote ``groq`` está instalado. Caso contrário, ``ai_enabled()`` retorna False e
o app segue usando apenas os desafios fixos de ``data.py``.

O lote gerado é ANEXADO ao pool fixo (nunca substitui) e guardado em
``Settings.challenge_pool``. Como a seleção do desafio do dia é determinística por
data, gerar em lote (semanal/manual) mantém os dois parceiros vendo o mesmo
desafio e ainda traz bastante variedade sem uma chamada de IA por dia.
"""
import json
import os

from .data import CATEGORY_ORDER, DIFFICULTIES, DIFFICULTY_LABEL

# A Groq roda os modelos abertos e ROTACIONA/descontinua com frequência, então
# em vez de fixar um ID (que quebra na próxima rotação) mantemos uma lista de
# candidatos e escolhemos, em runtime, o primeiro que estiver disponível na conta
# (via /models). As variáveis QUESTLY_AI_MODEL / QUESTLY_VISION_MODEL forçam um ID.
TEXT_MODELS = [
    "qwen/qwen3.6-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-20b",
]
VISION_MODELS = [
    "qwen/qwen3.6-27b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]
MAX_TEXT_LEN = 160

_avail_cache: "set[str] | None" = None


def ai_enabled() -> bool:
    if not os.getenv("GROQ_API_KEY"):
        return False
    try:
        import groq  # noqa: F401
    except Exception:
        return False
    return True


def _available_model_ids(client) -> set:
    """IDs de modelos disponíveis na conta (cacheado por processo)."""
    global _avail_cache
    if _avail_cache is None:
        try:
            _avail_cache = {m.id for m in client.models.list().data}
        except Exception:
            _avail_cache = set()
    return _avail_cache


def _pick_model(client, override_env: str, candidates: list) -> str:
    """Escolhe o 1º candidato disponível na conta; respeita o override por env."""
    override = os.getenv(override_env)
    if override:
        return override
    avail = _available_model_ids(client)
    for c in candidates:
        if c in avail:
            return c
    return candidates[0]  # último recurso: deixa a API reportar se não existir


def _prompt(categories: list[str], per_diff: int, context: str | None) -> str:
    cats = ", ".join(categories)
    diffs = ", ".join(f"{d} ({DIFFICULTY_LABEL[d]})" for d in DIFFICULTIES)
    extra = f"\nContexto do casal/grupo (use com moderação, sem citar dados pessoais): {context}" if context else ""
    return (
        "Você cria desafios diários para um app de evolução pessoal em casal/grupo "
        "(cristão, família, saudável), em português do Brasil.\n\n"
        f"Gere {per_diff} desafios NOVOS e variados para CADA combinação de área e "
        f"dificuldade.\nÁreas: {cats}.\nDificuldades: {diffs}.\n\n"
        "Regras:\n"
        "- Cada desafio é uma frase curta e acionável (máx. ~120 caracteres), no imperativo.\n"
        "- 'facil' = rápido/leve; 'medio' = exige esforço; 'dificil' = desafiador mas realista para um dia.\n"
        "- Área Física pode incluir treinos concretos (flexões, abdominais, agachamentos, prancha, corrida).\n"
        "- Área Espiritual tem tom cristão (oração, gratidão, Bíblia, louvor).\n"
        "- Área Relação é para o casal fazer junto.\n"
        "- Nada de conteúdo sensível, caro, perigoso ou que exija terceiros específicos.\n"
        "- Não repita ideias óbvias; traga variedade real.\n"
        f"{extra}\n\n"
        "Responda APENAS com um objeto JSON, sem texto fora do JSON, no formato exato:\n"
        '{\"Área\": {\"facil\": [\"...\"], \"medio\": [\"...\"], \"dificil\": [\"...\"]}}\n'
        "Use exatamente os nomes de área e as chaves de dificuldade indicados."
    )


def _clean(pool: dict) -> dict:
    """Mantém só áreas/dificuldades válidas, strings limpas e sem duplicatas."""
    out: dict[str, dict[str, list[str]]] = {}
    if not isinstance(pool, dict):
        return out
    for cat in CATEGORY_ORDER:
        raw = pool.get(cat)
        if not isinstance(raw, dict):
            continue
        by_diff: dict[str, list[str]] = {}
        for diff in DIFFICULTIES:
            items = raw.get(diff)
            if not isinstance(items, list):
                continue
            seen: list[str] = []
            for t in items:
                if not isinstance(t, str):
                    continue
                t = t.strip()
                if t and len(t) <= MAX_TEXT_LEN and t not in seen:
                    seen.append(t)
            if seen:
                by_diff[diff] = seen
        if by_diff:
            out[cat] = by_diff
    return out


def _extract_json(text: str) -> dict:
    text = (text or "").strip()
    if text.startswith("```"):
        # remove cerca de código ```json ... ```
        text = text.split("```", 2)[1] if text.count("```") >= 2 else text.strip("`")
        if text.lstrip().startswith("json"):
            text = text.lstrip()[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Resposta da IA sem JSON.")
    return json.loads(text[start : end + 1])


def generate_challenge_pool(categories: list[str], per_diff: int = 6, context: str | None = None) -> dict:
    """Chama a Groq e devolve ``{categoria: {dificuldade: [textos]}}`` (validado).

    Levanta exceção em erro (o chamador decide como reportar). Só chame se
    ``ai_enabled()`` for True.
    """
    import groq

    client = groq.Groq()  # lê GROQ_API_KEY do ambiente
    resp = client.chat.completions.create(
        model=_pick_model(client, "QUESTLY_AI_MODEL", TEXT_MODELS),
        max_tokens=4096,
        temperature=0.9,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Você responde SEMPRE com um único objeto JSON válido, sem texto extra."},
            {"role": "user", "content": _prompt(categories, per_diff, context)},
        ],
    )
    content = resp.choices[0].message.content or ""
    pool = _clean(_extract_json(content))
    if not pool:
        raise ValueError("A IA não retornou desafios válidos.")
    return pool


# --- Contador de calorias por foto -----------------------------------------
_MEAL_PROMPT = (
    "Você analisa a FOTO de uma refeição e estima os valores nutricionais da "
    "porção visível, em português do Brasil. Seja realista com o tamanho da porção.\n\n"
    "Responda APENAS com um objeto JSON, sem texto fora do JSON:\n"
    '{\"label\": \"nome curto do prato\", \"calories\": inteiro_kcal, '
    '\"protein_g\": inteiro, \"carbs_g\": inteiro, \"fat_g\": inteiro, '
    '\"confidence\": \"baixa|media|alta\"}\n'
    "Se a imagem não for comida, retorne calories 0 e label \"—\"."
)


def _clamp_int(v, lo: int, hi: int) -> int:
    try:
        return max(lo, min(hi, int(round(float(v)))))
    except (TypeError, ValueError):
        return 0


def _clean_meal(data: dict) -> dict:
    label = str(data.get("label") or "Refeição").strip()[:120] or "Refeição"
    conf = str(data.get("confidence") or "").strip().lower()
    if conf not in ("baixa", "media", "média", "alta"):
        conf = None
    elif conf == "média":
        conf = "media"
    return {
        "label": label,
        "calories": _clamp_int(data.get("calories"), 0, 6000),
        "protein_g": _clamp_int(data.get("protein_g"), 0, 600),
        "carbs_g": _clamp_int(data.get("carbs_g"), 0, 600),
        "fat_g": _clamp_int(data.get("fat_g"), 0, 600),
        "confidence": conf,
    }


def estimate_meal(image_data_url: str) -> dict:
    """Estima ``{label, calories, protein_g, carbs_g, fat_g, confidence}`` da foto.

    Levanta exceção em erro. Só chame se ``ai_enabled()`` for True.
    """
    import groq

    client = groq.Groq()
    resp = client.chat.completions.create(
        model=_pick_model(client, "QUESTLY_VISION_MODEL", VISION_MODELS),
        max_tokens=500,
        temperature=0.2,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _MEAL_PROMPT},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ],
            }
        ],
    )
    content = resp.choices[0].message.content or ""
    return _clean_meal(_extract_json(content))
