"""
HTTP error translation layer.

This module converts domain-level errors into FastAPI HTTPExceptions.
This is the ONLY place where HTTP status codes are decided.
"""

from fastapi import HTTPException, status

from app.errors.db import (
    DomainError,
    PermissionDenied,
    InvariantViolated,
    NotFound,
)


def to_http_error(error: DomainError) -> HTTPException:
    """
    Translate a domain error into an HTTPException.

    Routers should catch DomainError and immediately re-raise
    the returned HTTPException from this function.
    """

    """
    Permission / authorization errors.
    """
    if isinstance(error, PermissionDenied):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        )

    """
    Business invariant violations.
    """
    if isinstance(error, InvariantViolated):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )

    """
    Missing resources.
    """
    if isinstance(error, NotFound):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    """
    Fallback for unknown domain errors.
    """
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Internal server error",
    )
