"""Tabela de alimentos básicos — macros sem depender de IA.

Por que existir: registrar comida por foto ou frase depende de uma chave de IA
e de uma estimativa. Para arroz, feijão, ovo e frango não há o que estimar — os
valores são tabelados. Aqui a pessoa escreve o nome e a quantidade e o número
sai exato, de graça, offline e sempre igual.

Fonte dos números: TACO — Tabela Brasileira de Composição de Alimentos
(NEPA/UNICAMP, 4ª edição), complementada pelo USDA FoodData Central para itens
que a TACO não traz. Valores por 100 g da parte comestível, já como preparada
quando o nome diz "cozido"/"grelhado".

Para produtos industrializados (marca, código de barras) o caminho é o Open
Food Facts — aberto, sem chave, com muito produto brasileiro. Fica em
`openfoodfacts.py`, consultado só quando a busca local não resolve.
"""

from __future__ import annotations

import unicodedata

# (id, nome, kcal, proteína g, carboidrato g, gordura g, medidas caseiras)
# As medidas caseiras são o que a pessoa realmente digita: "2 ovos", "3 colheres
# de arroz". Sem elas, pedir gramas de um ovo é pedir para ela desistir.
_TABELA: list[tuple] = [
    # --- básicos do prato brasileiro -------------------------------------
    ("arroz_branco_cozido", "Arroz branco cozido", 128, 2.5, 28.1, 0.2, [("colher de sopa", 25), ("escumadeira", 80), ("xícara", 160)]),
    ("arroz_integral_cozido", "Arroz integral cozido", 124, 2.6, 25.8, 1.0, [("colher de sopa", 25), ("escumadeira", 80), ("xícara", 160)]),
    ("feijao_carioca_cozido", "Feijão carioca cozido", 76, 4.8, 13.6, 0.5, [("concha", 80), ("colher de sopa", 30)]),
    ("feijao_preto_cozido", "Feijão preto cozido", 77, 4.5, 14.0, 0.5, [("concha", 80), ("colher de sopa", 30)]),
    ("lentilha_cozida", "Lentilha cozida", 93, 6.3, 16.3, 0.5, [("concha", 80), ("colher de sopa", 30)]),
    ("grao_de_bico_cozido", "Grão-de-bico cozido", 164, 8.9, 27.4, 2.6, [("concha", 80), ("colher de sopa", 30)]),
    ("macarrao_cozido", "Macarrão cozido", 158, 5.8, 30.9, 0.9, [("escumadeira", 90), ("prato", 200)]),
    ("farofa_pronta", "Farofa pronta", 406, 2.6, 78.2, 9.0, [("colher de sopa", 20)]),
    ("mandioca_cozida", "Mandioca cozida", 125, 0.6, 30.1, 0.3, [("pedaço", 70)]),
    ("batata_cozida", "Batata cozida", 52, 1.2, 11.9, 0.1, [("unidade média", 120)]),
    ("batata_doce_cozida", "Batata-doce cozida", 77, 0.6, 18.4, 0.1, [("unidade média", 130)]),
    ("purê_de_batata", "Purê de batata", 78, 1.5, 14.0, 1.9, [("colher de sopa", 30)]),
    ("polenta", "Polenta cozida", 102, 1.8, 22.0, 0.7, [("fatia", 80)]),
    ("cuscuz_milho", "Cuscuz de milho cozido", 113, 2.2, 25.3, 0.5, [("fatia", 90)]),

    # --- carnes, ovos e peixes -------------------------------------------
    ("frango_peito_grelhado", "Peito de frango grelhado", 159, 32.0, 0.0, 2.5, [("filé", 100)]),
    ("frango_coxa_assada", "Coxa de frango assada", 215, 27.5, 0.0, 11.5, [("unidade", 65)]),
    ("carne_patinho_cozido", "Patinho cozido", 219, 35.9, 0.0, 7.3, [("bife", 100)]),
    ("carne_alcatra_grelhada", "Alcatra grelhada", 241, 31.9, 0.0, 11.8, [("bife", 100)]),
    ("carne_moida_refogada", "Carne moída refogada", 212, 26.7, 0.0, 11.2, [("colher de sopa", 25)]),
    ("carne_costela_assada", "Costela bovina assada", 373, 28.3, 0.0, 28.2, [("porção", 120)]),
    ("linguica_toscana", "Linguiça toscana grelhada", 296, 17.9, 0.0, 24.9, [("gomo", 60)]),
    ("bacon_frito", "Bacon frito", 541, 37.0, 1.4, 41.8, [("fatia", 15)]),
    ("tilapia_grelhada", "Tilápia grelhada", 128, 26.2, 0.0, 2.1, [("filé", 120)]),
    ("salmao_grelhado", "Salmão grelhado", 211, 22.8, 0.0, 13.0, [("posta", 130)]),
    ("sardinha_lata", "Sardinha em lata (óleo)", 208, 24.6, 0.0, 11.5, [("unidade", 30), ("lata", 84)]),
    ("atum_lata_agua", "Atum em lata (água)", 116, 25.5, 0.0, 1.0, [("lata", 120)]),
    ("ovo_cozido", "Ovo de galinha cozido", 146, 13.3, 0.6, 9.5, [("unidade", 50)]),
    ("ovo_frito", "Ovo frito", 240, 15.6, 1.2, 18.6, [("unidade", 50)]),
    ("clara_de_ovo", "Clara de ovo", 52, 10.9, 0.7, 0.2, [("unidade", 33)]),

    # --- laticínios -------------------------------------------------------
    ("leite_integral", "Leite integral", 61, 2.9, 4.6, 3.2, [("copo", 200), ("xícara", 240)]),
    ("leite_desnatado", "Leite desnatado", 35, 3.4, 5.0, 0.2, [("copo", 200), ("xícara", 240)]),
    ("iogurte_natural", "Iogurte natural integral", 61, 3.5, 4.7, 3.3, [("pote", 170)]),
    ("iogurte_grego", "Iogurte grego natural", 97, 9.0, 4.0, 5.0, [("pote", 130)]),
    ("queijo_minas_frescal", "Queijo minas frescal", 264, 17.4, 3.2, 20.2, [("fatia", 30)]),
    ("queijo_mussarela", "Queijo mussarela", 330, 22.6, 3.0, 25.2, [("fatia", 20)]),
    ("requeijao", "Requeijão cremoso", 257, 9.6, 3.0, 22.6, [("colher de sopa", 20)]),
    ("manteiga", "Manteiga com sal", 726, 0.4, 0.1, 82.4, [("colher de chá", 5), ("ponta de faca", 8)]),
    ("whey_protein", "Whey protein concentrado (pó)", 400, 80.0, 8.0, 5.0, [("scoop", 30)]),

    # --- pães, biscoitos e cereais ---------------------------------------
    ("pao_frances", "Pão francês", 300, 8.0, 58.6, 3.1, [("unidade", 50)]),
    ("pao_forma_integral", "Pão de forma integral", 253, 9.4, 49.9, 3.7, [("fatia", 25)]),
    ("pao_de_queijo", "Pão de queijo", 363, 5.4, 39.6, 20.0, [("unidade", 30)]),
    ("tapioca_goma", "Tapioca (goma hidratada)", 240, 0.0, 60.0, 0.0, [("unidade", 60)]),
    ("aveia_flocos", "Aveia em flocos", 394, 13.9, 66.6, 8.5, [("colher de sopa", 15)]),
    ("granola", "Granola", 471, 9.8, 63.0, 19.0, [("colher de sopa", 15)]),
    ("biscoito_agua_sal", "Biscoito água e sal", 432, 10.3, 71.4, 11.9, [("unidade", 7)]),
    ("bolacha_recheada", "Biscoito recheado", 472, 5.6, 71.0, 19.6, [("unidade", 13)]),

    # --- frutas -----------------------------------------------------------
    ("banana_prata", "Banana prata", 98, 1.3, 26.0, 0.1, [("unidade", 70)]),
    ("banana_nanica", "Banana nanica", 92, 1.4, 23.8, 0.1, [("unidade", 90)]),
    ("maca", "Maçã com casca", 56, 0.3, 15.2, 0.0, [("unidade", 130)]),
    ("laranja", "Laranja pera", 37, 1.0, 8.9, 0.1, [("unidade", 130)]),
    ("mamao_papaia", "Mamão papaia", 40, 0.5, 10.4, 0.1, [("fatia", 130)]),
    ("melancia", "Melancia", 33, 0.9, 8.1, 0.0, [("fatia", 200)]),
    ("abacaxi", "Abacaxi", 48, 0.9, 12.3, 0.1, [("fatia", 75)]),
    ("manga", "Manga", 64, 0.4, 16.7, 0.2, [("unidade", 150)]),
    ("uva", "Uva", 53, 0.7, 13.6, 0.2, [("cacho pequeno", 100)]),
    ("morango", "Morango", 30, 0.9, 6.8, 0.3, [("unidade", 12)]),
    ("abacate", "Abacate", 96, 1.2, 6.0, 8.4, [("colher de sopa", 30)]),

    # --- verduras e legumes ----------------------------------------------
    ("alface", "Alface", 15, 1.4, 2.4, 0.2, [("folha", 10), ("prato", 60)]),
    ("tomate", "Tomate", 15, 1.1, 3.1, 0.2, [("unidade", 90), ("fatia", 20)]),
    ("cenoura_crua", "Cenoura crua", 34, 1.3, 7.7, 0.2, [("unidade", 80)]),
    ("brocolis_cozido", "Brócolis cozido", 25, 2.1, 4.4, 0.5, [("colher de sopa", 25)]),
    ("couve_refogada", "Couve refogada", 90, 1.7, 8.7, 5.9, [("colher de sopa", 20)]),
    ("abobrinha_cozida", "Abobrinha cozida", 19, 1.1, 4.3, 0.2, [("colher de sopa", 30)]),
    ("beterraba_cozida", "Beterraba cozida", 32, 1.3, 7.2, 0.1, [("colher de sopa", 30)]),
    ("cebola", "Cebola", 39, 1.7, 8.9, 0.1, [("unidade", 70)]),
    ("pepino", "Pepino", 10, 0.9, 2.0, 0.0, [("unidade", 130)]),

    # --- gorduras, castanhas e extras ------------------------------------
    ("azeite_oliva", "Azeite de oliva", 884, 0.0, 0.0, 100.0, [("colher de sopa", 13), ("fio", 5)]),
    ("oleo_soja", "Óleo de soja", 884, 0.0, 0.0, 100.0, [("colher de sopa", 13)]),
    ("castanha_caju", "Castanha de caju", 570, 18.5, 29.1, 46.3, [("unidade", 5), ("punhado", 30)]),
    ("castanha_para", "Castanha-do-pará", 643, 14.5, 15.1, 63.5, [("unidade", 5)]),
    ("amendoim", "Amendoim torrado", 544, 27.2, 20.3, 43.9, [("punhado", 30)]),
    ("pasta_amendoim", "Pasta de amendoim", 588, 25.0, 20.0, 50.0, [("colher de sopa", 15)]),
    ("acucar_refinado", "Açúcar refinado", 387, 0.0, 99.5, 0.0, [("colher de chá", 5), ("colher de sopa", 12)]),
    ("mel", "Mel", 309, 0.0, 84.0, 0.0, [("colher de sopa", 20)]),
    ("chocolate_ao_leite", "Chocolate ao leite", 540, 7.2, 59.6, 30.3, [("quadradinho", 6), ("barra", 90)]),

    # --- bebidas ----------------------------------------------------------
    ("cafe_coado", "Café coado sem açúcar", 2, 0.2, 0.3, 0.0, [("xícara", 50), ("copo", 200)]),
    ("suco_laranja_natural", "Suco de laranja natural", 37, 0.7, 8.7, 0.2, [("copo", 200)]),
    ("refrigerante_cola", "Refrigerante de cola", 34, 0.0, 8.7, 0.0, [("copo", 200), ("lata", 350)]),
    ("cerveja", "Cerveja pilsen", 41, 0.6, 3.1, 0.0, [("copo", 300), ("lata", 350)]),
    ("agua_de_coco", "Água de coco", 22, 0.0, 5.3, 0.0, [("copo", 200)]),

    # --- pratos prontos comuns -------------------------------------------
    ("pizza_mussarela", "Pizza de mussarela", 266, 11.4, 30.0, 11.0, [("fatia", 100)]),
    ("hamburguer_lanche", "Hambúrguer (lanche completo)", 264, 12.9, 24.0, 12.9, [("unidade", 180)]),
    ("coxinha", "Coxinha de frango", 288, 8.5, 29.0, 15.5, [("unidade", 80)]),
    ("lasanha_bolonhesa", "Lasanha à bolonhesa", 168, 9.0, 14.0, 8.5, [("porção", 250)]),
    ("estrogonofe_frango", "Estrogonofe de frango", 143, 11.2, 4.3, 9.0, [("concha", 120)]),
    ("salada_maionese", "Salada de maionese", 156, 2.0, 12.0, 11.0, [("colher de sopa", 30)]),
]


