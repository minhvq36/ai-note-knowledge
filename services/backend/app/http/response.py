from typing import Any, Optional
from pydantic import BaseModel

class ErrorPayload(BaseModel):
    code: str
    message: str


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorPayload] = None
