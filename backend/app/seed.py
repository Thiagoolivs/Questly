"""Criação/ inicialização do schema (idempotente).

A Fase 1 (auth + grupos) troca o modelo antigo (2 jogadores fixos) por um modelo
multi-tenant. Como a decisão de produto foi "começar limpo", na primeira subida
do schema novo derrubamos as tabelas antigas incompatíveis e recriamos. Isso
roda uma única vez: assim que a tabela ``users`` existe, nunca mais dropa nada,
então os dados persistem normalmente entre deploys.
"""
from sqlalchemy import inspect, text

from . import models  # noqa: F401  (registra as tabelas no Base.metadata)
from .database import Base, engine

# Colunas aditivas do schema novo, garantidas em bancos já existentes
# (ALTER TABLE ADD COLUMN funciona em SQLite e Postgres).
_NEW_COLUMNS = {
    "users": {
        "photo": "TEXT",
    },
    "day_entries": {
        "challenge_proofs": "JSON",
        "challenge_rerolls": "JSON",
        "challenge_together": "JSON",
        "moods": "JSON",
        "mood_note": "TEXT",
    },
}

# Colunas do modelo antigo de desafio (1 diário + surpresa), agora obsoletas.
# No Postgres elas eram NOT NULL sem default do servidor, então quebrariam os
# inserts do novo modelo — por isso são removidas quando existirem.
_OBSOLETE_COLUMNS = {
    "day_entries": ["daily_done", "surprise_done", "daily_proof", "surprise_proof"],
}


def _ensure_columns() -> None:
    insp = inspect(engine)
    existing = set(insp.get_table_names())
    with engine.begin() as conn:
        for table, columns in _NEW_COLUMNS.items():
            if table not in existing:
                continue
            have = {c["name"] for c in insp.get_columns(table)}
            for name, ddl in columns.items():
                if name not in have:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))

        for table, columns in _OBSOLETE_COLUMNS.items():
            if table not in existing:
                continue
            have = {c["name"] for c in insp.get_columns(table)}
            for name in columns:
                if name in have:
                    try:
                        conn.execute(text(f"ALTER TABLE {table} DROP COLUMN {name}"))
                    except Exception:
                        pass  # SQLite antigo pode não suportar DROP COLUMN; não é crítico


def _reset_legacy_schema() -> None:
    """Derruba tabelas antigas/ incompatíveis. Só chamado quando não há schema novo."""
    # Ordem filho→pai para respeitar as FKs sem precisar de CASCADE.
    ordered = [
        "messages",
        "day_entries",
        "settings",
        "memberships",
        "groups",
        "users",
        "players",  # tabela legada (modelo antigo)
    ]
    with engine.begin() as conn:
        for table in ordered:
            conn.execute(text(f"DROP TABLE IF EXISTS {table}"))


def init_db() -> None:
    """Garante o schema novo. Reseta apenas na primeira migração para o novo modelo."""
    tables = set(inspect(engine).get_table_names())
    if "users" not in tables:
        _reset_legacy_schema()
    Base.metadata.create_all(bind=engine)
    _ensure_columns()
