from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session
from fastapi import UploadFile
from pathlib import Path
import shutil
from app.models.ticket_visit_report_model import (
    TicketVisitReport
)
from app.models.ticket_visit_report_member_model import (
    TicketVisitReportMember
)
from app.repository.ticket_repo import (
    get_ticket_by_id_repo
)
from app.repository.ticket_daily_task_repo import (
    get_selected_daily_tasks_repo
)
from app.core.ticket_constants import (
    TICKET_STATUS,
    VISIT_REPORT_STATUS
)
from app.core.config import settings

from app.repository.ticket_visit_report_repo import (
    create_ticket_visit_report_repo,
    get_ticket_visit_report_repo,
    update_ticket_visit_report_repo,
    delete_ticket_visit_report_repo,   
)


from app.repository.ticket_repo import update_ticket_repo

from app.repository.ticket_visit_report_member_repo import (
    create_ticket_visit_report_members_repo,
    delete_ticket_visit_report_members_repo,
    get_ticket_visit_report_members_repo
)

from app.schemas.ticket_visit_report_schema import (
    CreateTicketVisitReportSchema,
    TicketVisitReportResponse,
    UpdateTicketVisitReportSchema,
   
)
from app.schemas.ticket_visit_report_member_schema import (
 TicketVisitReportPdfResponse,
PdfMemberResponse
)







def create_ticket_visit_report_service(
    db: Session,
    ticket_id: int,
    data: CreateTicketVisitReportSchema,
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

    visit_report = get_ticket_visit_report_repo(
        db,
        ticket_id
    )

    if visit_report:
        raise HTTPException(
            status_code=400,
            detail="Visit report already exists."
        )

    tasks = get_selected_daily_tasks_repo(
        db,
        ticket_id
    )


    work_done = "\n".join(
        f"• {task.task_description}"
        for task in tasks
    )

    visit_report = TicketVisitReport(
        ticket_id=ticket_id,
        work_done=work_done,
        visit_report_status_id=VISIT_REPORT_STATUS["DRAFT"],
        created_by=current_user_id
    )

    visit_report = create_ticket_visit_report_repo(
        db,
        visit_report
    )
    # Update ticket status to In Progress
    ticket.status_id = TICKET_STATUS["IN_PROGRESS"]

    update_ticket_repo(
        db,
        ticket
    )


    members = []

    for item in data.members:

        members.append(

            TicketVisitReportMember(

                visit_report_id=visit_report.id,

                company_name=item.company_name,

                member_name=item.member_name,

                is_online=item.is_online,

                display_order=item.display_order

            )

        )

    if members:
        create_ticket_visit_report_members_repo(
            db,
            members
        )

    

    # Return fresh object with relationship loaded
    return TicketVisitReportResponse(
    id=visit_report.id,
    ticket_id=visit_report.ticket_id,
    work_done=visit_report.work_done,
    visit_report_status_id=visit_report.visit_report_status_id,
    status_name=visit_report.visit_report_status.status_name,
    report_file_path=visit_report.report_file_path,
    created_by=visit_report.created_by,
    created_at=visit_report.created_at,
    updated_at=visit_report.updated_at,
    approved_at=visit_report.approved_at,
    members=visit_report.members
)

def get_ticket_visit_report_service(
    db: Session,
    ticket_id: int
):

    visit_report = get_ticket_visit_report_repo(
        db,
        ticket_id
    )

    if not visit_report:

        raise HTTPException(
            status_code=404,
            detail="Visit report not found."
        )

    return TicketVisitReportResponse(
    id=visit_report.id,
    ticket_id=visit_report.ticket_id,
    work_done=visit_report.work_done,
    visit_report_status_id=visit_report.visit_report_status_id,
    status_name=visit_report.visit_report_status.status_name,
    report_file_path=visit_report.report_file_path,
    created_by=visit_report.created_by,
    created_at=visit_report.created_at,
    updated_at=visit_report.updated_at,
    approved_at=visit_report.approved_at,
    members=visit_report.members
)

def update_ticket_visit_report_service(
    db: Session,
    ticket_id: int,
    data: UpdateTicketVisitReportSchema
):

    visit_report = get_ticket_visit_report_repo(
        db,
        ticket_id
    )

    if not visit_report:
        raise HTTPException(
            status_code=404,
            detail="Visit report not found."
        )

    # Allow editing only while report is in Draft
    if visit_report.visit_report_status_id != VISIT_REPORT_STATUS["DRAFT"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Visit report cannot be updated because "
                f"it is already submitted."
            )
        )

     # -----------------------------
    # Regenerate work_done
    # -----------------------------
    tasks = get_selected_daily_tasks_repo(
        db,
        ticket_id
    )

    visit_report.work_done = "\n".join(
        f"• {task.task_description}"
        for task in tasks
    )


    # Remove existing members
    delete_ticket_visit_report_members_repo(
        db,
        visit_report.id
    )

    members = []

    for item in data.members:

        members.append(

            TicketVisitReportMember(

                visit_report_id=visit_report.id,

                company_name=item.company_name,

                member_name=item.member_name,

                is_online=item.is_online,

                display_order=item.display_order

            )

        )

    if members:

        create_ticket_visit_report_members_repo(
            db,
            members
        )

    visit_report = update_ticket_visit_report_repo(
        db,
        visit_report
    )


    return TicketVisitReportResponse(
        id=visit_report.id,
        ticket_id=visit_report.ticket_id,
        work_done=visit_report.work_done,
        visit_report_status_id=visit_report.visit_report_status_id,
        status_name=visit_report.visit_report_status.status_name,
        report_file_path=visit_report.report_file_path,
        created_by=visit_report.created_by,
        created_at=visit_report.created_at,
        updated_at=visit_report.updated_at,
        approved_at=visit_report.approved_at,
        members=visit_report.members
    )

