from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.task_schema import TaskChecklistUpdate
from app.services.activity_log_service import log_activity

from app.repository.task_repository import (
    get_checklist_item,
    update_checklist_item,
)


def update_checklist_item_service(
    task_db: Session,
    asset_db: Session,
    checklist_id: int,
    checklist_data: TaskChecklistUpdate,
    current_user
):
    try:

        checklist = get_checklist_item(
            task_db,
            checklist_id,
        )

        if not checklist:
            raise HTTPException(
                status_code=404,
                detail="Checklist item not found."
            )

        # -----------------------------------------
        # CAPTURE OLD VALUE
        # -----------------------------------------

        old_completed = checklist.is_completed

        #update

        checklist.is_completed = checklist_data.is_completed

        update_checklist_item(
            task_db,
            checklist,
        )

        # -----------------------------------------
        # ACTIVITY LOG
        # -----------------------------------------

        if old_completed != checklist.is_completed:

            action = (
                "COMPLETE_CHECKLIST"
                if checklist.is_completed
                else "UNCOMPLETE_CHECKLIST"
            )

            status_text = (
                "completed"
                if checklist.is_completed
                else "marked as incomplete"
            )

            log_activity(
                db=asset_db,
                created_by=current_user.id,
                module="TASK",
                action=action,
                item_type="TASK_CHECKLIST",
                item_id=checklist.id,
                item_name=getattr(
                    checklist,
                    "title",
                    f"Checklist #{checklist.id}"
                ),
                notes=(
                    f"Checklist item "
                    f"'{getattr(checklist, 'title', f'Checklist #{checklist.id}')}' "
                    f"was {status_text}."
                ),
                changes={
                    "is_completed": {
                        "old": old_completed,
                        "new": checklist.is_completed
                    }
                }
            )



        task_db.commit()

        return checklist

    except HTTPException:
        raise

    except Exception as e:

        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )