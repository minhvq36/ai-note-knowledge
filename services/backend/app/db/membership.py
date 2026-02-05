"""
Database adapter for tenant membership RPCs.

Responsibilities:
- Obtain Supabase client
- Forward access token
- Call change_tenant_member_role RPC

This module must not contain any business logic.
"""

from app.db.client import get_supabase_client


def change_tenant_member_role(
    *,
    access_token: str,
    tenant_id: str,
    target_user_id: str,
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
    """

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
    No validation or transformation is done here.
    """
    result = (
        client.rpc(
            "change_tenant_member_role",
            {
                "p_tenant_id": tenant_id,
                "p_target_user_id": target_user_id,
                "p_new_role": new_role,
            },
        )
        .execute()
    )

    """
    Return raw result object.
    Error handling is responsibility of higher layers.
    """
    return result
