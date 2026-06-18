from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.config import get_settings
from app.routers import (
    bitbucket,
    clickup,
    connectors,
    database,
    github,
    gitlab,
    indexing,
    jira,
    launch,
    linear,
    notion,
    organisation,
    query,
    sdlc,
    slack,
    teams,
    usage,
    users,
    webhook,
)
from app.routers.onboarding import router as onboarding_router
from app.routers.workspace import router as workspace_router

app = FastAPI(title="Elliot-AI", version="0.1.0")

# Parse CORS origins from environment variable
settings = get_settings()
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(organisation.router)
app.include_router(sdlc.router)
app.include_router(workspace_router)
app.include_router(onboarding_router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(connectors.router)
app.include_router(bitbucket.router, prefix="/bitbucket", tags=["bitbucket"])
app.include_router(github.router, prefix="/github", tags=["github"])
app.include_router(gitlab.router, prefix="/gitlab", tags=["gitlab"])
app.include_router(clickup.router, prefix="/clickup", tags=["clickup"])
app.include_router(jira.router, prefix="/jira", tags=["jira"])
app.include_router(slack.router, prefix="/slack", tags=["slack"])
app.include_router(linear.router, prefix="/linear", tags=["linear"])
app.include_router(notion.router, prefix="/notion", tags=["notion"])
app.include_router(indexing.router, prefix="/index", tags=["indexing"])
app.include_router(usage.router, prefix="/usage", tags=["usage"])
app.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
app.include_router(query.router, prefix="/query", tags=["query"])
app.include_router(launch.router, prefix="/launch", tags=["launch"])
app.include_router(database.router, prefix="/database", tags=["database"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "elliot-ai", "version": "0.1.0"}


@app.get("/")
async def root():
    return {"message": "Elliot-AI backend. See /docs for API."}
