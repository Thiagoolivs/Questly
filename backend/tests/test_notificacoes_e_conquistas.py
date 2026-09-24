"""Notificações que valem a pena e conquistas possíveis.

Três coisas que o app tinha pela metade: o placar não avisava ninguém (só
descobria quem perdeu a posição quem abrisse o app por conta própria), a meta
de água não tinha lembrete nenhum, e as conquistas não olhavam para o espaço —
um grupo de cinco via "Casal Inabalável", que ninguém ali pode desbloquear.
"""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_notif.db")
os.environ.pop("DATABASE_URL", None)

from datetime import date  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import main, scoring  # noqa: E402
from app import push as pushmod  # noqa: E402
from app.data import ACHIEVEMENTS  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _registrar(nome="Pessoa"):
    """Devolve (cabeçalhos, id do usuário) — o id importa para conferir quem
    recebeu qual notificação: o banco do módulo é compartilhado entre testes."""
    email = f"notif{next(_n)}@questly.app"
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": nome, "avatar": ""})
    dados = r.json()
    return {"Authorization": f"Bearer {dados['token']}"}, dados["user"]["id"]


def _usuario(nome="Pessoa"):
    return _registrar(nome)[0]


def _correr(h, gid, km):
    return c.post(f"/api/groups/{gid}/activity-record",
                  json={"modality": "corrida", "category": "fitness",
                        "params": {"distance": km, "duration": km * 6, "intensity": "moderado"}},
                  headers=h)


@pytest.fixture
def avisos(monkeypatch):
    """Coleta os pushes em vez de mandá-los para a rede."""
    enviados = []

    def fake(db, user_id, title, body, url="/"):
        enviados.append({"user_id": user_id, "title": title, "body": body, "url": url})

    monkeypatch.setattr(pushmod, "push_enabled", lambda: True)
    monkeypatch.setattr(pushmod, "send_to_user", fake)
    return enviados


# --- ultrapassagem no placar ------------------------------------------------
def test_avisa_quem_foi_passado(avisos):
    dono = _usuario("Ana Souza")
    g = c.post("/api/groups", json={"name": "Time", "group_type": "group"}, headers=dono).json()
    rival = _usuario("Bruno Lima")
    c.post("/api/groups/join", json={"invite_code": g["invite_code"]}, headers=rival)

    _correr(dono, g["id"], 5)          # Ana sai na frente
    avisos.clear()
    _correr(rival, g["id"], 12)        # Bruno passa

    meus = [a for a in avisos if a["title"].startswith("Bruno")]
    assert len(meus) == 1, avisos
    assert "Bruno passou você" == meus[0]["title"]
    assert "Time" in meus[0]["body"]
    assert meus[0]["url"] == "/grupo"


def test_nao_avisa_quem_continua_na_frente(avisos):
    dono = _usuario("Ana Souza")
    g = c.post("/api/groups", json={"name": "Time", "group_type": "group"}, headers=dono).json()
    rival = _usuario("Bruno Lima")
    c.post("/api/groups/join", json={"invite_code": g["invite_code"]}, headers=rival)

    _correr(dono, g["id"], 20)
    avisos.clear()
    _correr(rival, g["id"], 2)  # não alcança ninguém

    assert [a for a in avisos if "passou" in a["title"]] == []


def test_espaco_individual_nao_avisa(avisos):
    dono = _usuario("Sozinho")
    g = c.post("/api/groups", json={"name": "Eu", "group_type": "individual"}, headers=dono).json()
    avisos.clear()
    _correr(dono, g["id"], 10)

    assert [a for a in avisos if "passou" in a["title"]] == []


def test_push_desligado_nao_quebra_o_registro(monkeypatch):
    monkeypatch.setattr(pushmod, "push_enabled", lambda: False)
    dono = _usuario("Ana")
    g = c.post("/api/groups", json={"name": "Time", "group_type": "group"}, headers=dono).json()
    rival = _usuario("Bruno")
    c.post("/api/groups/join", json={"invite_code": g["invite_code"]}, headers=rival)
    _correr(dono, g["id"], 5)
    assert _correr(rival, g["id"], 12).status_code == 200


# --- lembrete de água -------------------------------------------------------
def _com_inscricao(h, gid):
    r = c.post(
        "/api/push/subscribe",
        json={"endpoint": f"https://exemplo/{next(_n)}",
              "keys": {"p256dh": "chave", "auth": "auth"}},
        headers=h,
    )
    # Sem conferir aqui, um corpo errado deixaria o usuário sem inscrição e os
    # testes de lembrete passariam por não notificar ninguém.
    assert r.status_code == 200, r.text
    return gid


