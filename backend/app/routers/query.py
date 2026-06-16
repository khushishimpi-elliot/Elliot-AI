import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.token_usage import TokenUsageLog
from app.schemas.query import (
    QueryRequest,
    QueryResponse,
    SourceUsage,
    TokenUsage,
)
from app.services.orchestration.graph import build_graph
from app.services.orchestration.state import AgentState
from app.services.token_logger import calculate_cost

router = APIRouter(tags=["query"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=QueryResponse)
async def query_endpoint(
    request: QueryRequest,
    db: AsyncSession = Depends(get_db),
) -> QueryResponse:
    """Main query endpoint — ask Elliot a question"""
    try:
        logger.info(
            f"Query from user {request.user_id}: {request.query[:100]}"
        )

        # Build the graph with database context
        elliot_graph = build_graph(db)

        # Initialize state
        initial_state: AgentState = {
            "query": request.query,
            "tenant_id": request.tenant_id,
            "user_id": request.user_id,
            "team_id": request.team_id,
            "repo": request.repo,
            "branch": request.branch,
            "needs_code": False,
            "needs_jira": False,
            "needs_slack": False,
            "needs_docs": False,
            "query_type": "general",
            "code_chunks": [],
            "jira_tickets": [],
            "slack_messages": [],
            "sdlc_profile": None,
            "prompt": None,
            "response": None,
            "input_tokens": 0,
            "output_tokens": 0,
            "error": None,
        }

        # Run the graph
        result = await elliot_graph.ainvoke(initial_state)

        # Check for errors
        if result.get("error"):
            logger.error(f"Error in orchestration: {result['error']}")
            raise HTTPException(
                status_code=500,
                detail=f"Query processing failed: {result['error']}",
            )

        if not result.get("response"):
            raise HTTPException(
                status_code=500,
                detail="No response generated",
            )

        # Calculate cost
        cost = calculate_cost(
            "claude-sonnet-4-6",
            result["input_tokens"],
            result["output_tokens"],
        )

        # Build response
        response = QueryResponse(
            response=result["response"],
            query_type=result["query_type"],
            sources_used=SourceUsage(
                code_chunks=len(result["code_chunks"]),
                jira_tickets=len(result["jira_tickets"]),
                slack_messages=len(result["slack_messages"]),
            ),
            tokens=TokenUsage(
                input=result["input_tokens"],
                output=result["output_tokens"],
                cost_usd=cost,
            ),
        )

        logger.info(
            f"Query completed: {result['input_tokens']} input, "
            f"{result['output_tokens']} output tokens"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in query endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Query processing failed: {str(e)}",
        ) from e


@router.get("/history")
async def query_history(
    user_id: UUID = Query(...),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Get query history for a user"""
    try:
        result = await db.execute(
            select(TokenUsageLog)
            .where(TokenUsageLog.user_id == user_id)
            .order_by(desc(TokenUsageLog.created_at))
            .limit(limit)
        )

        logs = result.scalars().all()

        return [
            {
                "timestamp": log.created_at.isoformat(),
                "query_type": log.query_type,
                "input_tokens": log.input_tokens,
                "output_tokens": log.output_tokens,
                "cost_usd": float(log.cost_usd),
            }
            for log in logs
        ]

    except Exception as e:
        logger.error(f"Error fetching query history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch query history",
        ) from e
