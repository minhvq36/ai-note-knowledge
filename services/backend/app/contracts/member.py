from pydantic import BaseModel
from typing import Literal
from uuid import UUID


class ChangeMemberRolePayload(BaseModel):
    new_role: Literal["owner", "admin", "member"]


class ChangeMemberRoleResponse(BaseModel):
    """
    Response when changing a member's role.
    RPC returns void, so we return success confirmation.
    """
    message: str = "Role changed successfully"