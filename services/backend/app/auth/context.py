# English comments only

import jwt
from fastapi import Request, Depends

from app.auth.deps import get_current_access_token


async def attach_user_context(
    request: Request,
    token: str = Depends(get_current_access_token),
):
    """
    Extract user_id from JWT without verification.
    Used only for rate limiting and request context.
    """

    payload = jwt.decode(token, options={"verify_signature": False})

    user_id = payload.get("sub")

    request.state.user_id = user_id