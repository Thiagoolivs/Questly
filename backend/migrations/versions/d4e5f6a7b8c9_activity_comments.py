"""Comentários no feed

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-15
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'activity_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('membership_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(length=500), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ),
        sa.ForeignKeyConstraint(['membership_id'], ['memberships.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_activity_comments_activity_id'), 'activity_comments', ['activity_id'], unique=False)
    op.create_index(op.f('ix_activity_comments_membership_id'), 'activity_comments', ['membership_id'], unique=False)
    op.create_index(op.f('ix_activity_comments_created_at'), 'activity_comments', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_activity_comments_created_at'), table_name='activity_comments')
    op.drop_index(op.f('ix_activity_comments_membership_id'), table_name='activity_comments')
    op.drop_index(op.f('ix_activity_comments_activity_id'), table_name='activity_comments')
    op.drop_table('activity_comments')
