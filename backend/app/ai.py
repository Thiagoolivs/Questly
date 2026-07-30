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

# Modelo padrão da Groq (bom para JSON e itens curtos/criativos).
DEFAULT_MODEL = os.getenv("QUESTLY_AI_MODEL", "llama-3.3-70b-versatile")
MAX_TEXT_LEN = 160


def ai_enabled() -> bool:
    if not os.getenv("GROQ_API_KEY"):
        return False
    try:
        import groq  # noqa: F401
    except Exception:
        return False
    return True


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
        model=DEFAULT_MODEL,
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
