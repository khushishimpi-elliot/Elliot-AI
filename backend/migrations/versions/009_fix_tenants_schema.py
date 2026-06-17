"""Fix tenants table schema - rename columns and add missing fields

Revision ID: 009
Revises: 008
Create Date: 2026-06-17 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("tenants", "name", new_column_name="org_name")
    op.alter_column("tenants", "residency", new_column_name="data_residency")

    op.add_column("tenants", sa.Column("stack", sa.Text(), nullable=True))
    op.add_column(
        "tenants",
        sa.Column("sdlc_profile", sa.JSON(), nullable=True, server_default="{}"),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "status",
            sa.Text(),
            nullable=False,
            server_default="provisioning",
        ),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_column("tenants", "updated_at")
    op.drop_column("tenants", "status")
    op.drop_column("tenants", "sdlc_profile")
    op.drop_column("tenants", "stack")

    op.alter_column("tenants", "data_residency", new_column_name="residency")
    op.alter_column("tenants", "org_name", new_column_name="name")
