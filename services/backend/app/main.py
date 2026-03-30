from fastapi import FastAPI, Request, Depends
from fastapi.responses import RedirectResponse, JSONResponse
import logging
import sys

from app.routers.members import router as members_router
from app.routers.tenants import router as tenants_router
from app.routers.requests import router as requests_router
from app.routers.me import router as me_router
from app.routers.notes import router as notes_router
from app.errors.db import DomainError
from app.errors.http import get_status_code_for_error
from app.http.response import ApiResponse, ErrorPayload
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.core.redis import init_redis, close_redis
from app.core.rate_limit import RateLimiter, TokenBucket
from app.application.rate_limit.registry import RateLimitRegistry
import os
# Configure logging to see all custom logs in console
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger(__name__)

app = FastAPI(title="AI Note Knowledge Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
async def redirect_to_docs():
    return RedirectResponse(url="/docs")

@app.get("/health")
async def health_check():
    """
    Health check endpoint with Redis connectivity verification.
    
    Rate limit: IP_ONLY (no authentication required).
    Returns simple JSON (not ApiResponse format) for infrastructure compatibility.
    Load balancers expect minimal response without business error details.
    """
    try:
        # Verify Redis connection (async ping)
        await app.state.redis.ping()
        return {"status": "ok", "redis": "up"}
    except Exception:
        # Return degraded status but HTTP 200 to avoid load balancer panic
        # Detailed error logging should be handled separately
        return {"status": "degraded", "redis": "down"}


"""
Global exception handler for domain-level errors.

Responsibilities:
- Catch DomainError bubbling up from routers/services
- Decide HTTP status code via http layer
- Enforce UI response contract
"""
@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError):
    """
    Translate DomainError into standardized API response.
    """

    """
    Determine HTTP status code (pure mapping).
    """
    status_code = get_status_code_for_error(exc)

    """
    Build API response payload.
    """
    payload = ApiResponse(
        success=False,
        data=None,
        error=ErrorPayload(
            code=getattr(exc, 'code', 'DOMAIN_ERROR'),
            message=str(exc),
        ),
    )

    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(),
    )

@app.on_event("startup")
async def startup():
    await init_redis(app)
    # Initialize RateLimiter with Redis-backed TokenBucket with logger
    bucket = TokenBucket(app.state.redis, logger=logger)
    app.state.limiter = RateLimiter(bucket)

@app.on_event("shutdown")
async def shutdown():
    await close_redis(app)

api_prefix = settings.API_PREFIX
app.include_router(members_router, prefix=api_prefix)
app.include_router(tenants_router, prefix=api_prefix)
app.include_router(requests_router, prefix=api_prefix)
app.include_router(me_router, prefix=api_prefix)
app.include_router(notes_router, prefix=api_prefix)
