"""
Request/Response contracts for note management operations.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class CreateNotePayload(BaseModel):
    """
    Payload for creating a new note.
    tenant_id comes from URL path, not payload.
    """
    content: str


class CreateNoteResponse(BaseModel):
    """
    Response when note is created.
    """
    id: UUID
    tenant_id: UUID
    owner_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime


class GetNoteResponse(BaseModel):
    """
    Response when retrieving a single note.
    """
    id: UUID
    tenant_id: UUID
    owner_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]


class UpdateNotePayload(BaseModel):
    """
    Payload for updating note content.
    """
    content: str


class UpdateNoteResponse(BaseModel):
    """
    Response when note is updated.
    """
    id: UUID
    tenant_id: UUID
    owner_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime


class DeleteNoteResponse(BaseModel):
    """
    Response when note is deleted (soft-delete via RPC).
    """
    note_id: UUID
    result: str


class NoteItem(BaseModel):
    """
    Represents a single note in list responses.
    """
    id: UUID
    tenant_id: UUID
    owner_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime


class ListMyNotesResponse(BaseModel):
    """
    Response for listing notes the authenticated user owns or has access to.
    """
    notes: List[NoteItem]
    total: int


class ListTenantNotesResponse(BaseModel):
    """
    Response for listing notes in a specific tenant.
    """
    notes: List[NoteItem]
    total: int
