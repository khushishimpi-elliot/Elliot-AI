import logging
from collections.abc import Callable

from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from .nodes import (
    context_planner_node,
    fetch_code_context_node,
    fetch_jira_context_node,
    fetch_sdlc_node,
    fetch_slack_context_node,
    llm_node,
    log_usage_node,
    prompt_builder_node,
)
from .state import AgentState

logger = logging.getLogger(__name__)


def build_graph(db: AsyncSession) -> Callable:
    """Build and compile the LangGraph orchestration graph"""

    # Create state graph
    graph = StateGraph(AgentState)

    # Create wrapped nodes that inject the database
    async def context_planner_wrapper(state: AgentState) -> AgentState:
        return context_planner_node(state)

    async def fetch_code_wrapper(state: AgentState) -> AgentState:
        return await fetch_code_context_node(state, db)

    async def fetch_jira_wrapper(state: AgentState) -> AgentState:
        return await fetch_jira_context_node(state, db)

    async def fetch_slack_wrapper(state: AgentState) -> AgentState:
        return await fetch_slack_context_node(state, db)

    async def fetch_sdlc_wrapper(state: AgentState) -> AgentState:
        return await fetch_sdlc_node(state, db)

    async def prompt_builder_wrapper(state: AgentState) -> AgentState:
        return prompt_builder_node(state)

    async def llm_wrapper(state: AgentState) -> AgentState:
        return llm_node(state)

    async def log_usage_wrapper(state: AgentState) -> AgentState:
        return await log_usage_node(state, db)

    # Add nodes
    graph.add_node("context_planner", context_planner_wrapper)
    graph.add_node("fetch_code", fetch_code_wrapper)
    graph.add_node("fetch_jira", fetch_jira_wrapper)
    graph.add_node("fetch_slack", fetch_slack_wrapper)
    graph.add_node("fetch_sdlc", fetch_sdlc_wrapper)
    graph.add_node("prompt_builder", prompt_builder_wrapper)
    graph.add_node("llm", llm_wrapper)
    graph.add_node("log_usage", log_usage_wrapper)

    # Set entry point
    graph.set_entry_point("context_planner")

    # Sequential flow to avoid state conflicts
    graph.add_edge("context_planner", "fetch_sdlc")
    graph.add_edge("fetch_sdlc", "fetch_code")
    graph.add_edge("fetch_code", "fetch_jira")
    graph.add_edge("fetch_jira", "fetch_slack")
    graph.add_edge("fetch_slack", "prompt_builder")

    # Prompt builder → LLM
    graph.add_edge("prompt_builder", "llm")

    # LLM → log usage
    graph.add_edge("llm", "log_usage")

    # Log usage → end
    graph.add_edge("log_usage", END)

    compiled = graph.compile()
    logger.info("LangGraph compiled successfully")

    return compiled
