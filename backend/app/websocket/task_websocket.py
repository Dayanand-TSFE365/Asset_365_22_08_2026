# backend\app\websocket\task_websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.connection_manager import manager
import logging



router = APIRouter()

logger = logging.getLogger("websocket")



# ============================================================
# WEBSOCKET DIAGNOSTIC TEST
# ============================================================

@router.websocket("/ws/test")
async def websocket_test(websocket: WebSocket):

    client = websocket.client

    logger.info(
        "WebSocket TEST request received | client=%s",
        client,
    )

    try:

        await websocket.accept()

        logger.info(
            "WebSocket TEST accepted | client=%s",
            client,
        )

        await websocket.send_json({
            "type": "connection_test",
            "status": "connected",
            "message": "WebSocket connection successful",
        })

        logger.info(
            "WebSocket TEST handshake successful | client=%s",
            client,
        )

        while True:

            message = await websocket.receive_text()

            logger.info(
                "WebSocket TEST message received | client=%s | message=%s",
                client,
                message,
            )

            await websocket.send_json({
                "type": "echo",
                "status": "success",
                "message": message,
            })

    except WebSocketDisconnect:

        logger.info(
            "WebSocket TEST disconnected | client=%s",
            client,
        )

    except Exception:

        logger.exception(
            "WebSocket TEST error | client=%s",
            client,
        )

# ============================================================
# TASK WEBSOCKET
# ============================================================

@router.websocket("/ws/tasks/{task_id}")
async def task_websocket(
    websocket: WebSocket,
    task_id: int,
):

    client = websocket.client

    logger.info(
        "[TASK WS] REQUEST RECEIVED | task_id=%s | client=%s",
        task_id,
        client,
    )

    try:

        logger.info(
            "[TASK WS] ACCEPTING CONNECTION | task_id=%s",
            task_id,
        )

        await manager.connect_task(
            task_id,
            websocket,
        )

        logger.info(
            "[TASK WS] CONNECTION ESTABLISHED | task_id=%s | client=%s",
            task_id,
            client,
        )

        while True:

            # logger.debug(
            #     "[TASK WS] WAITING FOR MESSAGE | task_id=%s",
            #     task_id,
            # )

            message = await websocket.receive_text()

            logger.info(
                "[TASK WS] MESSAGE RECEIVED | task_id=%s | message=%s",
                task_id,
                message,
            )

    except WebSocketDisconnect as e:

        logger.warning(
            "[TASK WS] CLIENT DISCONNECTED | "
            "task_id=%s | code=%s | client=%s",
            task_id,
            e.code,
            client,
        )

        manager.disconnect_task(
            task_id,
            websocket,
        )

    except Exception as e:

        logger.error(
            "[TASK WS] UNEXPECTED ERROR | "
            "task_id=%s | error_type=%s | error=%s",
            task_id,
            type(e).__name__,
            str(e),
            exc_info=True,
        )

        manager.disconnect_task(
            task_id,
            websocket,
        )



# ============================================================
# NOTIFICATION WEBSOCKET
# ============================================================

@router.websocket("/ws/notifications/{user_id}")
async def notification_websocket(
    websocket: WebSocket,
    user_id: int,
):

    client = websocket.client

    logger.info("")
    logger.info("=" * 70)
    logger.info("NOTIFICATION WEBSOCKET REQUEST RECEIVED")
    logger.info("User ID       : %s", user_id)
    logger.info("Client        : %s", client)

    if client:
        logger.info("Client host   : %s", client.host)
        logger.info("Client port   : %s", client.port)
    else:
        logger.info("Client host   : Unknown")
        logger.info("Client port   : Unknown")

    # Do not log complete headers in production.
    logger.info(
        "User-Agent    : %s",
        websocket.headers.get("user-agent", "Unknown"),
    )

    logger.info(
        "Origin        : %s",
        websocket.headers.get("origin", "Unknown"),
    )

    logger.info("=" * 70)

    try:

        # ----------------------------------------------------
        # CONNECT
        # ----------------------------------------------------

        logger.info(
            "[NOTIFICATION WS] Accepting connection | user_id=%s",
            user_id,
        )

        await manager.connect_user(
            user_id,
            websocket,
        )

        logger.info(
            "[NOTIFICATION WS] CONNECTION ESTABLISHED | "
            "user_id=%s",
            user_id,
        )

        # ----------------------------------------------------
        # KEEP CONNECTION ALIVE
        # ----------------------------------------------------

        while True:

            logger.debug(
                "[NOTIFICATION WS] Waiting for message | "
                "user_id=%s",
                user_id,
            )

            message = await websocket.receive_text()

            logger.info(
                "[NOTIFICATION WS] Message received | "
                "user_id=%s | message=%s",
                user_id,
                message,
            )

    except WebSocketDisconnect as e:

        logger.info("")
        logger.info("-" * 70)
        logger.info(
            "[NOTIFICATION WS] CLIENT DISCONNECTED | "
            "user_id=%s",
            user_id,
        )
        logger.info(
            "Disconnect code: %s",
            e.code,
        )
        logger.info(
            "Client         : %s",
            websocket.client,
        )
        logger.info("-" * 70)

        manager.disconnect_user(
            user_id,
            websocket,
        )

    except Exception:

        logger.exception(
            "[NOTIFICATION WS] UNEXPECTED ERROR | "
            "user_id=%s",
            user_id,
        )

        manager.disconnect_user(
            user_id,
            websocket,
        )


# from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# from app.websocket.connection_manager import manager

# router = APIRouter()


# @router.websocket("/ws/tasks/{task_id}")
# async def task_websocket(
#     websocket: WebSocket,
#     task_id: int,
# ):

#     await manager.connect_task(
#         task_id,
#         websocket,
#     )

#     print(f"Client connected to task {task_id}")

#     try:
#         while True:

#             # Keep the connection alive.
#             await websocket.receive_text()

#     except WebSocketDisconnect:

#         print(f"Client disconnected from task {task_id}")

#         manager.disconnect_task(
#             task_id,
#             websocket,
#         )

# @router.websocket("/ws/notifications/{user_id}")
# async def notification_websocket(
#     websocket: WebSocket,
#     user_id: int,
# ):

    
#     print("=" * 60)
#     print("WEBSOCKET REQUEST RECEIVED")
#     print(f"User ID: {user_id}")
#     print(f"Client: {websocket.client}")
#     print(f"Headers: {dict(websocket.headers)}")
#     print("=" * 60)

#     await manager.connect_user(
#         user_id,
#         websocket,
#     )

#     print(f"Notification client connected: User {user_id}")


#     try:

#         while True:

#             # Keep the connection alive
#             await websocket.receive_text()

#     except WebSocketDisconnect:

#         print(f"Notification client disconnected: User {user_id}")

#         manager.disconnect_user(
#             user_id,
#             websocket,
#         )