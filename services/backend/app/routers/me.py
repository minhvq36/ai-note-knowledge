"""
HTTP endpoints for authenticated user's personal membership requests and invites.

Endpoints:
- GET /me/invites/pending - List pending invites directed to authenticated user
- GET /me/requests - List join requests sent by authenticated user
"""

from fastapi import APIRouter, Depends, Query
from app.http.response import ApiResponse
from app.auth.deps import get_current_access_token
from app.db.membership_requests import list_my_invites, list_my_join_requests
from app.contracts.request import (
    ListMyInvitesResponse,
    ListMyJoinRequestsResponse,
)


router = APIRouter(
    prefix="/me",
    tags=["me"],
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
