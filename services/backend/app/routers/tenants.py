from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.http.response import ApiResponse

from app.auth.deps import get_current_access_token
from app.db.membership import leave_tenant
from app.db.tenants import create_tenant, delete_tenant, list_tenants, get_tenant_details, list_tenant_members
from app.db.membership_requests import request_join_tenant, invite_user_to_tenant, list_join_requests, list_invites
from app.db.notes import create_note
from app.errors.db import DomainError, NotFound
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
from app.contracts.request import (
    RequestJoinTenantResponse,
    InviteUserToTenantPayload,
    InviteUserToTenantResponse,
    ListJoinRequestsResponse,
    ListInvitesResponse,
)
from app.contracts.note import (
    CreateNotePayload,
    CreateNoteResponse,
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
        raise NotFound(
                message="Tenant not found or access denied",
                code="DB0101",
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


@router.post("/{tenant_id}/requests/join")
def request_join_endpoint(
    tenant_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    User requests to join a tenant.

    Domain rules enforced by database:
    - Caller must be authenticated
    - Cannot request if already a member
    - At most one pending join request per tenant
    - Join/invite cannot both be pending
    """

    result = request_join_tenant(access_token, tenant_id)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Join request operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=RequestJoinTenantResponse(
            request_id=data["request_id"],
            result=data["result"],
        ),
    )


@router.post("/{tenant_id}/invites")
def invite_user_to_tenant_endpoint(
    tenant_id: UUID,
    payload: InviteUserToTenantPayload,
    access_token: str = Depends(get_current_access_token),
):
    """
    Owner/admin invites a user to join a tenant.

    Domain rules enforced by database:
    - Caller must be owner/admin of tenant
    - Target user must have a Supabase account
    - At most one pending invite per (tenant, user)
    - Join/invite cannot both be pending
    """

    target_user_id = payload.target_user_id

    result = invite_user_to_tenant(access_token, tenant_id, target_user_id)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Invite operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=InviteUserToTenantResponse(
            request_id=data["request_id"],
            result=data["result"],
        ),
    )


@router.get("/{tenant_id}/requests/join")
def list_join_requests_endpoint(
    tenant_id: UUID,
    status: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List join requests for a tenant (direction='join').
    
    Access control:
    - Owner/admin can see all join requests
    - Requester/initiator can see their own requests
    - RLS enforces at database level
    """
    
    result = list_join_requests(access_token, tenant_id, status, limit, offset)
    
    requests = result.data if result.data else []
    
    return ApiResponse(
        success=True,
        data=ListJoinRequestsResponse(requests=requests),
    )


@router.get("/{tenant_id}/invites")
def list_invites_endpoint(
    tenant_id: UUID,
    status: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List invites for a tenant (direction='invite').
    
    Access control:
    - Owner/admin can see all invites
    - Invited user can see their own invites
    - RLS enforces at database level
    """
    
    result = list_invites(access_token, tenant_id, status, limit, offset)
    
    invites = result.data if result.data else []
    
    return ApiResponse(
        success=True,
        data=ListInvitesResponse(invites=invites),
    )


@router.post("/{tenant_id}/notes")
def create_note_endpoint(
    tenant_id: UUID,
    payload: CreateNotePayload,
    access_token: str = Depends(get_current_access_token),
):
    """
    Create a new note in a tenant.
    
    Access control:
    - Caller must be authenticated
    - Caller must be a member of the tenant
    - Caller automatically becomes the note owner
    - RLS enforces member requirement
    """
    
    content = payload.content
    
    result = create_note(access_token, tenant_id, content)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Create note operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=CreateNoteResponse(
            id=data["id"],
            tenant_id=data["tenant_id"],
            owner_id=data["owner_id"],
            content=data["content"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        ),
    )
