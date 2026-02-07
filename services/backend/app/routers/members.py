from uuid import UUID
from fastapi import APIRouter, Depends

from app.auth.deps import get_current_access_token
from app.db.membership import change_tenant_member_role
from app.errors.db import DomainError, map_db_error
from app.contracts.member import ChangeMemberRolePayload


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
    try:
        result = change_tenant_member_role(
            access_token=access_token,
            tenant_id=str(tenant_id),
            target_user_id=str(user_id),
            new_role=new_role,
        )
        return result  # TO CHECK: response shape and empty rowcount handling

    except DomainError:
        """
        Propagate domain error upward.
        HTTP translation is handled by global exception handler.
        """
        raise

    except Exception as exc:
        """
        Translate unexpected infrastructure errors into domain errors.
        """
        raise map_db_error(exc)
