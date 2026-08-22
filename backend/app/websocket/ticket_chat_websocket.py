from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)
import logging
from app.websocket.ticket_chat_manager import manager

logger = logging.getLogger("websocket")

router = APIRouter()


@router.websocket(
    "/ws/tickets/{ticket_id}"
)
async def ticket_chat_websocket(
    websocket: WebSocket,
    ticket_id: int
):

    client = websocket.client

    logger.info(
        "[TICKET WS ROUTE] REQUEST RECEIVED | "
        "ticket_id=%s | client=%s",
        ticket_id,
        client,
    )


    try:

        await manager.connect(
                ticket_id,
                websocket
            )

        logger.info(
            "[TICKET WS ROUTE] CONNECTION ESTABLISHED | "
            "ticket_id=%s | client=%s",
            ticket_id,
            client,
        )

        while True:

            # Receive heartbeat/ping from client
            message = await websocket.receive_text()

            logger.debug(
                "[TICKET WS ROUTE] MESSAGE RECEIVED | "
                "ticket_id=%s | message=%s",
                ticket_id,
                message,
            )



    except WebSocketDisconnect as e:

        logger.warning(
            "[TICKET WS ROUTE] CLIENT DISCONNECTED | "
            "ticket_id=%s | client=%s | "
            "close_code=%s",
            ticket_id,
            client,
            e.code,
        )



        manager.disconnect(
            ticket_id,
            websocket
        )

    except Exception as e:

        logger.error(
            "[TICKET WS ROUTE] UNEXPECTED ERROR | "
            "ticket_id=%s | client=%s | "
            "error_type=%s | error=%s",
            ticket_id,
            client,
            type(e).__name__,
            str(e),
            exc_info=True,
        )

        manager.disconnect(
            ticket_id,
            websocket,
        )