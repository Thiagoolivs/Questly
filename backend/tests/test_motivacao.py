"""Motivação: conquistas pessoais, recorde de sequência, resgate e retrospectiva.

As 11 conquistas antigas mediam só o desafio do grupo — quem usa o app pelo Meu
Dia não tinha medalha nenhuma ao alcance. E uma corrente quebrada por um
imprevisto não tinha saída nenhuma, que é onde a maioria abandona.
"""
import os
import tempfile
from datetime import date, datetime, timedelta

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_motiv.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app import models as m  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

HOJE = date.today()


def _auth(c, email):
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": "Tester", "avatar": ""})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _espaco(c, headers, nome="Espaço"):
    return c.post("/api/groups", json={"name": nome}, headers=headers).json()["id"]


def _envelhecer(tabela, dias: int) -> None:
    with SessionLocal() as db:
        for row in db.query(tabela).all():
            row.created_at = datetime.utcnow() - timedelta(days=dias)
        db.commit()


def _marcar(c, H, hid, *offsets):
    for i in offsets:
        c.post(f"/api/habits/{hid}/log", headers=H,
               json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})


class TestConquistasPessoais:
    def test_espaco_individual_tem_medalha_ao_alcance(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "conq1@questly.app")
        gid = _espaco(c, H, "Só meu")
        mid = c.get(f"/api/groups/{gid}/ranking", headers=H).json()["me"]["membership_id"]

        lista = c.get(f"/api/groups/{gid}/achievements/{mid}", headers=H).json()["achievements"]
        pessoais = [a for a in lista if a["scope"] == "pessoal"]
        assert len(pessoais) >= 10, "as conquistas pessoais têm de valer em qualquer espaço"
        # As do desafio do grupo continuam lá, marcadas, para quem usa esse lado.
        assert any(a["scope"] == "grupo" for a in lista)

    def test_fechar_o_dia_desbloqueia_a_primeira(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "conq2@questly.app")
        gid = _espaco(c, H)
        mid = c.get(f"/api/groups/{gid}/ranking", headers=H).json()["me"]["membership_id"]
        hid = c.post("/api/habits", json={"name": "Treinar"}, headers=H).json()["id"]

        def primeira():
            lista = c.get(f"/api/groups/{gid}/achievements/{mid}", headers=H).json()["achievements"]
            return next(a for a in lista if a["key"] == "p_primeiro_dia")

        assert primeira()["unlocked"] is False
        _marcar(c, H, hid, 0)
        assert primeira()["unlocked"] is True

        # Desmarcar devolve a medalha: conquista derivada não mente depois de
        # um desfazer.
        c.post(f"/api/habits/{hid}/log", headers=H,
               json={"date": HOJE.isoformat(), "completed": False})
        assert primeira()["unlocked"] is False

    def test_conquista_de_treino_conta_registros(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "conq3@questly.app")
        gid = _espaco(c, H)
        mid = c.get(f"/api/groups/{gid}/ranking", headers=H).json()["me"]["membership_id"]
        for _ in range(3):
            c.post(f"/api/groups/{gid}/activity-record", headers=H, json={
                "modality": "corrida", "params": {"distance": 5, "duration": 30},
            })

        lista = c.get(f"/api/groups/{gid}/achievements/{mid}", headers=H).json()["achievements"]
        dez = next(a for a in lista if a["key"] == "p_treinos_10")
        assert dez["current"] == 3 and dez["unlocked"] is False
        km = next(a for a in lista if a["key"] == "p_distancia")
        assert km["current"] == 15


class TestRecordeDeSequencia:
    def test_recorde_sobrevive_a_queda_da_sequencia(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "recorde@questly.app")
        _espaco(c, H)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 40)

        _marcar(c, H, hid, 10, 9, 8, 7, 6)  # cinco dias seguidos, mas antigos
        resumo = c.get("/api/today", headers=H).json()["summary"]
        assert resumo["streak"] == 0, "a corrente antiga já foi quebrada pelos dias vazios"
        assert resumo["best_streak"] == 5, "o recorde tem de continuar de pé"

        _marcar(c, H, hid, 1, 0)
        resumo = c.get("/api/today", headers=H).json()["summary"]
        assert resumo["streak"] == 2
        assert resumo["best_streak"] == 5


