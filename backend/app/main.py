from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.routers import (
    bitbucket,
    clickup,
    connectors,
    github,
    indexing,
    jira,
    launch,
    organisation,
    query,
    sdlc,
    slack,
    usage,
    webhook,
)
from app.routers.workspace import router as workspace_router

app = FastAPI(title="Elliot-AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://elliot-ai.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(organisation.router)
app.include_router(sdlc.router)
app.include_router(workspace_router)
app.include_router(connectors.router)
app.include_router(bitbucket.router, prefix="/bitbucket", tags=["bitbucket"])
app.include_router(github.router, prefix="/github", tags=["github"])
app.include_router(clickup.router, prefix="/clickup", tags=["clickup"])
app.include_router(jira.router, prefix="/jira", tags=["jira"])
app.include_router(slack.router, prefix="/slack", tags=["slack"])
app.include_router(indexing.router, prefix="/index", tags=["indexing"])
app.include_router(usage.router, prefix="/usage", tags=["usage"])
app.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
app.include_router(query.router, prefix="/query", tags=["query"])
app.include_router(launch.router, prefix="/launch", tags=["launch"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "elliot-ai", "version": "0.1.0"}


@app.get("/")
async def root():
    return {"message": "Elliot-AI backend. See /docs for API."}
