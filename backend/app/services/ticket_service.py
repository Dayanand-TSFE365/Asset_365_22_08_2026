

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.ticket_model import Ticket
from app.services.activity_log_service import log_activity

from app.repository.ticket_repo import (
    create_ticket_repo,
    get_ticket_by_id_repo,
    get_tickets_repo,
    update_ticket_repo,
    delete_ticket_repo,
    get_ticket_for_restore_repo,
    restore_ticket_repo,
    get_next_ticket_sequence_repo,
    get_deleted_tickets_repo,
    get_deleted_ticket_by_id_repo,
    permanently_delete_ticket_repo
)

from app.celery_task.ticket_email_tasks import (
    send_new_ticket_assignment_email_task
)

from app.services.ticket_notification_service import (
    create_ticket_notification_service,
    push_ticket_notification,
)



from app.repository.master_repo import (
    get_employee_by_auth_user_id
)

from app.services.email.ticket_email_service import (
    send_new_ticket_assignment_email
)

from app.schemas.ticket_schema import (
    CreateTicketSchema,
    UpdateTicketSchema,
    AssignTicketSchema
)


def generate_ticket_number(
    db: Session
) -> str:

    sequence = get_next_ticket_sequence_repo(
        db
    )

    return f"TKT-{sequence:06d}"

OPEN_STATUS_ID = 1


async def create_ticket_service(
    ticket_db: Session,
    asset_db: Session,
    data: CreateTicketSchema,
    current_user_id: int
):

    try:

        # -----------------------------------------
        # Create Ticket
        # -----------------------------------------

        ticket = Ticket(

            ticket_no=generate_ticket_number(
                ticket_db
            ),

            scope_of_work=data.scope_of_work,

            priority_id=data.priority_id,

            status_id=OPEN_STATUS_ID,

            assigned_to=data.assigned_to,

            created_by=current_user_id,

            due_date=data.due_date,

            customer_name=data.customer_name,

            meeting_date=data.meeting_date,

            meeting_time=data.meeting_time,

            venue=data.venue,

            order_no=data.order_no,

            agenda=data.agenda
        )

        # -----------------------------------------
        # Save Ticket
        # -----------------------------------------

        ticket = create_ticket_repo(
            ticket_db,
            ticket
        )

        # -----------------------------------------
        # Activity Log
        # -----------------------------------------

        log_activity(
            db=asset_db,
            created_by=current_user_id,
            module="TICKET",
            action="CREATE",
            item_type="TICKET",
            item_id=ticket.id,
            item_name=ticket.ticket_no,
            target_user_id=ticket.assigned_to,
            notes=(
                f"Created ticket '{ticket.ticket_no}' "
                f"for customer '{ticket.customer_name or '-'}'."
            ),
            changes={
                "ticket_no": ticket.ticket_no,
                "scope_of_work": ticket.scope_of_work,
                "priority_id": ticket.priority_id,
                "status_id": ticket.status_id,
                "assigned_to": ticket.assigned_to,
                "due_date": str(ticket.due_date) if ticket.due_date else None,
                "customer_name": ticket.customer_name,
                "meeting_date": str(ticket.meeting_date)
                if ticket.meeting_date else None,
                "meeting_time": str(ticket.meeting_time)
                if ticket.meeting_time else None,
                "venue": ticket.venue,
                "order_no": ticket.order_no,
                "agenda": ticket.agenda
            }
        )

        # -----------------------------------------
        # Get Assignee
        # -----------------------------------------

        assignee = None

        if ticket.assigned_to:

            assignee = (
                get_employee_by_auth_user_id(
                    asset_db,
                    ticket.assigned_to
                )
            )

        # -----------------------------------------
        # Get Creator
        # -----------------------------------------

        creator = (
            get_employee_by_auth_user_id(
                asset_db,
                current_user_id
            )
        )

        # Create Notification
        # -----------------------------------------

        notification = None

        if ticket.assigned_to:

            notification = create_ticket_notification_service(

                db=ticket_db,

                ticket_id=ticket.id,

                user_id=ticket.assigned_to,

                notification_type="ticket_assigned",

                title="New Ticket Assigned",

                message=(
                    f"You have been assigned ticket "
                    f"{ticket.ticket_no}. "
                    f"Customer: "
                    f"{ticket.customer_name or '-'}."
                ),

                created_by=current_user_id
            )

        # -----------------------------------------
        # Commit Ticket + Notification
        # -----------------------------------------

        ticket_db.commit()

        # -----------------------------------------
        # Real-time Notification
        # -----------------------------------------

        if notification:

            await push_ticket_notification(
                notification
            )

        # -----------------------------------------
        # Send Assignment Email
        # -----------------------------------------

        if assignee and assignee.email:

            try:

                send_new_ticket_assignment_email_task.delay(

                        email=assignee.email,

                        employee_name=(
                            assignee.full_name
                        ),

                        ticket_no=(
                            ticket.ticket_no
                        ),

                        customer_name=(
                            ticket.customer_name
                            or "-"
                        ),

                        scope_of_work=(
                            ticket.scope_of_work
                            or "-"
                        ),

                        assigned_by=(
                            creator.full_name
                            if creator
                            else "Manager"
                        ),

                        due_date=(
                            str(ticket.due_date)
                            if ticket.due_date
                            else "-"
                        )
                    )
                

            except Exception as e:

                # Email failure should NOT
                # make ticket creation fail.

                print(
                    "Ticket assignment email failed:",
                    e
                )

        return ticket

    except HTTPException:

        ticket_db.rollback()

        raise

    except Exception as e:

        ticket_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to create ticket: {str(e)}"
        )


