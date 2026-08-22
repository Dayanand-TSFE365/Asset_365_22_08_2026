from sqlalchemy.orm import Session

from app.models.ticket_visit_report_model import (
    TicketVisitReport
)
from sqlalchemy.orm import joinedload


def create_ticket_visit_report_repo(
    db: Session,
    visit_report: TicketVisitReport
):
    db.add(visit_report)
    db.commit()
    db.refresh(visit_report)

    return visit_report


def get_ticket_visit_report_repo(
    db: Session,
    ticket_id: int
):
    return (
        db.query(TicketVisitReport)
        .options(
            joinedload(TicketVisitReport.members)
        )
        .filter(
            TicketVisitReport.ticket_id == ticket_id
        )
        .first()
    )


def get_ticket_visit_report_by_id_repo(
    db: Session,
    visit_report_id: int
):
    return (
        db.query(TicketVisitReport)
        .filter(
            TicketVisitReport.id == visit_report_id
        )
        .first()
    )


def update_ticket_visit_report_repo(
    db: Session,
    visit_report: TicketVisitReport
):
    db.commit()
    db.refresh(visit_report)

    return visit_report


def delete_ticket_visit_report_repo(
    db: Session,
    visit_report: TicketVisitReport
):
    db.delete(visit_report)
    db.commit()

def update_visit_report_status_repo(
    db: Session,
    visit_report: TicketVisitReport,
    status: str
):
    visit_report.status = status

    db.commit()

    db.refresh(visit_report)

    return visit_report


