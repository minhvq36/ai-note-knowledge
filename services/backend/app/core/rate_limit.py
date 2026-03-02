# English comments only

import time
from typing import Optional


class TokenBucket:
    """
    Write Once, Run Everywhere Token Bucket Engine.

    - Storage: Redis
    - Scope: Defined entirely by key
    - Async
    - TTL supported
    - Redis fail-safe
    - Logger hook optional
    - Non-atomic (can upgrade to Lua later)
    """

    def __init__(self, redis_client, logger: Optional[object] = None):
        self.redis = redis_client
        self.logger = logger

    async def consume(
        self,
        key: str,
        capacity: int,
        refill_rate: float,   # tokens per second
        ttl: int = 120,
    ) -> bool:
        """
        Attempt to consume one token.

        Args:
            key: Unique bucket identifier
            capacity: Maximum tokens
            refill_rate: Tokens added per second
            ttl: Expiration for Redis key

        Returns:
            True  -> allowed
            False -> rejected
        """

        # Fail-safe: Redis unavailable
        if not self.redis:
            if self.logger:
                self.logger.warning(
                    f"RateLimit bypass (Redis unavailable) key={key}"
                )
            return True

        try:
            now = time.time()

            bucket = await self.redis.hgetall(key)

            # First request → initialize bucket
            if not bucket:
                tokens = capacity - 1

                await self.redis.hset(
                    key,
                    mapping={
                        "tokens": tokens,
                        "last_refill": now,
                    },
                )
                await self.redis.expire(key, ttl)

                if self.logger:
                    self.logger.debug(f"RateLimit init key={key}")

                return True

            # Parse stored values
            tokens = float(bucket.get("tokens", 0))
            last_refill = float(bucket.get("last_refill", now))

            # Calculate refill amount
            elapsed = now - last_refill
            refill_amount = elapsed * refill_rate

            # Refill bucket
            tokens = min(capacity, tokens + refill_amount)

            # Not enough tokens
            if tokens < 1:
                if self.logger:
                    self.logger.info(f"RateLimit reject key={key}")
                return False

            # Consume one token
            tokens -= 1

            # Persist updated state
            await self.redis.hset(
                key,
                mapping={
                    "tokens": tokens,
                    "last_refill": now,
                },
            )

            await self.redis.expire(key, ttl)

            if self.logger:
                self.logger.debug(f"RateLimit consume key={key}")

            return True

        except Exception as e:
            # Fail-safe on Redis error
            if self.logger:
                self.logger.error(
                    f"RateLimit error key={key} error={str(e)}"
                )
            return True

# English comments only


class RateLimiter:
    """
    Service layer wrapper around TokenBucket.

    Router and dependencies must interact with this class,
    not directly with TokenBucket.

    This allows future extension:
    - Multiple engines
    - Strategy-based limits
    - Plan-based limits
    - Memory fallback
    """

    def __init__(self, bucket: TokenBucket):
        self.bucket = bucket

    async def is_allowed(
        self,
        key: str,
        capacity: int,
        refill_rate: float,
        ttl: int = 120,
    ) -> bool:
        """
        Delegates token consumption to underlying bucket engine.
        """

        return await self.bucket.consume(
            key=key,
            capacity=capacity,
            refill_rate=refill_rate,
            ttl=ttl,
        )