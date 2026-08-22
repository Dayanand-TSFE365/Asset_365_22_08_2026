from fastapi import (
    APIRouter,
    Depends
)

from fastapi import UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_ticket_db

from app.core.dependencies import (
    get_current_user
)
from app.core.admin_require import require_admin

from app.schemas.ticket_visit_report_schema import (
    CreateTicketVisitReportSchema,
    UpdateTicketVisitReportSchema,
    TicketVisitReportResponse,
    
)
from app.schemas.ticket_visit_report_member_schema import (
TicketVisitReportPdfResponse
)



from app.services.ticket_visit_report_service import (
    create_ticket_visit_report_service,
    get_ticket_visit_report_service,
    update_ticket_visit_report_service,
    delete_ticket_visit_report_service,
    submit_visit_report_service,
    approve_visit_report_service,
    get_visit_report_pdf_data_service
)

router = APIRouter(
    prefix="/apiV3/tickets",
    tags=["Ticket Visit Reports"]
)

@router.post(
    "/{ticket_id}/visit-report",
    response_model=TicketVisitReportResponse
)
def create_visit_report(
    ticket_id: int,
    data: CreateTicketVisitReportSchema,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):
    return create_ticket_visit_report_service(
        db,
        ticket_id,
        data,
        current_user.id
    )

@router.get(
    "/{ticket_id}/visit-report",
    response_model=TicketVisitReportResponse
)
def get_visit_report(
    ticket_id: int,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)

):
    return get_ticket_visit_report_service(
        db,
        ticket_id
    )


@router.put(
    "/{ticket_id}/visit-report",
    response_model=TicketVisitReportResponse
)
def update_visit_report(
    ticket_id: int,
    data: UpdateTicketVisitReportSchema,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):
    return update_ticket_visit_report_service(
        db,
        ticket_id,
        data
    )


@router.get(
    "/{ticket_id}/visit-report/pdf-data",
    response_model=TicketVisitReportPdfResponse
)
def get_visit_report_pdf_data(
    ticket_id: int,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)

):
    return get_visit_report_pdf_data_service(
        db,
        ticket_id
    )



@router.patch(
    "/{ticket_id}/visit-report/submit",
    response_model=TicketVisitReportResponse
)
def submit_visit_report(
    ticket_id: int,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):
    return submit_visit_report_service(
        db,
        ticket_id
    )

# @router.patch(
#     "/{ticket_id}/visit-report/approve",
#     response_model=TicketVisitReportResponse
# )
# def approve_visit_report(
#     ticket_id: int,
#     db: Session = Depends(get_ticket_db),
#     current_user=Depends(get_current_user)
# ):
#     return approve_visit_report_service(
#         db,
#         ticket_id,
#         current_user.id
#     )

@router.patch(
    "/{ticket_id}/visit-report/approve",
    response_model=TicketVisitReportResponse
)
def approve_visit_report(
    ticket_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_ticket_db),
    current_user=Depends(require_admin)
):
    return approve_visit_report_service(
        db,
        ticket_id,
        current_user.id,
        file
    )


@router.delete(
    "/{ticket_id}/visit-report"
)
def delete_visit_report(
    ticket_id: int,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):
    return delete_ticket_visit_report_service(
        db,
        ticket_id
    )