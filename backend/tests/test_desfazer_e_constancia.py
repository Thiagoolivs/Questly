"""Desfazer e constância.

Duas coisas que faltavam e andam juntas: cumprir hábito/rotina tem de pontuar,
e tudo que pontua tem de poder ser desfeito devolvendo exatamente o que deu.
"""
import os
import tempfile
from datetime import date, datetime, timedelta

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_undo.db")
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


def _espaco(c, headers, nome):
    r = c.post("/api/groups", json={"name": nome}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _meus_pontos(c, headers, gid):
    linha = c.get(f"/api/groups/{gid}/ranking", headers=headers).json()["me"]
    return linha["total_score"], linha["habit_score"]


def _envelhecer(tabela, dias: int) -> None:
    """Recua o created_at das linhas — hábito só é cobrado a partir do dia em
    que foi criado, então testar sequência exige que ele já existisse antes."""
    with SessionLocal() as db:
        for row in db.query(tabela).all():
            row.created_at = datetime.utcnow() - timedelta(days=dias)
        db.commit()


class TestPontosDeHabito:
    def test_cumprir_habito_pontua_e_desmarcar_devolve(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "habito@questly.app")
        gid = _espaco(c, H, "Constância")

        hid = c.post("/api/habits", json={"name": "Beber água"}, headers=H).json()["id"]
        zero, _ = _meus_pontos(c, H, gid)

        r = c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": True},
                   headers=H)
        assert r.status_code == 200, r.text
        assert r.json()["points"] > 0, "hábito cumprido tem de render alguma coisa"

        depois, constancia = _meus_pontos(c, H, gid)
        assert depois > zero
        assert constancia > 0

        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": False},
               headers=H)
        voltou, constancia_final = _meus_pontos(c, H, gid)
        assert voltou == zero, "desmarcar tem de devolver o ponto inteiro"
        assert constancia_final == 0

    def test_rotina_fechada_vale_mais_que_um_habito(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "rotina@questly.app")
        gid = _espaco(c, H, "Rotinas")

        rot = c.post("/api/routines", headers=H, json={
            "name": "Manhã",
            "frequency": {"type": "daily", "days": []},
            "steps": [{"name": "Água", "order": 0}, {"name": "Alongar", "order": 1}],
        }).json()
        passos = [p["id"] for p in rot["steps"]]

        c.post(f"/api/routines/{rot['id']}/log", headers=H,
               json={"date": HOJE.isoformat(), "step_id": passos[0], "done": True})
        parcial, _ = _meus_pontos(c, H, gid)
        assert parcial == 0, "rotina pela metade não fecha, então não pontua"

        r = c.post(f"/api/routines/{rot['id']}/log", headers=H,
                   json={"date": HOJE.isoformat(), "step_id": passos[1], "done": True})
        assert r.json()["completed"] is True
        assert r.json()["points"] > 0

        fechada, _ = _meus_pontos(c, H, gid)
        assert fechada > parcial

        # Desmarcar um passo reabre a rotina e leva os pontos junto.
        c.post(f"/api/routines/{rot['id']}/log", headers=H,
               json={"date": HOJE.isoformat(), "step_id": passos[1], "done": False})
        assert _meus_pontos(c, H, gid)[0] == 0

    def test_xp_pessoal_tambem_sobe_e_desce_com_o_habito(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "xp@questly.app")
        _espaco(c, H, "XP")
        hid = c.post("/api/habits", json={"name": "Ler"}, headers=H).json()["id"]

        antes = c.get("/api/today", headers=H).json()["summary"]["xp"]
        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": True},
               headers=H)
        assert c.get("/api/today", headers=H).json()["summary"]["xp"] > antes

        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": False},
               headers=H)
        assert c.get("/api/today", headers=H).json()["summary"]["xp"] == antes


