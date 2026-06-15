"""Create organisations, roles, and members tables

Revision ID: 001
Revises:
Create Date: 2026-06-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'organisations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('org_name', sa.Text(), nullable=False),
        sa.Column('domain', sa.Text(), nullable=False),
        sa.Column('team_size', sa.Text(), nullable=True),
        sa.Column('data_residency', sa.Text(), nullable=True, server_default='US'),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_organisations_tenant_id'), 'organisations', ['tenant_id'], unique=False)

    op.create_table(
        'roles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('permissions', sa.JSON(), nullable=True, server_default='{}'),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roles_tenant_id'), 'roles', ['tenant_id'], unique=False)

    op.create_table(
        'members',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role_id', sa.UUID(), nullable=False),
        sa.Column('joined_at', sa.TIMESTAMP(), nullable=True, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.true()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_members_tenant_id'), 'members', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_members_user_id'), 'members', ['user_id'], unique=False)
    op.create_index(op.f('ix_members_role_id'), 'members', ['role_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_members_role_id'), table_name='members')
    op.drop_index(op.f('ix_members_user_id'), table_name='members')
    op.drop_index(op.f('ix_members_tenant_id'), table_name='members')
    op.drop_table('members')

    op.drop_index(op.f('ix_roles_tenant_id'), table_name='roles')
    op.drop_table('roles')

    op.drop_index(op.f('ix_organisations_tenant_id'), table_name='organisations')
    op.drop_table('organisations')
