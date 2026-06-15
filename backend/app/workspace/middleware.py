"""Tenant context middleware.

Reads `Authorization: Bearer <jwt>`, decodes it, and attaches
`request.state.tenant_id` and `request.state.user_email` if present.

Does NOT reject requests without a token — public routes (/health, /auth/*, /docs)
must still work. Route-level enforcement is via `require_tenant` dependency.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.auth.jwt import decode_access_token


class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request.state.tenant_id = None
        request.state.user_email = None

        auth = request.headers.get("authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth[7:].strip()
            try:
                payload = decode_access_token(token)
                request.state.user_email = payload.get("sub")
                request.state.tenant_id = payload.get("tenant_id")
            except ValueError:
                # Invalid token -> leave state empty; require_tenant will 401 if needed.
                pass

        return await call_next(request)
