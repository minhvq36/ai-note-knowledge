"""
HTTP endpoints for tenant join request management.

Endpoints:
- POST /tenants/{tenant_id}/requests/join - User requests to join
- POST /requests/{request_id}/approve - Owner/admin approves
- POST /requests/{request_id}/reject - Owner/admin rejects
- POST /requests/{request_id}/cancel - User cancels their request
"""

from uuid import UUID
from fastapi import APIRouter, Depends
from app.http.response import ApiResponse
from app.auth.deps import get_current_access_token
from app.db.invites import (
    request_join_tenant,
    approve_join_request,
    reject_join_request,
    cancel_join_request,
)
from app.errors.db import DomainError
from app.contracts.request import (
    RequestJoinTenantResponse,
    ApproveJoinRequestResponse,
    RejectJoinRequestResponse,
    CancelJoinRequestResponse,
)


router = APIRouter(
    prefix="",
    tags=["requests"],
)


@router.post("/tenants/{tenant_id}/requests/join")
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


@router.post("/requests/{request_id}/approve")
def approve_join_request_endpoint(
    request_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Owner/admin approves a pending join request.

    Domain rules enforced by database:
    - Caller must be owner/admin of tenant
    - Request must be pending
    - Request must be a 'join' request (not 'invite')
    - Membership is created on approval
    """

    result = approve_join_request(access_token, request_id)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Approve request operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=ApproveJoinRequestResponse(
            request_id=data["request_id"],
            result=data["result"],
        ),
    )


@router.post("/requests/{request_id}/reject")
def reject_join_request_endpoint(
    request_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Owner/admin rejects a pending join request.

    Domain rules enforced by database:
    - Caller must be owner/admin of tenant
    - Request must be pending
    - Request must be a 'join' request (not 'invite')
    - Membership is NOT created
    """

    result = reject_join_request(access_token, request_id)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Reject request operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=RejectJoinRequestResponse(
            request_id=data["request_id"],
            result=data["result"],
        ),
    )


@router.post("/requests/{request_id}/cancel")
def cancel_join_request_endpoint(
    request_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    User cancels their own pending join request.

    Domain rules enforced by database:
    - Caller must be the requester
    - Request must be pending
    - Request must be a 'join' request (not 'invite')
    """

    result = cancel_join_request(access_token, request_id)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Cancel request operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=CancelJoinRequestResponse(
            request_id=data["request_id"],
            result=data["result"],
        ),
    )