def _quem_recebeu_agua(avisos):
    return {a["user_id"] for a in avisos if a["title"] == "Água"}


def test_lembra_quem_esta_atrasado_e_poupa_quem_bateu_a_meta(avisos):
    atrasado, id_atrasado = _registrar("Atrasado")
    g1 = c.post("/api/groups", json={"name": "A", "group_type": "individual"}, headers=atrasado).json()
    _com_inscricao(atrasado, g1["id"])

    adiantado, id_adiantado = _registrar("Adiantado")
    g2 = c.post("/api/groups", json={"name": "B", "group_type": "individual"}, headers=adiantado).json()
    _com_inscricao(adiantado, g2["id"])
    hoje = date.today().isoformat()
    c.post(f"/api/groups/{g2['id']}/water", json={"date": hoje, "delta_ml": 5000}, headers=adiantado)

    avisos.clear()
    main._run_water_reminders()

    recebeu = _quem_recebeu_agua(avisos)
    assert id_atrasado in recebeu
    assert id_adiantado not in recebeu

    meu = next(a for a in avisos if a["user_id"] == id_atrasado)
    assert meu["url"] == "/nutricao"
    assert "L para sua meta" in meu["body"]


def test_dia_de_descanso_nao_recebe_lembrete_de_agua(avisos):
    h, uid = _registrar("Descansando")
    g = c.post("/api/groups", json={"name": "C", "group_type": "individual"}, headers=h).json()
    _com_inscricao(h, g["id"])
    c.post("/api/rest-days", json={"date": date.today().isoformat(), "reason": "folga"}, headers=h)

    avisos.clear()
    main._run_water_reminders()

    # Outros usuários do módulo seguem inscritos e atrasados; o que importa é
    # que este, em descanso, ficou de fora.
    assert uid not in _quem_recebeu_agua(avisos)


# --- conquistas por espaço --------------------------------------------------
class _Config:
    """Configurações de grupo o suficiente para decidir o que se aplica."""

    def __init__(self, disabled_areas=None, spiritual=True):
        self.disabled_areas = disabled_areas or []
        self.spiritual_enabled = spiritual


def _por_chave(chave):
    return next(a for a in ACHIEVEMENTS if a["key"] == chave)


def test_casal_inabalavel_so_em_casal():
    casal = _por_chave("casal_inabalavel")
    assert scoring.achievement_applies(casal, _Config(), "couple") is True
    assert scoring.achievement_applies(casal, _Config(), "group") is False
    assert scoring.achievement_applies(casal, _Config(), "individual") is False


def test_nenhuma_conquista_depende_dos_habitos_fixos_do_grupo():
    """Hábito é pessoal — e as três conquistas que mediam os "hábitos fixos"
    do grupo nunca poderiam sair, porque nenhuma tela sabia marcá-los."""
    assert not [a for a in ACHIEVEMENTS if a.get("needs_habit")]
    metricas = {a["metric"] for a in ACHIEVEMENTS}
    assert not [m for m in metricas if m.startswith("habit:")]
    assert "all_habits_days" not in metricas


def test_conquista_de_area_some_se_a_area_esta_desligada():
    mental = _por_chave("mente_forte")
    assert scoring.achievement_applies(mental, _Config(), "group") is True
    assert scoring.achievement_applies(mental, _Config(disabled_areas=["Mental"]), "group") is False


def test_equilibrio_exige_as_cinco_areas():
    equilibrio = _por_chave("equilibrio")
    assert scoring.achievement_applies(equilibrio, _Config(), "group") is True
    assert scoring.achievement_applies(equilibrio, _Config(spiritual=False), "group") is False


def test_endpoint_nao_devolve_conquista_impossivel():
    dono = _usuario("Ana")
    g = c.post("/api/groups", json={"name": "Time", "group_type": "group"}, headers=dono).json()
    estado = c.get(f"/api/groups/{g['id']}/state", headers=dono).json()

    lista = c.get(f"/api/groups/{g['id']}/achievements/{estado['me_id']}", headers=dono).json()
    chaves = {a["key"] for a in lista["achievements"]}
    assert "casal_inabalavel" not in chaves
    assert chaves, "sobrou pelo menos uma conquista"


def test_casal_continua_vendo_a_conquista_de_casal():
    dono = _usuario("Ana")
    g = c.post("/api/groups", json={"name": "Nós", "group_type": "couple"}, headers=dono).json()
    estado = c.get(f"/api/groups/{g['id']}/state", headers=dono).json()

    lista = c.get(f"/api/groups/{g['id']}/achievements/{estado['me_id']}", headers=dono).json()
    assert "casal_inabalavel" in {a["key"] for a in lista["achievements"]}
