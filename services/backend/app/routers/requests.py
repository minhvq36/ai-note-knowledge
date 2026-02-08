"""
HTTP endpoints for tenant join request and invite management.

Join request endpoints:
- POST /requests/{request_id}/approve - Owner/admin approves
- POST /requests/{request_id}/reject - Owner/admin rejects
- POST /requests/{request_id}/cancel - User cancels their request

Invite endpoints:
- POST /requests/{request_id}/accept - User accepts invite
- POST /requests/{request_id}/decline - User declines invite
- POST /requests/{request_id}/revoke - Owner/admin revokes invite
"""

from uuid import UUID
from fastapi import APIRouter, Depends
from app.http.response import ApiResponse
from app.auth.deps import get_current_access_token
from app.db.membership_requests import (
    approve_join_request,
    reject_join_request,
    cancel_join_request,
    accept_invite,
    decline_invite,
    revoke_invite,
)
from app.errors.db import DomainError
from app.contracts.request import (
    ApproveJoinRequestResponse,
    RejectJoinRequestResponse,
    CancelJoinRequestResponse,
    AcceptInviteResponse,
    DeclineInviteResponse,
    RevokeInviteResponse,
)


router = APIRouter(
    prefix="/requests",
    tags=["requests"],
)


@router.post("/{request_id}/approve")
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


@router.post("/{request_id}/reject")
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


@router.post("/{request_id}/cancel")
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


@router.post("/{request_id}/accept")
def accept_invite_endpoint(
    request_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    User accepts a pending invite to join a tenant.

    Domain rules enforced by database:
    - Caller must be the invited user
    - Request must be pending
    - Request must be an 'invite' request (not 'join')
    - Membership is created on acceptance
    """

    result = accept_invite(access_token, request_id)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Accept invite operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=AcceptInviteResponse(
            request_id=data["request_id"],
            result=data["result"],
        ),
    )


@router.post("/{request_id}/decline")
def decline_invite_endpoint(
    request_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    User declines a pending invite to join a tenant.

    Domain rules enforced by database:
    - Caller must be the invited user
    - Request must be pending
    - Request must be an 'invite' request (not 'join')
    - Membership is NOT created
    """

    result = decline_invite(access_token, request_id)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Decline invite operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=DeclineInviteResponse(
            request_id=data["request_id"],
            result=data["result"],
        ),
    )


@router.post("/{request_id}/revoke")
def revoke_invite_endpoint(
    request_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Owner/admin revokes a pending invite to join a tenant.

    Domain rules enforced by database:
    - Caller must be owner/admin of tenant
    - Request must be pending
    - Request must be an 'invite' request (not 'join')
    """

    result = revoke_invite(access_token, request_id)
    
    if not result.data or len(result.data) == 0:
        raise DomainError(
            message="Revoke invite operation returned no data",
            code="INVARIANT_VIOLATION",
        )
    
    data = result.data[0]
    
    return ApiResponse(
        success=True,
        data=RevokeInviteResponse(
            request_id=data["request_id"],
            result=data["result"],
        ),
    )