class TestSequencia:
    def test_dias_seguidos_viram_sequencia_e_marco_paga_bonus(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "streak@questly.app")
        gid = _espaco(c, H, "Sequência")
        hid = c.post("/api/habits", json={"name": "Treinar"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 30)

        for i in range(3):
            dia = (HOJE - timedelta(days=i)).isoformat()
            c.post(f"/api/habits/{hid}/log", json={"date": dia, "completed": True}, headers=H)

        dia = c.get("/api/today", headers=H).json()["summary"]
        assert dia["streak"] == 3
        assert dia["streak_bonus"] > 0, "o marco de 3 dias tem de pagar alguma coisa"
        assert dia["next_milestone"]["days"] > 3

        # O bônus está dentro do placar, não é só enfeite de tela.
        total, constancia = _meus_pontos(c, H, gid)
        assert constancia >= dia["streak_bonus"]

        # Quebrar a corrente no meio derruba a sequência e o bônus junto.
        c.post(f"/api/habits/{hid}/log", headers=H,
               json={"date": (HOJE - timedelta(days=1)).isoformat(), "completed": False})
        assert c.get("/api/today", headers=H).json()["summary"]["streak"] == 1
        assert _meus_pontos(c, H, gid)[1] < constancia

    def test_descanso_planejado_atravessa_a_sequencia(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "descanso@questly.app")
        _espaco(c, H, "Descanso")
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 30)

        for i in (0, 2, 3):
            c.post(f"/api/habits/{hid}/log", headers=H,
                   json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})
        # Sem o descanso, o buraco de ontem corta a corrente em 1.
        assert c.get("/api/today", headers=H).json()["summary"]["streak"] == 1

        c.post("/api/rest-days", headers=H,
               json={"date": (HOJE - timedelta(days=1)).isoformat(), "reason": "Folga"})
        assert c.get("/api/today", headers=H).json()["summary"]["streak"] == 3

    def test_habito_novo_nao_apaga_a_sequencia_ja_construida(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "novohabito@questly.app")
        _espaco(c, H, "Novo hábito")
        antigo = c.post("/api/habits", json={"name": "Água"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 30)
        for i in range(3):
            c.post(f"/api/habits/{antigo}/log", headers=H,
                   json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})
        assert c.get("/api/today", headers=H).json()["summary"]["streak"] == 3

        # Criar um hábito hoje reabre o dia de HOJE (tem pendência nova), mas não
        # pode reprovar retroativamente os dias já fechados: a corrente de ontem
        # para trás continua de pé, e fechar o novo hábito devolve os 3.
        novo = c.post("/api/habits", json={"name": "Meditar"}, headers=H).json()["id"]
        assert c.get("/api/today", headers=H).json()["summary"]["streak"] == 2

        c.post(f"/api/habits/{novo}/log", headers=H,
               json={"date": HOJE.isoformat(), "completed": True})
        assert c.get("/api/today", headers=H).json()["summary"]["streak"] == 3


