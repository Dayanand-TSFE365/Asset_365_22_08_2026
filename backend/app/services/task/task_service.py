from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from typing import List, Optional
import os
import shutil


from app.repository.master_repo import get_employee_by_auth_user_id

from app.services.email.task_email_service import (
    send_new_task_assignment_email,
)

from app.services.task.notification_helper import (
    notify_user,
    push_notification,
    get_notification_receiver,
)

from app.celery_task.task_email_tasks import (
    send_new_task_assignment_email_task,
)

from app.models.task_model import Task
from app.models.task_checklist_model import TaskChecklist
from app.models.task_attachment_model import TaskAttachment
from app.models.task_assignment_history_model import TaskAssignmentHistory

from app.schemas.task_schema import TaskCreate

from app.repository.task_repository import(
    get_task_by_id,
    get_all_tasks,
    create_task,
    create_attachment,
    create_assignment_history,
    create_checklist_item,
    delete_task,
    get_deleted_tasks,
    get_deleted_task_by_id,
    restore_task,
    permanently_delete_task
     ) 
from app.core.config import settings

from app.services.activity_log_service import log_activity


UPLOAD_DIR = os.path.join(
    settings.UPLOAD_DIR,
    "tasks"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_unique_filename(directory: str, filename: str) -> str:
    """
    Returns a unique filename.

    Example:
        report.pdf
        report_1.pdf
        report_2.pdf
    """

    base_name, extension = os.path.splitext(filename)

    new_filename = filename
    counter = 1

    while os.path.exists(os.path.join(directory, new_filename)):
        new_filename = f"{base_name}_{counter}{extension}"
        counter += 1

    return new_filename

async def create_task_service(
    task_db: Session,
    asset_db: Session,
    task_data: TaskCreate,
    created_by: int,
    files: Optional[List[UploadFile]] = None,
):
    try:

        if not task_data.title.strip():
            raise HTTPException(
                status_code=400,
                detail="Task title is required."
            )

        # ----------------------------------------------------
        # Get Assigned Employee
        # ----------------------------------------------------

        assignee = None
        department = None

        if task_data.assigned_to:

            assignee = get_employee_by_auth_user_id(
                asset_db,
                task_data.assigned_to,
            )

            if not assignee:
                raise HTTPException(
                    status_code=404,
                    detail="Assigned employee not found."
                )

            department = assignee.department

        # ----------------------------------------------------
        # Create Task
        # ----------------------------------------------------

        task = Task(
            title=task_data.title,
            description=task_data.description,
            assigned_to=task_data.assigned_to,
            priority=task_data.priority,
            department=department,
            estimated_hours=task_data.estimated_hours,
            deadline=task_data.deadline,
            created_by=created_by,
        )

        task = create_task(task_db, task)

        # ----------------------------------------------------
        # Checklist
        # ----------------------------------------------------

        for item in task_data.checklists:

            checklist = TaskChecklist(
                task_id=task.id,
                title=item.title,
                is_completed=item.is_completed,
            )

            create_checklist_item(task_db, checklist)

        # ----------------------------------------------------
        # Attachments
        # ----------------------------------------------------

        if files:

            task_folder = os.path.join(
                UPLOAD_DIR,
                str(task.id)
            )

            os.makedirs(task_folder, exist_ok=True)

            for file in files:

                filename = get_unique_filename(
                    task_folder,
                    file.filename
                )

                file_path = os.path.join(
                    task_folder,
                    filename
                )
                file.file.seek(0, os.SEEK_END)
                file_size = file.file.tell()
                file.file.seek(0)

                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                attachment = TaskAttachment(
                    task_id=task.id,
                    file_name=filename,
                    file_path=file_path,
                    file_size=file_size,
                    uploaded_by=created_by,
                )

                create_attachment(
                    task_db,
                    attachment,
                )

        # ----------------------------------------------------
        # Assignment History
        # ----------------------------------------------------
        notification = None
        if task.assigned_to:

            history = TaskAssignmentHistory(
                task_id=task.id,
                old_assignee=None,
                new_assignee=task.assigned_to,
                assigned_by=created_by,
                note="Task Assigned During Creation",
            )

            create_assignment_history(
                task_db,
                history,
            )
            notification = notify_user(
                db=task_db,
                task_id=task.id,
                user_id=task.assigned_to,
                notification_type="assignment",
                title="New Task Assigned",
                message=f"You have been assigned a new task: '{task.title}'.",
                created_by=created_by,
                )


        log_activity(
            db=asset_db,
            created_by=created_by,
            module="TASK",
            action="CREATE",
            item_type="TASK",
            item_id=task.id,
            item_name=task.title,
            notes=(
                f"Created task '{task.title}'."
            ),
            changes={
                "title": task.title,
                "description": task.description,
                "assigned_to": task.assigned_to,
                "priority": task.priority,
                "department": task.department,
                "estimated_hours": task.estimated_hours,
                "deadline": str(task.deadline) if task.deadline else None,
            }
        )

        task_db.commit()

        if notification:
            await push_notification(notification)

        assignee = None

        if task.assigned_to:
            assignee = get_employee_by_auth_user_id(
                asset_db,
                task.assigned_to,
            )


        creator = get_employee_by_auth_user_id(
            asset_db,
            created_by,
        )

        try:

            if assignee and assignee.email:

                # await send_new_task_assignment_email(
                send_new_task_assignment_email_task.delay(

                    email=assignee.email,

                    employee_name=assignee.full_name,

                    task_title=task.title,

                    assigned_by=(
                        creator.full_name
                        if creator
                        else "Manager"
                    ),

                    reason="Task Assigned",

                    deadline=(
                        str(task.deadline)
                        if task.deadline
                        else "-"
                    ),

                )

        except Exception as e:

            print(
                "Task assignment email failed:",
                e
            )

        return get_task_by_id(task_db, task.id)

    except HTTPException:
        task_db.rollback()
        raise

    except Exception as e:
        task_db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create task: {str(e)}"
        )





