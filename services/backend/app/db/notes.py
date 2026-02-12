"""
Database adapters for note management.

Operations:
- create_note() - Create a new note in a tenant
- get_note() - Get a single note by ID
- update_note() - Update note content (owner or write-share only)
- delete_note() - Soft-delete a note (owner-only, via RPC)
"""

from uuid import UUID
from app.db.client import get_supabase_client
from app.errors.db import map_db_error


def create_note(access_token: str, tenant_id: UUID, content: str):
    """
    Create a new note in a tenant.
    owner_id is automatically set to auth.uid() by database DEFAULT.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.table("notes").insert({
            "tenant_id": str(tenant_id),
            "content": content,
        }).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def get_note(access_token: str, note_id: UUID):
    """
    Get a single note by ID.
    RLS enforces access control: user must own note, be tenant member, or have share.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.table("notes").select("*").eq("id", str(note_id)).limit(1).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def update_note(access_token: str, note_id: UUID, content: str):
    """
    Update note content.
    RLS enforces access control: only owner or write-share users can update.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.table("notes").update({
            "content": content,
        }).eq("id", str(note_id)).execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def delete_note(access_token: str, note_id: UUID):
    """
    Soft-delete a note (owner-only, via RPC).
    RPC enforces owner-only access and soft-delete logic.
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.rpc(
            "delete_note",
            {"p_note_id": str(note_id)},
        ).execute()

        return result
    except Exception as e:
        raise map_db_error(e)

def list_my_notes(access_token: str, limit: int = 20, offset: int = 0):
    """
    List all notes the authenticated user owns or has access to (via share).
    RLS enforces access control: returns only notes user can read.
    Notes: filters out soft-deleted notes (deleted_at IS NOT NULL).
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.table("notes").select("*", count="exact") \
            .is_("deleted_at", "null") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .offset(offset) \
            .execute()

        return result
    except Exception as e:
        raise map_db_error(e)


def list_tenant_notes(access_token: str, tenant_id: UUID, limit: int = 20, offset: int = 0):
    """
    List all notes in a specific tenant.
    RLS enforces access control: user must be tenant member.
    Notes: filters out soft-deleted notes (deleted_at IS NOT NULL).
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.table("notes").select("*", count="exact") \
            .eq("tenant_id", str(tenant_id)) \
            .is_("deleted_at", "null") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .offset(offset) \
            .execute()

        return result
    except Exception as e:
        raise map_db_error(e)


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
    
    RLS enforces:
    - Caller must own the note
    - Caller must be tenant member
    - Note must be active
    - Deletes the note_shares record
    """
    try:
        client = get_supabase_client()
        client.postgrest.auth(access_token)

        result = client.table("note_shares").delete(count="exact") \
            .eq("note_id", str(note_id)) \
            .eq("user_id", str(target_user_id)) \
            .execute()

        return result
    except Exception as e:
        raise map_db_error(e)
