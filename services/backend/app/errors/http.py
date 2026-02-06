from fastapi import status
from app.errors.db import (
    DomainError,
    PermissionDenied,
    InvariantViolated,
    NotFound,
)

def get_status_code_for_error(error: DomainError) -> int:
    """
    Map domain error type to HTTP status code.
    No HTTP objects are created here.
    """
    if isinstance(error, PermissionDenied):
        return status.HTTP_403_FORBIDDEN
    if isinstance(error, InvariantViolated):
        return status.HTTP_409_CONFLICT
    if isinstance(error, NotFound):
        return status.HTTP_404_NOT_FOUND
    return status.HTTP_500_INTERNAL_SERVER_ERROR
