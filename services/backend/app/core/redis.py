# English comments only

import redis.asyncio as redis
from fastapi import FastAPI
from app.config import settings


async def init_redis(app: FastAPI):
    """
    Initialize Redis and attach to app.state
    """
    try:
        client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )

        await client.ping()

        app.state.redis = client
        print("✅ Redis connected")

    except Exception as e:
        app.state.redis = None
        print("⚠️ Redis unavailable:", e)


async def close_redis(app: FastAPI):
    """
    Close Redis connection safely
    """
    redis_client = getattr(app.state, "redis", None)
    if redis_client:
        await redis_client.close()