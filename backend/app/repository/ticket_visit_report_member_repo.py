from sqlalchemy.orm import Session

from app.models.ticket_visit_report_member_model import (
    TicketVisitReportMember
)


def create_ticket_visit_report_member_repo(
    db: Session,
    member: TicketVisitReportMember
):
    db.add(member)
    db.commit()
    db.refresh(member)

    return member


def create_ticket_visit_report_members_repo(
    db: Session,
    members: list[TicketVisitReportMember]
):
    db.add_all(members)
    db.commit()

    for member in members:
        db.refresh(member)

    return members


def get_ticket_visit_report_members_repo(
    db: Session,
    visit_report_id: int
):
    return (
        db.query(TicketVisitReportMember)
        .filter(
            TicketVisitReportMember.visit_report_id == visit_report_id
        )
        .order_by(
        TicketVisitReportMember.display_order.asc()
        )
        .all()
    )


def delete_ticket_visit_report_members_repo(
    db: Session,
    visit_report_id: int
):
    (
        db.query(TicketVisitReportMember)
        .filter(
            TicketVisitReportMember.visit_report_id == visit_report_id
        )
        .delete()
    )

    db.commit()

def get_ticket_visit_report_members_repo(
    db: Session,
    visit_report_id: int
):
    return (
        db.query(TicketVisitReportMember)
        .filter(
            TicketVisitReportMember.visit_report_id == visit_report_id
        )
        .order_by(
            TicketVisitReportMember.display_order
        )
        .all()
    )