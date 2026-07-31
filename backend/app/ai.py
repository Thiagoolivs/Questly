"""IA do Questly: geração de desafios (texto) e contador de calorias (visão).

Dois provedores suportados, escolhidos por variável de ambiente / disponibilidade:
- Groq (``GROQ_API_KEY``, pacote ``groq``) — barato/grátis, ótimo para os desafios.
- OpenAI (``OPENAI_API_KEY``, pacote ``openai``) — usado por padrão na VISÃO
  (contador de calorias) quando a chave existe, por ser mais confiável com fotos.

Ambos os SDKs falam a mesma API (``chat.completions``), então o código é comum;
só mudam o cliente e o modelo. ``ai_enabled()`` é True se qualquer provedor estiver
configurado — senão o app segue com os desafios fixos e o card de calorias inativo.

Overrides (opcionais):
- ``QUESTLY_AI_PROVIDER`` / ``QUESTLY_TEXT_PROVIDER`` / ``QUESTLY_VISION_PROVIDER``
  = ``openai`` | ``groq``
- ``QUESTLY_AI_MODEL`` / ``QUESTLY_VISION_MODEL`` = força um ID de modelo
- ``QUESTLY_OPENAI_TEXT_MODEL`` / ``QUESTLY_OPENAI_VISION_MODEL`` (padrão gpt-4o-mini)
"""
import json
import os
import re

from .data import CATEGORY_ORDER, DIFFICULTIES, DIFFICULTY_LABEL

# Groq roda modelos abertos e ROTACIONA/descontinua com frequência, então em vez
# de fixar um ID escolhemos, em runtime, o 1º candidato disponível na conta (/models).
GROQ_TEXT_MODELS = [
    "qwen/qwen3.6-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-20b",
]
GROQ_VISION_MODELS = [
    "qwen/qwen3.6-27b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]
OPENAI_TEXT_DEFAULT = "gpt-4o-mini"
OPENAI_VISION_DEFAULT = "gpt-4o-mini"
MAX_TEXT_LEN = 160

_avail_cache: "set[str] | None" = None


# --- disponibilidade / escolha de provedor ---------------------------------
def _has_openai() -> bool:
    if not os.getenv("OPENAI_API_KEY"):
        return False
    try:
        import openai  # noqa: F401
    except Exception:
        return False
    return True


def _has_groq() -> bool:
    if not os.getenv("GROQ_API_KEY"):
        return False
    try:
        import groq  # noqa: F401
    except Exception:
        return False
    return True


def _has_gemini() -> bool:
    # Usa a API REST do Gemini (stdlib), sem SDK — basta a chave.
    return bool(os.getenv("GEMINI_API_KEY"))


def ai_enabled() -> bool:
    return _has_gemini() or _has_openai() or _has_groq()


def _provider(kind: str) -> "str | None":
    """Escolhe o provedor para ``kind`` ('text' | 'vision').

    Padrão: VISÃO prefere Gemini (barato/free e ótimo com fotos), depois OpenAI,
    depois Groq; TEXTO prefere Groq (grátis), depois Gemini, depois OpenAI. Um
    override por env move o provedor escolhido para a frente.
    """
    override = os.getenv("QUESTLY_VISION_PROVIDER" if kind == "vision" else "QUESTLY_TEXT_PROVIDER") or os.getenv("QUESTLY_AI_PROVIDER")
    order = ("gemini", "openai", "groq") if kind == "vision" else ("groq", "gemini", "openai")
    if override in ("gemini", "openai", "groq"):
        order = (override,) + tuple(p for p in order if p != override)
    for p in order:
        if p == "gemini" and _has_gemini():
            return "gemini"
        if p == "openai" and _has_openai():
            return "openai"
        if p == "groq" and _has_groq():
            return "groq"
    return None


def _client(provider: str):
    if provider == "openai":
        import openai
        return openai.OpenAI()  # lê OPENAI_API_KEY
    import groq
    return groq.Groq()  # lê GROQ_API_KEY


def _available_model_ids(client) -> set:
    """IDs disponíveis na conta Groq (cacheado por processo)."""
    global _avail_cache
    if _avail_cache is None:
        try:
            _avail_cache = {m.id for m in client.models.list().data}
        except Exception:
            _avail_cache = set()
    return _avail_cache


def _resolve_model(client, provider: str, kind: str) -> str:
    override = os.getenv("QUESTLY_AI_MODEL" if kind == "text" else "QUESTLY_VISION_MODEL")
    if override:
        return override
    if provider == "openai":
        if kind == "text":
            return os.getenv("QUESTLY_OPENAI_TEXT_MODEL", OPENAI_TEXT_DEFAULT)
        return os.getenv("QUESTLY_OPENAI_VISION_MODEL", OPENAI_VISION_DEFAULT)
    candidates = GROQ_TEXT_MODELS if kind == "text" else GROQ_VISION_MODELS
    avail = _available_model_ids(client)
    for c in candidates:
        if c in avail:
            return c
    return candidates[0]


def _complete_json(provider: str, kind: str, messages: list, max_tokens: int, temperature: float) -> str:
    """Chama o provedor pedindo JSON; devolve o texto da resposta."""
    client = _client(provider)
    model = _resolve_model(client, provider, kind)
    kwargs = dict(model=model, max_tokens=max_tokens, temperature=temperature, messages=messages)
    try:
        resp = client.chat.completions.create(response_format={"type": "json_object"}, **kwargs)
    except Exception:
        # Alguns modelos não aceitam response_format (ou o param); refaz sem ele.
        resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""


# --- Gemini (Google) via API REST (sem SDK) --------------------------------
# A Google também rotaciona/descontinua modelos (ex.: gemini-2.0-flash saiu do ar).
# Em vez de fixar um ID, descobrimos um modelo válido via ListModels (cacheado) e
# escolhemos de uma lista de preferência. QUESTLY_GEMINI_MODEL força um ID.
GEMINI_PREFERRED = [
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-001",
    "gemini-2.5-pro",
    "gemini-pro-latest",
]
_gemini_avail: "list[str] | None" = None


def _gemini_available_models() -> list:
    """IDs de modelos Gemini que suportam generateContent (cacheado por processo)."""
    global _gemini_avail
    if _gemini_avail is None:
        _gemini_avail = []
        try:
            import urllib.request

            key = os.getenv("GEMINI_API_KEY")
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}&pageSize=200"
            with urllib.request.urlopen(url, timeout=15) as r:
                data = json.loads(r.read().decode())
            for m in data.get("models", []):
                if "generateContent" in (m.get("supportedGenerationMethods") or []):
                    _gemini_avail.append((m.get("name") or "").split("/")[-1])
        except Exception:
            _gemini_avail = []
    return _gemini_avail


