from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_task_db,get_asset_db
from app.core.dependencies import get_current_user

from app.schemas.task_progress_schema import (
    TaskProgressCreate,
    TaskProgressResponse,
)

from app.services.task.progress_service import (
    create_task_progress_service,
    get_task_progress_service,
    get_task_progress_history_service
    
)

router = APIRouter(
    prefix="/apiV3/tasks",
    tags=["Task Progress"],
)


@router.post(
    "/{task_id}/progress",
    response_model=TaskProgressResponse,
)
async def create_task_progress(
    task_id: int,
    progress_data: TaskProgressCreate,
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user),
):
    return await create_task_progress_service(
        task_db=task_db,
        asset_db=asset_db,
        task_id=task_id,
        progress_data=progress_data,
        created_by=current_user.id,
    )

@router.get(
    "/{task_id}/progress",
    response_model=List[TaskProgressResponse],
)
def get_task_progress_history(
    task_id: int,
    db: Session = Depends(get_task_db),
):
    return get_task_progress_history_service(
        db=db,
        task_id=task_id,
    )

@router.get(
    "/progress/{progress_id}",
    response_model=TaskProgressResponse,
)
def get_task_progress(
    progress_id: int,
    db: Session = Depends(get_task_db),
):
    return get_task_progress_service(
        db=db,
        progress_id=progress_id,
    )




