from pydantic import BaseModel
from typing import Literal

class ChangeMemberRolePayload(BaseModel):
    new_role: Literal["owner", "admin", "member"]