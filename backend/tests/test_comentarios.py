"""Comentários no feed, convivendo com as reações."""
import os
import tempfile

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_coment.db")
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import init_db  # noqa: E402

init_db()
c = TestClient(app)
_n = iter(range(1000))


def _auth(nome="Pessoa"):
    r = c.post("/api/auth/register", json={
        "email": f"c{next(_n)}@questly.app", "password": "secret123",
        "name": nome, "avatar": "",
    })
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _grupo_com_item():
    """Grupo com dois membros e um item no feed."""
    dono = _auth("Dono")
    g = c.post("/api/groups", json={"name": "Turma", "group_type": "group"}, headers=dono).json()
    outro = _auth("Outro")
    c.post("/api/groups/join", json={"invite_code": g["invite_code"]}, headers=outro)

    r = c.post(f"/api/groups/{g['id']}/activity-record", headers=dono, json={
        "modality": "corrida", "category": "fitness",
        "params": {"distance": 5, "duration": 30, "intensity": "moderado"},
    })
    assert r.status_code == 200, r.text
    feed = c.get(f"/api/groups/{g['id']}/activities", headers=dono).json()
    return g, dono, outro, feed["activities"][0]


def test_feed_traz_comentarios_junto():
    g, dono, outro, item = _grupo_com_item()
    assert item["comments"] == [], "item novo não tem comentário"

    r = c.post(f"/api/groups/{g['id']}/activities/{item['id']}/comments",
               headers=outro, json={"text": "Boa! Que ritmo foi esse?"})
    assert r.status_code == 200, r.text
    assert len(r.json()["comments"]) == 1
    assert r.json()["comments"][0]["author"] == "Outro"

    feed = c.get(f"/api/groups/{g['id']}/activities", headers=dono).json()
    assert len(feed["activities"][0]["comments"]) == 1


def test_comentario_e_reacao_convivem():
    g, dono, outro, item = _grupo_com_item()
    c.post(f"/api/groups/{g['id']}/activities/{item['id']}/comments",
           headers=outro, json={"text": "Arrasou"})
    c.post(f"/api/groups/{g['id']}/activities/{item['id']}/react",
           headers=outro, json={"reaction": "forca"})

    feed = c.get(f"/api/groups/{g['id']}/activities", headers=dono).json()
    atual = feed["activities"][0]
    assert len(atual["comments"]) == 1
    assert atual["reactions"]["total"] == 1


def test_ordem_cronologica():
    g, dono, outro, item = _grupo_com_item()
    for texto in ["primeiro", "segundo", "terceiro"]:
        c.post(f"/api/groups/{g['id']}/activities/{item['id']}/comments",
               headers=dono, json={"text": texto})
    comentarios = c.get(f"/api/groups/{g['id']}/activities/{item['id']}/comments",
                        headers=dono).json()["comments"]
    assert [x["text"] for x in comentarios] == ["primeiro", "segundo", "terceiro"]


def test_so_o_autor_apaga_o_proprio_comentario():
    g, dono, outro, item = _grupo_com_item()
    meu = c.post(f"/api/groups/{g['id']}/activities/{item['id']}/comments",
                 headers=outro, json={"text": "meu comentário"}).json()["comments"][0]

    alheio = c.delete(f"/api/groups/{g['id']}/activities/{item['id']}/comments/{meu['id']}",
                      headers=dono)
    assert alheio.status_code == 403

    proprio = c.delete(f"/api/groups/{g['id']}/activities/{item['id']}/comments/{meu['id']}",
                       headers=outro)
    assert proprio.status_code == 200
    assert proprio.json()["comments"] == []


def test_quem_nao_e_do_grupo_nao_comenta():
    g, dono, outro, item = _grupo_com_item()
    estranho = _auth("Estranho")
    r = c.post(f"/api/groups/{g['id']}/activities/{item['id']}/comments",
               headers=estranho, json={"text": "oi"})
    assert r.status_code in (403, 404)


def test_texto_vazio_e_recusado():
    g, dono, outro, item = _grupo_com_item()
    assert c.post(f"/api/groups/{g['id']}/activities/{item['id']}/comments",
                  headers=dono, json={"text": "   "}).status_code in (400, 422)


def test_comentar_item_de_outro_grupo_e_recusado():
    g1, dono1, _, item1 = _grupo_com_item()
    g2, dono2, _, _ = _grupo_com_item()
    r = c.post(f"/api/groups/{g2['id']}/activities/{item1['id']}/comments",
               headers=dono2, json={"text": "invasão"})
    assert r.status_code == 404
