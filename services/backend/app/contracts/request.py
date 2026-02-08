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