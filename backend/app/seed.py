"""Criação de tabelas, migração leve e dados iniciais (idempotente)."""
from datetime import date

from sqlalchemy import inspect, text

from .data import DEFAULT_HABITS
from .database import Base, SessionLocal, engine
from .models import Player, Settings

# Colunas adicionadas depois da v1 — garantidas em bancos já existentes.
_NEW_COLUMNS = {
    "day_entries": {
        "mood": "VARCHAR(16)",
        "daily_proof": "TEXT",
        "surprise_proof": "TEXT",
    },
}


def _ensure_columns() -> None:
    """ALTER TABLE ADD COLUMN para colunas ausentes (SQLite e Postgres)."""
    insp = inspect(engine)
    existing_tables = set(insp.get_table_names())
    with engine.begin() as conn:
        for table, columns in _NEW_COLUMNS.items():
            if table not in existing_tables:
                continue
            have = {c["name"] for c in insp.get_columns(table)}
            for name, ddl in columns.items():
                if name not in have:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


def init_db() -> None:
    """Cria as tabelas, migra colunas novas e semeia dados iniciais, se vazio."""
    Base.metadata.create_all(bind=engine)
    _ensure_columns()

    db = SessionLocal()
    try:
        if db.get(Settings, 1) is None:
            db.add(Settings(
                id=1,
                start_date=date.today(),
                duration_days=30,
                fixed_habits=DEFAULT_HABITS,
            ))

        if db.query(Player).count() == 0:
            db.add_all([
                Player(name="Jogador 1", avatar="🦊", objetivo="Evoluir todo dia"),
                Player(name="Jogador 2", avatar="🐨", objetivo="Constância acima de tudo"),
            ])

        db.commit()
    finally:
        db.close()
