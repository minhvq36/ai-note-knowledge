from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class RequestJoinTenantResponse(BaseModel):
    """
    Response when user requests to join a tenant.
    Returns request_id and result status.
    """
    request_id: UUID
    result: str


class ApproveJoinRequestResponse(BaseModel):
    """
    Response when owner/admin approves a join request.
    """
    request_id: UUID
    result: str


class RejectJoinRequestResponse(BaseModel):
    """
    Response when owner/admin rejects a join request.
    """
    request_id: UUID
    result: str


class CancelJoinRequestResponse(BaseModel):
    """
    Response when user cancels their join request.
    """
    request_id: UUID
    result: str


class InviteUserToTenantPayload(BaseModel):
    """
    Payload for inviting a user to a tenant.
    """
    target_user_id: UUID


class InviteUserToTenantResponse(BaseModel):
    """
    Response when owner/admin invites a user to a tenant.
    """
    request_id: UUID
    result: str


class AcceptInviteResponse(BaseModel):
    """
    Response when user accepts a pending invite.
    """
    request_id: UUID
    result: str


class DeclineInviteResponse(BaseModel):
    """
    Response when user declines a pending invite.
    """
    request_id: UUID
    result: str


class RevokeInviteResponse(BaseModel):
    """
    Response when owner/admin revokes a pending invite.
    """
    request_id: UUID
    result: str


"""
List query response models
"""


class JoinRequestItem(BaseModel):
    """
    A single join request record.
    """
    id: UUID
    tenant_id: UUID
    user_id: UUID
    initiated_by: UUID
    direction: str
    status: str
    decided_by: Optional[UUID]
    decided_at: Optional[datetime]
    created_at: datetime


class ListJoinRequestsResponse(BaseModel):
    """
    Response list of join requests for a tenant.
    """
    requests: List[JoinRequestItem]


class InviteItem(BaseModel):
    """
    A single invite record.
    """
    id: UUID
    tenant_id: UUID
    user_id: UUID
    initiated_by: UUID
    direction: str
    status: str
    decided_by: Optional[UUID]
    decided_at: Optional[datetime]
    created_at: datetime


class ListInvitesResponse(BaseModel):
    """
    Response list of invites for a tenant.
    """
    invites: List[InviteItem]


class MyInviteItem(BaseModel):
    """
    A pending invite directed to authenticated user.
    """
    id: UUID
    tenant_id: UUID
    initiated_by: UUID
    direction: str
    status: str
    created_at: datetime


class ListMyInvitesResponse(BaseModel):
    """
    Response list of pending invites for authenticated user.
    """
    invites: List[MyInviteItem]


class MyJoinRequestItem(BaseModel):
    """
    A join request created by authenticated user.
    """
    id: UUID
    tenant_id: UUID
    direction: str
    status: str
    decided_by: Optional[UUID]
    decided_at: Optional[datetime]
    created_at: datetime


class ListMyJoinRequestsResponse(BaseModel):
    """
    Response list of join requests by authenticated user.
    """
    requests: List[MyJoinRequestItem]