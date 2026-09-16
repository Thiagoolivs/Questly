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
        "google_sub": "VARCHAR(64)",
        "altura_cm": "FLOAT",
        "sexo": "VARCHAR(1)",
        "idade": "INTEGER",
        "nivel_atividade": "VARCHAR(20)",
        "objetivo_tipo": "VARCHAR(10)",
        "meta_kcal": "INTEGER",
        "meta_proteina_g": "INTEGER",
        "meta_carbo_g": "INTEGER",
        "meta_gordura_g": "INTEGER",
        "meta_agua_l": "FLOAT",
    },
    "day_entries": {
        "challenge_proofs": "JSON",
        "challenge_rerolls": "JSON",
        "challenge_together": "JSON",
        "habit_proofs": "JSON",
        "moods": "JSON",
        "mood_note": "TEXT",
        "water_ml": "INTEGER",
    },
    "settings": {
        "timezone": "VARCHAR(40)",
        "challenge_pool": "JSON",
        "challenge_pool_updated": "TIMESTAMP",
        "custom_challenges": "JSON",
        "disabled_areas": "JSON",
        # Janela do desafio com hora. Ficam nulas nos grupos antigos; o backend
        # deriva a janela de start_date + duration_days enquanto for o caso.
        "challenge_start": "TIMESTAMP",
        "challenge_end": "TIMESTAMP",
    },
    "activities": {
        "image": "TEXT",
        "ref": "VARCHAR(40)",
        "day": "DATE",
        # O feed desenha ícone em vez de emoji; a coluna emoji fica para os
        # itens já publicados não perderem o que mostravam.
        "icon": "VARCHAR(24)",
    },
    "task_completions": {
        "image": "TEXT",
    },
    "joint_activities": {
        "icon": "VARCHAR(24)",
    },
    "scheduled_tasks": {
        "time": "VARCHAR(5)",
    },
}

# Colunas do modelo antigo de desafio (1 diário + surpresa), agora obsoletas.
# No Postgres elas eram NOT NULL sem default do servidor, então quebrariam os
# inserts do novo modelo — por isso são removidas quando existirem.
_OBSOLETE_COLUMNS = {
    "day_entries": ["daily_done", "surprise_done", "daily_proof", "surprise_proof"],
}


def _missing_from_models(insp, existing: set) -> dict[str, dict[str, str]]:
    """Colunas que as models esperam e o banco ainda não tem, derivadas do metadata.

    Mantida à mão, esta lista esquece colunas novas em silêncio — e o sintoma só
    aparece em produção, num SELECT que quebra a tela inteira. Derivar do
    metadata faz qualquer coluna nova ser criada sem ninguém precisar lembrar.
    """
    out: dict[str, dict[str, str]] = {}
    for table_name, table in Base.metadata.tables.items():
        if table_name not in existing:
            continue  # tabela nova: o create_all cria inteira
        have = {c["name"] for c in insp.get_columns(table_name)}
        for col in table.columns:
            if col.name in have:
                continue
            try:
                ddl = col.type.compile(dialect=engine.dialect)
            except Exception:
                continue  # tipo que o dialeto não sabe emitir: cai no dict manual
            # Sempre NULL: uma coluna NOT NULL sem default não pode ser
            # acrescentada a uma tabela que já tem linhas.
            out.setdefault(table_name, {})[col.name] = ddl
    return out


def _ensure_columns() -> None:
    insp = inspect(engine)
    existing = set(insp.get_table_names())

    # O dict manual vem por último e vence: ele existe para os casos em que o
    # DDL precisa ser diferente do que o tipo da model emitiria.
    planned = _missing_from_models(insp, existing)
    for table, columns in _NEW_COLUMNS.items():
        if table in existing:
            have = {c["name"] for c in insp.get_columns(table)}
            for name, ddl in columns.items():
                if name not in have:
                    planned.setdefault(table, {})[name] = ddl

    with engine.begin() as conn:
        for table, columns in planned.items():
            for name, ddl in columns.items():
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
                print(f"[schema] {table}.{name} adicionada ({ddl})")

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


def _relabel_water_habit() -> None:
    """Renomeia o hábito de água ('Beber 2,5L de água' → 'Bater a meta de água
    diária') nos grupos já existentes. Idempotente: só toca no rótulo antigo."""
    from sqlalchemy.orm import Session

    from .models import Settings

    old, new = "Beber 2,5L de água", "Bater a meta de água diária"
    try:
        with Session(engine) as s:
            changed = False
            for st in s.query(Settings).all():
                fh = st.fixed_habits or []
                new_fh = [
                    {**h, "label": new} if (isinstance(h, dict) and h.get("key") == "agua" and h.get("label") == old) else h
                    for h in fh
                ]
                if new_fh != fh:
                    st.fixed_habits = new_fh
                    changed = True
            if changed:
                s.commit()
    except Exception:
        pass  # cosmético; não pode derrubar o startup


def init_db() -> None:
    """Garante o schema novo. Reseta apenas na primeira migração para o novo modelo."""
    tables = set(inspect(engine).get_table_names())
    if "users" not in tables:
        _reset_legacy_schema()
    Base.metadata.create_all(bind=engine)
    _ensure_columns()
    _relabel_water_habit()
