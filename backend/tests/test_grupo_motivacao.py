"""Motivação dentro do grupo: empurrão, meta coletiva, duelo e retrospectiva.

O feed deixava reagir ao que o outro postou, mas não havia gesto nenhum para
quem *não* postou — que é justamente quem está precisando. E o placar mensal
desanima quem ficou para trás logo na primeira semana.
"""
import os
import tempfile
from datetime import date, datetime, timedelta

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_motivgrupo.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app import models as m  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import _pares_da_semana, _run_weekly_group_recap, app  # noqa: E402
from app.seed import init_db  # noqa: E402

HOJE = date.today()
_n = iter(range(10_000))


def _auth(c, nome="Pessoa"):
    email = f"gm{next(_n)}@questly.app"
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": nome, "avatar": ""})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}, email


def _grupo_com(c, quantos, nome="Time"):
    """Cria um grupo e devolve os cabeçalhos de cada membro."""
    dono, _ = _auth(c, "Ana Silva")
    gid = c.post("/api/groups", json={"name": nome, "group_type": "group"}, headers=dono).json()["id"]
    codigo = c.get("/api/groups", headers=dono).json()["groups"][0]["invite_code"]
    todos = [dono]
    for i in range(quantos - 1):
        outro, _ = _auth(c, f"Membro {i}")
        r = c.post("/api/groups/join", json={"invite_code": codigo}, headers=outro)
        assert r.status_code == 200, r.text
        todos.append(outro)
    return gid, todos


def _membros(c, headers, gid):
    return c.get(f"/api/groups/{gid}/ranking", headers=headers).json()["ranking"]


def _envelhecer(tabela, dias):
    with SessionLocal() as db:
        for row in db.query(tabela).all():
            row.created_at = datetime.utcnow() - timedelta(days=dias)
        db.commit()


class TestEmpurrao:
    def test_manda_e_nao_repete_no_mesmo_dia(self):
        init_db()
        c = TestClient(app)
        gid, (ana, bruno) = _grupo_com(c, 2)
        alvo = next(x for x in _membros(c, ana, gid) if not x["is_me"])

        r = c.post(f"/api/groups/{gid}/nudge", headers=ana,
                   json={"membership_id": alvo["membership_id"], "kind": "forca"})
        assert r.status_code == 200, r.text

        de_novo = c.post(f"/api/groups/{gid}/nudge", headers=ana,
                         json={"membership_id": alvo["membership_id"], "kind": "forca"})
        assert de_novo.status_code == 400 and "já mandou" in de_novo.text

        # O limite é por alvo: o outro ainda pode mandar de volta.
        meu = next(x for x in _membros(c, bruno, gid) if not x["is_me"])
        volta = c.post(f"/api/groups/{gid}/nudge", headers=bruno,
                       json={"membership_id": meu["membership_id"], "kind": "aplauso"})
        assert volta.status_code == 200, volta.text

    def test_nao_da_para_cutucar_a_si_mesmo(self):
        init_db()
        c = TestClient(app)
        gid, (ana, _) = _grupo_com(c, 2)
        eu = next(x for x in _membros(c, ana, gid) if x["is_me"])
        r = c.post(f"/api/groups/{gid}/nudge", headers=ana,
                   json={"membership_id": eu["membership_id"]})
        assert r.status_code == 400

    def test_nao_da_para_cutucar_quem_nao_e_do_grupo(self):
        init_db()
        c = TestClient(app)
        gid, (ana, _) = _grupo_com(c, 2)
        outro_gid, (fora,) = _grupo_com(c, 1, "Outro")
        estranho = next(x for x in _membros(c, fora, outro_gid) if x["is_me"])

        r = c.post(f"/api/groups/{gid}/nudge", headers=ana,
                   json={"membership_id": estranho["membership_id"]})
        assert r.status_code == 404

    def test_empurrao_nao_vira_post_no_feed(self):
        init_db()
        c = TestClient(app)
        gid, (ana, _) = _grupo_com(c, 2)
        alvo = next(x for x in _membros(c, ana, gid) if not x["is_me"])
        c.post(f"/api/groups/{gid}/nudge", headers=ana,
               json={"membership_id": alvo["membership_id"]})
        # Empurrão é de pessoa para pessoa; no feed viraria placar de quem apoia mais.
        assert c.get(f"/api/groups/{gid}/activities", headers=ana).json()["activities"] == []


