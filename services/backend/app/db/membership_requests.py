"""
Database adapters for tenant join/invite request management.

Join operations:
- request_join_tenant() - User requests to join a tenant
- approve_join_request() - Owner/admin approves a join request
- reject_join_request() - Owner/admin rejects a join request
- cancel_join_request() - User cancels their own join request

Invite operations:
- invite_user_to_tenant() - Owner/admin invites a user to tenant
- accept_invite() - User accepts a pending invite
- decline_invite() - User declines a pending invite
- revoke_invite() - Owner/admin revokes a pending invite
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


def invite_user_to_tenant(access_token: str, tenant_id: UUID, target_user_id: UUID):
    """
    Owner/admin invites a user to join a tenant.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "invite_user_to_tenant",
            {
                "p_tenant_id": str(tenant_id),
                "p_target_user_id": str(target_user_id),
            },
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def accept_invite(access_token: str, request_id: UUID):
    """
    User accepts a pending invite to join a tenant.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "accept_invite",
            {"p_request_id": str(request_id)},
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def decline_invite(access_token: str, request_id: UUID):
    """
    User declines a pending invite to join a tenant.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "decline_invite",
            {"p_request_id": str(request_id)},
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def revoke_invite(access_token: str, request_id: UUID):
    """
    Owner/admin revokes a pending invite (via cancel_invite RPC with invite direction).
    Note: DB function is cancel_invite but we use revoke as the domain operation name.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "cancel_invite",
            {"p_request_id": str(request_id)},
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)
