import logging

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.connector import Connector
from app.models.sdlc import SDLCProfile
from app.services.token_logger import log_token_usage

from .state import AgentState

logger = logging.getLogger(__name__)

# Keyword patterns for context planning
JIRA_KEYWORDS = {
    "ticket",
    "jira",
    "issue",
    "bug",
    "task",
    "sprint",
    "story",
    "backlog",
    "milestone",
    "status of",
    "progress of",
    "pay-",
    "auth-",
}

SLACK_KEYWORDS = {
    "slack",
    "decided",
    "discussed",
    "team said",
    "why did we",
    "conversation",
    "channel",
    "message",
}

DOCS_KEYWORDS = {
    "docs",
    "documentation",
    "runbook",
    "deploy",
    "process",
    "confluence",
    "adr",
    "decision",
    "why",
}


def context_planner_node(state: AgentState) -> AgentState:
    """Analyse query and decide what context is needed"""
    query_lower = state["query"].lower()

    # Always search code
    needs_code = True

    # Check for Jira-related keywords
    needs_jira = any(keyword in query_lower for keyword in JIRA_KEYWORDS)

    # Check for Slack-related keywords
    needs_slack = any(keyword in query_lower for keyword in SLACK_KEYWORDS)

    # Check for documentation-related keywords
    needs_docs = any(keyword in query_lower for keyword in DOCS_KEYWORDS)

    # Determine query type
    if needs_jira:
        query_type = "jira"
    elif needs_docs:
        query_type = "docs"
    elif needs_code:
        query_type = "code"
    else:
        query_type = "general"

    logger.info(
        f"Context planning: needs_code={needs_code}, "
        f"needs_jira={needs_jira}, needs_slack={needs_slack}, "
        f"needs_docs={needs_docs}, query_type={query_type}"
    )

    return {
        **state,
        "needs_code": needs_code,
        "needs_jira": needs_jira,
        "needs_slack": needs_slack,
        "needs_docs": needs_docs,
        "query_type": query_type,
        "code_chunks": [],
        "jira_tickets": [],
        "slack_messages": [],
    }


async def fetch_code_context_node(
    state: AgentState, db: AsyncSession
) -> AgentState:
    """Fetch relevant code chunks from pgvector"""
    if not state["needs_code"]:
        return state

    try:
        # For now, return empty chunks (pgvector search would be added)
        # In production, we would:
        # 1. Embed the query
        # 2. Search pgvector using cosine similarity
        # 3. Filter by repo if specified
        # 4. Return top 5 chunks

        logger.info("Fetching code context from vector DB")

        # Placeholder: return empty for now
        code_chunks = []

        return {**state, "code_chunks": code_chunks}

    except Exception as e:
        logger.error(f"Error fetching code context: {str(e)}")
        return {
            **state,
            "code_chunks": [],
            "error": f"Code context fetch failed: {str(e)}",
        }


async def fetch_jira_context_node(
    state: AgentState, db: AsyncSession
) -> AgentState:
    """Fetch relevant Jira tickets"""
    if not state["needs_jira"]:
        return state

    try:
        # Find Jira connector for tenant
        result = await db.execute(
            select(Connector).where(
                (Connector.tenant_id == state["tenant_id"])
                & (Connector.provider == "jira")
                & (Connector.status == "connected")
            )
        )
        connector = result.scalar_one_or_none()

        if not connector:
            logger.info("No Jira connector found")
            return {**state, "jira_tickets": []}

        # In production, decrypt token and use JiraConnector to search
        # For now, return empty
        logger.info("Would fetch Jira tickets (connector found)")
        jira_tickets = []

        return {**state, "jira_tickets": jira_tickets}

    except Exception as e:
        logger.error(f"Error fetching Jira context: {str(e)}")
        return {**state, "jira_tickets": []}


async def fetch_slack_context_node(
    state: AgentState, db: AsyncSession
) -> AgentState:
    """Fetch relevant Slack messages"""
    if not state["needs_slack"]:
        return state

    try:
        # Find Slack connector for tenant
        result = await db.execute(
            select(Connector).where(
                (Connector.tenant_id == state["tenant_id"])
                & (Connector.provider == "slack")
                & (Connector.status == "connected")
            )
        )
        connector = result.scalar_one_or_none()

        if not connector:
            logger.info("No Slack connector found")
            return {**state, "slack_messages": []}

        # In production, decrypt token and use SlackConnector to search
        # For now, return empty
        logger.info("Would fetch Slack messages (connector found)")
        slack_messages = []

        return {**state, "slack_messages": slack_messages}

    except Exception as e:
        logger.error(f"Error fetching Slack context: {str(e)}")
        return {**state, "slack_messages": []}


async def fetch_sdlc_node(
    state: AgentState, db: AsyncSession
) -> AgentState:
    """Fetch team's SDLC profile"""
    try:
        result = await db.execute(
            select(SDLCProfile).where(
                SDLCProfile.tenant_id == state["tenant_id"]
            )
        )
        sdlc = result.scalar_one_or_none()

        if not sdlc:
            logger.info("No SDLC profile found, using defaults")
            sdlc_profile = {
                "stack": "Python, TypeScript",
                "branching_model": "Git Flow",
                "test_framework": "pytest",
                "coverage_gate": 80,
                "ci_cd_platform": "GitHub Actions",
                "review_policy": "2 approvals required",
                "arch_style": "Microservices",
            }
        else:
            sdlc_profile = {
                "stack": sdlc.stack or "Unknown",
                "branching_model": sdlc.branching_model or "Unknown",
                "test_framework": sdlc.test_framework or "Unknown",
                "coverage_gate": sdlc.coverage_gate or 80,
                "ci_cd_platform": sdlc.ci_cd_platform or "Unknown",
                "review_policy": sdlc.review_policy or "Unknown",
                "arch_style": sdlc.arch_style or "Unknown",
            }

        return {**state, "sdlc_profile": sdlc_profile}

    except Exception as e:
        logger.error(f"Error fetching SDLC profile: {str(e)}")
        return {**state, "sdlc_profile": None}


