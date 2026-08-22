from pydantic import BaseModel
from typing import List


class PermissionResponse(BaseModel):

    permissions: List[str]
    
    



class CreatePermissionRequest(BaseModel):

    permission_code:str

    module_name:str
    
    
class AssignUserPermissionRequest(
    BaseModel
):

    user_id:int

    permission_id:int



class RemoveUserPermissionRequest(
    BaseModel
):

    user_id:int

    permission_id:int