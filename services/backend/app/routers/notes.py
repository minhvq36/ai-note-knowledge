"""
HTTP endpoints for note management.

Endpoints:
- GET /notes - List notes the authenticated user owns or has access to
- GET /notes/{note_id} - Get a single note
- PATCH /notes/{note_id} - Update note content
- DELETE /notes/{note_id} - Soft-delete a note
- POST /notes/{note_id}/shares - Share a note with another user
- DELETE /notes/{note_id}/shares/{target_user_id} - Revoke share access
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.http.response import ApiResponse
from app.auth.deps import get_current_access_token
from app.db.notes import get_note, update_note, delete_note, list_my_notes, share_note, revoke_share
from app.errors.db import (
    InvariantViolated,
    NotFound,
    PermissionDenied,
    )
from app.contracts.note import (
    GetNoteResponse,
    UpdateNotePayload,
    UpdateNoteResponse,
    DeleteNoteResponse,
    ListMyNotesResponse,
    NoteItem,
    ShareNotePayload,
    ShareNoteResponse,
    RevokeShareResponse,
)


router = APIRouter(
    tags=["notes"],
)


@router.get("/notes")
def list_my_notes_endpoint(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List all notes the authenticated user owns or has access to via share.
    
    Access control:
    - RLS enforces: returns only notes user can read
    - Filters out soft-deleted notes (deleted_at IS NOT NULL)
    """
    
    result = list_my_notes(access_token, limit, offset)
    
    notes = [
        NoteItem(
            id=item["id"],
            tenant_id=item["tenant_id"],
            owner_id=item["owner_id"],
            content=item["content"],
            created_at=item["created_at"],
            updated_at=item["updated_at"],
        )
        for item in result.data
    ]
    
    return ApiResponse(
        success=True,
        data=ListMyNotesResponse(
            notes=notes,
            total=result.count,
        ),
    )


@router.get("/notes/{note_id}")
def get_note_endpoint(
    note_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Get a single note by ID.
    
    Access control:
    - User must own the note, be a tenant member, or have note share
    - RLS enforces access control at database level
    """
    
    result = get_note(access_token, note_id)
    
    if not result.data:
        raise NotFound(
            message="Note not found or access denied",
            code="DB0401",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=GetNoteResponse(
            id=data["id"],
            tenant_id=data["tenant_id"],
            owner_id=data["owner_id"],
            content=data["content"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            deleted_at=data.get("deleted_at"),
            deleted_by=data.get("deleted_by"),
        ),
    )


@router.patch("/notes/{note_id}")
def update_note_endpoint(
    note_id: UUID,
    payload: UpdateNotePayload,
    access_token: str = Depends(get_current_access_token),
):
    """
    Update note content.
    
    Access control:
    - Only note owner can update
    - Or user with write-share permission can update
    - RLS enforces access control at database level
    """
    
    content = payload.content
    
    result = update_note(access_token, note_id, content)
    
    if not result.data or len(result.data) == 0:
        raise InvariantViolated(
            message="Update note operation returned no data or access denied",
            code="DB0403",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=UpdateNoteResponse(
            id=data["id"],
            tenant_id=data["tenant_id"],
            owner_id=data["owner_id"],
            content=data["content"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        ),
    )


@router.delete("/notes/{note_id}")
def delete_note_endpoint(
    note_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Soft-delete a note (owner-only).
    
    Access control:
    - Only note owner can delete
    - RPC enforces owner-only access
    - Soft-delete: sets deleted_at and deleted_by
    - Audit log is created
    """
    
    result = delete_note(access_token, note_id)
    
    if not result.data or len(result.data) == 0:
        raise InvariantViolated(
            message="Delete note operation returned no data or access denied",
            code="DB0403",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=DeleteNoteResponse(
            note_id=data["note_id"],
            result=data["result"],
        ),
    )

@router.post("/notes/{note_id}/shares")
def share_note_endpoint(
    note_id: UUID,
    payload: ShareNotePayload,
    access_token: str = Depends(get_current_access_token),
):
    """
    Share a note with another user or change share permission.
    
    Access control:
    - Only note owner can share
    - Target must be tenant member
    - Cannot share to self
    - RPC enforces all rules
    - Audit log is created
    """
    
    target_user_id = payload.target_user_id
    permission = payload.permission
    
    """
    RPC call returns void, so result.data will be empty.
    If no error is raised, it means success.
    """
    result = share_note(access_token, note_id, target_user_id, permission)
    
    return ApiResponse(
        success=True,
        data=ShareNoteResponse(
            note_id=note_id,
            target_user_id=target_user_id,
            permission=permission,
            result="shared",
        ),
    )


@router.delete("/notes/{note_id}/shares/{target_user_id}")
def revoke_share_endpoint(
    note_id: UUID,
    target_user_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Revoke share access to a note.
    
    Access control:
    - Only note owner can revoke
    - Caller must be tenant member
    - RLS enforces access control
    """
    
    result = revoke_share(access_token, note_id, target_user_id)
    
    return ApiResponse(
        success=True,
        data=RevokeShareResponse(
            note_id=note_id,
            target_user_id=target_user_id,
            result="revoked",
        ),
    )