class TestMetaColetiva:
    def test_soma_o_que_todo_mundo_fez(self):
        init_db()
        c = TestClient(app)
        gid, (ana, bruno) = _grupo_com(c, 2)

        alvo = c.post(f"/api/groups/{gid}/targets", headers=ana, json={
            "title": "100 km juntos", "metric": "km", "target": 100, "days": 30,
        })
        assert alvo.status_code == 200, alvo.text
        assert alvo.json()["total"] == 0

        for headers, km in ((ana, 8), (bruno, 12)):
            c.post(f"/api/groups/{gid}/activity-record", headers=headers, json={
                "modality": "corrida", "params": {"distance": km, "duration": 45},
            })

        lista = c.get(f"/api/groups/{gid}/targets", headers=ana).json()["targets"]
        assert lista[0]["total"] == 20.0, "a meta é do grupo: soma o que cada um pôs"
        assert lista[0]["percent"] == 20
        assert {x["value"] for x in lista[0]["members"]} == {8.0, 12.0}

    def test_meta_de_dias_usa_o_que_cada_um_fechou(self):
        init_db()
        c = TestClient(app)
        gid, (ana, bruno) = _grupo_com(c, 2)
        c.post(f"/api/groups/{gid}/targets", headers=ana, json={
            "title": "10 dias fechados", "metric": "dias", "target": 10, "days": 30,
        })
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=ana).json()["id"]
        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": True},
               headers=ana)

        lista = c.get(f"/api/groups/{gid}/targets", headers=bruno).json()["targets"]
        assert lista[0]["total"] == 1.0

    def test_encerrar_tira_da_lista(self):
        init_db()
        c = TestClient(app)
        gid, (ana, _) = _grupo_com(c, 2)
        tid = c.post(f"/api/groups/{gid}/targets", headers=ana, json={
            "title": "Qualquer", "metric": "treinos", "target": 5,
        }).json()["id"]

        assert c.delete(f"/api/groups/{gid}/targets/{tid}", headers=ana).status_code == 200
        assert c.get(f"/api/groups/{gid}/targets", headers=ana).json()["targets"] == []


class TestDueloDaSemana:
    def test_todo_mundo_e_pareado_uma_vez_so(self):
        for n in (2, 4, 6):
            pares, fora = _pares_da_semana(list(range(1, n + 1)), HOJE)
            emparelhados = [x for par in pares for x in par]
            assert fora is None, f"grupo par não deixa ninguém de fora (n={n})"
            assert sorted(emparelhados) == list(range(1, n + 1)), f"n={n}"
            assert len(pares) == n // 2

    def test_grupo_impar_deixa_um_de_folga_e_a_folga_gira(self):
        ids = [1, 2, 3, 4, 5]
        folgas = set()
        for semana in range(8):
            pares, fora = _pares_da_semana(ids, HOJE + timedelta(days=7 * semana))
            assert fora is not None
            emparelhados = [x for par in pares for x in par]
            assert fora not in emparelhados
            assert sorted(emparelhados + [fora]) == ids
            folgas.add(fora)
        assert len(folgas) > 1, "a folga não pode cair sempre na mesma pessoa"

    def test_os_pares_mudam_de_uma_semana_para_a_outra(self):
        ids = [1, 2, 3, 4, 5, 6]
        a = _pares_da_semana(ids, HOJE)[0]
        b = _pares_da_semana(ids, HOJE + timedelta(days=7))[0]
        assert set(map(frozenset, a)) != set(map(frozenset, b))

    def test_duelo_traz_os_dois_placares(self):
        init_db()
        c = TestClient(app)
        gid, (ana, bruno) = _grupo_com(c, 2)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=ana).json()["id"]
        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": True},
               headers=ana)

        duelo = c.get(f"/api/groups/{gid}/duel", headers=ana).json()
        assert duelo["active"] is True
        assert duelo["me"]["days_closed"] == 1
        assert duelo["rival"]["days_closed"] == 0
        assert duelo["leading"] == "me"

        # O rival vê o mesmo confronto, do lado dele.
        outro = c.get(f"/api/groups/{gid}/duel", headers=bruno).json()
        assert outro["rival"]["membership_id"] == duelo["me"]["membership_id"]
        assert outro["leading"] == "rival"

    def test_espaco_de_uma_pessoa_nao_tem_duelo(self):
        init_db()
        c = TestClient(app)
        gid, (ana,) = _grupo_com(c, 1)
        r = c.get(f"/api/groups/{gid}/duel", headers=ana).json()
        assert r["active"] is False and r["reason"] == "individual"


