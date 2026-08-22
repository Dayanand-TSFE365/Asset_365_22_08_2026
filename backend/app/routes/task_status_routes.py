from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List


from app.db.database import get_task_db,get_asset_db
from app.core.dependencies import get_current_user

from app.schemas.task_status_history_schema import (
    TaskStatusUpdate,
    TaskStatusHistoryResponse,
)
from app.schemas.task_schema import TaskCloseSchema

from app.services.task.task_status_service import (
    change_task_status_service,
    get_task_status_history_service,
    
)

from app.services.task.close_task_service import close_task_service
router = APIRouter(
    prefix="/apiV3/tasks",
    tags=["Task Status"],
)

@router.patch(
    "/{task_id}/status",
)
async def change_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user),
):
    
    return await change_task_status_service(
        task_db=task_db,
        asset_db=asset_db,
        task_id=task_id,
        status_data=status_data,
        changed_by=current_user.id
    )

@router.get(
    "/{task_id}/status-history",
    response_model=List[TaskStatusHistoryResponse],
)
def get_task_status_history(
    task_id: int,
    db: Session = Depends(get_task_db),
):
    return get_task_status_history_service(
        db=db,
        task_id=task_id,
    )

@router.patch(
    "/{task_id}/close",
)
def close_task(
    task_id: int,
    data: TaskCloseSchema,
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user),
):
    return close_task_service(
    task_db,
    asset_db,
    task_id,
    close_data=data,
    approved_by=current_user.id,
)
    # return close_task_service(
    #     db=db,
    #     task_id=task_id,
    #     close_data=data,
    #     approved_by=current_user.id,
    # )