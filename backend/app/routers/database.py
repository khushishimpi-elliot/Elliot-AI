from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.database import (
    DatabaseConnectRequest,
    DatabaseConnectResponse,
    DatabaseQueryLogsResponse,
    DatabaseSchemaResponse,
    QueryLog,
    TableSchema,
    VectorIndexSchema,
)
from app.services.connectors.database import DatabaseConnector
from app.services.oauth import decrypt_token, encrypt_token

router = APIRouter(tags=["database"])

VECTOR_PROVIDERS = {"pinecone", "weaviate", "qdrant"}


@router.post("/{tenant_id}/connect", response_model=DatabaseConnectResponse)
async def connect_database(
    tenant_id: UUID,
    payload: DatabaseConnectRequest,
    db: AsyncSession = Depends(get_db),
) -> DatabaseConnectResponse:
    try:
        connector = DatabaseConnector(payload.connection_string)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    reachable = await connector.test_connection()
    if not reachable:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not connect to {connector.provider} database."
                " Check your connection string."
            ),
        )

    encrypted = encrypt_token(payload.connection_string)

    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == connector.provider)
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.oauth_token = encrypted
        existing.status = "connected"
    else:
        db.add(
            Connector(
                tenant_id=tenant_id,
                provider=connector.provider,
                status="connected",
                oauth_token=encrypted,
            )
        )

    await db.commit()
    return DatabaseConnectResponse(
        status="connected",
        provider=connector.provider,
        message=f"Successfully connected to {connector.provider} database.",
    )


@router.get("/{tenant_id}/schema", response_model=DatabaseSchemaResponse)
async def get_database_schema(
    tenant_id: UUID,
    provider: str,
    db: AsyncSession = Depends(get_db),
) -> DatabaseSchemaResponse:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == provider)
            & (Connector.status == "connected")
        )
    )
    record = result.scalar_one_or_none()
    if not record or not record.oauth_token:
        raise HTTPException(
            status_code=404,
            detail=f"{provider} connector not found or not connected",
        )

    connection_string = decrypt_token(record.oauth_token)
    connector = DatabaseConnector(connection_string)

    try:
        raw = await connector.get_schema()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    is_vector = provider in VECTOR_PROVIDERS
    return DatabaseSchemaResponse(
        provider=provider,
        tables=[TableSchema(**t) for t in raw] if not is_vector else None,
        indexes=[VectorIndexSchema(**i) for i in raw] if is_vector else None,
        retrieved_at=datetime.now(UTC).isoformat(),
    )


@router.get("/{tenant_id}/query-logs", response_model=DatabaseQueryLogsResponse)
async def get_query_logs(
    tenant_id: UUID,
    provider: str,
    db: AsyncSession = Depends(get_db),
) -> DatabaseQueryLogsResponse:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == provider)
            & (Connector.status == "connected")
        )
    )
    record = result.scalar_one_or_none()
    if not record or not record.oauth_token:
        raise HTTPException(
            status_code=404,
            detail=f"{provider} connector not found or not connected",
        )

    connection_string = decrypt_token(record.oauth_token)
    connector = DatabaseConnector(connection_string)

    try:
        raw = await connector.get_query_logs()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return DatabaseQueryLogsResponse(
        provider=provider,
        logs=[QueryLog(**q) for q in raw],
        retrieved_at=datetime.now(UTC).isoformat(),
    )
