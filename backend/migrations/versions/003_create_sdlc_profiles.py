"""Create sdlc_profiles table

Revision ID: 002
Revises: 001
Create Date: 2026-06-15 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sdlc_profiles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("stack", sa.Text(), nullable=True),
        sa.Column("branching_model", sa.Text(), nullable=True),
        sa.Column("test_framework", sa.Text(), nullable=True),
        sa.Column("coverage_gate", sa.Integer(), nullable=True),
        sa.Column("ci_cd_platform", sa.Text(), nullable=True),
        sa.Column("review_policy", sa.Text(), nullable=True),
        sa.Column("arch_style", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=True, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id"),
    )
    op.create_index(
        op.f("ix_sdlc_profiles_tenant_id"),
        "sdlc_profiles",
        ["tenant_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_sdlc_profiles_tenant_id"), table_name="sdlc_profiles")
    op.drop_table("sdlc_profiles")