def _chave(texto: str) -> str:
    """Minúsculo e sem acento — 'Feijão' e 'feijao' têm de achar a mesma coisa."""
    sem_acento = unicodedata.normalize("NFD", texto or "")
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return sem_acento.lower().strip()


def _alimento(linha: tuple) -> dict:
    fid, nome, kcal, prot, carb, gord, medidas = linha
    return {
        "id": fid,
        "name": nome,
        "per": 100,
        "calories": kcal,
        "protein_g": prot,
        "carbs_g": carb,
        "fat_g": gord,
        "measures": [{"label": rotulo, "grams": g} for rotulo, g in medidas],
        "source": "TACO",
    }


CATALOGO: dict[str, dict] = {linha[0]: _alimento(linha) for linha in _TABELA}
_INDICE: list[tuple[str, str]] = [(_chave(a["name"]), fid) for fid, a in CATALOGO.items()]


def buscar(termo: str, limite: int = 12) -> list[dict]:
    """Busca por nome, ignorando acento e maiúscula.

    Quem começa com o termo vem antes de quem só o contém: digitando "arroz"
    ninguém espera ver "Salada de maionese" antes de "Arroz branco".
    """
    alvo = _chave(termo)
    if len(alvo) < 2:
        return []
    comeca, contem = [], []
    for nome, fid in _INDICE:
        if nome.startswith(alvo):
            comeca.append(fid)
        elif alvo in nome:
            contem.append(fid)
    return [CATALOGO[fid] for fid in (comeca + contem)[:limite]]


