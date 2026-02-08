"""
Database adapters for tenant join/invite request management.

Operations:
- request_join_tenant() - User requests to join a tenant
- approve_join_request() - Owner/admin approves a join request
- reject_join_request() - Owner/admin rejects a join request
- cancel_join_request() - User cancels their own join request
"""

from uuid import UUID
from app.db.client import get_supabase_client
from app.errors.db import map_db_error


def request_join_tenant(access_token: str, tenant_id: UUID):
    """
    User requests to join a tenant.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "request_join_tenant",
            {"p_tenant_id": str(tenant_id)},
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def approve_join_request(access_token: str, request_id: UUID):
    """
    Owner/admin approves a pending join request.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "approve_join_request",
            {"p_request_id": str(request_id)},
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def reject_join_request(access_token: str, request_id: UUID):
    """
    Owner/admin rejects a pending join request.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "reject_join_request",
            {"p_request_id": str(request_id)},
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def cancel_join_request(access_token: str, request_id: UUID):
    """
    User cancels their own pending join request.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "cancel_join_request",
            {"p_request_id": str(request_id)},
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)
