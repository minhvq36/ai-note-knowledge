# English comments only

from typing import Callable, Optional
from fastapi import Request, HTTPException, status
from app.core.rate_limit import TokenBucket


def rate_limit(
    bucket: TokenBucket,
    *,
    scope: str = "global",
    capacity: int = 10,
    refill_rate: float = 1.0,
    ttl: int = 120,
    key_builder: Optional[Callable[[Request], str]] = None,
):
    """
    Generic Rate Limit Dependency.

    Args:
        bucket: TokenBucket engine instance
        scope: global | ip | user | tenant | custom
        capacity: max tokens
        refill_rate: tokens per second
        ttl: redis key ttl
        key_builder: optional custom key builder override

    Usage:
        Depends(rate_limit(...))
    """

    async def dependency(request: Request):
        # Build key
        if key_builder:
            key = key_builder(request)

        elif scope == "global":
            key = "rl:global"

        elif scope == "ip":
            ip = request.client.host if request.client else "unknown"
            key = f"rl:ip:{ip}"

        elif scope == "user":
            # Expect request.state.user to be set by auth middleware
            user = getattr(request.state, "user", None)
            user_id = getattr(user, "id", "anonymous")
            key = f"rl:user:{user_id}"

        elif scope == "tenant":
            tenant_id = getattr(request.state, "tenant_id", "default")
            key = f"rl:tenant:{tenant_id}"

        else:
            raise ValueError(f"Unsupported rate limit scope: {scope}")

        allowed = await bucket.consume(
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