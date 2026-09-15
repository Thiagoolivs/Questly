"""Tipo de grupo e janela do desafio.

O tipo escolhido na criação decide participação, dupla e ranking; o desafio só
aceita registro dentro da janela combinada.
"""
import os
import tempfile
from datetime import datetime, timedelta

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_grupos.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _auth(nome="Pessoa"):
    email = f"u{next(_n)}@questly.app"
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": nome, "avatar": ""})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _grupo(H, tipo, nome="Espaço"):
    r = c.post("/api/groups", json={"name": nome, "group_type": tipo}, headers=H)
    assert r.status_code == 200, r.text
    return r.json()


def _hoje(H, gid):
    """Hoje no fuso do grupo — que pode não ser o dia UTC."""
    return c.get(f"/api/groups/{gid}/challenges/today", headers=H).json()["date"]


class TestTipoDeGrupo:
    def test_tipo_e_regras_aparecem_no_payload(self):
        g = _grupo(_auth(), "couple", "Nós dois")
        assert g["group_type"] == "couple"
        assert g["rules"]["joint"] is True
        assert g["rules"]["max_members"] == 2

    def test_individual_nao_aceita_ninguem(self):
        dono = _auth()
        g = _grupo(dono, "individual", "Só eu")
        assert g["rules"]["invite"] is False
        r = c.post("/api/groups/join", json={"invite_code": g["invite_code"]}, headers=_auth())
        assert r.status_code == 400
        assert "individual" in r.json()["detail"].lower()

    def test_casal_para_de_aceitar_no_terceiro(self):
        g = _grupo(_auth(), "couple", "Casal")
        assert c.post("/api/groups/join", json={"invite_code": g["invite_code"]},
                      headers=_auth()).status_code == 200
        r = c.post("/api/groups/join", json={"invite_code": g["invite_code"]}, headers=_auth())
        assert r.status_code == 400
        assert "completo" in r.json()["detail"].lower()

    def test_dupla_so_existe_em_casal(self):
        dono = _auth()
        grupo = _grupo(dono, "group", "Turma")
        r = c.post(f"/api/groups/{grupo['id']}/joint", headers=dono,
                   json={"date": _hoje(dono, grupo["id"]), "label": "Treino junto"})
        assert r.status_code == 400
        assert "casal" in r.json()["detail"].lower()

    def test_dupla_funciona_em_casal(self):
        dono = _auth()
        casal = _grupo(dono, "couple", "Casal 2")
        r = c.post(f"/api/groups/{casal['id']}/joint", headers=dono,
                   json={"date": _hoje(dono, casal["id"]), "label": "Treino junto"})
        assert r.status_code == 200, r.text


class TestJanelaDoDesafio:
    def test_grupo_novo_ja_nasce_com_janela(self):
        dono = _auth()
        g = _grupo(dono, "group", "Com janela")
        s = c.get(f"/api/groups/{g['id']}/settings", headers=dono).json()
        assert s["challenge_start"] and s["challenge_end"]
        assert s["challenge_status"] == "active"

    def test_fim_antes_do_inicio_e_recusado(self):
        dono = _auth()
        g = _grupo(dono, "group", "Invertida")
        agora = datetime.now()
        r = c.put(f"/api/groups/{g['id']}/settings", headers=dono, json={
            "challenge_start": agora.isoformat(),
            "challenge_end": (agora - timedelta(days=1)).isoformat(),
        })
        assert r.status_code == 400
        assert "depois do início" in r.json()["detail"]

    def test_duracao_e_derivada_da_janela(self):
        dono = _auth()
        g = _grupo(dono, "group", "Derivada")
        inicio = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
        r = c.put(f"/api/groups/{g['id']}/settings", headers=dono, json={
            "challenge_start": inicio.isoformat(),
            "challenge_end": (inicio + timedelta(days=13, hours=17)).isoformat(),
        })
        assert r.status_code == 200, r.text
        assert r.json()["duration_days"] == 14

    def test_antes_de_comecar_nao_da_para_registrar(self):
        dono = _auth()
        g = _grupo(dono, "group", "Futuro")
        futuro = datetime.now() + timedelta(days=3)
        c.put(f"/api/groups/{g['id']}/settings", headers=dono, json={
            "challenge_start": futuro.isoformat(),
            "challenge_end": (futuro + timedelta(days=30)).isoformat(),
        })
        s = c.get(f"/api/groups/{g['id']}/settings", headers=dono).json()
        assert s["challenge_status"] == "scheduled"

        r = c.post(f"/api/groups/{g['id']}/day/challenge", headers=dono,
                   json={"date": _hoje(dono, g["id"]), "category": "Física", "image": None})
        assert r.status_code == 400
        assert "começa em" in r.json()["detail"]

    def test_depois_de_terminar_nao_da_para_registrar(self):
        dono = _auth()
        g = _grupo(dono, "group", "Passado")
        fim = datetime.now() - timedelta(days=1)
        c.put(f"/api/groups/{g['id']}/settings", headers=dono, json={
            "challenge_start": (fim - timedelta(days=30)).isoformat(),
            "challenge_end": fim.isoformat(),
        })
        s = c.get(f"/api/groups/{g['id']}/settings", headers=dono).json()
        assert s["challenge_status"] == "ended"

        r = c.post(f"/api/groups/{g['id']}/day/challenge", headers=dono,
                   json={"date": _hoje(dono, g["id"]), "category": "Física", "image": None})
        assert r.status_code == 400
        assert "terminou em" in r.json()["detail"]
