from pydantic import BaseModel
from typing import Optional


# -----------------------------------
# CREATE GROUP
# -----------------------------------

class CreateGroupRequest(
    BaseModel
):

    group_name:str

    description:Optional[str]=None



# -----------------------------------
# ASSIGN USER TO GROUP
# -----------------------------------

class AssignUserGroupRequest(
    BaseModel
):

    user_id:int

    group_id:int



# -----------------------------------
# REMOVE USER FROM GROUP
# -----------------------------------

class RemoveUserGroupRequest(
    BaseModel
):

    user_id:int

    group_id:int



# -----------------------------------
# ASSIGN PERMISSION TO GROUP
# -----------------------------------

class AssignGroupPermissionRequest(
    BaseModel
):

    group_id:int

    permission_id:int



# -----------------------------------
# REMOVE PERMISSION FROM GROUP
# -----------------------------------

class RemoveGroupPermissionRequest(
    BaseModel
):

    group_id:int

    permission_id:int