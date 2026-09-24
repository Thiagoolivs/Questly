"""Hábito é pessoal, e conquista pessoal pode ir para o grupo quando a pessoa quer.

Os "hábitos fixos" do grupo eram configuráveis e nenhuma tela sabia marcá-los:
duplicavam o conceito e travavam o dia perfeito, que exigia todos cumpridos.
Já o progresso pessoal acontecia todo em silêncio — o feed só sabia de treino
registrado e desafio cumprido.
"""
import os
import tempfile
from datetime import date, datetime, timedelta

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_share.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app import models as m  # noqa: E402
from app import scoring  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

HOJE = date.today()


def _auth(c, email, nome="Tester"):
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": nome, "avatar": ""})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _espaco(c, headers, nome="Espaço", tipo="group"):
    r = c.post("/api/groups", json={"name": nome, "group_type": tipo}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _envelhecer(tabela, dias: int) -> None:
    with SessionLocal() as db:
        for row in db.query(tabela).all():
            row.created_at = datetime.utcnow() - timedelta(days=dias)
        db.commit()


def _feed(c, headers, gid):
    return c.get(f"/api/groups/{gid}/activities", headers=headers).json()["activities"]


class TestHabitoEhPessoal:
    def test_configuracoes_do_grupo_nao_falam_mais_de_habito(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "cfg@questly.app")
        gid = _espaco(c, H)

        cfg = c.get(f"/api/groups/{gid}/settings", headers=H).json()
        assert "fixed_habits" not in cfg
        assert "habits_menu" not in cfg

        # E mandar hábito fixo não faz nada: o campo deixou de existir.
        r = c.put(f"/api/groups/{gid}/settings", headers=H,
                  json={"fixed_habits": [{"key": "agua", "label": "Água"}]})
        assert r.status_code == 200, r.text
        assert "fixed_habits" not in r.json()

    def test_marcar_habito_do_grupo_nao_existe_mais(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "toggle@questly.app")
        gid = _espaco(c, H)
        r = c.post(f"/api/groups/{gid}/day/toggle", headers=H,
                   json={"date": HOJE.isoformat(), "habit_key": "agua"})
        # 405: o caminho ainda casa com o GET de /day/{mid}, mas POST não existe
        # mais. O que importa é que marcar hábito de grupo não é mais possível.
        assert r.status_code == 405

    def test_dia_perfeito_nao_depende_mais_de_habito_do_grupo(self):
        """Antes `perfect` exigia todos os hábitos fixos cumpridos. Como ninguém
        conseguia marcá-los, o dia perfeito — e o bônus — eram inalcançáveis."""
        class _Cfg:
            disabled_areas = ["Mental", "Social", "Relação", "Espiritual"]
            spiritual_enabled = False
            rest_days = []
            challenge_pool = {}
            custom_challenges = {}
            start_date = HOJE
            duration_days = 30
            challenge_start = None
            challenge_end = None

        class _Entry:
            habits_done = []
            habit_proofs = {}
            challenge_rerolls = {}
            challenge_together = {}
            moods = []
            mood_note = None

        cfg = _Cfg()
        areas = scoring.active_categories(cfg)
        entry = _Entry()
        entry.challenge_proofs = {cat: "data:image/png;base64,x" for cat in areas}

        dia = scoring.compute_day(cfg, entry, HOJE)
        assert dia["perfect"] is True, "fechar as áreas tem de bastar para o dia perfeito"
        assert dia["perfect_bonus"] > 0
        assert dia["completion_pct"] == 100, "o máximo do dia não pode incluir ponto inalcançável"


class TestCompartilharConquista:
    def _com_sequencia(self, c, email):
        H = _auth(c, email)
        gid = _espaco(c, H)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 30)
        for i in range(3):
            c.post(f"/api/habits/{hid}/log", headers=H,
                   json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})
        return H, gid

    def test_sequencia_vai_para_o_feed_quando_a_pessoa_pede(self):
        init_db()
        c = TestClient(app)
        H, gid = self._com_sequencia(c, "share1@questly.app")

        antes = len(_feed(c, H, gid))
        r = c.post(f"/api/groups/{gid}/share", json={"kind": "streak"}, headers=H)
        assert r.status_code == 200, r.text
        assert "3 dias seguidos" in r.json()["text"]

        itens = _feed(c, H, gid)
        assert len(itens) == antes + 1
        assert "3 dias seguidos" in itens[0]["text"]

    def test_compartilhar_duas_vezes_nao_enche_o_feed(self):
        init_db()
        c = TestClient(app)
        H, gid = self._com_sequencia(c, "share2@questly.app")

        c.post(f"/api/groups/{gid}/share", json={"kind": "streak"}, headers=H)
        depois_do_primeiro = len(_feed(c, H, gid))
        c.post(f"/api/groups/{gid}/share", json={"kind": "streak"}, headers=H)
        assert len(_feed(c, H, gid)) == depois_do_primeiro

    def test_nao_da_para_inventar_conquista(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "share3@questly.app")
        gid = _espaco(c, H)

        # Conquista que existe mas não saiu.
        travada = c.post(f"/api/groups/{gid}/share", headers=H,
                         json={"kind": "achievement", "ref": "p_cem_dias"})
        assert travada.status_code == 400 and "ainda não saiu" in travada.text

        # Chave que não existe.
        inventada = c.post(f"/api/groups/{gid}/share", headers=H,
                           json={"kind": "achievement", "ref": "p_sou_o_melhor"})
        assert inventada.status_code == 404

        # Sequência que não existe.
        sem_corrente = c.post(f"/api/groups/{gid}/share", json={"kind": "streak"}, headers=H)
        assert sem_corrente.status_code == 400

    def test_o_texto_e_do_servidor_e_o_recado_e_da_pessoa(self):
        init_db()
        c = TestClient(app)
        H, gid = self._com_sequencia(c, "share4@questly.app")

        r = c.post(f"/api/groups/{gid}/share", headers=H,
                   json={"kind": "streak", "message": "bora junto"})
        texto = r.json()["text"]
        assert texto.startswith("está em 3 dias seguidos")
        assert texto.endswith("— bora junto")

    def test_sessao_de_treino_so_vai_depois_de_concluida(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "share5@questly.app")
        gid = _espaco(c, H)

        with SessionLocal() as db:
            user = db.query(m.User).filter(m.User.email == "share5@questly.app").one()
            plano = m.TrainingPlan(user_id=user.id, modality="corrida", weeks=1, days_per_week=1)
            db.add(plano)
            db.flush()
            db.add(m.TrainingSession(plan_id=plano.id, user_id=user.id, week=1, order=0,
                                     title="Tiro curto", items=[{"name": "8x400m", "done": False}]))
            db.commit()
            sid = db.query(m.TrainingSession).filter(m.TrainingSession.plan_id == plano.id).one().id

        pendente = c.post(f"/api/groups/{gid}/share", headers=H,
                          json={"kind": "session", "ref": str(sid)})
        assert pendente.status_code == 400 and "ainda não foi concluída" in pendente.text

        c.put(f"/api/training/sessions/{sid}", json={"status": "done"}, headers=H)
        feita = c.post(f"/api/groups/{gid}/share", headers=H,
                       json={"kind": "session", "ref": str(sid)})
        assert feita.status_code == 200, feita.text
        assert "Tiro curto" in feita.json()["text"]

    def test_sessao_de_outra_pessoa_nao_se_compartilha(self):
        init_db()
        c = TestClient(app)
        dono = _auth(c, "dono-sessao@questly.app")
        gid = _espaco(c, dono, "Dupla")
        codigo = c.get("/api/groups", headers=dono).json()["groups"][0]["invite_code"]
        outro = _auth(c, "outro-sessao@questly.app")
        c.post("/api/groups/join", json={"invite_code": codigo}, headers=outro)

        with SessionLocal() as db:
            user = db.query(m.User).filter(m.User.email == "dono-sessao@questly.app").one()
            plano = m.TrainingPlan(user_id=user.id, modality="yoga", weeks=1, days_per_week=1)
            db.add(plano)
            db.flush()
            db.add(m.TrainingSession(plan_id=plano.id, user_id=user.id, week=1, order=0,
                                     title="Alongar", items=[], status="done"))
            db.commit()
            sid = db.query(m.TrainingSession).filter(m.TrainingSession.plan_id == plano.id).one().id

        r = c.post(f"/api/groups/{gid}/share", headers=outro,
                   json={"kind": "session", "ref": str(sid)})
        assert r.status_code == 404

    def test_opcoes_so_trazem_o_que_existe_de_verdade(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "opcoes1@questly.app")
        gid = _espaco(c, H)

        vazio = c.get(f"/api/groups/{gid}/share/options", headers=H).json()
        assert vazio["options"] == []
        assert vazio["auto_share"] is False

        H2, gid2 = self._com_sequencia(c, "opcoes2@questly.app")
        cheio = c.get(f"/api/groups/{gid2}/share/options", headers=H2).json()["options"]
        tipos = {o["kind"] for o in cheio}
        assert "streak" in tipos and "day" in tipos
        assert any(o["kind"] == "achievement" for o in cheio)


