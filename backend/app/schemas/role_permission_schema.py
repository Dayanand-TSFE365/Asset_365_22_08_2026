from pydantic import BaseModel
from typing import List


class UpdateRolePermissionSchema(BaseModel):

    permission_ids: List[int]