from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.routers import bitbucket, connectors, organisation, sdlc

app = FastAPI(title="Elliot-AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(organisation.router)
app.include_router(sdlc.router)
app.include_router(connectors.router)
app.include_router(bitbucket.router, prefix="/bitbucket", tags=["bitbucket"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "elliot-ai", "version": "0.1.0"}


@app.get("/")
async def root():
    return {"message": "Elliot-AI backend. See /docs for API."}