def delete_ticket_visit_report_service(
    db: Session,
    ticket_id: int
):

    visit_report = get_ticket_visit_report_repo(
        db,
        ticket_id
    )

    if not visit_report:
        raise HTTPException(
            status_code=404,
            detail="Visit report not found."
        )

    delete_ticket_visit_report_repo(
        db,
        visit_report
    )

    return {
        "message": "Visit report deleted successfully."
    }



def submit_visit_report_service(
    db: Session,
    ticket_id: int
):

    visit_report = get_ticket_visit_report_repo(
        db,
        ticket_id
    )

    if not visit_report:
        raise HTTPException(
            status_code=404,
            detail="Visit report not found."
        )

    if visit_report.visit_report_status_id != VISIT_REPORT_STATUS["DRAFT"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Visit report cannot be submitted because "
                f"it is already submitted."
            )
        )

    tasks = get_selected_daily_tasks_repo(
        db,
        ticket_id
    )

    if not tasks:
        raise HTTPException(
            status_code=400,
            detail="No selected daily tasks found."
        )

    visit_report.work_done = "\n".join(
        [
            f"• {task.task_description}"
            for task in tasks
        ]
    )

    visit_report.visit_report_status_id = VISIT_REPORT_STATUS["SUBMITTED"]

    ticket = get_ticket_by_id_repo(
        db,
        ticket_id
    )

    ticket.status_id = TICKET_STATUS["SUBMITTED"]   # if you have this status

    update_ticket_repo(
        db,
        ticket
    )

    visit_report = update_ticket_visit_report_repo(
        db,
        visit_report
    )

    return TicketVisitReportResponse(
        id=visit_report.id,
        ticket_id=visit_report.ticket_id,
        work_done=visit_report.work_done,
        visit_report_status_id=visit_report.visit_report_status_id,
        status_name=visit_report.visit_report_status.status_name,
        report_file_path=visit_report.report_file_path,
        created_by=visit_report.created_by,
        created_at=visit_report.created_at,
        updated_at=visit_report.updated_at,
        approved_at=visit_report.approved_at,
        members=visit_report.members
    )



def approve_visit_report_service(
    db: Session,
    ticket_id: int,
    current_user_id: int,
    file: UploadFile
    
):

    visit_report = get_ticket_visit_report_repo(
        db,
        ticket_id
    )

    if not visit_report:
        raise HTTPException(
            status_code=404,
            detail="Visit report not found."
        )

    if visit_report.visit_report_status_id != VISIT_REPORT_STATUS["SUBMITTED"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Visit report cannot be approved because "
                f"it is not submitted."
            )
        )

    ticket = get_ticket_by_id_repo(
        db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )


    # ---------------------------------------
    # Save PDF
 
    # Base upload directory from .env
    base_upload_dir = Path(settings.UPLOAD_DIR)

    # Physical folder
    ticket_report_dir = base_upload_dir / "ticket_visit_reports"

    ticket_report_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    filename = f"{ticket.ticket_no}.pdf"

    # Full physical path (used to save the file)
    full_path = ticket_report_dir / filename

    # Save the file
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    # Save ONLY the relative path in database
    visit_report.report_file_path = (
        f"ticket_visit_reports/{filename}"
    )


    visit_report.visit_report_status_id = VISIT_REPORT_STATUS["APPROVED"]

    ticket = get_ticket_by_id_repo(
        db,
        ticket_id
    )

    ticket.status_id = TICKET_STATUS["APPROVED"]   # or CLOSED

    update_ticket_repo(
        db,
        ticket
    )

    visit_report.approved_at = datetime.utcnow()

    # Uncomment if you added approved_by column
    # visit_report.approved_by = current_user_id

    visit_report = update_ticket_visit_report_repo(
        db,
        visit_report
    )

    return TicketVisitReportResponse(
        id=visit_report.id,
        ticket_id=visit_report.ticket_id,
        work_done=visit_report.work_done,
        visit_report_status_id=visit_report.visit_report_status_id,
        status_name=visit_report.visit_report_status.status_name,
        report_file_path=visit_report.report_file_path,
        created_by=visit_report.created_by,
        created_at=visit_report.created_at,
        updated_at=visit_report.updated_at,
        approved_at=visit_report.approved_at,
        members=visit_report.members
    )






def get_visit_report_pdf_data_service(
    db: Session,
    ticket_id: int
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

    visit_report = get_ticket_visit_report_repo(
        db,
        ticket_id
    )

    if not visit_report:
        raise HTTPException(
            status_code=404,
            detail="Visit report not found."
        )

    members = get_ticket_visit_report_members_repo(
        db,
        visit_report.id
    )

    work_done = []

    if visit_report.work_done:

        work_done = [
            line.replace("•", "").strip()
            for line in visit_report.work_done.split("\n")
            if line.strip()
        ]

    return TicketVisitReportPdfResponse(

        ticket_no=ticket.ticket_no,

        customer_name=ticket.customer_name,

        meeting_date=ticket.meeting_date,

        meeting_time=ticket.meeting_time,

        venue=ticket.venue,

        order_no=ticket.order_no,

        scope_of_work=ticket.scope_of_work,

        agenda=ticket.agenda,

        work_done=work_done,

        visit_report_status_id=visit_report.visit_report_status_id,
        status_name=visit_report.visit_report_status.status_name,

        members=[

            PdfMemberResponse(

                company_name=m.company_name,

                member_name=m.member_name,

                is_online=m.is_online,

                display_order=m.display_order

            )

            for m in members

        ]

    )