class TestPostagemAutomatica:
    def test_desligada_por_padrao(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "auto1@questly.app")
        gid = _espaco(c, H)
        hid = c.post("/api/habits", json={"name": "Ler"}, headers=H).json()["id"]

        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": True},
               headers=H)
        assert _feed(c, H, gid) == [], "nada pode ir ao feed sem a pessoa pedir"

    def test_ligada_publica_o_fecho_do_dia_e_atualiza_no_lugar(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "auto2@questly.app")
        gid = _espaco(c, H)
        assert c.put(f"/api/groups/{gid}/auto-share", json={"auto_share": True},
                     headers=H).json()["auto_share"] is True

        um = c.post("/api/habits", json={"name": "Ler"}, headers=H).json()["id"]
        dois = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]

        c.post(f"/api/habits/{um}/log", json={"date": HOJE.isoformat(), "completed": True}, headers=H)
        itens = _feed(c, H, gid)
        assert len(itens) == 1 and "1 hábito" in itens[0]["text"]

        c.post(f"/api/habits/{dois}/log", json={"date": HOJE.isoformat(), "completed": True}, headers=H)
        itens = _feed(c, H, gid)
        assert len(itens) == 1, "o dia é um item só, não uma fila de avisos"
        assert "2 hábitos" in itens[0]["text"]

    def test_desligar_para_de_publicar(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "auto3@questly.app")
        gid = _espaco(c, H)
        c.put(f"/api/groups/{gid}/auto-share", json={"auto_share": True}, headers=H)
        c.put(f"/api/groups/{gid}/auto-share", json={"auto_share": False}, headers=H)

        hid = c.post("/api/habits", json={"name": "Ler"}, headers=H).json()["id"]
        c.post(f"/api/habits/{hid}/log", json={"date": HOJE.isoformat(), "completed": True},
               headers=H)
        assert _feed(c, H, gid) == []


class TestSequenciaNoRanking:
    def test_ranking_mostra_a_sequencia_do_meu_dia(self):
        init_db()
        c = TestClient(app)
        H = _auth(c, "rank@questly.app")
        gid = _espaco(c, H)
        hid = c.post("/api/habits", json={"name": "Correr"}, headers=H).json()["id"]
        _envelhecer(m.Habit, 30)
        for i in range(4):
            c.post(f"/api/habits/{hid}/log", headers=H,
                   json={"date": (HOJE - timedelta(days=i)).isoformat(), "completed": True})

        eu = c.get(f"/api/groups/{gid}/ranking", headers=H).json()["me"]
        assert eu["streak"] == 4, "a sequência do grupo é a mesma que a Home mostra"
        assert eu["challenge_streak"] == 0
