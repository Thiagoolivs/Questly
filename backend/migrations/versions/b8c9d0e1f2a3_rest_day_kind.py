"""Distingue descanso planejado de dia resgatado

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-09-23

O resgate ("salvei seu dia") é limitado por mês; a folga marcada com
antecedência não é. Sem separar os dois, contar quantos resgates restam
obrigaria a adivinhar pela data de criação.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, Sequence[str], None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'rest_days',
        sa.Column('kind', sa.String(length=10), nullable=False, server_default='planned'),
    )


def downgrade() -> None:
    op.drop_column('rest_days', 'kind')
