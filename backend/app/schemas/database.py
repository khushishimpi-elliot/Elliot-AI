from pydantic import BaseModel


class DatabaseConnectRequest(BaseModel):
    connection_string: str


class DatabaseConnectResponse(BaseModel):
    status: str
    provider: str
    message: str


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    is_primary_key: bool
    foreign_key: str | None


class TableSchema(BaseModel):
    table_name: str
    columns: list[ColumnInfo]


class VectorIndexSchema(BaseModel):
    index_name: str
    dimensions: int | None
    vector_count: int | None
    metric: str | None


class QueryLog(BaseModel):
    query: str
    calls: int | None
    total_time_ms: float | None
    last_call: str | None


class DatabaseSchemaResponse(BaseModel):
    provider: str
    tables: list[TableSchema] | None
    indexes: list[VectorIndexSchema] | None
    retrieved_at: str


class DatabaseQueryLogsResponse(BaseModel):
    provider: str
    logs: list[QueryLog]
    retrieved_at: str
