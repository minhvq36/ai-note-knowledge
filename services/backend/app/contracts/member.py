from pydantic import BaseModel
from typing import Literal
from uuid import UUID


class ChangeMemberRolePayload(BaseModel):
    new_role: Literal["owner", "admin", "member"]


class ChangeMemberRoleResponse(BaseModel):
    """
    Response when changing a member's role.
    RPC returns void, so we return success confirmation.
    """
    message: str = "Role changed successfully"


class RemoveMemberResponse(BaseModel):
    """
    Response when removing a tenant member.
    """
    tenant_id: UUID
    removed_user_id: UUID
    result: str


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