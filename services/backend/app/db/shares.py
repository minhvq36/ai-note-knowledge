"""
Database adapters for note sharing operations.

Operations:
- share_note() - Share a note or change permission (via RPC)
- revoke_share() - Revoke share access (via RPC)
- list_note_shares() - List all shares for a note
- list_shared_with_me() - List all shares granted to the authenticated user
"""

from uuid import UUID
from app.db.client import get_supabase_client
from app.errors.db import map_db_error


def share_note(access_token: str, note_id: UUID, target_user_id: UUID, permission: str):
    """
    Share a note with another user (or change existing share permission).
    
    RPC enforces:
    - Caller must own the note
    - Target must be tenant member
    - Cannot share to self
    - Permission must be 'read' or 'write'
    - Atomic operation: revoke old + grant new
    - Audit log is written
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "change_note_share_permission",
            {
                "p_note_id": str(note_id),
                "p_target_user_id": str(target_user_id),
                "p_new_permission": permission,
            },
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def revoke_share(access_token: str, note_id: UUID, target_user_id: UUID):
    """
    Revoke share access to a note.
    
    RPC enforces:
    - Caller must own the note
    - Caller must be tenant member
    - Note must be active
    - Atomic operation: deletes note_shares record and writes audit log
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "revoke_note_share",
            {
                "p_note_id": str(note_id),
                "p_target_user_id": str(target_user_id),
            },
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def list_note_shares(access_token: str, note_id: UUID, limit: int = 20, offset: int = 0):
    """
    List all users who have access to a note.
    
    RLS enforces:
    - Caller must be note owner, tenant admin/owner, or be a sharee of the note
    - Returns note_shares records (user_id, permission, created_at)
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.table("note_shares").select("note_id, user_id, permission, created_at", count="exact") \
            .eq("note_id", str(note_id)) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .offset(offset) \
            .execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def list_shared_with_me(access_token: str, limit: int = 20, offset: int = 0):
    """
    List all note shares granted to the authenticated user.
    
    Query: note_shares table only (RLS filters to user's shares).
    RLS enforces:
    - Returns only shares where user_id = auth.uid()
    - Returns minimal share data (note_id, user_id, permission, created_at)
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.table("note_shares").select("note_id, user_id, permission, created_at", count="exact") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .offset(offset) \
            .execute()

        return result
    except Exception as e:
        raise map_db_error(e)
