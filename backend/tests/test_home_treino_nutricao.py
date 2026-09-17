"""Treino e alimentação na Home.

A Home passou a mostrar os dois como cartão de destaque. Estes testes fixam o
que ela lê do `/api/today`: sem plano e sem espaço os blocos vêm nulos (a tela
vira convite), e com dados vêm os números que o cartão exibe.
"""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_home.db")
os.environ.pop("DATABASE_URL", None)

from datetime import date  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import ai  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _auth():
    email = f"home{next(_n)}@questly.app"
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": "Thiago", "avatar": ""})
    return {"Authorization": f"Bearer {r.json()['token']}"}


PLANO_FALSO = {
    "notes": "Comece leve.",
    "weeks": [
        {"week": 1, "sessions": [
            {"title": "Rodagem leve", "focus": "base", "duration_min": 40,
             "items": [{"name": "5 km", "detail": "ritmo confortável", "done": False}]},
        ]},
    ],
}


@pytest.fixture
def ia_ligada(monkeypatch):
    """A IA vira uma resposta fixa: o que se testa é o que a Home faz com ela."""
    monkeypatch.setattr(ai, "ai_enabled", lambda: True)
    monkeypatch.setattr(ai, "generate_training_plan", lambda **kw: PLANO_FALSO)


def _criar_plano(h):
    return c.post("/api/training/plans", headers=h, json={
        "modality": "corrida", "goal": "10 km", "level": "iniciante",
        "days_per_week": 3, "weeks": 1,
    })


def test_sem_plano_e_sem_espaco_os_blocos_vem_nulos():
    h = _auth()
    d = c.get("/api/today", headers=h).json()
    assert d["training"] is None
    assert d["nutrition"] is None


def test_alimentacao_do_dia_soma_o_que_foi_registrado():
    h = _auth()
    gid = c.post("/api/groups", json={"name": "Casa", "group_type": "individual"}, headers=h).json()["id"]
    hoje = date.today().isoformat()
    c.post(f"/api/groups/{gid}/meals/foods",
           json={"date": hoje, "items": [{"food_id": "ovo_cozido", "grams": 100}]}, headers=h)
    c.post(f"/api/groups/{gid}/water", json={"date": hoje, "delta_ml": 500}, headers=h)

    n = c.get(f"/api/today?group={gid}", headers=h).json()["nutrition"]
    assert n["group_id"] == gid
    assert n["calories"] == 146
    assert n["water_l"] == 0.5
    assert n["meals"] == 1
    assert n["calories_goal"] > 0


def test_sem_o_grupo_na_url_usa_o_primeiro_espaco():
    h = _auth()
    gid = c.post("/api/groups", json={"name": "Casa", "group_type": "individual"}, headers=h).json()["id"]
    assert c.get("/api/today", headers=h).json()["nutrition"]["group_id"] == gid


def test_treino_traz_a_proxima_sessao_pendente(ia_ligada):
    h = _auth()
    plano = _criar_plano(h)
    assert plano.status_code == 200, plano.text

    t = c.get("/api/today", headers=h).json()["training"]
    assert t["plan_id"] == plano.json()["id"]
    assert t["modality"] == "corrida"
    assert t["total"] == 1 and t["done"] == 0 and t["percent"] == 0
    assert t["today"]["title"] == "Rodagem leve"
    assert t["today"]["status"] == "pending"


def test_atividade_solta_conta_como_treino_do_dia(ia_ligada):
    h = _auth()
    gid = c.post("/api/groups", json={"name": "Casa", "group_type": "individual"}, headers=h).json()["id"]
    _criar_plano(h)
    c.post(f"/api/groups/{gid}/activity-record",
           json={"modality": "corrida", "category": "fitness",
                 "params": {"distance": 8, "duration": 42, "intensity": "intenso"}},
           headers=h)

    assert c.get("/api/today", headers=h).json()["training"]["logged_today"] == 1
