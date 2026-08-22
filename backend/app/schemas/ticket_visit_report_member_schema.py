from datetime import datetime
from typing import Optional,List

from pydantic import BaseModel, ConfigDict
from datetime import date, time


class CreateTicketVisitReportMemberSchema(BaseModel):

    company_name: str

    member_name: str

    is_online: bool = False

    display_order: int = 1


class UpdateTicketVisitReportMemberSchema(BaseModel):

    company_name: Optional[str] = None

    member_name: Optional[str] = None

    is_online: Optional[bool] = None

    display_order: Optional[int] = None


class TicketVisitReportMemberResponse(BaseModel):

    id: int

    visit_report_id: int

    company_name: str

    member_name: str

    is_online: bool

    display_order: int

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )





class PdfMemberResponse(BaseModel):

    company_name: str

    member_name: str

    is_online: bool

    display_order: int

    model_config = ConfigDict(
        from_attributes=True
    )


class TicketVisitReportPdfResponse(BaseModel):

    ticket_no: str

    customer_name: Optional[str]

    meeting_date: Optional[date]

    meeting_time: Optional[time]

    venue: Optional[str]

    order_no: Optional[str]

    scope_of_work: Optional[str]

    agenda: Optional[str]

    work_done: List[str]

    members: List[
        PdfMemberResponse
    ]

    status_name: str