class TestRetrospectivaDoGrupo:
    def test_post_do_app_sai_com_o_podio_e_sem_dono(self):
        init_db()
        c = TestClient(app)
        gid, (ana, bruno) = _grupo_com(c, 2)

        hid = c.post("/api/habits", json={"name": "Correr"}, headers=ana).json()["id"]
        _envelhecer(m.Habit, 30)
        segunda_passada = HOJE - timedelta(days=HOJE.weekday() + 7)
        for i in range(3):
            c.post(f"/api/habits/{hid}/log", headers=ana,
                   json={"date": (segunda_passada + timedelta(days=i)).isoformat(),
                         "completed": True})

        _run_weekly_group_recap()

        itens = c.get(f"/api/groups/{gid}/activities", headers=bruno).json()["activities"]
        recap = next(x for x in itens if x["kind"] == "recap")
        assert recap["system"] is True
        assert recap["author"] == "Questly", "quem escreve é o app, não um membro"
        assert recap["membership_id"] is None
        assert "Ana 3d" in recap["text"]

    def test_rodar_duas_vezes_nao_duplica(self):
        init_db()
        c = TestClient(app)
        gid, (ana, _) = _grupo_com(c, 2)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=ana).json()["id"]
        _envelhecer(m.Habit, 30)
        c.post(f"/api/habits/{hid}/log", headers=ana,
               json={"date": (HOJE - timedelta(days=HOJE.weekday() + 7)).isoformat(),
                     "completed": True})

        _run_weekly_group_recap()
        _run_weekly_group_recap()
        itens = c.get(f"/api/groups/{gid}/activities", headers=ana).json()["activities"]
        assert len([x for x in itens if x["kind"] == "recap"]) == 1

    def test_semana_vazia_nao_vira_post(self):
        init_db()
        c = TestClient(app)
        gid, (ana, _) = _grupo_com(c, 2)
        _run_weekly_group_recap()
        itens = c.get(f"/api/groups/{gid}/activities", headers=ana).json()["activities"]
        assert [x for x in itens if x["kind"] == "recap"] == []


class TestMarcoNaHora:
    def test_bater_o_marco_volta_na_resposta(self):
        init_db()
        c = TestClient(app)
        gid, (ana, _) = _grupo_com(c, 2)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=ana).json()["id"]
        _envelhecer(m.Habit, 30)

        for i in (2, 1):
            r = c.post(f"/api/habits/{hid}/log", headers=ana,
                       json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})
            assert r.json()["milestone_reached"] is None

        fechou = c.post(f"/api/habits/{hid}/log", headers=ana,
                        json={"date": HOJE.isoformat(), "completed": True}).json()
        assert fechou["streak"] == 3
        assert fechou["milestone_reached"] == {"days": 3, "points": 10}
