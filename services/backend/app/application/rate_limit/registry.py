"""
BLOCK COMMENT:
Rate limit policy registry.

Purpose:
- Central place mapping endpoints to rate limit policies
- Keeps routers clean and consistent
- Allows easy adjustment of limits without touching route code

Usage:
    Depends(rate_limit(**RateLimitRegistry.NOTES_LIST))
"""

from app.application.rate_limit.policies import Policy


class RateLimitRegistry:
    """
    Central registry of rate limit policies for API endpoints.
    """

    # -------------------------------------------------
    # USER SCOPED
    # -------------------------------------------------

    """
    Standard authenticated user operations.
    """
    USER_STANDARD = Policy.USER_STANDARD

    """
    Relaxed limit for search-like operations.
    """
    USER_SEARCH = Policy.USER_SEARCH_RELAXED


    # -------------------------------------------------
    # TENANT SCOPED
    # -------------------------------------------------

    """
    Tenant-level operations (shared workspace resources).
    """
    TENANT_STANDARD = Policy.TENANT_STANDARD

    """
    Heavy write operations affecting shared tenant data.
    """
    TENANT_HEAVY_WRITE = Policy.TENANT_HEAVY_WRITE


    # -------------------------------------------------
    # IP SCOPED
    # -------------------------------------------------

    """
    Public endpoints protection (login, auth, etc).
    """
    IP_STANDARD = Policy.IP_STANDARD

    """
    Temporary burst allowance (for scraping spikes or batch jobs).
    """
    IP_BURST = Policy.IP_BURST


    # -------------------------------------------------
    # GLOBAL SCOPED
    # -------------------------------------------------

    """
    Global system-wide protection.
    """
    GLOBAL_STANDARD = Policy.GLOBAL_STANDARD

    """
    Administrative / maintenance operations.
    """
    GLOBAL_ADMIN = Policy.GLOBAL_ADMIN


    # -------------------------------------------------
    # SPECIFIC ENDPOINTS (OPTIONAL)
    # -------------------------------------------------

    """
    Frequently used endpoint presets.
    These make router code even cleaner.
    """

    NOTES_LIST = Policy.USER_STANDARD

    NOTES_UPDATE = Policy.TENANT_HEAVY_WRITE

    NOTES_SHARE = Policy.TENANT_HEAVY_WRITE

    TENANT_MEMBER_CHANGE_ROLE = Policy.TENANT_HEAVY_WRITE

    TENANT_MEMBER_REMOVE = Policy.TENANT_HEAVY_WRITE