def prompt_builder_node(state: AgentState) -> AgentState:
    """Assemble final prompt from retrieved context"""
    try:
        sdlc = state["sdlc_profile"] or {}

        system_prompt = f"""You are Elliot, an AI coding assistant for engineering team.

Team Standards:
- Tech Stack: {sdlc.get('stack', 'Unknown')}
- Architecture: {sdlc.get('arch_style', 'Unknown')}
- Testing: {sdlc.get('test_framework', 'Unknown')} with {sdlc.get('coverage_gate', 80)}% coverage
- Branching Model: {sdlc.get('branching_model', 'Unknown')}
- Review Policy: {sdlc.get('review_policy', 'Unknown')}
- CI/CD: {sdlc.get('ci_cd_platform', 'Unknown')}

Instructions:
- Answer based on the provided context
- Be concise and specific
- Follow the team's standards in code suggestions
- If context doesn't contain the answer, say so clearly
- Format code with proper syntax highlighting"""

        # Build code context section
        code_context = ""
        if state["code_chunks"]:
            code_context = "\n[CODEBASE CONTEXT]\n"
            for chunk in state["code_chunks"]:
                code_context += (
                    f"\nFile: {chunk.get('source', 'unknown')}\n"
                    f"Type: {chunk.get('chunk_type', 'unknown')}\n"
                    f"{chunk.get('content', '')}\n"
                )

        # Build Jira context section
        jira_context = ""
        if state["jira_tickets"]:
            jira_context = "\n[JIRA CONTEXT]\n"
            for ticket in state["jira_tickets"]:
                jira_context += (
                    f"\n{ticket.get('key', 'unknown')}: "
                    f"{ticket.get('summary', 'unknown')}\n"
                    f"Status: {ticket.get('status', 'unknown')}\n"
                )

        # Build Slack context section
        slack_context = ""
        if state["slack_messages"]:
            slack_context = "\n[SLACK CONTEXT]\n"
            for msg in state["slack_messages"]:
                slack_context += (
                    f"\n#{msg.get('channel', 'unknown')}: "
                    f"{msg.get('text', '')}\n"
                )

        user_prompt = f"""Question: {state['query']}
{code_context}
{jira_context}
{slack_context}"""

        prompt = f"{system_prompt}\n\n{user_prompt}"

        logger.info(f"Assembled prompt ({len(prompt)} characters)")

        return {**state, "prompt": prompt}

    except Exception as e:
        logger.error(f"Error building prompt: {str(e)}")
        return {
            **state,
            "error": f"Prompt building failed: {str(e)}",
        }


def llm_node(state: AgentState) -> AgentState:
    """Call Claude via OpenRouter to generate response"""
    try:
        settings = get_settings()
        client = OpenAI(
            base_url=settings.openrouter_base_url,
            api_key=settings.openrouter_api_key,
        )

        response = client.chat.completions.create(
            model=settings.claude_model,
            max_tokens=settings.max_tokens,
            messages=[{"role": "user", "content": state["prompt"]}],
            extra_headers={
                "HTTP-Referer": "https://elliot-ai.onrender.com",
                "X-Title": "Elliot-AI",
            },
        )

        answer = response.choices[0].message.content

        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens

        logger.info(
            f"LLM response: {input_tokens} input, "
            f"{output_tokens} output tokens"
        )

        return {
            **state,
            "response": answer,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
        }

    except Exception as e:
        logger.error(f"Error calling LLM: {str(e)}")
        return {
            **state,
            "error": f"LLM call failed: {str(e)}",
        }


async def log_usage_node(
    state: AgentState, db: AsyncSession
) -> AgentState:
    """Log token usage after query"""
    try:
        if state["input_tokens"] > 0 or state["output_tokens"] > 0:
            await log_token_usage(
                db,
                state["user_id"],
                state["tenant_id"],
                state["team_id"],
                "claude-sonnet-4-6",
                state["input_tokens"],
                state["output_tokens"],
                state["query_type"],
            )
            logger.info("Logged token usage")

        return state

    except Exception as e:
        logger.warning(f"Error logging usage: {str(e)}")
        # Don't fail the request if logging fails
        return state


async def get_context_only(
    state: AgentState, db: AsyncSession
) -> AgentState:
    """Run context planning and fetch nodes without LLM call"""
    try:
        # Step 1: Context planning
        state = context_planner_node(state)

        # Step 2: Run all fetch nodes
        state = await fetch_code_context_node(state, db)
        state = await fetch_jira_context_node(state, db)
        state = await fetch_slack_context_node(state, db)
        state = await fetch_sdlc_node(state, db)

        # Step 3: Build prompt
        state = prompt_builder_node(state)

        logger.info("Context prepared for streaming")
        return state

    except Exception as e:
        logger.error(f"Error preparing context: {str(e)}")
        return {
            **state,
            "error": f"Context preparation failed: {str(e)}",
        }
