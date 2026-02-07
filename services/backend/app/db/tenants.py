"""
Database adapter for tenant management RPCs.

Responsibilities:
- Obtain Supabase client
- Forward access token
- Call tenant RPCs

This module must not contain any business logic.
"""

from uuid import UUID
from app.db.client import get_supabase_client


def create_tenant(
    *,
    access_token: str,
    name: str,
):
    """
    Call create_tenant RPC.

    The database enforces:
    - Authentication
    - Caller becomes the owner
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
                "create_tenant",
                {
                    "p_name": name,
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


def delete_tenant(
    *,
    access_token: str,
    tenant_id: UUID,
):
    """
    Call delete_tenant RPC.

    The database enforces:
    - Authentication
    - Authorization (only owner can delete)
    - Last owner only invariant (must be the only owner)
    - Tenant deletion
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
                "delete_tenant",
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
