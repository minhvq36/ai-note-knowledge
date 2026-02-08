from pydantic import BaseModel
from uuid import UUID

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