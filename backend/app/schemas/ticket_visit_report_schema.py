from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.ticket_visit_report_member_schema import (
    CreateTicketVisitReportMemberSchema,
    TicketVisitReportMemberResponse
)


class CreateTicketVisitReportSchema(BaseModel):

    members: List[
        CreateTicketVisitReportMemberSchema
    ] = []


class UpdateTicketVisitReportSchema(BaseModel):

    members: List[
        CreateTicketVisitReportMemberSchema
    ] = []


class TicketVisitReportResponse(BaseModel):

    id: int

    ticket_id: int

    work_done: Optional[str]

    visit_report_status_id: int

    status_name: str

    report_file_path: Optional[str]

    created_by: int

    created_at: datetime

    updated_at: datetime

    approved_at: Optional[datetime]

    members: List[
        TicketVisitReportMemberResponse
    ]

    model_config = ConfigDict(
        from_attributes=True
    )