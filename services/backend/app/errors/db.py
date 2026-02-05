"""
Domain-level errors derived from database / RPC failures.

This module is responsible for:
- Inspecting raw Supabase/PostgREST errors
- Mapping them into domain-specific exceptions

No HTTP concepts are allowed here.
"""

from typing import Optional


class DomainError(Exception):
    """
    Base class for all domain-level errors.
    """

    def __init__(self, message: str, *, cause: Optional[Exception] = None):
        super().__init__(message)
        self.cause = cause


class PermissionDenied(DomainError):
    """
    Raised when RLS or permission checks fail.
    """
    pass


class InvariantViolated(DomainError):
    """
    Raised when a business invariant enforced by the database is violated.
    Example: attempting to remove the last owner.
    """
    pass


class NotFound(DomainError):
    """
    Raised when a requested resource does not exist.
    """
    pass


def map_db_error(error: Exception) -> DomainError:
    """
    Convert a raw Supabase/PostgREST error into a domain error.

    This function:
    - Does NOT raise HTTP exceptions
    - Does NOT depend on FastAPI
    - Centralizes all DB error interpretation logic
    """

    """
    Extract error message in a defensive way.
    Supabase error objects may vary slightly by version.
    """
    message = str(error).lower()

    """
    Permission / RLS violations.
    """
    if "permission denied" in message or "rls" in message:
        return PermissionDenied(
            "Permission denied by database policy",
            cause=error,
        )

    """
    Invariant violations enforced by RPC logic.
    """
    if "last owner" in message or "invariant" in message:
        return InvariantViolated(
            "Database invariant violated",
            cause=error,
        )

    """
    Missing resources.
    """
    if "not found" in message or "does not exist" in message:
        return NotFound(
            "Requested resource not found",
            cause=error,
        )

    """
    Fallback: wrap as generic domain error.
    """
    return DomainError(
        "Unhandled database error",
        cause=error,
    )
