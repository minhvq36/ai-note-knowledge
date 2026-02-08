from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.http.response import ApiResponse

from app.auth.deps import get_current_access_token
from app.db.membership import leave_tenant
from app.db.tenants import create_tenant, delete_tenant, list_tenants, get_tenant_details, list_tenant_members
from app.errors.db import DomainError
from app.contracts.tenant import (
    CreateTenantPayload,
    CreateTenantResponse,
    DeleteTenantResponse,
    LeaveTenantResponse,
    ListTenantsResponse,
    TenantDetailsResponse,
    ListTenantMembersResponse,
    TenantItem,
    TenantMemberItem,
)


router = APIRouter(
    prefix="/tenants",
    tags=["tenants"],
)


@router.post("")
def create_tenant_endpoint(
    payload: CreateTenantPayload,
    access_token: str = Depends(get_current_access_token),
):
    """
    Create a new tenant and become the owner.

    Domain rules enforced by database:
    - Caller must be authenticated
    - Caller automatically becomes the owner
    - Tenant name is validated
    - Audit log is created
    """

    """
    Extract name from request payload.
    """
    name = payload.name

    """
    Execute RPC via database adapter.
    Router does not handle business logic.
    """
    result = create_tenant(
        access_token=access_token,
        name=name,
    )
    return ApiResponse(
                success=True,
                data=CreateTenantResponse(
                    tenant_id=result.data,
                ),
            )


@router.delete("/{tenant_id}")
def delete_tenant_endpoint(
    tenant_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Delete a tenant (owner-only, must be the last and only owner).

    Domain rules enforced by database:
    - Caller must be authenticated
    - Caller must be the only owner
    - No other members can exist (or automatically removed)
    - Tenant is deleted
    - Audit log is created
    - Concurrency safety is guaranteed
    """

    """
    Execute RPC via database adapter.
    Router does not handle business logic.
    """
    result = delete_tenant(
        access_token=access_token,
        tenant_id=tenant_id,
    )
    
    if not result.data:
        raise DomainError(
                message="Unexpected empty result from delete_tenant",
                code="INVARIANT_VIOLATION",
            )
    
    return ApiResponse(
        success=True,
        data=DeleteTenantResponse(
            tenant_id=result.data[0]["tenant_id"],
            result=result.data[0]["result"],
        ),
    )


@router.post("/{tenant_id}/leave")
def leave_tenant_endpoint(
    tenant_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Leave a tenant (caller leaves the tenant).

    Domain rules enforced by database:
    - Caller must be authenticated
    - Caller must be a member of the tenant
    - Tenant must always have at least one owner (last owner cannot leave)
    - Membership is removed
    - Audit log is created
    - Concurrency safety is guaranteed
    """

    """
    Execute RPC via database adapter.
    Router does not handle business logic.
    """
    result = leave_tenant(
        access_token=access_token,
        tenant_id=tenant_id,
    )
    
    if not result.data:
        raise DomainError(
                message="Unexpected empty result from leave_tenant",
                code="INVARIANT_VIOLATION",
            )
    
    return ApiResponse(
        success=True,
        data=LeaveTenantResponse(
            tenant_id=result.data[0]["tenant_id"],
            user_id=result.data[0]["user_id"],
            result=result.data[0]["result"],
        ),
    )


@router.get("")
def list_tenants_endpoint(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List all tenants the authenticated user belongs to.

    RLS enforces: user only sees tenants they are a member of.
    Returns paginated list of tenants.
    """
    result = list_tenants(
        access_token=access_token,
        limit=limit,
        offset=offset,
    )
    
    """
    Extract tenants list and return with proper contract.
    result.data contains list of tenant items.
    """
    tenants = [
        TenantItem(
            id=item["id"],
            name=item["name"],
            created_at=item["created_at"],
        )
        for item in result.data
    ]
    
    return ApiResponse(
        success=True,
        data=ListTenantsResponse(
            tenants=tenants,
            total=len(result.data),
        ),
    )


@router.get("/{tenant_id}")
def get_tenant_details_endpoint(
    tenant_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Get detailed information about a specific tenant.

    RLS enforces: user must be a member of the tenant.
    Returns tenant info with metadata.
    """
    result = get_tenant_details(
        access_token=access_token,
        tenant_id=tenant_id,
    )
    
    """
    Query returns single row. Extract and return.
    """
    
    if not result.data:
        raise DomainError(
                message="Tenant not found",
                code="NOT_FOUND",
            )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=TenantDetailsResponse(
            id=data["id"],
            name=data["name"],
            created_at=data["created_at"],
        ),
    )


@router.get("/{tenant_id}/members")
def list_tenant_members_endpoint(
    tenant_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List members of a specific tenant.

    RLS enforces: user must be a member of the tenant to see its members.
    Returns paginated list of members with their roles and emails.
    """

    result = list_tenant_members(
        access_token=access_token,
        tenant_id=tenant_id,
        limit=limit,
        offset=offset,
    )
    
    """
    Extract members and flatten nested user data.
    PostgREST returns users as nested object.
    """
    members = [
        TenantMemberItem(
            user_id=item["user_id"],
            email=item["users"]["email"] if item.get("users") else "",
            role=item["role"],
            created_at=item["created_at"],
        )
        for item in result.data
    ]
    
    return ApiResponse(
        success=True,
        data=ListTenantMembersResponse(
            members=members,
            total=len(result.data),
        ),
    )
