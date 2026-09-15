"""Planos de treino estruturados (IA)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-15
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'training_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('modality', sa.String(length=40), nullable=False),
        sa.Column('goal', sa.String(length=200), nullable=True),
        sa.Column('level', sa.String(length=20), nullable=False),
        sa.Column('days_per_week', sa.Integer(), nullable=False),
        sa.Column('weeks', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=10), nullable=False),
        sa.Column('status', sa.String(length=12), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_training_plans_user_id'), 'training_plans', ['user_id'], unique=False)

    op.create_table(
        'training_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('week', sa.Integer(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('focus', sa.String(length=80), nullable=True),
        sa.Column('duration_min', sa.Integer(), nullable=True),
        sa.Column('items', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=12), nullable=False),
        sa.Column('scheduled_date', sa.Date(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['plan_id'], ['training_plans.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_training_sessions_plan_id'), 'training_sessions', ['plan_id'], unique=False)
    op.create_index(op.f('ix_training_sessions_user_id'), 'training_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_training_sessions_scheduled_date'), 'training_sessions', ['scheduled_date'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_training_sessions_scheduled_date'), table_name='training_sessions')
    op.drop_index(op.f('ix_training_sessions_user_id'), table_name='training_sessions')
    op.drop_index(op.f('ix_training_sessions_plan_id'), table_name='training_sessions')
    op.drop_table('training_sessions')
    op.drop_index(op.f('ix_training_plans_user_id'), table_name='training_plans')
    op.drop_table('training_plans')
