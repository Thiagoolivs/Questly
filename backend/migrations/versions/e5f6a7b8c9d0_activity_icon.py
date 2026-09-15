"""Ícone no item do feed (emoji sai da interface)

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-15

O feed desenhava um emoji guardado em activities.emoji. Com o emoji restrito às
reações e ao chat, o item passa a guardar um nome de ícone — que não cabe em
String(8). A coluna antiga fica para os itens já publicados.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('activities', sa.Column('icon', sa.String(length=24), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('activities', 'icon')
