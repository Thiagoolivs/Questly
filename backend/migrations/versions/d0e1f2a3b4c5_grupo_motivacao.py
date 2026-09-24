"""Cutucada, meta coletiva e post do próprio app

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-09-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd0e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'activities',
        sa.Column('system', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_table(
        'nudges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('from_membership_id', sa.Integer(), nullable=False),
        sa.Column('to_membership_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('kind', sa.String(length=12), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id']),
        sa.ForeignKeyConstraint(['from_membership_id'], ['memberships.id']),
        sa.ForeignKeyConstraint(['to_membership_id'], ['memberships.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('from_membership_id', 'to_membership_id', 'date', name='uq_nudge_dia'),
    )
    op.create_index('ix_nudges_group_id', 'nudges', ['group_id'])
    op.create_index('ix_nudges_date', 'nudges', ['date'])
    op.create_table(
        'group_targets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('icon', sa.String(length=24), nullable=True),
        sa.Column('metric', sa.String(length=12), nullable=False),
        sa.Column('target', sa.Float(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id']),
        sa.ForeignKeyConstraint(['created_by'], ['memberships.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_group_targets_group_id', 'group_targets', ['group_id'])


def downgrade() -> None:
    op.drop_table('group_targets')
    op.drop_table('nudges')
    op.drop_column('activities', 'system')
