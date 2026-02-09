"""
Request/Response contracts for note management operations.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


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
