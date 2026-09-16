"""Alimentos por nome e quantidade — o caminho que não depende de IA.

O que se testa aqui é a conta: buscar o alimento, converter a quantidade e
somar a refeição. O Open Food Facts fica de fora de propósito (é rede), mas o
teste garante que a busca continua respondendo quando ele não responde.
"""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_alimentos.db")
os.environ.pop("DATABASE_URL", None)

from datetime import date  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402

from app import foods, openfoodfacts  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _espaco():
    email = f"comida{next(_n)}@questly.app"
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": "Faminto", "avatar": ""})
    h = {"Authorization": f"Bearer {r.json()['token']}"}
    g = c.post("/api/groups", json={"name": "Casa", "group_type": "individual"}, headers=h)
    return h, g.json()["id"]


# --- tabela ----------------------------------------------------------------
def test_busca_ignora_acento_e_maiuscula():
    assert any(a["id"] == "feijao_carioca_cozido" for a in foods.buscar("FEIJÃO"))
    assert any(a["id"] == "feijao_carioca_cozido" for a in foods.buscar("feijao"))


def test_quem_comeca_com_o_termo_vem_primeiro():
    # "Salada de maionese" contém "maionese", mas quem digita "arroz" quer arroz.
    assert foods.buscar("arroz")[0]["id"].startswith("arroz")


def test_termo_curto_nao_busca():
    assert foods.buscar("a") == []


def test_macros_escalam_com_a_quantidade():
    meio = foods.macros("frango_peito_grelhado", 50)
    inteiro = foods.macros("frango_peito_grelhado", 100)
    assert inteiro["calories"] == 159
    assert meio["calories"] == round(159 / 2)
    assert meio["protein_g"] == round(32.0 / 2, 1)


def test_alimento_inexistente_nao_estoura():
    assert foods.macros("nao_existe", 100) is None


def test_todo_alimento_tem_medida_caseira():
    # Pedir "150 g de arroz" é pedir para a pessoa desistir: sempre há uma
    # colher, uma unidade ou uma fatia para escolher.
    for fid, a in foods.CATALOGO.items():
        assert a["measures"], f"{fid} sem medida caseira"
        assert all(m["grams"] > 0 for m in a["measures"]), fid


# --- endpoints -------------------------------------------------------------
def test_busca_pela_api():
    h, _ = _espaco()
    r = c.get("/api/foods?q=ovo", headers=h)
    assert r.status_code == 200
    nomes = [a["name"] for a in r.json()["foods"]]
    assert "Ovo de galinha cozido" in nomes


def test_busca_sobrevive_ao_open_food_facts_fora_do_ar(monkeypatch):
    def explode(*a, **k):
        raise RuntimeError("rede fora")

    monkeypatch.setattr(openfoodfacts.urllib.request, "urlopen", explode)
    h, _ = _espaco()
    r = c.get("/api/foods?q=arroz", headers=h)
    assert r.status_code == 200
    assert len(r.json()["foods"]) >= 2  # a tabela local respondeu sozinha


def test_refeicao_por_alimentos_soma_certo():
    h, gid = _espaco()
    hoje = date.today().isoformat()
    r = c.post(
        f"/api/groups/{gid}/meals/foods",
        json={"date": hoje, "items": [
            {"food_id": "arroz_branco_cozido", "grams": 150},
            {"food_id": "feijao_carioca_cozido", "grams": 80},
            {"food_id": "frango_peito_grelhado", "grams": 120},
        ]},
        headers=h,
    )
    assert r.status_code == 200, r.text
    refeicao = r.json()["meal"]
    # 128*1.5 + 76*0.8 + 159*1.2 = 192 + 61 + 191
    assert refeicao["calories"] == 444
    assert refeicao["protein_g"] == 46
    assert refeicao["confidence"] is None  # tabelado, não estimado
    assert r.json()["nutrition"]["calories"] == 444


def test_item_fora_da_tabela_precisa_trazer_os_macros():
    h, gid = _espaco()
    hoje = date.today().isoformat()
    sem = c.post(f"/api/groups/{gid}/meals/foods",
                 json={"date": hoje, "items": [{"food_id": "off:123", "grams": 30}]}, headers=h)
    assert sem.status_code == 400

    com = c.post(
        f"/api/groups/{gid}/meals/foods",
        json={"date": hoje, "items": [
            {"food_id": "off:123", "name": "Achocolatado", "grams": 30,
             "calories": 380, "protein_g": 4, "carbs_g": 85, "fat_g": 2},
        ]},
        headers=h,
    )
    assert com.status_code == 200
    assert com.json()["meal"]["calories"] == 114  # 380 * 0.3


def test_quantidade_invalida_e_recusada():
    h, gid = _espaco()
    hoje = date.today().isoformat()
    for gramas in (0, -10, 99999):
        r = c.post(f"/api/groups/{gid}/meals/foods",
                   json={"date": hoje, "items": [{"food_id": "ovo_cozido", "grams": gramas}]},
                   headers=h)
        assert r.status_code == 422, gramas


def test_rotulo_sai_dos_alimentos():
    assert foods.rotulo([{"name": "Ovo de galinha cozido"}]) == "Ovo de galinha cozido"
    assert foods.rotulo([{"name": "Arroz"}, {"name": "Feijão"}]) == "Arroz e Feijão"
    assert foods.rotulo([{"name": "A"}, {"name": "B"}, {"name": "C"}]) == "A, B e mais 1"
