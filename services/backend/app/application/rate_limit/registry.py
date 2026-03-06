'''
BLOCK COMMENT:
Final Professional Security Bundles.
Each bundle represents a specific 'Shield Level'.
Order of Depends is optimized for performance (IP check first).
'''
from fastapi import Depends
from app.auth.context import attach_user_context
from app.middleware.rate_limit import rate_limit
from app.application.rate_limit.policies import Policy


class RateLimitRegistry:
    # (1) IP_ONLY: For non-auth endpoints (Login/Register)
    IP_ONLY = [
        Depends(rate_limit(**Policy.IP_STANDARD))
    ]

    # (2) USER_ONLY: For personal space (Me/Profile)
    USER_ONLY = [
        Depends(attach_user_context), 
        Depends(rate_limit(**Policy.USER_STANDARD))
    ]

    # (4) IP_USER: Double shield for global discovery (List Tenants)
    IP_USER = [
        Depends(rate_limit(**Policy.IP_STANDARD)),
        Depends(attach_user_context),
        Depends(rate_limit(**Policy.USER_STANDARD))
    ]

    # (5a) USER_TENANT_NORMAL: Standard SaaS writes (Notes/Shares)
    USER_TENANT_NORMAL = [
        Depends(attach_user_context),
        Depends(rate_limit(**Policy.USER_STANDARD)),
        Depends(rate_limit(**Policy.TENANT_WRITE_NORMAL))
    ]

    # (5b) USER_TENANT_CRITICAL: Admin actions (Invites/Roles/Delete)
    USER_TENANT_CRITICAL = [
        Depends(attach_user_context),
        Depends(rate_limit(**Policy.USER_STANDARD)),
        Depends(rate_limit(**Policy.TENANT_HEAVY_WRITE))
    ]

    # (6) TENANT_READ: Viewing shared tenant resources
    TENANT_READ = [
        Depends(attach_user_context),
        Depends(rate_limit(**Policy.TENANT_STANDARD))
    ]