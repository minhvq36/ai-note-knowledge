from uuid import UUID
from fastapi import APIRouter, Depends
from app.http.response import ApiResponse

from app.auth.deps import get_current_access_token
from app.db.membership import leave_tenant
from app.db.tenants import create_tenant, delete_tenant
from app.errors.db import DomainError, map_db_error
from app.contracts.tenant import (
    CreateTenantPayload,
    CreateTenantResponse,
    DeleteTenantResponse,
    LeaveTenantResponse,
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
    try:
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
    try:
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
    try:
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
