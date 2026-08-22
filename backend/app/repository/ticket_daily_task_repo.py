from app.models.ticket_model import Ticket
from sqlalchemy.orm import Session

from app.models.ticket_daily_task_model import (
    TicketDailyTask
)


def create_daily_task_repo(
    db: Session,
    task: TicketDailyTask
):
    db.add(task)
    db.commit()
    db.refresh(task)

    return task


def get_daily_tasks_repo(
    db: Session,
    ticket_id: int
):
    return (
        db.query(TicketDailyTask)
        .filter(
            TicketDailyTask.ticket_id == ticket_id
        )
        .order_by(
            TicketDailyTask.work_date.asc(),
            TicketDailyTask.created_at.asc()
        )
        .all()
    )


def get_daily_task_by_id_repo(
    db: Session,
    task_id: int
):
    return (
        db.query(TicketDailyTask)
        .filter(
            TicketDailyTask.id == task_id
        )
        .first()
    )


def update_daily_task_repo(
    db: Session,
    task: TicketDailyTask
):
    db.commit()
    db.refresh(task)

    return task


def delete_daily_task_repo(
    db: Session,
    task: TicketDailyTask
):
    db.delete(task)
    db.commit()

def create_bulk_daily_task_repo(
    db: Session,
    tasks: list[TicketDailyTask]
):
    db.add_all(tasks)

    db.commit()

    for task in tasks:
        db.refresh(task)

    return tasks


def get_selected_daily_tasks_repo(
    db: Session,
    ticket_id: int
):
    return (
        db.query(TicketDailyTask)
        .filter(
            TicketDailyTask.ticket_id == ticket_id,
            TicketDailyTask.is_selected == True
        )
        .order_by(
            TicketDailyTask.work_date.asc(),
            TicketDailyTask.created_at.asc()
        )
        .all()
    )

