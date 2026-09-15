"""Add phase 4: rest_days (descanso planejado)

Revision ID: a1b2c3d4e5f6
Revises: 34171315a808
Create Date: 2026-09-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '34171315a808'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'rest_days',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(length=120), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'date', name='uq_user_rest_date'),
    )
    op.create_index(op.f('ix_rest_days_user_id'), 'rest_days', ['user_id'], unique=False)
    op.create_index(op.f('ix_rest_days_date'), 'rest_days', ['date'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_rest_days_date'), table_name='rest_days')
    op.drop_index(op.f('ix_rest_days_user_id'), table_name='rest_days')
    op.drop_table('rest_days')
