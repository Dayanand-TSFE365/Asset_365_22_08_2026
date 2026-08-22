from pydantic import BaseModel
from typing import List


class LogFileResponse(BaseModel):
    status: str
    file: str
    lines: List[str]
    message: str | None = None