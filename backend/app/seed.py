"""Criação/ inicialização do schema (idempotente).

A Fase 1 (auth + grupos) troca o modelo antigo (2 jogadores fixos) por um modelo
multi-tenant. Como a decisão de produto foi "começar limpo", na primeira subida
do schema novo derrubamos as tabelas antigas incompatíveis e recriamos. Isso
roda uma única vez: assim que a tabela ``users`` existe, nunca mais dropa nada,
então os dados persistem normalmente entre deploys.
"""
from sqlalchemy import inspect, text

from .database import Base, engine


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
