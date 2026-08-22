from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.db.database import get_ticket_db

from app.core.dependencies import get_current_user

from app.schemas.ticket_daily_task_schema import (
    CreateTicketDailyTaskSchema,
    UpdateTicketDailyTaskSchema,
    UpdateTicketDailyTaskSelectionSchema,
    TicketDailyTaskResponse,
    BulkCreateDailyTaskSchema
)

from app.services.ticket_daily_task_service import (
    create_daily_task_service,
    get_daily_tasks_service,
    update_daily_task_service,
    update_task_selection_service,
    delete_daily_task_service,
    create_bulk_daily_task_service
)

router = APIRouter(
    prefix="/apiV3",
    tags=["Ticket Daily Tasks"]
)


@router.post(
    "/tickets/{ticket_id}/daily-tasks",
    response_model=list[TicketDailyTaskResponse]
)
def create_bulk_daily_tasks(
    ticket_id: int,
    data: BulkCreateDailyTaskSchema,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):
    return create_bulk_daily_task_service(
        db,
        ticket_id,
        data,
        current_user.id
    )




@router.get(
    "/tickets/{ticket_id}/daily-tasks",
    response_model=list[TicketDailyTaskResponse]
)
def get_daily_tasks(
    ticket_id: int,
    db: Session = Depends(get_ticket_db)
):
    return get_daily_tasks_service(
        db,
        ticket_id
    )


@router.put(
    "/daily-tasks/{task_id}",
    response_model=TicketDailyTaskResponse
)
def update_daily_task(
    task_id: int,
    data: UpdateTicketDailyTaskSchema,
    db: Session = Depends(get_ticket_db)
):
    return update_daily_task_service(
        db,
        task_id,
        data
    )


@router.patch(
    "/daily-tasks/{task_id}/check",
    response_model=TicketDailyTaskResponse
)
def check_daily_task(
    task_id: int,
    data: UpdateTicketDailyTaskSelectionSchema,
    db: Session = Depends(get_ticket_db)
):
    return update_task_selection_service(
        db,
        task_id,
        data
    )


@router.delete(
    "/daily-tasks/{task_id}"
)
def delete_daily_task(
    task_id: int,
    db: Session = Depends(get_ticket_db)
):
    return delete_daily_task_service(
        db,
        task_id
    )

