"""Create teams table

Revision ID: 008
Revises: 007
Create Date: 2026-06-17 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "teams",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("repos", sa.JSON(), nullable=True, server_default="[]"),
        sa.Column("members", sa.JSON(), nullable=True, server_default="[]"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_teams_tenant_id"),
        "teams",
        ["tenant_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_teams_tenant_id"), table_name="teams")
    op.drop_table("teams")