def macros(food_id: str, grams: float) -> dict | None:
    """Macros de `grams` gramas do alimento, arredondados como o app exibe."""
    alimento = CATALOGO.get(food_id)
    if alimento is None:
        return None
    fator = max(0.0, float(grams)) / 100.0
    return {
        "id": alimento["id"],
        "name": alimento["name"],
        "grams": round(float(grams), 1),
        "calories": round(alimento["calories"] * fator),
        "protein_g": round(alimento["protein_g"] * fator, 1),
        "carbs_g": round(alimento["carbs_g"] * fator, 1),
        "fat_g": round(alimento["fat_g"] * fator, 1),
    }


def somar(itens: list[dict]) -> dict:
    """Soma uma lista de `macros()` num total pronto para virar refeição."""
    return {
        "calories": round(sum(i["calories"] for i in itens)),
        "protein_g": round(sum(i["protein_g"] for i in itens)),
        "carbs_g": round(sum(i["carbs_g"] for i in itens)),
        "fat_g": round(sum(i["fat_g"] for i in itens)),
    }


def rotulo(itens: list[dict]) -> str:
    """Nome curto da refeição a partir dos alimentos escolhidos."""
    if not itens:
        return "Refeição"
    nomes = [i["name"].split(" com ")[0].split(" (")[0] for i in itens]
    if len(nomes) <= 2:
        return " e ".join(nomes)[:120]
    return f"{nomes[0]}, {nomes[1]} e mais {len(nomes) - 2}"[:120]