def _gemini_model(kind: str) -> str:
    override = os.getenv("QUESTLY_GEMINI_MODEL") or os.getenv(
        "QUESTLY_VISION_MODEL" if kind == "vision" else "QUESTLY_AI_MODEL"
    )
    if override and "gemini" in override:
        return override
    avail = _gemini_available_models()
    for m in GEMINI_PREFERRED:
        if m in avail:
            return m
    for m in avail:  # fallback: qualquer "flash", senão o primeiro disponível
        if "flash" in m:
            return m
    return avail[0] if avail else "gemini-2.5-flash"


def _split_data_url(url: str) -> "tuple[str, str]":
    """Separa 'data:image/jpeg;base64,XXXX' em (mime, base64)."""
    if isinstance(url, str) and url.startswith("data:") and "," in url:
        head, b64 = url.split(",", 1)
        mime = head[5:].split(";")[0] or "image/jpeg"
        return mime, b64
    return "image/jpeg", url


def _gemini_json(kind: str, prompt: str, image_data_url: str | None = None) -> str:
    """Chama o Gemini (generateContent) pedindo JSON; devolve o texto."""
    import urllib.error
    import urllib.request

    key = os.getenv("GEMINI_API_KEY")
    parts: list = [{"text": prompt}]
    if image_data_url:
        mime, b64 = _split_data_url(image_data_url)
        parts.append({"inline_data": {"mime_type": mime, "data": b64}})
    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.2 if image_data_url else 0.9,
            "responseMimeType": "application/json",
        },
    }
    model = _gemini_model(kind)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise ValueError(f"Gemini {e.code}: {e.read().decode(errors='ignore')[:300]}")
    cands = payload.get("candidates") or []
    if not cands:
        raise ValueError("Gemini não retornou resposta.")
    out_parts = (cands[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in out_parts)


# --- helpers de parsing -----------------------------------------------------
def _extract_json(text: str) -> dict:
    text = (text or "").strip()
    # Modelos "thinking" (ex.: Qwen) podem prefixar um bloco de raciocínio.
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE).strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1] if text.count("```") >= 2 else text.strip("`")
        if text.lstrip().startswith("json"):
            text = text.lstrip()[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Resposta da IA sem JSON.")
    return json.loads(text[start : end + 1])


# --- desafios (texto) -------------------------------------------------------
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


def generate_challenge_pool(categories: list[str], per_diff: int = 6, context: str | None = None) -> dict:
    """Gera ``{categoria: {dificuldade: [textos]}}`` (validado). Só com ``ai_enabled()``."""
    provider = _provider("text")
    if provider is None:
        raise ValueError("Nenhum provedor de IA configurado.")
    if provider == "gemini":
        content = _gemini_json("text", _prompt(categories, per_diff, context))
    else:
        content = _complete_json(
            provider,
            "text",
            [
                {"role": "system", "content": "Você responde SEMPRE com um único objeto JSON válido, sem texto extra."},
                {"role": "user", "content": _prompt(categories, per_diff, context)},
            ],
            max_tokens=4096,
            temperature=0.9,
        )
    pool = _clean(_extract_json(content))
    if not pool:
        raise ValueError("A IA não retornou desafios válidos.")
    return pool


# --- contador de calorias por foto (visão) ---------------------------------
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
    """Estima ``{label, calories, protein_g, carbs_g, fat_g, confidence}`` da foto."""
    provider = _provider("vision")
    if provider is None:
        raise ValueError("Nenhum provedor de IA configurado.")
    if provider == "gemini":
        content = _gemini_json("vision", _MEAL_PROMPT, image_data_url)
    else:
        content = _complete_json(
            provider,
            "vision",
            [
                {"role": "system", "content": "Você responde SEMPRE com um único objeto JSON válido, sem texto extra e sem raciocínio."},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": _MEAL_PROMPT},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ],
                },
            ],
            max_tokens=800,
            temperature=0.2,
        )
    return _clean_meal(_extract_json(content))
