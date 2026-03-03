# English comments only

from fastapi import Request

# TO UPGRADE: resolver based on production proxy setup (e.g. X-Forwarded-For, Cloudflare headers, Nginx real_ip module, etc.)
def resolve_client_ip(request: Request) -> str:
    """
    Resolve client IP address.

    Current implementation:
    - Direct client host (dev mode)

    This function is intentionally isolated so that
    production proxy logic can be added later without
    touching routers or middleware.
    """

    return request.client.host if request.client else "unknown"