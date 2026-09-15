"""Agenda: criar compromisso com data/hora e vê-lo no dia.

O POST /api/calendar devolvia 500 para qualquer evento com horário — a data
chegava como texto ISO e ia direto para uma coluna DateTime. Como nada
exercitava a rota, a agenda inteira estava quebrada sem ninguém notar.
"""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_agenda.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _auth():
    r = c.post("/api/auth/register", json={
        "email": f"agenda{next(_n)}@questly.app", "password": "secret123",
        "name": "Agendador", "avatar": "",
    })
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_compromisso_com_horario_e_criado_e_aparece_no_dia():
    H = _auth()
    hoje = c.get("/api/today", headers=H).json()["date"]

    r = c.post("/api/calendar", headers=H, json={
        "title": "Treino de Jiu-Jitsu",
        "category": "treino",
        "start_datetime": f"{hoje}T19:00:00",
        "end_datetime": f"{hoje}T20:30:00",
        "duration_min": 90,
        "reminder_minutes": [30],
    })
    assert r.status_code == 200, r.text

    dia = c.get("/api/today", headers=H).json()
    assert len(dia["agenda"]) == 1, dia["agenda"]
    evento = dia["agenda"][0]
    assert evento["title"] == "Treino de Jiu-Jitsu"
    assert evento["start"].endswith("19:00:00")
    assert evento["duration_min"] == 90
    assert evento["reminder_minutes"] == [30]
    assert dia["summary"]["pending"] == 1


def test_aceita_iso_com_fuso():
    H = _auth()
    hoje = c.get("/api/today", headers=H).json()["date"]
    r = c.post("/api/calendar", headers=H, json={
        "title": "Com Z", "start_datetime": f"{hoje}T10:00:00Z",
    })
    assert r.status_code == 200, r.text


def test_fim_antes_do_inicio_e_recusado():
    H = _auth()
    hoje = c.get("/api/today", headers=H).json()["date"]
    r = c.post("/api/calendar", headers=H, json={
        "title": "Invertido",
        "start_datetime": f"{hoje}T20:00:00",
        "end_datetime": f"{hoje}T19:00:00",
    })
    assert r.status_code == 400


def test_data_invalida_devolve_400_e_nao_500():
    H = _auth()
    r = c.post("/api/calendar", headers=H, json={
        "title": "Data errada", "start_datetime": "15/09/2026 19h",
    })
    assert r.status_code == 400, r.text


def test_concluir_e_reabrir_compromisso():
    H = _auth()
    hoje = c.get("/api/today", headers=H).json()["date"]
    item = c.post("/api/calendar", headers=H, json={
        "title": "Meditar", "start_datetime": f"{hoje}T07:00:00",
    }).json()

    c.put(f"/api/calendar/{item['id']}", headers=H, json={"status": "done"})
    dia = c.get("/api/today", headers=H).json()
    assert dia["agenda"][0]["status"] == "done"
    assert dia["summary"]["pending"] == 0

    c.put(f"/api/calendar/{item['id']}", headers=H, json={"status": "pending"})
    assert c.get("/api/today", headers=H).json()["summary"]["pending"] == 1


def test_agenda_de_outro_usuario_nao_vaza():
    H = _auth()
    hoje = c.get("/api/today", headers=H).json()["date"]
    item = c.post("/api/calendar", headers=H, json={
        "title": "Particular", "start_datetime": f"{hoje}T09:00:00",
    }).json()

    outro = _auth()
    assert c.get("/api/today", headers=outro).json()["agenda"] == []
    assert c.put(f"/api/calendar/{item['id']}", headers=outro,
                 json={"status": "done"}).status_code == 404
