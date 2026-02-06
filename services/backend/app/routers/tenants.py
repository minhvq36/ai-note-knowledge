from fastapi import APIRouter, Depends

from app.auth.deps import get_current_access_token
from app.db.membership import leave_tenant
from app.errors.db import DomainError, map_db_error


router = APIRouter(
    prefix="/tenants",
    tags=["tenants"],
)


@router.post("/{tenant_id}/leave")
def leave_tenant_endpoint(
    tenant_id: str,
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
    try:
        result = leave_tenant(
            access_token=access_token,
            tenant_id=tenant_id,
        )
        return result

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
