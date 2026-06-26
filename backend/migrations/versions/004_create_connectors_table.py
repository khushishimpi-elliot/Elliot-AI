"""Create connectors table for OAuth integrations

Revision ID: 003
Revises: 002
Create Date: 2026-06-15 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "connectors",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="not_connected"),
        sa.Column("oauth_token", sa.Text(), nullable=True),
        sa.Column("oauth_refresh_token", sa.Text(), nullable=True),
        sa.Column("scopes", sa.ARRAY(sa.String()), nullable=True, server_default="{}"),
        sa.Column("last_synced", sa.TIMESTAMP(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=True, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_connectors_tenant_id"),
        "connectors",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_connectors_provider"),
        "connectors",
        ["provider"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_connectors_provider"), table_name="connectors")
    op.drop_index(op.f("ix_connectors_tenant_id"), table_name="connectors")
    op.drop_table("connectors")
