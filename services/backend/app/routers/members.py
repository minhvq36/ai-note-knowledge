from fastapi import APIRouter, Depends

from app.auth.deps import get_current_access_token
from app.db.membership import change_tenant_member_role
from app.errors.db import map_db_error, DomainError
from app.errors.http import to_http_error


router = APIRouter(
    prefix="/tenants/{tenant_id}/members",
    tags=["members"],
)


@router.post("/{user_id}/role")
def change_member_role(
    tenant_id: str,
    user_id: str,
    payload: dict, # TO be replaced with a Pydantic model for better validation
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
    new_role = payload.get("new_role")

    """
    Execute RPC via database adapter.
    """
    try:
        result = change_tenant_member_role(
            access_token=access_token,
            tenant_id=tenant_id,
            target_user_id=user_id,
            new_role=new_role,
        )
        return result # TO CHECK WITH response shape and handle empty rowcount
    except DomainError as exc:
        raise to_http_error(exc)

    except Exception as exc:
        raise to_http_error(map_db_error(exc))