class TestDesfazerRegistro:
    def test_apagar_registro_devolve_xp_e_pontos(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "apagar@questly.app")
        gid = _espaco(c, H, "Registros")

        antes = c.get("/api/today", headers=H).json()["summary"]["xp"]
        r = c.post(f"/api/groups/{gid}/activity-record", headers=H, json={
            "modality": "corrida", "category": "fitness",
            "params": {"distance": 5, "duration": 30, "intensity": "moderado"},
        })
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        assert c.get("/api/today", headers=H).json()["summary"]["xp"] > antes
        assert _meus_pontos(c, H, gid)[0] > 0

        assert c.delete(f"/api/groups/{gid}/activity-record/{rid}", headers=H).status_code == 200
        assert c.get("/api/today", headers=H).json()["summary"]["xp"] == antes
        assert _meus_pontos(c, H, gid)[0] == 0
        assert c.get("/api/today", headers=H).json()["records"] == []

    def test_apagar_registro_tira_do_feed(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "feedrec@questly.app")
        gid = _espaco(c, H, "Feed")
        rid = c.post(f"/api/groups/{gid}/activity-record", headers=H, json={
            "modality": "caminhada", "params": {"duration": 30, "intensity": "leve"},
        }).json()["id"]
        assert c.get(f"/api/groups/{gid}/activities", headers=H).json()["activities"]

        c.delete(f"/api/groups/{gid}/activity-record/{rid}", headers=H)
        assert c.get(f"/api/groups/{gid}/activities", headers=H).json()["activities"] == []

    def test_registro_dos_outros_nao_se_apaga(self):
        init_db()
        c = TestClient(app)
        dono = _auth(c, "dono@questly.app")
        gid = _espaco(c, dono, "Compartilhado")
        codigo = c.get("/api/groups", headers=dono).json()["groups"][0]["invite_code"]

        outro = _auth(c, "outro@questly.app")
        c.post("/api/groups/join", json={"invite_code": codigo}, headers=outro)

        rid = c.post(f"/api/groups/{gid}/activity-record", headers=dono, json={
            "modality": "yoga", "params": {"duration": 40, "intensity": "leve"},
        }).json()["id"]
        assert c.delete(f"/api/groups/{gid}/activity-record/{rid}", headers=outro).status_code == 403


class TestDesfazerPublicacao:
    def test_apagar_a_propria_publicacao_leva_comentarios_junto(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "post@questly.app")
        gid = _espaco(c, H, "Mural")
        c.post(f"/api/groups/{gid}/activity-record", headers=H, json={
            "modality": "danca", "params": {"duration": 30, "intensity": "moderado"},
        })
        aid = c.get(f"/api/groups/{gid}/activities", headers=H).json()["activities"][0]["id"]
        c.post(f"/api/groups/{gid}/activities/{aid}/comments", json={"text": "boa!"}, headers=H)

        assert c.delete(f"/api/groups/{gid}/activities/{aid}", headers=H).status_code == 200
        assert c.get(f"/api/groups/{gid}/activities", headers=H).json()["activities"] == []
        with SessionLocal() as db:
            assert db.query(m.ActivityComment).filter(
                m.ActivityComment.activity_id == aid).count() == 0

    def test_publicacao_dos_outros_nao_se_apaga(self):
        init_db()
        c = TestClient(app)
        dono = _auth(c, "donopost@questly.app")
        gid = _espaco(c, dono, "Dois")
        codigo = c.get("/api/groups", headers=dono).json()["groups"][0]["invite_code"]
        outro = _auth(c, "outropost@questly.app")
        c.post("/api/groups/join", json={"invite_code": codigo}, headers=outro)

        c.post(f"/api/groups/{gid}/activity-record", headers=dono, json={
            "modality": "yoga", "params": {"duration": 20, "intensity": "leve"},
        })
        aid = c.get(f"/api/groups/{gid}/activities", headers=dono).json()["activities"][0]["id"]
        assert c.delete(f"/api/groups/{gid}/activities/{aid}", headers=outro).status_code == 403

    def test_apagar_a_propria_mensagem_do_chat(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "chat@questly.app")
        gid = _espaco(c, H, "Chat")
        mid = c.post(f"/api/groups/{gid}/messages", json={"text": "oi"}, headers=H).json()["id"]

        assert c.delete(f"/api/groups/{gid}/messages/{mid}", headers=H).status_code == 200
        assert c.get(f"/api/groups/{gid}/messages", headers=H).json()["messages"] == []


