"""Create token_usage_logs table.

Revision ID: 004
Revises: 003
Create Date: 2026-06-15 20:30:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "token_usage_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "team_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("model", sa.String(length=255), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=False),
        sa.Column("output_tokens", sa.Integer(), nullable=False),
        sa.Column(
            "cost_usd",
            sa.Numeric(precision=10, scale=6),
            nullable=False,
        ),
        sa.Column("query_type", sa.String(length=50), nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_token_usage_logs_user_id",
        "token_usage_logs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_token_usage_logs_tenant_id",
        "token_usage_logs",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        "ix_token_usage_logs_team_id",
        "token_usage_logs",
        ["team_id"],
        unique=False,
    )
    op.create_index(
        "ix_token_usage_logs_model",
        "token_usage_logs",
        ["model"],
        unique=False,
    )
    op.create_index(
        "ix_token_usage_logs_query_type",
        "token_usage_logs",
        ["query_type"],
        unique=False,
    )
    op.create_index(
        "ix_token_usage_logs_timestamp",
        "token_usage_logs",
        ["timestamp"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_token_usage_logs_timestamp",
        table_name="token_usage_logs",
    )
    op.drop_index(
        "ix_token_usage_logs_query_type",
        table_name="token_usage_logs",
    )
    op.drop_index(
        "ix_token_usage_logs_model",
        table_name="token_usage_logs",
    )
    op.drop_index(
        "ix_token_usage_logs_team_id",
        table_name="token_usage_logs",
    )
    op.drop_index(
        "ix_token_usage_logs_tenant_id",
        table_name="token_usage_logs",
    )
    op.drop_index(
        "ix_token_usage_logs_user_id",
        table_name="token_usage_logs",
    )
    op.drop_table("token_usage_logs")
