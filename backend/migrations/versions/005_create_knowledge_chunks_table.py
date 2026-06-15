"""Create knowledge_chunks table for RAG.

Revision ID: 005
Revises: 004
Create Date: 2026-06-15 20:45:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "knowledge_chunks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("source", sa.String(length=500), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("chunk_type", sa.String(length=50), nullable=True),
        sa.Column("chunk_name", sa.String(length=255), nullable=True),
        sa.Column("start_line", sa.Integer(), nullable=True),
        sa.Column("end_line", sa.Integer(), nullable=True),
        sa.Column("language", sa.String(length=50), nullable=True),
        sa.Column(
            "embedding",
            postgresql.Vector(dim=1536),
            nullable=False,
        ),
        sa.Column("char_count", sa.Integer(), nullable=False),
        sa.Column("token_estimate", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_knowledge_chunks_tenant_id",
        "knowledge_chunks",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        "ix_knowledge_chunks_source",
        "knowledge_chunks",
        ["source"],
        unique=False,
    )
    op.create_index(
        "ix_knowledge_chunks_created_at",
        "knowledge_chunks",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_knowledge_chunks_created_at",
        table_name="knowledge_chunks",
    )
    op.drop_index(
        "ix_knowledge_chunks_source",
        table_name="knowledge_chunks",
    )
    op.drop_index(
        "ix_knowledge_chunks_tenant_id",
        table_name="knowledge_chunks",
    )
    op.drop_table("knowledge_chunks")
