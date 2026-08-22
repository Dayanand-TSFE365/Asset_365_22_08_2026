from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.schemas.task_schema import TaskUpdate

from app.repository.task_repository import (
    get_task_by_id,
    update_task,
)

from app.services.activity_log_service import log_activity


def update_task_service(
    task_db: Session,
    asset_db: Session,
    task_id: int,
    task_data: TaskUpdate,
    updated_by: int,
):
    try:

        # -----------------------------------------
        # GET TASK
        # -----------------------------------------

        task = get_task_by_id(
            task_db,
            task_id,
        )

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found."
            )

        # -----------------------------------------
        # CAPTURE OLD VALUES
        # -----------------------------------------

        old_values = {
            "title": task.title,
            "description": task.description,
            "deadline": task.deadline,
            "department": task.department,
            "estimated_hours": task.estimated_hours,
        }

        # -----------------------------------------
        # UPDATE TASK
        # -----------------------------------------

        task.title = task_data.title.strip()

        task.description = task_data.description

        task.deadline = task_data.deadline

        task.department = task_data.department

        task.estimated_hours = task_data.estimated_hours

        # -----------------------------------------
        # FIND CHANGES
        # -----------------------------------------

        changed_fields = []

        if old_values["title"] != task.title:
            changed_fields.append(
                f"Title: '{old_values['title']}' → '{task.title}'"
            )

        if old_values["description"] != task.description:
            changed_fields.append(
                "Description updated"
            )

        if old_values["deadline"] != task.deadline:
            changed_fields.append(
                f"Deadline: '{old_values['deadline']}' → "
                f"'{task.deadline}'"
            )

        if old_values["department"] != task.department:
            changed_fields.append(
                f"Department: '{old_values['department']}' → "
                f"'{task.department}'"
            )

        if old_values["estimated_hours"] != task.estimated_hours:
            changed_fields.append(
                f"Estimated Hours: "
                f"'{old_values['estimated_hours']}' → "
                f"'{task.estimated_hours}'"
            )

        # -----------------------------------------
        # SAVE TASK
        # -----------------------------------------

        task = update_task(
            task_db,
            task,
        )

        # -----------------------------------------
        # ACTIVITY LOG
        # IMPORTANT:
        # activity_logs is in Asset365 DB
        # -----------------------------------------

        log_activity(
            db=asset_db,
            created_by=updated_by,
            module="TASK",
            action="UPDATE",
            item_type="TASK",
            item_id=task.id,
            item_name=task.title,
            notes=(
                f"Updated task '{task.title}'. "
                + (
                    f"Changes: {', '.join(changed_fields)}."
                    if changed_fields
                    else "No field values changed."
                )
            ),
            changes={
                "old_values": {
                    "title": old_values["title"],
                    "description": old_values["description"],
                    "deadline": (
                        str(old_values["deadline"])
                        if old_values["deadline"]
                        else None
                    ),
                    "department": old_values["department"],
                    "estimated_hours": (
                        str(old_values["estimated_hours"])
                        if old_values["estimated_hours"]
                        else None
                    ),
                },
                "new_values": {
                    "title": task.title,
                    "description": task.description,
                    "deadline": (
                        str(task.deadline)
                        if task.deadline
                        else None
                    ),
                    "department": task.department,
                    "estimated_hours": (
                        str(task.estimated_hours)
                        if task.estimated_hours
                        else None
                    ),
                }
            }
        )

        # -----------------------------------------
        # COMMIT BOTH DATABASES
        # -----------------------------------------

        task_db.commit()
        asset_db.commit()

        task_db.refresh(task)

        return get_task_by_id(
            task_db,
            task.id,
        )

    except HTTPException:
        task_db.rollback()
        asset_db.rollback()
        raise

    except Exception as e:

        task_db.rollback()
        asset_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update task: {str(e)}",
        )