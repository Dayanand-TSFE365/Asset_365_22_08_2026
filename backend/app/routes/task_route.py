from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.db.database import get_task_db,get_asset_db
from app.schemas.task_schema import (
    TaskAssign,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TaskChecklistUpdate
)
from app.services.task.task_service import create_task_service,get_all_tasks_service,get_task_service,delete_task_service,get_deleted_tasks_service,restore_task_service,permanently_delete_task_service
from app.services.task.update_task_service import update_task_service
from app.services.task.assign_task_service import assign_task_service
from app.services.task.attachment_service import delete_task_attachment_service,get_task_attachments_service,upload_task_attachments_service
from app.services.task.task_checklist_service import update_checklist_item_service
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/apiV3/tasks",
    tags=["Task Management"],
)


@router.post(
    "/",
    response_model=TaskResponse,
)
async def create_task(
    task_data: TaskCreate,
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user),
):
    return await create_task_service(
        task_db=task_db,
        asset_db=asset_db,
        task_data=task_data,
        created_by=current_user.id,
    )

@router.get(
    "/",
    response_model=List[TaskResponse],
)
def get_all_tasks(
    db: Session = Depends(get_task_db),
):
    return get_all_tasks_service(db)


@router.get("/deleted")
def get_deleted_tasks(
    db: Session = Depends(get_task_db),
    # current_user=Depends(get_current_user)
):
    return get_deleted_tasks_service(
        db=db,
        # current_user=current_user
    )


@router.patch("/{task_id}/restore")
def restore_task(
    task_id: int,
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    return restore_task_service(
        task_db=task_db,
        asset_db=asset_db,
        task_id=task_id,
        current_user=current_user
    )

@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_task(
    task_id: int,
    db: Session = Depends(get_task_db),
):
    return get_task_service(
        db=db,
        task_id=task_id,
    )





@router.patch("/{task_id}/assign",
               response_model=TaskResponse,)
async def assign_task(
    task_id: int,
    assign_data: TaskAssign,
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user),
):
    return await assign_task_service(
        task_db=task_db,
        asset_db=asset_db,
        task_id=task_id,
        assign_data=assign_data,
        assigned_by=current_user.id,
    )

@router.post(
    "/{task_id}/attachments"
)
async def upload_task_attachments(
    task_id: int,
    files: List[UploadFile] = File(...),
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user),
):
    return await upload_task_attachments_service(
        task_db=task_db,
        asset_db=asset_db,
        task_id=task_id,
        uploaded_by=current_user.id,
        files=files,
    )


@router.delete("/{task_id}/permanent")
def permanently_delete_task(
    task_id: int,
    db: Session = Depends(get_task_db),
    current_user=Depends(get_current_user)
):
    return permanently_delete_task_service(
        db=db,
        task_id=task_id,
        current_user=current_user
    )

@router.get(
    "/{task_id}/attachments"
)
def get_task_attachments(
    task_id: int,
    db: Session = Depends(get_task_db),
):
    return get_task_attachments_service(
        db,
        task_id,
    )

@router.put("/{task_id}")
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user),
):
    return update_task_service(
        task_db=task_db,
        asset_db=asset_db,
        task_id=task_id,
        task_data=task_data,
        updated_by=current_user.id,
    )

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    task_db: Session = Depends(get_task_db),
    asset_db: Session=Depends(get_asset_db),
    current_user= Depends(get_current_user)
):
    return delete_task_service(
        task_db=task_db,
        asset_db=asset_db,
        task_id=task_id,
        current_user=current_user
    )


@router.delete(
    "/attachments/{attachment_id}"
)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_task_db),
    current_user= Depends(get_current_user)
):
    return delete_task_attachment_service(
        db,
        attachment_id,
        current_user
    )



@router.patch(
    "/checklists/{checklist_id}",
)
def update_checklist(
    checklist_id: int,
    checklist_data: TaskChecklistUpdate,
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user= Depends(get_current_user)
):
    return update_checklist_item_service(
        task_db,
        asset_db,
        checklist_id,
        checklist_data,
        current_user=current_user
    )