"""Janela do desafio do grupo (início e fim com hora)

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-15

O desafio passa a ter data/hora de início e término em vez de só uma contagem
de dias. Grupos já existentes ficam com as colunas nulas e o backend deriva a
janela de start_date + duration_days, então nada precisa ser preenchido à mão.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('settings', sa.Column('challenge_start', sa.DateTime(), nullable=True))
    op.add_column('settings', sa.Column('challenge_end', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('settings', 'challenge_end')
    op.drop_column('settings', 'challenge_start')