def get_task_service(
    db: Session,
    task_id: int,
):
    try:

        task = get_task_by_id(
            db,
            task_id,
        )

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found."
            )

        return task

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch task: {str(e)}"
        )


def get_all_tasks_service(
    db: Session,
):
    try:

        tasks = get_all_tasks(db)

        return tasks

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch tasks: {str(e)}"
        )

def get_deleted_tasks_service(
    db: Session,
    # current_user
):
    # if current_user.role.lower() != "superadmin":
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Only SuperAdmin can view deleted tasks."
    #     )

    return get_deleted_tasks(db) 


def restore_task_service(
    task_db: Session,
    asset_db: Session,
    task_id: int,
    current_user
):
    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Only SuperAdmin can restore tasks."
        )

    task = get_deleted_task_by_id(
        task_db,
        task_id
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Deleted task not found."
        )

    task = restore_task(
        task_db,
        task
    )

    log_activity(
        db=asset_db,
        created_by=current_user.id,
        module="TASK",
        action="RESTORE",
        item_type="TASK",
        item_id=task.id,
        item_name=task.title,
        notes=(
            f"Restored task '{task.title}'."
        )
    )

    task_db.commit()
    task_db.refresh(task)

    return {
        "message": "Task restored successfully.",
        "task_id": task.id
    }


def delete_task_service(
    task_db: Session,
    asset_db: Session,
    task_id: int,
    current_user
):
    try:

        task = get_task_by_id(
            task_db,
            task_id,
        )

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found."
            )

        log_activity(
            db=asset_db,
            created_by=current_user.id,
            module="TASK",
            action="DELETE",
            item_type="TASK",
            item_id=task.id,
            item_name=task.title,
            notes=(
                f"Deleted task '{task.title}'."
            )
        )

        delete_task(
            task_db,
            task,
        )

        task_db.commit()

        return {
            "message": "Task deleted successfully."
        }

    except HTTPException:
        raise

    except Exception as e:

        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


def permanently_delete_task_service(
    db: Session,
    task_id: int,
    current_user
):
    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Only SuperAdmin can permanently delete tasks."
        )

    task = get_deleted_task_by_id(
        db,
        task_id
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Deleted task not found."
        )

    # Save values before deleting
    deleted_task_id = task.id
    task_name = task.title

    log_activity(
        db=db,
        created_by=current_user.id,
        module="TASK",
        action="PERMANENT_DELETE",
        item_type="TASK",
        item_id=deleted_task_id,
        item_name=task_name,
        notes=(
            f"Permanently deleted task "
            f"'{task_name}'."
        )
    )

    permanently_delete_task(
        db,
        task
    )

    db.commit()

    return {
        "message": "Task permanently deleted successfully."
    }