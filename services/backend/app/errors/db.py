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


def map_db_error(exc: Exception) -> DomainError:
    """
    Map Supabase / PostgREST exceptions
    into domain-specific errors.
    """

    """
    Supabase PostgREST errors usually expose:
    - status_code
    - message
    - details
    """

    status_code = getattr(exc, "status_code", None)
    message = str(exc).lower()

    """
    Permission / RLS errors.
    """
    if status_code in (401, 403):
        return PermissionDenied(message)

    if "permission" in message or "rls" in message:
        return PermissionDenied(message)

    """
    Invariant violations.
    """
    if "last owner" in message:
        return InvariantViolated(message)

    """
    Not found errors.
    """
    if status_code == 404:
        return NotFound(message)

    return DomainError(message)
