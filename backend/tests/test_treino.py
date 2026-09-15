"""Planos de treino: geração, checklist, progresso e adaptação.

A IA é substituída por uma resposta fixa — o que se testa aqui é o que o app
faz com a estrutura, não o provedor.
"""
import os
import tempfile

import pytest

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_treino.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app import ai  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _auth():
    email = f"treino{next(_n)}@questly.app"
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": "Atleta", "avatar": ""})
    return {"Authorization": f"Bearer {r.json()['token']}"}


PLANO_FALSO = {
    "notes": "Comece leve e progrida.",
    "weeks": [
        {"week": 1, "sessions": [
            {"title": "Base A", "focus": "Guarda", "duration_min": 60,
             "items": [{"name": "Aquecimento", "detail": "10 min", "done": False},
                       {"name": "Drill de passagem", "detail": "3x5 min", "done": False}]},
        ]},
        {"week": 2, "sessions": [
            {"title": "Base B", "focus": "Raspagem", "duration_min": 60,
             "items": [{"name": "Rolamento", "detail": "5x5 min", "done": False}]},
        ]},
    ],
}


@pytest.fixture
def ia_ligada(monkeypatch):
    monkeypatch.setattr(ai, "ai_enabled", lambda: True)
    monkeypatch.setattr(ai, "generate_training_plan", lambda **kw: PLANO_FALSO)
    monkeypatch.setattr(
        ai, "generate_routine",
        lambda *a, **kw: {"name": "Pré-treino",
                          "steps": [{"name": "Mobilidade", "duration_min": 5, "is_required": True},
                                    {"name": "Ativação", "duration_min": 5, "is_required": False}]},
    )


def _criar_plano(H):
    return c.post("/api/training/plans", headers=H, json={
        "modality": "jiu-jitsu", "goal": "Passar a guarda", "level": "iniciante",
        "days_per_week": 1, "weeks": 2,
    })


def test_sem_ia_configurada_o_erro_e_claro(monkeypatch):
    monkeypatch.setattr(ai, "ai_enabled", lambda: False)
    r = _criar_plano(_auth())
    assert r.status_code == 503
    assert "IA" in r.json()["detail"]


def test_plano_vira_sessoes_com_checklist(ia_ligada):
    H = _auth()
    r = _criar_plano(H)
    assert r.status_code == 200, r.text
    plano = r.json()

    assert plano["weeks"] == 2
    assert len(plano["sessions"]) == 2
    assert plano["sessions"][0]["items"][0]["name"] == "Aquecimento"
    assert plano["progress"] == {"total": 2, "done": 0, "percent": 0}


def test_marcar_todos_os_itens_fecha_a_sessao(ia_ligada):
    H = _auth()
    plano = _criar_plano(H).json()
    sessao = plano["sessions"][0]

    r = c.post(f"/api/training/sessions/{sessao['id']}/item", headers=H, json={"item_index": 0})
    assert r.json()["status"] == "pending", "1 de 2 itens não fecha a sessão"

    r = c.post(f"/api/training/sessions/{sessao['id']}/item", headers=H, json={"item_index": 1})
    corpo = r.json()
    assert corpo["status"] == "done"
    assert corpo["plan"]["progress"]["done"] == 1
    assert corpo["plan"]["progress"]["percent"] == 50

    # Desmarcar reabre — progresso tem de acompanhar nos dois sentidos.
    r = c.post(f"/api/training/sessions/{sessao['id']}/item", headers=H, json={"item_index": 1})
    assert r.json()["status"] == "pending"
    assert r.json()["plan"]["progress"]["done"] == 0


def test_item_inexistente_e_recusado(ia_ligada):
    H = _auth()
    plano = _criar_plano(H).json()
    r = c.post(f"/api/training/sessions/{plano['sessions'][0]['id']}/item",
               headers=H, json={"item_index": 99})
    assert r.status_code == 400


def test_adaptar_preserva_o_que_ja_foi_feito(ia_ligada):
    H = _auth()
    plano = _criar_plano(H).json()
    feita = plano["sessions"][0]
    c.put(f"/api/training/sessions/{feita['id']}", headers=H, json={"status": "done"})

    r = c.post(f"/api/training/plans/{plano['id']}/adapt", headers=H,
               json={"feedback": "Está pesado demais no fim da semana"})
    assert r.status_code == 200, r.text
    depois = r.json()

    ids = [x["id"] for x in depois["sessions"]]
    assert feita["id"] in ids, "adaptar não pode apagar sessão já concluída"
    assert depois["progress"]["done"] == 1


def test_plano_de_outro_usuario_nao_e_acessivel(ia_ligada):
    dono = _auth()
    plano = _criar_plano(dono).json()
    outro = _auth()

    assert c.get(f"/api/training/plans/{plano['id']}", headers=outro).status_code == 404
    assert c.delete(f"/api/training/plans/{plano['id']}", headers=outro).status_code == 404
    assert c.post(f"/api/training/sessions/{plano['sessions'][0]['id']}/item",
                  headers=outro, json={"item_index": 0}).status_code == 404


def test_ia_tambem_monta_rotina(ia_ligada):
    H = _auth()
    r = c.post("/api/routines/ai", headers=H,
               json={"name": "Pré-treino", "context": "antes do jiu-jitsu", "steps": 2})
    assert r.status_code == 200, r.text
    assert len(r.json()["steps"]) == 2

    # E a rotina criada aparece no Meu Dia como qualquer outra.
    dia = c.get("/api/today", headers=H).json()
    assert any(x["name"] == "Pré-treino" for x in dia["routines"])
