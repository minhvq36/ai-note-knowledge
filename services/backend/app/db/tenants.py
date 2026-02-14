"""
Database adapter for tenant domain.

This module contains:
- RPC adapters for write operations (create, delete)
- PostgREST query adapters for read operations

Responsibilities:
- Obtain Supabase client
- Forward access token
- Call RPCs or PostgREST queries
- Return raw database results

Constraints:
- No business logic
- No authorization checks
- All invariants enforced by database (RLS + RPC)
"""

from uuid import UUID
from app.db.client import get_supabase_client
from dotenv import load_dotenv
load_dotenv()

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

def list_tenants(
    *,
    access_token: str,
    limit: int = 20,
    offset: int = 0,
):
    """
    List all tenants the authenticated user belongs to.
    
    RLS enforces: user must be a member of the tenant.
    Returns list of tenant items.
    """
    from app.errors.db import map_db_error

    """
    Create new client with user-specific auth context.
    Each request gets its own client instance to avoid auth context collisions.
    """
    client = get_supabase_client()
    client.postgrest.auth(access_token)

    try:
        """
        Query tenants table.
        RLS ensures only tenants where the user is a member are visible.
        """
        result = (
            client.table("tenants")
            .select("id, name, created_at", count="exact")
            .limit(limit)
            .offset(offset)
            .execute()
        )
        return result

    except Exception as exc:
        domain_error = map_db_error(exc)
        raise domain_error


def get_tenant_details(
    *,
    access_token: str,
    tenant_id: UUID,
):
    """
    Get detailed information about a specific tenant.
    
    RLS enforces: user must be a member of the tenant.
    Returns tenant info with member count.
    """
    from app.errors.db import map_db_error

    """
    Create new client with user-specific auth context.
    """
    client = get_supabase_client()
    client.postgrest.auth(access_token)

    try:
        """
        Query tenant with member count aggregation.
        Note: May need to use RPC if member_count view doesn't exist.
        For now, query tenant and let backend count if needed.
        """
        result = (
            client.table("tenants")
            .select("id, name, created_at")
            .eq("id", str(tenant_id))
            .limit(1)
            .execute()
        )
        return result

    except Exception as exc:
        domain_error = map_db_error(exc)
        raise domain_error


def list_tenant_members(
    *,
    access_token: str,
    tenant_id: UUID,
    limit: int = 20,
    offset: int = 0,
):
    """
    List members of a specific tenant with their details.
    
    RLS enforces: user must be a member of the tenant.
    Returns list of tenant_members with user email info.
    """
    from app.errors.db import map_db_error

    """
    Create new client with user-specific auth context.
    """
    client = get_supabase_client()
    client.postgrest.auth(access_token)

    try:
        """
        Query tenant_members joined with users table.
        """
        result = (
            client.table("tenant_members")
            .select("user_id, role, created_at, users(email)", count="exact")
            .eq("tenant_id", str(tenant_id))
            .limit(limit)
            .offset(offset)
            .execute()
        )
        return result

    except Exception as exc:
        domain_error = map_db_error(exc) # TO CHANGE WITH MAP QUERY ERROR
        raise domain_error

