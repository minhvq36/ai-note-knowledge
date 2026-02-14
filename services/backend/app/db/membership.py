"""
Database adapter for tenant membership RPCs.

Responsibilities:
- Obtain Supabase client
- Forward access token
- Call membership RPCs

This module must not contain any business logic.
"""

from uuid import UUID
from app.db.client import get_supabase_client


def change_tenant_member_role(
    *,
    access_token: str,
    tenant_id: UUID,
    target_user_id: UUID,
    new_role: str,
):
    """
    Call change_tenant_member_role RPC.

    The database enforces:
    - Authentication
    - Authorization
    - Role invariants
    - Concurrency safety
    - Audit logging
    
    Raises DomainError if RPC fails.
    """
    from app.errors.db import map_db_error

    """
    Obtain singleton Supabase client initialized with service role key.
    """
    client = get_supabase_client()

    """
    Attach user JWT to PostgREST request context.
    This enables auth.uid() inside the RPC.
    """
    client.postgrest.auth(access_token)

    """
    Execute RPC with raw parameters.
    """
    try:
        result = (
            client.rpc(
                "change_tenant_member_role",
                {
                    "p_tenant_id": str(tenant_id),
                    "p_target_user_id": str(target_user_id),
                    "p_new_role": new_role,
                },
            )
            .execute()
        )
        return result
    
    except Exception as exc:
        """
        Convert database exception to domain error.
        This will be caught by router and converted to HTTP error.
        """
        domain_error = map_db_error(exc)
        raise domain_error


def leave_tenant(
    *,
    access_token: str,
    tenant_id: UUID,
):
    """
    Call leave_tenant RPC.

    The database enforces:
    - Authentication
    - Membership verification
    - Last owner invariant (cannot be the last owner)
    - Membership removal
    - Audit logging
    - Concurrency safety
    
    Raises DomainError if RPC fails.
    """
    from app.errors.db import map_db_error

    """
    Obtain singleton Supabase client initialized with service role key.
    """
    client = get_supabase_client()

    """
    Attach user JWT to PostgREST request context.
    This enables auth.uid() inside the RPC.
    """
    client.postgrest.auth(access_token)

    """
    Execute RPC with raw parameters.
    """
    try:
        result = (
            client.rpc(
                "leave_tenant",
                {
                    "p_tenant_id": str(tenant_id),
                },
            )
            .execute()
        )
        return result
    
    except Exception as exc:
        """
        Convert database exception to domain error.
        This will be caught by router and converted to HTTP error.
        """
        domain_error = map_db_error(exc)
        raise domain_error


def remove_tenant_member(
    *,
    access_token: str,
    tenant_id: UUID,
    target_user_id: UUID,
):
    """
    Call remove_tenant_member RPC.

    The database enforces:
    - Authentication
    - Authorization (only owner/admin can remove)
    - Role-based restrictions (admin cannot remove owner)
    - Last owner invariant (cannot remove the last owner)
    - Membership removal
    - Audit logging
    - Concurrency safety
    
    Raises DomainError if RPC fails.
    """
    from app.errors.db import map_db_error

    """
    Obtain singleton Supabase client initialized with service role key.
    """
    client = get_supabase_client()

    """
    Attach user JWT to PostgREST request context.
    This enables auth.uid() inside the RPC.
    """
    client.postgrest.auth(access_token)

    """
    Execute RPC with raw parameters.
    """
    try:
        result = (
            client.rpc(
                "remove_tenant_member",
                {
                    "p_tenant_id": str(tenant_id),
                    "p_target_user_id": str(target_user_id),
                },
            )
            .execute()
        )
        return result
    
    except Exception as exc:
        """
        Convert database exception to domain error.
        This will be caught by router and converted to HTTP error.
        """
        domain_error = map_db_error(exc)
        raise domain_error