class TestResgateDeDia:
    def test_salvar_um_dia_recompoe_a_sequencia(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "resgate1@questly.app")
        _espaco(c, H)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 40)
        _marcar(c, H, hid, 0, 2, 3)  # buraco em ontem

        assert c.get("/api/today", headers=H).json()["summary"]["streak"] == 1

        disponiveis = c.get("/api/rest-days/rescues", headers=H).json()
        assert disponiveis["left"] == 2
        assert (HOJE - timedelta(days=1)).isoformat() in [d["date"] for d in disponiveis["days"]]

        r = c.post("/api/rest-days/rescue",
                   json={"date": (HOJE - timedelta(days=1)).isoformat()}, headers=H)
        assert r.status_code == 200, r.text
        assert r.json()["streak"] == 3
        assert r.json()["left"] == 1

    def test_limite_mensal_e_respeitado(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "resgate2@questly.app")
        _espaco(c, H)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 40)
        _marcar(c, H, hid, 0)

        # Resgata dias de ontem para trás enquanto houver cota — e só os do mês
        # corrente contam, então o teste anda só dentro da janela de 7 dias.
        salvos = 0
        for i in range(1, 6):
            r = c.post("/api/rest-days/rescue",
                       json={"date": (HOJE - timedelta(days=i)).isoformat()}, headers=H)
            if r.status_code == 200:
                salvos += 1
            elif "resgates deste mês acabaram" in r.text:
                break
        assert salvos <= 2, "o limite mensal não pode ser furado"
        assert c.get("/api/rest-days/rescues", headers=H).json()["left"] == 0

    def test_hoje_e_dia_antigo_demais_sao_recusados(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "resgate3@questly.app")
        _espaco(c, H)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 60)

        hoje = c.post("/api/rest-days/rescue", json={"date": HOJE.isoformat()}, headers=H)
        assert hoje.status_code == 400 and "já passou" in hoje.text

        antigo = c.post("/api/rest-days/rescue",
                        json={"date": (HOJE - timedelta(days=30)).isoformat()}, headers=H)
        assert antigo.status_code == 400 and "últimos" in antigo.text

    def test_dia_sem_nada_marcado_nao_precisa_de_resgate(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "resgate4@questly.app")
        _espaco(c, H)
        # Sem nenhum hábito, nenhum dia cobra nada — gastar cota aqui seria roubo.
        r = c.post("/api/rest-days/rescue",
                   json={"date": (HOJE - timedelta(days=1)).isoformat()}, headers=H)
        assert r.status_code == 400 and "não havia nada marcado" in r.text


class TestRetrospectiva:
    def test_semana_fechada_traz_numeros_e_comparacao(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "recap1@questly.app")
        gid = _espaco(c, H)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 40)

        # Marca a semana passada inteira (segunda a domingo da semana anterior).
        segunda_passada = HOJE - timedelta(days=HOJE.weekday() + 7)
        for i in range(7):
            c.post(f"/api/habits/{hid}/log", headers=H,
                   json={"date": (segunda_passada + timedelta(days=i)).isoformat(),
                         "completed": True})

        r = c.get("/api/week/recap", headers=H)
        assert r.status_code == 200, r.text
        dados = r.json()
        assert dados["is_last_closed"] is True
        assert dados["current"]["week_start"] == segunda_passada.isoformat()
        assert dados["current"]["days_closed"] == 7
        assert dados["current"]["habits_done"] == 7
        assert dados["current"]["points"] > 0
        assert dados["current"]["best_day"] is not None
        assert dados["previous"]["days_closed"] == 0
        assert "anterior" in dados["verdict"]

    def test_semana_vazia_convida_em_vez_de_cobrar(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "recap2@questly.app")
        _espaco(c, H)
        dados = c.get("/api/week/recap", headers=H).json()
        assert dados["current"]["days_closed"] == 0
        assert "Recomeçar" in dados["verdict"]

    def test_treino_registrado_entra_na_retrospectiva(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "recap3@questly.app")
        gid = _espaco(c, H)
        c.post(f"/api/groups/{gid}/activity-record", headers=H, json={
            "modality": "corrida", "params": {"distance": 7, "duration": 40},
        })

        # A semana corrente é pedida por data, já que o padrão é a última fechada.
        dados = c.get(f"/api/week/recap?week={HOJE.isoformat()}", headers=H).json()
        assert dados["is_last_closed"] is False
        assert dados["current"]["records"] == 1
        assert dados["current"]["distance_km"] == 7.0
        assert dados["current"]["modalities"] == ["corrida"]