def get_tickets_service(
    db: Session,
    assigned_to=None,
    created_by=None,
    status_id=None, 
    priority_id=None
):

    return get_tickets_repo(
        db=db,
        assigned_to=assigned_to,
        created_by=created_by,
        status_id=status_id,
        priority_id=priority_id
    )


def get_deleted_tickets_service(
    db
    # current_user
):
    # if current_user.role.lower() != "superadmin":
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Only SuperAdmin can view deleted tickets."
    #     )

    return get_deleted_tickets_repo(db)


def get_ticket_by_id_service(
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

    return ticket

def update_ticket_service(
    ticket_db: Session,
    asset_db: Session,
    ticket_id: int,
    data: UpdateTicketSchema,
    current_user
):
    ticket = get_ticket_by_id_repo(
        ticket_db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    changed_fields = []

    for key, value in update_data.items():

        old_value = getattr(
            ticket,
            key
        )

        if old_value != value:

            changed_fields.append(
                f"{key}: '{old_value}' → '{value}'"
            )

            setattr(
                ticket,
                key,
                value
            )

    ticket = update_ticket_repo(
        ticket_db,
        ticket
    )

    log_activity(
        db=asset_db,
        created_by=current_user.id,
        module="TICKET",
        action="UPDATE",
        item_type="TICKET",
        item_id=ticket.id,
        item_name=ticket.ticket_no,
        target_user_id=ticket.assigned_to,
        notes=(
            f"Updated ticket '{ticket.ticket_no}'. "
            + (
                f"Changes: {', '.join(changed_fields)}."
                if changed_fields
                else "No field values changed."
            )
        )
    )

    asset_db.commit()

    return ticket

def delete_ticket_service(
    ticket_db: Session,
    asset_db: Session,
    ticket_id: int,
    current_user
):

    ticket = get_ticket_by_id_repo(
        ticket_db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    if ticket.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Ticket is already deleted."
        )

    log_activity(
        db=asset_db,
        created_by=current_user.id,
        module="TICKET",
        action="DELETE",
        item_type="TICKET",
        item_id=ticket.id,
        item_name=ticket.ticket_no,
        target_user_id=ticket.assigned_to,
        notes=(
            f"Deleted ticket '{ticket.ticket_no}'. "
            f"Customer: '{ticket.customer_name or '-'}'."
        )
    )

    ticket = delete_ticket_repo(
        ticket_db,
        ticket
    )

    asset_db.commit()

    return ticket


def assign_ticket_service(
    ticket_db: Session,
    asset_db: Session,
    ticket_id: int,
    data: AssignTicketSchema,
    current_user
):

    ticket = get_ticket_by_id_repo(
        ticket_db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    old_assignee = ticket.assigned_to

    ticket.assigned_to = data.assigned_to

    ticket = update_ticket_repo(
        ticket_db,
        ticket
    )

    log_activity(
        db=asset_db,
        created_by=current_user.id,
        module="TICKET",
        action="ASSIGN",
        item_type="TICKET",
        item_id=ticket.id,
        item_name=ticket.ticket_no,
        target_user_id=data.assigned_to,
        notes=(
            f"Ticket '{ticket.ticket_no}' reassigned. "
            f"Previous assignee: {old_assignee or 'Unassigned'}, "
            f"New assignee: {data.assigned_to}."
        ),
        changes={
            "old_assignee": old_assignee,
            "new_assignee": data.assigned_to
        }
    )

    asset_db.commit()

    return ticket


def restore_ticket_service(
    ticket_db,
    asset_db,
    ticket_id: int,
    current_user
):

    # --------------------------------
    # SUPERADMIN CHECK
    # --------------------------------

    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Only SuperAdmin can restore tickets."
        )

    # --------------------------------
    # GET DELETED TICKET
    # --------------------------------

    ticket = get_deleted_ticket_by_id_repo(
        ticket_db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Deleted ticket not found."
        )

    # --------------------------------
    # RESTORE
    # --------------------------------

    ticket = restore_ticket_repo(
        ticket_db,
        ticket
    )

    # --------------------------------
    # ACTIVITY LOG
    # --------------------------------

    log_activity(
        db=asset_db,
        created_by=current_user.id,
        module="TICKET",
        action="RESTORE",
        item_type="TICKET",
        item_id=ticket.id,
        item_name=ticket.ticket_no,
        target_user_id=ticket.assigned_to,
        notes=(
            f"Restored ticket '{ticket.ticket_no}'. "
            f"Customer: '{ticket.customer_name or '-'}'."
        )
    )

    asset_db.commit()

    return {
        "message": "Ticket restored successfully.",
        "ticket_id": ticket.id,
        "ticket_no": ticket.ticket_no
    }


def permanently_delete_ticket_service(
    ticket_db,
    asset_db,
    ticket_id: int,
    current_user
):

    # --------------------------------
    # SUPERADMIN CHECK
    # --------------------------------

    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Only SuperAdmin can permanently delete tickets."
        )

    # --------------------------------
    # GET DELETED TICKET
    # --------------------------------

    ticket = get_deleted_ticket_by_id_repo(
        ticket_db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Deleted ticket not found."
        )

    # Save values before deletion
    deleted_ticket_id = ticket.id
    ticket_no = ticket.ticket_no
    customer_name = ticket.customer_name

    # --------------------------------
    # ACTIVITY LOG
    # --------------------------------

    log_activity(
        db=asset_db,
        created_by=current_user.id,
        module="TICKET",
        action="PERMANENT_DELETE",
        item_type="TICKET",
        item_id=deleted_ticket_id,
        item_name=ticket_no,
        notes=(
            f"Permanently deleted ticket '{ticket_no}'. "
            f"Customer: '{customer_name or '-'}'."
        )
    )

    # --------------------------------
    # PERMANENT DELETE
    # --------------------------------

    permanently_delete_ticket_repo(
        ticket_db,
        ticket
    )

    asset_db.commit()

    return {
        "message": "Ticket permanently deleted successfully."
    }
