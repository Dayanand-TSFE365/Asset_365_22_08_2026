from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.db.database import get_ticket_db,get_asset_db

from app.core.dependencies import get_current_user

from app.schemas.ticket_schema import (
    CreateTicketSchema,
    TicketResponse,
    TicketListResponse,
    UpdateTicketSchema,
    AssignTicketSchema
)

from app.services.ticket_service import (
    create_ticket_service,
    get_ticket_by_id_service,
    get_tickets_service,
    update_ticket_service,
    delete_ticket_service,
    assign_ticket_service,
    restore_ticket_service,
    get_deleted_tickets_service,
    permanently_delete_ticket_service
)

router = APIRouter(
    prefix="/apiV3/tickets",
    tags=["Tickets"]
)


@router.post(
    "",
    response_model=TicketResponse
)
async def create_ticket(
    data: CreateTicketSchema,
    ticket_db: Session = Depends(get_ticket_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user),
):
    return await create_ticket_service(
        ticket_db=ticket_db,
        asset_db=asset_db,
        data=data,
        current_user_id=current_user.id
    )


@router.get(
    "",
    response_model=list[TicketListResponse]
)
def get_tickets(
    assigned_to: Optional[int] = None,
    created_by: Optional[int] = None,
    status_id: Optional[int] = None,
    priority_id: Optional[int] = None,
    db: Session = Depends(get_ticket_db)
):
    return get_tickets_service(
        db=db,
        assigned_to=assigned_to,
        created_by=created_by,
        status_id=status_id,
        priority_id=priority_id
    )

@router.get("/deleted")
def get_deleted_tickets(
    db: Session = Depends(get_ticket_db),
    # current_user=Depends(get_current_user)
):
    return get_deleted_tickets_service(
        db=db,
        # current_user=current_user
    )




@router.patch("/{ticket_id}/restore")
def restore_ticket(
    ticket_id: int,
    ticket_db: Session = Depends(get_ticket_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return restore_ticket_service(
            ticket_db=ticket_db,
            asset_db=asset_db,
            ticket_id=ticket_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.delete("/{ticket_id}/permanent")
def permanently_delete_ticket(
    ticket_id: int,
    ticket_db: Session = Depends(get_ticket_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return permanently_delete_ticket_service(
            ticket_db=ticket_db,
            asset_db=asset_db,
            ticket_id=ticket_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.patch(
    "/{ticket_id}/assign",
    response_model=TicketResponse
)
def assign_ticket(
    ticket_id: int,
    data: AssignTicketSchema,
    ticket_db: Session = Depends(get_ticket_db),
    asset_db: Session = Depends(get_asset_db)
):
    return assign_ticket_service(
        ticket_db=ticket_id,
        asset_db=asset_db,
        ticket_id=ticket_id,
        data=data
    )

@router.get(
    "/{ticket_id}",
    response_model=TicketResponse
)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_ticket_db)
):
    return get_ticket_by_id_service(
        db,
        ticket_id
    )

@router.put(
    "/{ticket_id}",
    response_model=TicketResponse
)
def update_ticket(
    ticket_id: int,
    data: UpdateTicketSchema,
    ticket_db: Session = Depends(get_ticket_db),
    asset_db : Session = Depends(get_asset_db),
    current_user= Depends(get_current_user)

):
    return update_ticket_service(
        ticket_db=ticket_db,
        asset_db=asset_db,
        ticket_id=ticket_id,
        data=data,
        current_user=current_user
    )

@router.delete(
    "/{ticket_id}"
)
def delete_ticket(
    ticket_id: int,
    ticket_db: Session = Depends(get_ticket_db),
    asset_db: Session = Depends(get_asset_db),
    current_user= Depends(get_current_user)

):
    return delete_ticket_service(
        ticket_db=ticket_db,
        asset_db=asset_db,
        ticket_id=ticket_id,
        current_user=current_user
    )




