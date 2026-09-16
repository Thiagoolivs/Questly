"""O banco existente tem de chegar completo depois do init_db.

Isto quebrou em produção: uma coluna nova (activities.icon) ficou de fora da
lista mantida à mão — havia duas entradas "activities" no mesmo dicionário e a
segunda descartava a primeira em silêncio. Todo SELECT em activities passou a
falhar, derrubando o feed e a Home de quem já tinha banco.
"""
import os
import tempfile

import pytest
from sqlalchemy import inspect, text

os.environ["QUESTLY_DB"] = os.path.join(tempfile.mkdtemp(), "test_schema.db")
os.environ.pop("DATABASE_URL", None)

from app import models  # noqa: E402,F401
from app.database import Base, engine  # noqa: E402
from app.seed import _NEW_COLUMNS, init_db  # noqa: E402


def _lacunas() -> dict[str, list[str]]:
    """Colunas que as models esperam e o banco não tem."""
    insp = inspect(engine)
    existentes = set(insp.get_table_names())
    out = {}
    for nome, tabela in Base.metadata.tables.items():
        if nome not in existentes:
            out[nome] = ["<tabela inteira>"]
            continue
        tem = {c["name"] for c in insp.get_columns(nome)}
        faltam = [c.name for c in tabela.columns if c.name not in tem]
        if faltam:
            out[nome] = faltam
    return out


def test_banco_novo_nasce_completo():
    init_db()
    assert _lacunas() == {}


def test_coluna_que_falta_num_banco_antigo_e_criada():
    """Simula o banco de quem já usava o app antes da coluna existir."""
    init_db()
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE activities DROP COLUMN icon"))
    assert "icon" in _lacunas().get("activities", []), "o cenário não foi montado"

    init_db()
    assert _lacunas() == {}, "init_db precisa fechar a lacuna sozinho"


def test_init_db_e_idempotente():
    for _ in range(3):
        init_db()
    assert _lacunas() == {}


def test_lista_manual_nao_tem_chave_repetida():
    """Chave repetida num dict literal descarta a anterior sem avisar."""
    fonte = open(os.path.join(os.path.dirname(__file__), "..", "app", "seed.py"), encoding="utf-8").read()
    import ast

    for no in ast.walk(ast.parse(fonte)):
        if isinstance(no, ast.Assign) and getattr(no.targets[0], "id", "") == "_NEW_COLUMNS":
            chaves = [k.value for k in no.value.keys]
            repetidas = [c for c in set(chaves) if chaves.count(c) > 1]
            assert not repetidas, f"chaves repetidas em _NEW_COLUMNS: {repetidas}"
            return
    pytest.fail("_NEW_COLUMNS não encontrado")


def test_feed_responde_num_banco_sem_a_coluna_nova():
    """O sintoma real: feed com 500 porque activities.icon não existia."""
    from fastapi.testclient import TestClient

    from app.main import app

    init_db()
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE activities DROP COLUMN icon"))
    init_db()  # o deploy roda isto na subida

    c = TestClient(app)
    r = c.post("/api/auth/register", json={
        "email": "schema@questly.app", "password": "secret123", "name": "Schema", "avatar": "",
    })
    H = {"Authorization": f"Bearer {r.json()['token']}"}
    g = c.post("/api/groups", json={"name": "Time", "group_type": "group"}, headers=H).json()

    assert c.get(f"/api/groups/{g['id']}/activities", headers=H).status_code == 200
    assert c.get(f"/api/groups/{g['id']}/state", headers=H).status_code == 200
