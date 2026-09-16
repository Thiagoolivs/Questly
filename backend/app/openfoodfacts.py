"""Open Food Facts — produtos industrializados, de graça e sem chave.

A tabela local (`foods.py`) resolve comida de verdade: arroz, ovo, frango. O que
ela não tem é produto de marca — "Nescau", "Bauducco maisena", "Whey X". Isso
é exatamente o que o Open Food Facts cobre: base aberta (ODbL), colaborativa,
com muito produto brasileiro e sem cadastro nem limite de chave.

Só é consultado quando a busca local traz pouca coisa, com timeout curto e
tudo dentro de try/except: se a rede cair, a busca local continua respondendo.
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request

BUSCA = "https://world.openfoodfacts.org/cgi/search.pl"
CAMPOS = "code,product_name,product_name_pt,brands,nutriments,serving_quantity"
# A política deles pede um User-Agent que identifique o aplicativo.
UA = "Questly/1.0 (https://github.com/thiagoolivs/questly)"
TIMEOUT = 4.0


def _numero(valor) -> float:
    try:
        n = float(valor)
    except (TypeError, ValueError):
        return 0.0
    return n if n == n and n not in (float("inf"), float("-inf")) else 0.0


def _produto(bruto: dict) -> dict | None:
    nome = (bruto.get("product_name_pt") or bruto.get("product_name") or "").strip()
    if not nome:
        return None
    nutrientes = bruto.get("nutriments") or {}
    kcal = _numero(nutrientes.get("energy-kcal_100g"))
    if kcal <= 0:
        # Sem energia declarada não dá para somar nada — o item seria ruído.
        return None
    marca = (bruto.get("brands") or "").split(",")[0].strip()
    return {
        "id": f"off:{bruto.get('code')}",
        "name": f"{nome} ({marca})" if marca else nome,
        "per": 100,
        "calories": round(kcal),
        "protein_g": round(_numero(nutrientes.get("proteins_100g")), 1),
        "carbs_g": round(_numero(nutrientes.get("carbohydrates_100g")), 1),
        "fat_g": round(_numero(nutrientes.get("fat_100g")), 1),
        "measures": [{"label": "porção", "grams": round(_numero(bruto.get("serving_quantity")) or 30)}],
        "source": "Open Food Facts",
    }


def buscar(termo: str, limite: int = 8) -> list[dict]:
    """Produtos cujo nome casa com `termo`. Lista vazia se a rede falhar."""
    termo = (termo or "").strip()
    if len(termo) < 3:
        return []
    url = BUSCA + "?" + urllib.parse.urlencode(
        {
            "search_terms": termo,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "page_size": limite,
            "fields": CAMPOS,
            # Produtos vendidos no Brasil primeiro: a base é mundial e sem isto
            # a busca por "biscoito" volta cheia de coisa que ninguém acha aqui.
            "tagtype_0": "countries",
            "tag_contains_0": "contains",
            "tag_0": "brazil",
        }
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            dados = json.loads(resp.read().decode("utf-8"))
    except Exception:  # noqa: BLE001 — indisponibilidade não pode quebrar a busca
        return []

    saida = []
    for bruto in dados.get("products") or []:
        item = _produto(bruto)
        if item:
            saida.append(item)
    return saida[:limite]
