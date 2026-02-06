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
    code = "DOMAIN_ERROR"

    def __init__(self, message: str, *, cause: Optional[Exception] = None):
        super().__init__(message)
        self.cause = cause


class PermissionDenied(DomainError):
    """
    Raised when RLS or permission checks fail.
    """
    code = "PERMISSION_DENIED"


class InvariantViolated(DomainError):
    """
    Raised when a business invariant enforced by the database is violated.
    """
    code = "INVARIANT_VIOLATED"


class NotFound(DomainError):
    """
    Raised when a requested resource does not exist.
    """
    code = "NOT_FOUND"



"""
Error code to domain error class mapping.
Keyed by DB error codes from database contract (errors.md)
"""
ERROR_CODE_MAP = {
    # AUTH ERRORS
    'DB0001': (PermissionDenied, 'User is not authenticated'),
    
    # TENANT ERRORS
    'DB0101': (NotFound, 'Tenant not found or has been deleted'),
    'DB0102': (PermissionDenied, 'Only tenant owner can perform this action'),
    'DB0103': (InvariantViolated, 'Cannot delete tenant with multiple owners'),
    'DB0104': (DomainError, 'Tenant name is invalid'),
    
    # MEMBERSHIP ERRORS
    'DB0201': (PermissionDenied, 'Caller lacks permission for membership operation'),
    'DB0202': (NotFound, 'Target user is not a member of the tenant'),
    'DB0203': (InvariantViolated, 'Cannot remove or downgrade the last owner'),
    'DB0204': (InvariantViolated, 'User is already a member of this tenant'),
    'DB0205': (DomainError, 'Invalid role provided'),
    'DB0206': (DomainError, 'Self-removal is not allowed through this endpoint'),
    'DB0207': (PermissionDenied, 'Admin cannot remove other admins or owners'),
    'DB0208': (NotFound, 'Caller is not a member of this tenant'),
    'DB0209': (InvariantViolated, 'Last owner cannot leave the tenant'),
    
    # REQUEST & INVITATION ERRORS
    'DB0301': (NotFound, 'Join request or invitation not found'),
    'DB0302': (InvariantViolated, 'Cannot approve/reject an invitation request'),
    'DB0303': (InvariantViolated, 'Cannot accept/decline a join request'),
    'DB0304': (InvariantViolated, 'Only pending requests can be processed'),
    'DB0305': (PermissionDenied, 'Caller is not authorized to perform this action'),
    'DB0306': (InvariantViolated, 'Blocked by existing invitation'),
    'DB0307': (InvariantViolated, 'Blocked by existing join request'),
    'DB0308': (InvariantViolated, 'Join request already exists'),
    'DB0309': (InvariantViolated, 'Invitation already exists'),
    'DB0310': (NotFound, 'Target user does not exist'),
    'DB0311': (PermissionDenied, 'Only tenant owner or admin allowed'),
    'DB0312': (PermissionDenied, 'Only owner/admin can cancel invitations'),
    
    # NOTE ERRORS
    'DB0401': (NotFound, 'Note not found, deleted, or tenant is inactive'),
    'DB0402': (PermissionDenied, 'Only note owner can perform this action'),
    'DB0403': (NotFound, 'Note tenant is inactive or deleted'),
    
    # SHARE ERRORS
    'DB0501': (DomainError, 'Cannot share note with yourself'),
    'DB0502': (DomainError, 'Invalid share permission'),
    'DB0503': (NotFound, 'Target user is not a tenant member'),
    'DB0504': (PermissionDenied, 'Only note owner can change share permissions'),
    'DB0505': (NotFound, 'Note not found or deleted'),
}


def _extract_error_code(error: Exception) -> Optional[str]:
    """
    Extract DB error code from Supabase exception.
    
    Supabase PostgREST errors have a detail field containing the error code.
    Example: detail = 'DB0001'
    """
    try:
        error_str = str(error)
        
        # Check if error has details attribute (from postgrest client)
        if hasattr(error, 'details') and error.details:
            return error.details
        
        # Fallback: try to parse from string representation
        if 'DB' in error_str and len(error_str) >= 6:
            # Look for pattern: DB####
            for word in error_str.split():
                if word.startswith('DB') and word[2:6].isdigit():
                    return word[:6]
    except Exception:
        pass
    
    return None


def map_db_error(error: Exception) -> DomainError:
    """
    Convert a raw Supabase/PostgREST error into a domain error.

    Strategy:
    1. Try to extract structured error code from Supabase exception
    2. Map error code to appropriate domain error class
    3. Fall back to message-based heuristics if code not found
    """

    # Try structured error code first
    error_code = _extract_error_code(error)
    
    if error_code and error_code in ERROR_CODE_MAP:
        error_class, message = ERROR_CODE_MAP[error_code]
        return error_class(message, cause=error)
    
    # Fallback: string-based heuristics for compatibility
    message = str(error).lower()

    if "permission denied" in message or "rls" in message:
        return PermissionDenied(
            "Permission denied by database policy",
            cause=error,
        )

    if "last owner" in message or "invariant" in message:
        return InvariantViolated(
            "Database invariant violated",
            cause=error,
        )

    if "not found" in message or "does not exist" in message:
        return NotFound(
            "Requested resource not found",
            cause=error,
        )

    # Final fallback
    return DomainError(
        "Unhandled database error",
        cause=error,
    )
