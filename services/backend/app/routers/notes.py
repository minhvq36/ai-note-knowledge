"""
HTTP endpoints for note management.

Endpoints:
- GET /notes/{note_id} - Get a single note
- PATCH /notes/{note_id} - Update note content
- DELETE /notes/{note_id} - Soft-delete a note
"""

from uuid import UUID
from fastapi import APIRouter, Depends
from app.http.response import ApiResponse
from app.auth.deps import get_current_access_token
from app.db.notes import get_note, update_note, delete_note
from app.errors.db import (
    InvariantViolated,
    NotFound,
    )
from app.contracts.note import (
    GetNoteResponse,
    UpdateNotePayload,
    UpdateNoteResponse,
    DeleteNoteResponse,
)


router = APIRouter(
    tags=["notes"],
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
