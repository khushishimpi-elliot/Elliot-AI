from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.workspace.deps import TenantContext, require_tenant
from app.workspace.middleware import TenantContextMiddleware

app = FastAPI(title="Elliot-AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TenantContextMiddleware)

app.include_router(auth_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "elliot-ai", "version": "0.1.0"}


@app.get("/")
async def root():
    return {"message": "Elliot-AI backend. See /docs for API."}


@app.get("/me")
async def whoami(ctx: TenantContext = Depends(require_tenant)):
    return {"email": ctx.user_email, "tenant_id": ctx.tenant_id}
