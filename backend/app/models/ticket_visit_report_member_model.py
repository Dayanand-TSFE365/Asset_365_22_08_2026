from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import TicketBase


class TicketVisitReportMember(TicketBase):
    __tablename__ = "TicketVisitReportMembers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    visit_report_id = Column(
        Integer,
        ForeignKey("TicketVisitReports.id"),
        nullable=False
    )

    company_name = Column(
        String(255),
        nullable=False
    )

    member_name = Column(
        String(255),
        nullable=False
    )

    is_online = Column(
        Boolean,
        default=False,
        nullable=False
    )

    display_order = Column(
        Integer,
        default=1,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    visit_report = relationship(
        "TicketVisitReport",
        back_populates="members"
    )