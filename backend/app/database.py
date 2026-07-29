"""Configuração do banco.

- Em produção (ex: Railway) defina ``DATABASE_URL`` para usar Postgres — o dado
  persiste entre deploys.
- Sem ``DATABASE_URL``, usa SQLite local (``QUESTLY_DB`` define o caminho; aponte
  para um volume persistente no Railway se quiser manter o SQLite entre deploys).
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Railway/Heroku entregam "postgres://"; o SQLAlchemy 2 quer o driver explícito.
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    DB_PATH = os.getenv("QUESTLY_DB", os.path.join(os.path.dirname(__file__), "..", "questly.db"))
    engine = create_engine(
        f"sqlite:///{os.path.abspath(DB_PATH)}",
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base declarativa das models."""


def get_db():
    """Dependency do FastAPI: abre e fecha a sessão por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
