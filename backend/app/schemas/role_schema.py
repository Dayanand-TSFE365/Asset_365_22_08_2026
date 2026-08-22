from pydantic import BaseModel




class CreateRoleRequest(BaseModel):
    role_name:str
    description:str | None = None
    
    
class AssignRoleRequest(BaseModel):
    user_id:int
    role_id:int
    
    
class AssignPermissionRequest(BaseModel):
    role_id:int
    permission_id:int
    
    
class RemovePermissionRequest(BaseModel):
    role_id:int
    permission_id:int


class RemoveUserRoleRequest(BaseModel):
    user_id:int
    
    
class UpdateUserRoleRequest(
    BaseModel
):

    user_id:int

    role_id:int