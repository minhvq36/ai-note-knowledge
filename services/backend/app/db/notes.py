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

        result = client.table("notes").select("*").eq("id", str(note_id)).single().execute()

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
