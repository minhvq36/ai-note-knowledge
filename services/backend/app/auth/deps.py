from fastapi import Header, HTTPException, status


def get_current_access_token(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Extract access token from Authorization header.

    Expected format:
        Authorization: Bearer <access_token>

    This function:
    - Does NOT decode or verify JWT
    - Does NOT inspect claims
    - Only ensures token presence and basic format

    The database (RLS + auth.uid()) is the single source of truth
    for authentication and authorization.
    """

    """
    Authorization header must be present.
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    """
    Authorization header must start with 'Bearer '.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format",
        )

    """
    Extract raw access token.
    """
    access_token = authorization.removeprefix("Bearer ").strip()

    """
    Access token must not be empty.
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty access token",
        )

    return access_token
