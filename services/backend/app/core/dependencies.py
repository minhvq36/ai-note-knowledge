# English comments only

from fastapi import Request
from app.core.rate_limit import RateLimiter


def get_limiter(request: Request) -> RateLimiter:
    """
    Centralized limiter resolver.

    This is the ONLY place that knows about app.state.limiter.
    Routers and middleware must depend on RateLimiter,
    not TokenBucket.
    """

    limiter = getattr(request.app.state, "limiter", None)

    if not limiter:
        raise RuntimeError(
            "RateLimiter not initialized. Did you forget to init in startup?"
        )

    return limiter