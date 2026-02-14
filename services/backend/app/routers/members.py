from uuid import UUID
from fastapi import APIRouter, Depends
from app.http.response import ApiResponse

from app.auth.deps import get_current_access_token
from app.db.membership import change_tenant_member_role, remove_tenant_member
from app.errors.db import DomainError
from app.contracts.member import ChangeMemberRolePayload, ChangeMemberRoleResponse, RemoveMemberResponse


router = APIRouter(
    prefix="/tenants/{tenant_id}/members",
    tags=["members"],
)


@router.post("/{user_id}/role")
def change_member_role(
    tenant_id: UUID,
    user_id: UUID,
    payload: ChangeMemberRolePayload,
    access_token: str = Depends(get_current_access_token),
):
    """
    Change role of a tenant member.

    Domain rules enforced by database:
    - Only owners can change roles
    - Tenant must always have at least one owner
    - Target user must belong to the tenant
    - Concurrency safety is guaranteed
    """

    """
    Extract new role from request payload.
    Validation is intentionally minimal here.
    """
    new_role = payload.new_role

    """
    Execute RPC via database adapter.
    Router does not handle HTTP concerns.
    """
    result = change_tenant_member_role(
        access_token=access_token,
        tenant_id=tenant_id,
        target_user_id=user_id,
        new_role=new_role,
    )
    
    """
    RPC returns void. Return success confirmation.
    """
    return ApiResponse(
        success=True,
        data=ChangeMemberRoleResponse(),
    )


@router.delete("/{user_id}")
def remove_member(
    tenant_id: UUID,
    user_id: UUID,
    access_token: str = Depends(get_current_access_token),
):
    """
    Remove a tenant member.

    Domain rules enforced by database:
    - Only owners/admins can remove members
    - Admins cannot remove owners/other admins
    - Tenant must always have at least one owner
    - Target user must belong to the tenant
    - Concurrency safety is guaranteed
    """

    """
    Execute RPC via database adapter.
    Router does not handle business logic.
    """
    result = remove_tenant_member(
        access_token=access_token,
        tenant_id=tenant_id,
        target_user_id=user_id,
    )
    
    """
    RPC returns tuple (tenant_id, removed_user_id, result).
    Extract and return.
    """
    if not result.data:
        raise DomainError(
            message="Unexpected empty result from remove_tenant_member",
            code="INVARIANT_VIOLATION",
        )
    
    row = result.data[0]
    return ApiResponse(
        success=True,
        data=RemoveMemberResponse(
            tenant_id=row["tenant_id"],
            removed_user_id=row["removed_user_id"],
            result=row["result"],
        ),
    )
