from pydantic import BaseModel
from uuid import UUID


class CreateTenantPayload(BaseModel):
    """
    Payload for creating a new tenant.
    Caller automatically becomes the owner.
    """
    name: str


class CreateTenantResponse(BaseModel):
    """
    Response when creating a new tenant.
    """
    tenant_id: UUID


class DeleteTenantResponse(BaseModel):
    """
    Response when deleting a tenant.
    """
    tenant_id: UUID
    result: str


class LeaveTenantResponse(BaseModel):
    """
    Response when leaving a tenant.
    """
    tenant_id: UUID
    user_id: UUID
    result: str