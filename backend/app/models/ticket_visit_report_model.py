from sqlalchemy import (
    Column,
    Integer,
    Text,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.ticket_constants import VISIT_REPORT_STATUS  
from app.db.database import TicketBase


class TicketVisitReport(TicketBase):
    __tablename__ = "TicketVisitReports"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    ticket_id = Column(
        Integer,
        ForeignKey("Tickets.id"),
        nullable=False,
        unique=True
    )

    # Auto-generated from selected daily tasks
    work_done = Column(
        Text,
        nullable=True
    )

    # Workflow Status
    visit_report_status_id = Column(
    Integer,
    ForeignKey("TicketStatusMaster.id"),
    nullable=False,
    default=VISIT_REPORT_STATUS["DRAFT"]
)

    created_by = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    report_file_path = Column(
    String(500),
    nullable=True
)

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    approved_at = Column(
        DateTime,
        nullable=True
    )

    ticket = relationship(
        "Ticket",
        back_populates="visit_report"
    )

    members = relationship(
        "TicketVisitReportMember",
        back_populates="visit_report",
        cascade="all, delete-orphan"
    )
    visit_report_status = relationship(
    "TicketStatusMaster"
)