"""
Request/Response contracts for note management operations.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Literal



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

class ShareNotePayload(BaseModel):
    """
    Payload for sharing a note with another user.
    
    Permission is strictly validated at schema level.
    Only 'read' or 'write' are accepted.
    """
    target_user_id: UUID
    permission: Literal['read', 'write']


class ShareNoteResponse(BaseModel):
    """
    Response when note is shared.
    
    Permission is guaranteed to be 'read' or 'write'.
    """
    note_id: UUID
    target_user_id: UUID
    permission: Literal['read', 'write']
    result: str  # 'shared'


class RevokeSharePayload(BaseModel):
    """
    Payload for revoking share access.
    """
    target_user_id: UUID


class RevokeShareResponse(BaseModel):
    """
    Response when share is revoked.
    """
    note_id: UUID
    target_user_id: UUID
    result: str  # 'revoked'


class NoteShareItem(BaseModel):
    """
    Represents a single note share record.
    """
    note_id: UUID
    user_id: UUID
    permission: Literal['read', 'write']
    created_at: datetime


class ListNoteSharesResponse(BaseModel):
    """
    Response for listing all users who have access to a note.
    """
    shares: List[NoteShareItem]
    total: int


class SharedNoteItem(BaseModel):
    """
    Represents a note shared with the authenticated user.
    """
    id: UUID
    tenant_id: UUID
    owner_id: UUID
    content: str
    permission: Literal['read', 'write']
    created_at: datetime
    updated_at: datetime
    shared_at: datetime


class ListSharedWithMeResponse(BaseModel):
    """
    Response for listing notes shared with the authenticated user.
    """
    notes: List[SharedNoteItem]
    total: int