class TestProntos:
    def test_catalogo_vem_com_habitos_rotinas_e_compromissos(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "prontos@questly.app")
        r = c.get("/api/presets", headers=H)
        assert r.status_code == 200, r.text
        catalogo = r.json()
        assert len(catalogo["habits"]) >= 10
        assert len(catalogo["routines"]) >= 5
        assert catalogo["activities"] and catalogo["goals"]
        # Rotina pronta tem de vir com passos, senão não é rotina.
        assert all(r["steps"] for r in catalogo["routines"])

    def test_adicionar_varios_prontos_de_uma_vez_sem_duplicar(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "bulk@questly.app")
        catalogo = c.get("/api/presets", headers=H).json()
        escolhidos = [
            {k: v for k, v in h.items() if k != "key"} for h in catalogo["habits"][:3]
        ]

        r = c.post("/api/habits/bulk", json={"habits": escolhidos}, headers=H)
        assert r.status_code == 200, r.text
        assert r.json()["created"] == 3

        repetido = c.post("/api/habits/bulk", json={"habits": escolhidos}, headers=H).json()
        assert repetido["created"] == 0 and repetido["skipped"] == 3
        assert len(c.get("/api/habits", headers=H).json()["habits"]) == 3

    def test_rotina_pronta_entra_inteira_pelo_endpoint_normal(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "rotinapronta@questly.app")
        pronta = c.get("/api/presets", headers=H).json()["routines"][0]

        r = c.post("/api/routines", headers=H, json={
            "name": pronta["name"],
            "category": pronta["category"],
            "time_slot": pronta["time_slot"],
            "frequency": pronta["frequency"],
            "steps": [
                {**p, "order": i} for i, p in enumerate(pronta["steps"])
            ],
        })
        assert r.status_code == 200, r.text
        assert len(r.json()["steps"]) == len(pronta["steps"])


class TestDesfazerDemaisTelas:
    def test_refeicao_apagada_pode_voltar_igual(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "refeicao@questly.app")
        gid = _espaco(c, H, "Comida")

        prato = {"date": HOJE.isoformat(), "label": "Almoço", "calories": 600,
                 "protein_g": 40, "carbs_g": 60, "fat_g": 20}
        r = c.post(f"/api/groups/{gid}/meals/manual", json=prato, headers=H)
        assert r.status_code == 200, r.text
        mid = r.json()["meal"]["id"]
        assert r.json()["nutrition"]["calories"] == 600

        c.delete(f"/api/groups/{gid}/meals/{mid}", headers=H)
        assert c.get(f"/api/groups/{gid}/meals", headers=H).json()["calories"] == 0

        # O caminho de volta recria com os mesmos valores — é o que sustenta o
        # "Desfazer" da tela: pela foto, a IA estimaria outro número.
        volta = c.post(f"/api/groups/{gid}/meals/manual", json=prato, headers=H)
        assert volta.json()["meal"]["calories"] == 600

    def test_sessao_de_treino_fecha_e_reabre(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "sessao@questly.app")
        _espaco(c, H, "Treino")

        with SessionLocal() as db:
            user = db.query(m.User).filter(m.User.email == "sessao@questly.app").one()
            plano = m.TrainingPlan(user_id=user.id, modality="corrida", weeks=1, days_per_week=1)
            db.add(plano)
            db.flush()
            db.add(m.TrainingSession(
                plan_id=plano.id, user_id=user.id, week=1, order=0, title="Tiro curto",
                items=[{"name": "8x400m", "done": False}, {"name": "Solto", "done": False}],
            ))
            db.commit()
            sid = db.query(m.TrainingSession).filter(m.TrainingSession.plan_id == plano.id).one().id

        feito = c.put(f"/api/training/sessions/{sid}", json={"status": "done"}, headers=H)
        assert feito.status_code == 200, feito.text
        assert feito.json()["status"] == "done"
        assert all(x["done"] for x in feito.json()["items"])
        assert feito.json()["plan"]["progress"]["done"] == 1

        reaberta = c.put(f"/api/training/sessions/{sid}", json={"status": "pending"}, headers=H)
        assert reaberta.json()["status"] == "pending"
        # Reabrir desmarca tudo: sessão "pendente" com todos os itens marcados
        # seria um estado que a tela não sabe desenhar.
        assert not any(x["done"] for x in reaberta.json()["items"])
        assert reaberta.json()["plan"]["progress"]["done"] == 0

    def test_apagar_habito_leva_o_historico_e_os_pontos(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "apagarhabito@questly.app")
        gid = _espaco(c, H, "Limpeza")
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": True}, headers=H)
        assert _meus_pontos(c, H, gid)[1] > 0

        c.delete(f"/api/habits/{hid}", headers=H)
        assert _meus_pontos(c, H, gid)[1] == 0
        with SessionLocal() as db:
            assert db.query(m.HabitLog).filter(m.HabitLog.habit_id == hid).count() == 0

    def test_pausar_habito_preserva_o_passado(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "pausar@questly.app")
        gid = _espaco(c, H, "Pausa")
        hid = c.post("/api/habits", json={"name": "Ler"}, headers=H).json()["id"]
        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": True}, headers=H)
        pontos = _meus_pontos(c, H, gid)[1]

        # Pausar é a alternativa a apagar: o hábito sai do dia, o histórico fica.
        c.put(f"/api/habits/{hid}", json={"active": False}, headers=H)
        assert c.get("/api/today", headers=H).json()["habits"] == []
        assert _meus_pontos(c, H, gid)[1] == pontos


