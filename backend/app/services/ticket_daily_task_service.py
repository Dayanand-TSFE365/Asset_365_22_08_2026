from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.ticket_daily_task_model import TicketDailyTask

from app.repository.ticket_daily_task_repo import (
    create_daily_task_repo,
    get_daily_tasks_repo,
    get_daily_task_by_id_repo,
    update_daily_task_repo,
    delete_daily_task_repo,
    create_bulk_daily_task_repo
)
from app.repository.ticket_repo import (
    get_ticket_by_id_repo,
    update_ticket_repo
)
from app.core.ticket_constants import (
    TICKET_STATUS
)


from app.schemas.ticket_daily_task_schema import (
    CreateTicketDailyTaskSchema,
    UpdateTicketDailyTaskSchema,
    UpdateTicketDailyTaskSelectionSchema,
    BulkCreateDailyTaskSchema
)


def create_daily_task_service(
    db: Session,
    ticket_id: int,
    data: CreateTicketDailyTaskSchema,
    current_user_id: int
):
    ticket = get_ticket_by_id_repo(
        db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    if ticket.status_id == TICKET_STATUS["OPEN"]:

        ticket.status_id = TICKET_STATUS["IN_PROGRESS"]

        update_ticket_repo(
            db,
            ticket
        )

    task = TicketDailyTask(

        ticket_id=ticket_id,

        task_description=data.task_description,

        work_date=data.work_date or date.today(),

        created_by=current_user_id

    )

    return create_daily_task_repo(
        db,
        task
    )


def get_daily_tasks_service(
    db: Session,
    ticket_id: int
):
    return get_daily_tasks_repo(
        db,
        ticket_id
    )


def update_daily_task_service(
    db: Session,
    task_id: int,
    data: UpdateTicketDailyTaskSchema
):

    task = get_daily_task_by_id_repo(
        db,
        task_id
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    for key, value in data.model_dump(
        exclude_unset=True
    ).items():

        setattr(
            task,
            key,
            value
        )

    return update_daily_task_repo(
        db,
        task
    )


def update_task_selection_service(
    db: Session,
    task_id: int,
    data: UpdateTicketDailyTaskSelectionSchema
):

    task = get_daily_task_by_id_repo(
        db,
        task_id
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    task.is_selected = data.is_selected

    return update_daily_task_repo(
        db,
        task
    )


def delete_daily_task_service(
    db: Session,
    task_id: int
):

    task = get_daily_task_by_id_repo(
        db,
        task_id
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    delete_daily_task_repo(
        db,
        task
    )

    return {
        "message": "Task deleted successfully."
    }




def create_bulk_daily_task_service(
    db: Session,
    ticket_id: int,
    data: BulkCreateDailyTaskSchema,
    current_user_id: int
):
    ticket = get_ticket_by_id_repo(
        db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    if ticket.status_id == TICKET_STATUS["OPEN"]:

        ticket.status_id = TICKET_STATUS["IN_PROGRESS"]

        update_ticket_repo(
            db,
            ticket
        )

    tasks = []

    for item in data.tasks:

        task = TicketDailyTask(

            ticket_id=ticket_id,

            task_description=item.task_description,

            work_date=item.work_date or date.today(),

            created_by=current_user_id

        )

        tasks.append(task)

    return create_bulk_daily_task_repo(
        db,
        tasks
    )