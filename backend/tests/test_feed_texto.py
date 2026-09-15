"""O texto do feed não repete o autor.

O item do feed desenha o autor em negrito e o texto logo depois. Enquanto o
texto também começava com o nome, saía "Ana Souza Ana Souza registrou corrida".
"""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_feedtxt.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))

NOME = "Ana Souza"


def _auth():
    r = c.post("/api/auth/register", json={
        "email": f"f{next(_n)}@questly.app", "password": "secret123",
        "name": NOME, "avatar": "",
    })
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_texto_do_feed_nao_comeca_com_o_nome():
    H = _auth()
    g = c.post("/api/groups", json={"name": "Time", "group_type": "group"}, headers=H).json()
    c.post(f"/api/groups/{g['id']}/activity-record", headers=H, json={
        "modality": "corrida", "category": "fitness",
        "params": {"distance": 8, "duration": 42, "intensity": "intenso"},
    })

    item = c.get(f"/api/groups/{g['id']}/activities", headers=H).json()["activities"][0]
    assert item["author"] == NOME
    assert not item["text"].startswith(NOME), item["text"]
    assert item["text"].startswith("registrou"), item["text"]


def test_item_do_feed_traz_icone_e_nao_emoji():
    H = _auth()
    g = c.post("/api/groups", json={"name": "Time 2", "group_type": "group"}, headers=H).json()
    c.post(f"/api/groups/{g['id']}/activity-record", headers=H, json={
        "modality": "corrida", "category": "fitness",
        "params": {"distance": 5, "duration": 30},
    })

    item = c.get(f"/api/groups/{g['id']}/activities", headers=H).json()["activities"][0]
    assert item["icon"], "o item precisa trazer um nome de ícone"
    assert item["icon"].isascii(), f"ícone não pode ser emoji: {item['icon']!r}"


def test_reacoes_continuam_com_emoji():
    """As reações do feed são a exceção combinada — elas seguem em emoji."""
    H = _auth()
    g = c.post("/api/groups", json={"name": "Time 3", "group_type": "group"}, headers=H).json()
    tipos = c.get(f"/api/groups/{g['id']}/activities", headers=H).json()["reaction_types"]
    assert len(tipos) == 6
    for t in tipos:
        assert t["emoji"] and not t["emoji"].isascii(), t