class TestAvisoDeSequencia:
    """O lembrete da noite vira o aviso mais útil que o app tem: o que se perde."""

    def _usuario(self, c, email):
        H = _auth(c, email)
        _espaco(c, H, "Aviso")
        with SessionLocal() as db:
            return H, db.query(m.User).filter(m.User.email == email).one().id

    def test_sem_sequencia_nao_ha_aviso_especial(self):
        init_db()
        c = TestClient(app)
        from app.main import _aviso_de_sequencia

        H, uid = self._usuario(c, "aviso1@questly.app")
        hid = c.post("/api/habits", json={"name": "Treinar"}, headers=H).json()["id"]
        with SessionLocal() as db:
            assert _aviso_de_sequencia(db, uid, HOJE) is None

        # Um dia só de corrente ainda não dá o que perder.
        c.post(f"/api/habits/{hid}/log", headers=H,
               json={"date": (HOJE - timedelta(days=1)).isoformat(), "completed": True})
        with SessionLocal() as db:
            assert _aviso_de_sequencia(db, uid, HOJE) is None

    def test_sequencia_em_risco_diz_quanto_falta(self):
        init_db()
        c = TestClient(app)
        from app.main import _aviso_de_sequencia

        H, uid = self._usuario(c, "aviso2@questly.app")
        hid = c.post("/api/habits", json={"name": "Treinar"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 30)
        for i in (1, 2, 3):
            c.post(f"/api/habits/{hid}/log", headers=H,
                   json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})

        with SessionLocal() as db:
            titulo, corpo = _aviso_de_sequencia(db, uid, HOJE)
        assert "3 dias seguidos" in titulo
        assert "1 item" in corpo

    def test_dia_ja_fechado_nao_recebe_cobranca(self):
        init_db()
        c = TestClient(app)
        from app.main import _aviso_de_sequencia

        H, uid = self._usuario(c, "aviso3@questly.app")
        hid = c.post("/api/habits", json={"name": "Treinar"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 30)
        for i in (0, 1, 2, 3):
            c.post(f"/api/habits/{hid}/log", headers=H,
                   json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})

        with SessionLocal() as db:
            assert _aviso_de_sequencia(db, uid, HOJE) is None

    def test_descanso_planejado_nao_recebe_cobranca(self):
        init_db()
        c = TestClient(app)
        from app.main import _aviso_de_sequencia

        H, uid = self._usuario(c, "aviso4@questly.app")
        hid = c.post("/api/habits", json={"name": "Treinar"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 30)
        for i in (1, 2, 3):
            c.post(f"/api/habits/{hid}/log", headers=H,
                   json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})
        c.post("/api/rest-days", json={"date": HOJE.isoformat(), "reason": "Folga"}, headers=H)

        with SessionLocal() as db:
            assert _aviso_de_sequencia(db, uid, HOJE) is None
