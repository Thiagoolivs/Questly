"""Placar do grupo — o que a tela competitiva precisa ler.

A tela lia campos que o endpoint nunca devolveu (`id`, `stats.total`,
`stats.streak`), então mostrava zeros e "0 pessoas". Estes testes fixam o
contrato: posição, distância para quem está na frente e quem sou eu.
"""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_ranking.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _usuario(nome):
    email = f"placar{next(_n)}@questly.app"
    r = c.post("/api/auth/register",
               json={"email": email, "password": "secret123", "name": nome, "avatar": ""})
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _correr(h, gid, km):
    return c.post(f"/api/groups/{gid}/activity-record",
                  json={"modality": "corrida", "category": "fitness",
                        "params": {"distance": km, "duration": km * 6, "intensity": "moderado"}},
                  headers=h)


def _grupo_com(pontuacoes, tipo="group"):
    """Cria um grupo e coloca cada pessoa a correr a distância pedida."""
    dono = _usuario("Dono")
    g = c.post("/api/groups", json={"name": "Time", "group_type": tipo}, headers=dono).json()
    gid, codigo = g["id"], g["invite_code"]
    cabecalhos = [dono]
    _correr(dono, gid, pontuacoes[0])
    for i, km in enumerate(pontuacoes[1:], start=1):
        h = _usuario(f"Pessoa {i}")
        c.post("/api/groups/join", json={"invite_code": codigo}, headers=h)
        _correr(h, gid, km)
        cabecalhos.append(h)
    return gid, cabecalhos


def test_ranking_ordena_e_numera_posicoes():
    gid, (dono, *_) = _grupo_com([4, 10, 7])
    d = c.get(f"/api/groups/{gid}/ranking", headers=dono).json()

    pontos = [r["total_score"] for r in d["ranking"]]
    assert pontos == sorted(pontos, reverse=True)
    assert [r["position"] for r in d["ranking"]] == [1, 2, 3]


def test_distancia_e_para_quem_esta_logo_a_frente():
    gid, (dono, *_) = _grupo_com([4, 10, 7])
    linhas = c.get(f"/api/groups/{gid}/ranking", headers=dono).json()["ranking"]

    assert linhas[0]["gap_to_next"] == 0
    for anterior, atual in zip(linhas, linhas[1:]):
        assert atual["gap_to_next"] == anterior["total_score"] - atual["total_score"]
        assert atual["gap_to_leader"] == linhas[0]["total_score"] - atual["total_score"]


def test_cada_pessoa_se_ve_na_propria_linha():
    gid, cabecalhos = _grupo_com([4, 10, 7])
    for h in cabecalhos:
        d = c.get(f"/api/groups/{gid}/ranking", headers=h).json()
        marcados = [r for r in d["ranking"] if r["is_me"]]
        assert len(marcados) == 1
        assert d["me"]["membership_id"] == marcados[0]["membership_id"]


def test_periodo_em_portugues():
    gid, (dono, *_) = _grupo_com([5])
    d = c.get(f"/api/groups/{gid}/ranking", headers=dono).json()
    meses = ("janeiro", "fevereiro", "março", "abril", "maio", "junho",
             "julho", "agosto", "setembro", "outubro", "novembro", "dezembro")
    assert d["period"].split(" de ")[0] in meses
    assert d["days_left"] >= 0


def test_espaco_de_uma_pessoa_nao_e_competitivo():
    # Sem ninguém contra quem competir, a tela troca o placar por progresso.
    gid, (dono, *_) = _grupo_com([5], tipo="individual")
    assert c.get(f"/api/groups/{gid}/ranking", headers=dono).json()["competitive"] is False


def test_grupo_com_duas_pessoas_e_competitivo():
    gid, (dono, *_) = _grupo_com([5, 8])
    d = c.get(f"/api/groups/{gid}/ranking", headers=dono).json()
    assert d["competitive"] is True
    assert d["total_score"] == sum(r["total_score"] for r in d["ranking"])


def test_estado_do_grupo_traz_regras_e_contagem():
    # A tela do grupo lê o grupo daqui; sem `rules` ela escondia o convite e
    # sem `member_count` mostrava "0 pessoas".
    gid, (dono, *_) = _grupo_com([5, 8, 3])
    grupo = c.get(f"/api/groups/{gid}/state", headers=dono).json()["group"]
    assert grupo["member_count"] == 3
    assert grupo["rules"]["invite"] is True
    assert grupo["rules"]["ranking"] is True
    assert grupo["invite_code"]
