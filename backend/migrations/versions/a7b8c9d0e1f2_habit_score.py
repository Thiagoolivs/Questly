"""Pontos de constância (hábitos, rotinas e sequência) no score competitivo

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-09-23

Cumprir hábito e fechar rotina não pontuava: o ranking só via treino
registrado. A coluna separa esses pontos do esforço para que a tela consiga
dizer de onde veio cada ponto — e para que apagar um log derrube só a parcela
dele.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'competitive_scores',
        sa.Column('habit_score', sa.Float(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    op.drop_column('competitive_scores', 'habit_score')
