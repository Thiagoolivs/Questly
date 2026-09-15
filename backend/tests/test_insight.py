"""A leitura do dia lê dados reais — não é chat.

O que se testa aqui é o que o app entrega à IA e o que faz com a resposta,
não o provedor.
"""
import os
import tempfile

import pytest

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_insight.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app import ai  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _auth():
    r = c.post("/api/auth/register", json={
        "email": f"i{next(_n)}@questly.app", "password": "secret123",
        "name": "Insight", "avatar": "",
    })
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture
def ia(monkeypatch):
    """Captura o que foi entregue à IA, para checar que são dados reais."""
    visto = {}

    def falsa(dados):
        visto.update(dados)
        return "Você fechou os hábitos ontem; hoje falta a rotina da manhã."

    monkeypatch.setattr(ai, "ai_enabled", lambda: True)
    monkeypatch.setattr(ai, "generate_daily_insight", falsa)
    return visto


def test_sem_ia_a_tela_segue_inteira(monkeypatch):
    monkeypatch.setattr(ai, "ai_enabled", lambda: False)
    r = c.get("/api/today/insight", headers=_auth())
    assert r.status_code == 200
    assert r.json()["text"] is None
    assert r.json()["ai_enabled"] is False


def test_a_ia_recebe_o_que_a_pessoa_fez(ia):
    H = _auth()
    h = c.post("/api/habits", json={"name": "Beber água", "frequency": "daily"}, headers=H).json()
    c.post(f"/api/habits/{h['id']}/log", json={}, headers=H)

    r = c.get("/api/today/insight", headers=H)
    assert r.status_code == 200, r.text
    assert r.json()["text"].startswith("Você fechou")

    assert "consistência de hábitos (7 dias)" in ia
    assert "pendente hoje" in ia
    assert ia["concluído hoje"] == "1 de 1"


def test_descanso_planejado_chega_como_escolha(ia):
    H = _auth()
    hoje = c.get("/api/today", headers=H).json()["date"]
    c.post("/api/rest-days", json={"date": hoje, "reason": "Descanso"}, headers=H)

    c.get("/api/today/insight", headers=H)
    assert ia["hoje é descanso planejado"] == "sim"


def test_a_leitura_e_gerada_uma_vez_por_dia(ia):
    H = _auth()
    primeira = c.get("/api/today/insight", headers=H).json()
    assert primeira["cached"] is False

    segunda = c.get("/api/today/insight", headers=H).json()
    assert segunda["cached"] is True
    assert segunda["text"] == primeira["text"]


def test_falha_da_ia_nao_derruba_a_tela(monkeypatch):
    def explode(_):
        raise RuntimeError("provedor fora do ar")

    monkeypatch.setattr(ai, "ai_enabled", lambda: True)
    monkeypatch.setattr(ai, "generate_daily_insight", explode)

    r = c.get("/api/today/insight", headers=_auth())
    assert r.status_code == 200
    assert r.json()["text"] is None
