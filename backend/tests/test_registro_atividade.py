"""O teto de pontuação tem de valer no endpoint, não só no módulo puro."""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_rec.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402


def _auth(c, email):
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": "Tester", "avatar": ""})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_repetir_a_mesma_corrida_rende_cada_vez_menos():
    init_db()
    c = TestClient(app)
    H = _auth(c, "farm@questly.app")
    gid = c.post("/api/groups", json={"name": "Teste"}, headers=H).json()["id"]

    corrida = {"modality": "corrida", "category": "fitness",
               "params": {"distance": 5, "duration": 30, "intensity": "moderado"}}

    ganhos = []
    for _ in range(4):
        r = c.post(f"/api/groups/{gid}/activity-record", json=corrida, headers=H)
        assert r.status_code == 200, r.text
        ganhos.append(r.json()["score_earned"])

    assert ganhos[0] > ganhos[1] > ganhos[2], f"sem retorno decrescente: {ganhos}"
    assert sum(ganhos) < ganhos[0] * 2.6, f"4 registros iguais renderam demais: {ganhos}"

    # O XP pessoal não sofre o corte competitivo: evolução própria não é disputa.
    r = c.post(f"/api/groups/{gid}/activity-record", json=corrida, headers=H)
    corpo = r.json()
    assert corpo["xp_earned"] > 0
    assert corpo["capped"] > 0, "o que foi cortado precisa ser informado"


def test_valores_impossiveis_viram_aviso_e_nao_pontuacao():
    init_db()
    c = TestClient(app)
    H = _auth(c, "impossivel@questly.app")
    gid = c.post("/api/groups", json={"name": "Teste 2"}, headers=H).json()["id"]

    r = c.post(f"/api/groups/{gid}/activity-record", headers=H, json={
        "modality": "corrida", "category": "fitness",
        "params": {"distance": 100, "duration": 20, "intensity": "extremo"},
    })
    assert r.status_code == 200, r.text
    assert r.json()["notes"], "100 km em 20 min tem de gerar aviso"


def test_atividade_sem_duracao_e_recusada():
    init_db()
    c = TestClient(app)
    H = _auth(c, "vazio@questly.app")
    gid = c.post("/api/groups", json={"name": "Teste 3"}, headers=H).json()["id"]

    r = c.post(f"/api/groups/{gid}/activity-record", headers=H, json={
        "modality": "corrida", "category": "fitness", "params": {},
    })
    assert r.status_code == 400
