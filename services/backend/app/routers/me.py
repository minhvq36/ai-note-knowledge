"""
HTTP endpoints for authenticated user's personal resources (requests, invites, shared notes, tenants).

Endpoints:
- GET /me/tenants - List tenants authenticated user is a member of
- GET /me/invites/pending - List pending invites directed to authenticated user
- GET /me/requests - List join requests sent by authenticated user
- GET /me/notes/shared - List notes shared with authenticated user
"""

from fastapi import APIRouter, Depends, Query
from app.http.response import ApiResponse
from app.auth.deps import get_current_access_token
from app.db.membership_requests import list_my_invites, list_my_join_requests
from app.db.shares import list_shared_with_me
from app.db.tenants import list_my_tenants
from app.contracts.request import (
    ListMyInvitesResponse,
    ListMyJoinRequestsResponse,
)
from app.contracts.note import (
    ListSharedWithMeResponse,
)
from app.contracts.tenant import (
    ListTenantsResponse,
    TenantItem,
)


router = APIRouter(
    prefix="/me",
    tags=["me"],
)


@router.get("/tenants")
def list_my_tenants_endpoint(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List all tenants the authenticated user is a member of.

    RLS enforces: user only sees tenants they are a member of.
    Returns paginated list of tenants where user has membership.
    
    Access control:
    - Authenticated user can see only their own tenants
    - RLS filters tenant_members by auth.uid()
    """
    result = list_my_tenants(
        access_token=access_token,
        limit=limit,
        offset=offset,
    )
    
    """
    Extract tenants list from query result.
    Note: result.data contains tenant_members records with nested tenants info.
    We need to extract the tenant data from the nested structure.
    """
    tenants = []
    if result.data:
        for member in result.data:
            tenant_data = member.get("tenants")
            if tenant_data:
                tenants.append(
                    TenantItem(
                        id=tenant_data["id"],
                        name=tenant_data["name"],
                        created_at=tenant_data["created_at"],
                    )
                )
    
    return ApiResponse(
        success=True,
        data=ListTenantsResponse(
            tenants=tenants,
            total=result.count,
        ),
    )

@router.get("/invites/pending")
def list_my_invites_endpoint(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List all pending invites directed to the authenticated user.
    
    Returns invites where:
    - direction = 'invite'
    - status = 'pending'
    - user_id = authenticated user's id
    """
    
    result = list_my_invites(access_token, limit, offset)
    
    invites = result.data if result.data else []
    
    return ApiResponse(
        success=True,
        data=ListMyInvitesResponse(invites=invites),
    )


@router.get("/requests")
def list_my_join_requests_endpoint(
    status: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List all join requests sent by the authenticated user.
    
    Returns requests where:
    - direction = 'join'
    - initiated_by = authenticated user's id
    """
    
    result = list_my_join_requests(access_token, status, limit, offset)
    
    requests = result.data if result.data else []
    
    return ApiResponse(
        success=True,
        data=ListMyJoinRequestsResponse(requests=requests),
    )


@router.get("/notes/shared")
def list_shared_with_me_endpoint(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    access_token: str = Depends(get_current_access_token),
):
    """
    List all note shares granted to the authenticated user.
    
    Access control:
    - User can see only notes shared with them
    - RLS enforces access control at database level
    - Returns share records (note_id, permission, created_at)
    """
    
    result = list_shared_with_me(access_token, limit, offset)
    
    return ApiResponse(
        success=True,
        data=ListSharedWithMeResponse(
            shares=result.data if result.data else [],
            total=result.count,
        ),
    )
