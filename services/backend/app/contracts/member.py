from pydantic import BaseModel
from typing import Literal

class ChangeMemberRolePayload(BaseModel):
    new_role: Literal["owner", "admin", "member"]


class CreateTenantPayload(BaseModel):
    """
    Payload for creating a new tenant.
    Caller automatically becomes the owner.
    """
    name: str