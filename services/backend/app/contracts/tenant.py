from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List


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


class TenantItem(BaseModel):
    """
    Tenant item in list response.
    """
    id: UUID
    name: str
    created_at: datetime


class ListTenantsResponse(BaseModel):
    """
    Response when listing all tenants user belongs to.
    """
    tenants: List[TenantItem]
    total: int


class TenantDetailsResponse(BaseModel):
    """
    Response when getting tenant details.
    """
    id: UUID
    name: str
    created_at: datetime
    member_count: int


class TenantMemberItem(BaseModel):
    """
    Member item in list members response.
    """
    user_id: UUID
    email: str
    role: str
    created_at: datetime


class ListTenantMembersResponse(BaseModel):
    """
    Response when listing members of a tenant.
    """
    members: List[TenantMemberItem]
    total: int