"""Create tenants table

Revision ID: 003
Revises: (none — must run before 001 which has FK to tenants.id)
Create Date: 2026-06-15 00:00:00.000000
"""
import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("domain", sa.Text(), nullable=False),
        sa.Column("team_size", sa.Text(), nullable=True),
        sa.Column("residency", sa.Text(), nullable=False, server_default="US"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("tenants")
