"""Add user_garage_vehicles table

Revision ID: 002_add_user_garage_vehicles
Revises: 001_add_users_and_user_id
Create Date: 2025-07-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_add_user_garage_vehicles"
down_revision: Union[str, None] = "001_add_users_and_user_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_garage_vehicles",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(32),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("brand", sa.String(50), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("engine", sa.String(100), nullable=True, server_default=""),
        sa.Column("transmission", sa.String(50), nullable=True, server_default=""),
        sa.Column("fuel_type", sa.String(50), nullable=True, server_default=""),
        sa.Column("mileage_km", sa.Integer(), nullable=True),
        sa.Column("price_usd", sa.Numeric(12, 2), nullable=True),
        sa.Column("body_type", sa.String(50), nullable=True, server_default=""),
        sa.Column("drive", sa.String(50), nullable=True, server_default=""),
        sa.Column("condition", sa.String(50), nullable=True, server_default=""),
        sa.Column("color", sa.String(50), nullable=True, server_default=""),
        sa.Column("cylinders", sa.Integer(), nullable=True),
        sa.Column("passengers", sa.Integer(), nullable=True),
        sa.Column("consumption", sa.String(50), nullable=True, server_default=""),
        sa.Column("notes", sa.Text(), nullable=True, server_default=""),
        sa.Column(
            "added_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_user_garage_vehicles_user_id",
        "user_garage_vehicles",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_garage_vehicles_user_id", table_name="user_garage_vehicles")
    op.drop_table("user_garage_vehicles")
