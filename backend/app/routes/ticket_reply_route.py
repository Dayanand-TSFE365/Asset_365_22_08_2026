from typing import List

from fastapi import (
    APIRouter,
    Depends,
    Form,
    File,
    UploadFile
)
from sqlalchemy.orm import Session

from app.db.database import (
    get_ticket_db
)

from app.core.dependencies import (
    get_current_user
)

from app.websocket.ticket_chat_manager import (
    manager
)

from app.schemas.ticket_reply_schema import (
    TicketReplyResponse
)

from app.services.ticket_reply_service import (
    create_ticket_reply_service
)



router = APIRouter(
    prefix="/apiV3/tickets",
    tags=["Ticket Replies"]
)


@router.post(
    "/{ticket_id}/reply",
    response_model=TicketReplyResponse
)
async def create_reply(
    ticket_id: int,
    message: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):

    reply = await create_ticket_reply_service(
        db=db,
        ticket_id=ticket_id,
        message=message,
        files=files,
        sender_id=current_user.id
    )

    await manager.broadcast_to_ticket(
        ticket_id,
        {
            "type": "new_reply",
            "reply": TicketReplyResponse.model_validate(
                reply
            ).model_dump(
                mode="json"
            )
        }
    )

    return reply




