"""add is_admin column to users

Revision ID: a7ec4b85038e
Revises: 002_add_user_garage_vehicles
Create Date: 2026-07-27 14:11:46.376395
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7ec4b85038e'
down_revision: Union[str, None] = '002_add_user_garage_vehicles'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_admin column as nullable with default False
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=True, server_default=sa.false()))
    
    # Update existing rows to have is_admin = False
    op.execute("UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL")
    
    # Make the column non-nullable
    op.alter_column('users', 'is_admin', nullable=False, server_default=sa.false())


def downgrade() -> None:
    op.drop_column('users', 'is_admin')