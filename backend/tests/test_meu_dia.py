"""Meu Dia de ponta a ponta: marcar hábito, fechar rotina, descansar.

Cobre o que estava quebrado antes: marcar um hábito não gravava nada, porque
HabitLog/RoutineLog não tinham rota.

Rodar:  cd backend && python -m pytest tests/ -q
"""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402


def test_meu_dia_ponta_a_ponta():
    init_db()
    c = TestClient(app)

    r = c.post("/api/auth/register", json={"email":"a@b.com","password":"secret123","name":"Thiago","avatar":""})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    H = {"Authorization": f"Bearer {tok}"}

    # --- hábito diário -> marcar -> desmarcar ---------------------------------
    h = c.post("/api/habits", json={"name":"Beber água","frequency":"daily"}, headers=H)
    assert h.status_code == 200, h.text
    hid = h.json()["id"]

    d = c.get("/api/today", headers=H).json()
    assert len(d["habits"]) == 1 and d["habits"][0]["completed"] is False, d
    assert d["summary"]["pending"] == 1, d["summary"]

    lg = c.post(f"/api/habits/{hid}/log", json={}, headers=H)
    assert lg.status_code == 200 and lg.json()["completed"] is True, lg.text

    d = c.get("/api/today", headers=H).json()
    assert d["habits"][0]["completed"] is True, d["habits"]
    assert d["summary"]["done"] == 1 and d["summary"]["pending"] == 0, d["summary"]

    lg = c.post(f"/api/habits/{hid}/log", json={}, headers=H)
    assert lg.json()["completed"] is False, "toggle deve inverter"

    # --- hábito custom: não vence num dia fora da lista ------------------------
    h2 = c.post("/api/habits", json={"name":"Alongar","frequency":"custom","custom_days":[]}, headers=H)
    hid2 = h2.json()["id"]
    d = c.get("/api/today", headers=H).json()
    assert [x["id"] for x in d["habits"]] == [hid], "hábito custom sem dias não deve vencer hoje"

    # --- rotina com passos -----------------------------------------------------
    rt = c.post("/api/routines", json={
        "name":"Manhã","frequency":{"type":"daily"},
        "steps":[{"name":"Água","is_required":True},{"name":"Alongar","is_required":True},
                 {"name":"Extra","is_required":False}],
    }, headers=H)
    assert rt.status_code == 200, rt.text
    rid = rt.json()["id"]

    d = c.get("/api/today", headers=H).json()
    routine = d["routines"][0]
    assert routine["total_count"] == 3 and routine["done_count"] == 0, routine
    steps = routine["steps"]
    req = [s for s in steps if s["is_required"]]

    s1 = c.post(f"/api/routines/{rid}/log", json={"step_id": req[0]["id"]}, headers=H)
    assert s1.json()["completed"] is False, "1 de 2 obrigatórios não fecha a rotina"
    s2 = c.post(f"/api/routines/{rid}/log", json={"step_id": req[1]["id"]}, headers=H)
    assert s2.json()["completed"] is True, "todos obrigatórios -> rotina fecha"

    d = c.get("/api/today", headers=H).json()
    assert d["routines"][0]["completed"] is True and d["routines"][0]["done_count"] == 2, d["routines"][0]

    # passo de outra rotina é rejeitado
    bad = c.post(f"/api/routines/{rid}/log", json={"step_id": 9999}, headers=H)
    assert bad.status_code == 404, bad.status_code

    # --- descanso planejado não vira falha ------------------------------------
    c.post(f"/api/habits/{hid}/log", json={"completed": False}, headers=H)
    d = c.get("/api/today", headers=H).json()
    assert d["summary"]["pending"] == 1, ("antes do descanso deve haver pendência", d["summary"])

    rd = c.post("/api/rest-days", json={"date": d["date"], "reason":"Descanso"}, headers=H)
    assert rd.status_code == 200, rd.text
    d = c.get("/api/today", headers=H).json()
    assert d["rest_day"] is True and d["summary"]["pending"] == 0, ("descanso zera pendência", d["summary"])

    assert len(c.get("/api/rest-days", headers=H).json()["rest_days"]) == 1
    c.delete(f"/api/rest-days/{d['date']}", headers=H)
    d = c.get("/api/today", headers=H).json()
    assert d["rest_day"] is False and d["summary"]["pending"] == 1, d["summary"]

    # --- isolamento entre usuários --------------------------------------------
    r2 = c.post("/api/auth/register", json={"email":"c@d.com","password":"secret123","name":"Outro","avatar":""})
    H2 = {"Authorization": f"Bearer {r2.json()['token']}"}
    assert c.post(f"/api/habits/{hid}/log", json={}, headers=H2).status_code == 404, "não pode logar hábito alheio"
    assert c.post(f"/api/routines/{rid}/log", json={"step_id":req[0]['id']}, headers=H2).status_code == 404
    assert c.get("/api/today", headers=H2).json()["habits"] == []


