from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse

from app.routers.members import router as members_router
from app.routers.tenants import router as tenants_router
from app.errors.db import DomainError
from app.errors.http import get_status_code_for_error
from app.http.response import ApiResponse, ErrorPayload


app = FastAPI(title="AI Note Knowledge Backend")


@app.get("/", include_in_schema=False)
async def redirect_to_docs():
    return RedirectResponse(url="/docs")


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


app.include_router(members_router)
app.include_router(tenants_router)
