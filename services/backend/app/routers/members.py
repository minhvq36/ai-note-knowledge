from uuid import UUID
from fastapi import APIRouter, Depends
from app.http.response import ApiResponse

from app.auth.deps import get_current_access_token
from app.db.membership import change_tenant_member_role
from app.errors.db import DomainError, map_db_error
from app.contracts.member import ChangeMemberRolePayload, ChangeMemberRoleResponse


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
