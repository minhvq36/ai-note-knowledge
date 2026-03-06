# English comments only

from typing import Callable, Optional
from fastapi import Request, HTTPException, status, Depends

from app.core.dependencies import get_limiter
from app.core.rate_limit import RateLimiter
from app.core.network import resolve_client_ip


def rate_limit(
    *,
    scope: str = "ip",
    capacity: int = 10,
    refill_rate: float = 1.0,
    ttl: int = 120,
    key_builder: Optional[Callable[[Request], str]] = None,
):
    """
    Generic Rate Limit Dependency using RateLimiter service.

    Middleware is responsible ONLY for:
    - Extracting request context
    - Building key
    - Delegating to RateLimiter
    """

    async def dependency(
        request: Request,
        limiter: RateLimiter = Depends(get_limiter),
    ):
        # Build key
        if key_builder:
            key = key_builder(request)
            if not key:
                raise ValueError("key_builder must return a valid key")

        elif scope == "global":
            key = "rl:global"

        elif scope == "ip":
            ip = resolve_client_ip(request)
            key = f"rl:ip:{ip}"

        elif scope == "user":
            user_id = getattr(request.state, "user_id", "anonymous")
            key = f"rl:user:{user_id}"

        elif scope == "tenant":
            tenant_id = request.path_params.get("tenant_id")
            if not tenant_id:
                tenant_id = getattr(request.state, "tenant_id", "default")
            key = f"rl:tenant:{tenant_id}"

        else:
            raise ValueError(f"Unsupported scope: {scope}")

        # Delegate to service layer
        allowed = await limiter.is_allowed(
            key=key,
            capacity=capacity,
            refill_rate=refill_rate,
            ttl=ttl,
        )

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests",
            )

    return dependency