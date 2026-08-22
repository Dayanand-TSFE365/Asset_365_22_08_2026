# backend\app\websocket\connection_manager.py

from collections import defaultdict
from fastapi import WebSocket
from typing import Dict, List
import logging

# ============================================================
# LOGGER
# ============================================================

logger = logging.getLogger("websocket")

class ConnectionManager:

    def __init__(self):

        # task_id -> list of websocket connections
        self.task_connections: Dict[
            int,
            List[WebSocket]
        ] = defaultdict(list)

        # user_id -> list of websocket connections
        self.user_connections: Dict[
            int,
            List[WebSocket]
        ] = defaultdict(list)

    # ==================================================
    # TASK CONNECTIONS
    # ==================================================

    async def connect_task(
        self,
        task_id: int,
        websocket: WebSocket,
    ):

        logger.info(
            "[TASK WS] CONNECTION ATTEMPT | "
            "task_id=%s | client=%s | headers=%s",
            task_id,
            websocket.client,
            dict(websocket.headers),
        )


        try:

            await websocket.accept()

            logger.info(
                "[TASK WS] WEBSOCKET ACCEPTED | "
                "task_id=%s | client=%s",
                task_id,
                websocket.client,
            )

            self.task_connections[
                task_id
            ].append(websocket)

            logger.info(
                "[TASK WS] CONNECTION STORED | "
                "task_id=%s | active_connections=%s",
                task_id,
                len(self.task_connections[task_id]),
            )

        

        except Exception as e:

            logger.error(
                "[TASK WS] CONNECTION ERROR | "
                "task_id=%s | client=%s",
                task_id,
                websocket.client,
                exc_info=True,
            )

            raise

    

      

    def disconnect_task(
        self,
        task_id: int,
        websocket: WebSocket,
    ):

        logger.info(
            "[TASK WS] DISCONNECT | "
            "task_id=%s | client=%s",
            task_id,
            websocket.client,
        )

        if task_id not in self.task_connections:

            logger.warning(
                "[TASK WS] TASK NOT FOUND IN CONNECTION MANAGER | "
                "task_id=%s",
                task_id,
            )
            return

        if websocket in self.task_connections[task_id]:

            self.task_connections[task_id].remove(websocket)

            logger.info(
                "[TASK WS] CONNECTION REMOVED | "
                "task_id=%s | remaining=%s",
                task_id,
                len(self.task_connections[task_id]),
            )

        else:

            logger.warning(
                "[TASK WS] SOCKET NOT FOUND FOR TASK | "
                "task_id=%s | client=%s",
                task_id,
                websocket.client,
            )

            return

        if not self.task_connections[task_id]:

            del self.task_connections[task_id]

            logger.info(
                "[TASK WS] NO ACTIVE CONNECTIONS | "
                "task_id=%s",
                task_id,
            )

    async def send_to_task(
        self,
        task_id: int,
        message: dict,
    ):

        logger.info(
            "[TASK WS] SEND EVENT | "
            "task_id=%s | message=%s",
            task_id,
            message,
        )

        if task_id not in self.task_connections:

            logger.warning(
                "[TASK WS] NO ACTIVE CONNECTION | "
                "task_id=%s",
                task_id,
            )

            return

        disconnected = []

        logger.info(
            "[TASK WS] ACTIVE CONNECTIONS | "
            "task_id=%s | count=%s",
            task_id,
            len(self.task_connections[task_id]),
        )

        for connection in list(
            self.task_connections[task_id]
        ):

            try:

                logger.info(
                    "[TASK WS] SENDING EVENT | "
                    "task_id=%s | client=%s",
                    task_id,
                    connection.client,
                )

                await connection.send_json(
                    message
                )

                logger.info(
                    "[TASK WS] EVENT SENT SUCCESSFULLY | "
                    "task_id=%s | client=%s",
                    task_id,
                    connection.client,
                )

            except Exception as e:

                logger.error(
                    "[TASK WS] FAILED TO SEND EVENT | "
                    "task_id=%s | client=%s",
                    task_id,
                    connection.client,
                    exc_info=True,
                )

                disconnected.append(
                    connection
                )

        for socket in disconnected:

            self.disconnect_task(
                task_id,
                socket
            )


    # ==================================================
    # USER NOTIFICATION CONNECTIONS
    # ==================================================

    async def connect_user(
        self,
        user_id: int,
        websocket: WebSocket,
    ):

        logger.info(
            "[NOTIFICATION WS] CONNECTION ATTEMPT | "
            "user_id=%s | client=%s | headers=%s",
            user_id,
            websocket.client,
            dict(websocket.headers),
        )

        try:

            

            await websocket.accept()

            logger.info(
                    "[NOTIFICATION WS] WEBSOCKET ACCEPTED | "
                    "user_id=%s | client=%s",
                    user_id,
                    websocket.client,
                )

            self.user_connections[
                user_id
            ].append(websocket)

            logger.info(
                "[NOTIFICATION WS] CONNECTION STORED | "
                "user_id=%s | active_connections=%s",
                user_id,
                len(self.user_connections[user_id]),
            )

            logger.info(
                "[NOTIFICATION WS] CONNECTED USERS | "
                "users=%s",
                list(self.user_connections.keys()),
            )

            

        except Exception as e:

            logger.error(
                "[NOTIFICATION WS] CONNECTION ERROR | "
                "user_id=%s | client=%s",
                user_id,
                websocket.client,
                exc_info=True,
            )

            raise

        
    def disconnect_user(
        self,
        user_id: int,
        websocket: WebSocket,
    ):

        logger.info(
            "[NOTIFICATION WS] DISCONNECT | "
            "user_id=%s | client=%s",
            user_id,
            websocket.client,
        )

        if user_id not in self.user_connections:

            logger.warning(
                "[NOTIFICATION WS] USER NOT FOUND IN CONNECTION MANAGER | "
                "user_id=%s",
                user_id,
            )
            return

        if websocket in self.user_connections[user_id]:

            self.user_connections[user_id].remove(websocket)

            logger.info(
                "[NOTIFICATION WS] CONNECTION REMOVED | "
                "user_id=%s | remaining=%s",
                user_id,
                len(self.user_connections[user_id]),
            )

        else:

            logger.warning(
                "[NOTIFICATION WS] SOCKET NOT FOUND FOR USER | "
                "user_id=%s | client=%s",
                user_id,
                websocket.client,
            )

            return

        if not self.user_connections[user_id]:

            del self.user_connections[user_id]

            logger.info(
                "[NOTIFICATION WS] NO ACTIVE CONNECTIONS | "
                "user_id=%s",
                user_id,
            )
            

       

    async def send_to_user(
        self,
        user_id: int,
        message: dict,
    ):

        logger.info(
            "[NOTIFICATION WS] SEND NOTIFICATION | "
            "user_id=%s | message=%s",
            user_id,
            message,
        )

        if user_id not in self.user_connections:

            logger.warning(
                "[NOTIFICATION WS] NO ACTIVE CONNECTION | "
                "user_id=%s",
                user_id,
            )

            return

        

        disconnected = []

        logger.info(
            "[NOTIFICATION WS] ACTIVE CONNECTIONS | "
            "user_id=%s | count=%s",
            user_id,
            len(self.user_connections[user_id]),
        )

        for connection in list(
            self.user_connections[user_id]
        ):

            try:

                logger.info(
                    "[NOTIFICATION WS] SENDING NOTIFICATION | "
                    "user_id=%s | client=%s",
                    user_id,
                    connection.client,
                )


                await connection.send_json(
                    message
                )

                logger.info(
                    "[NOTIFICATION WS] NOTIFICATION SENT SUCCESSFULLY | "
                    "user_id=%s | client=%s",
                    user_id,
                    connection.client,
                )

            except Exception as e:


                logger.error(
                    "[NOTIFICATION WS] FAILED TO SEND NOTIFICATION | "
                    "user_id=%s | client=%s",
                    user_id,
                    connection.client,
                    exc_info=True,
                )


                disconnected.append(
                    connection
                )


        for socket in disconnected:

            self.disconnect_user(
                user_id,
                socket
            )

 


# ==================================================
# GLOBAL CONNECTION MANAGER
# ==================================================

manager = ConnectionManager()


# ==================================================
# BROADCAST HELPERS
# ==================================================

async def broadcast_task_event(
    task_id: int,
    payload: dict,
):

    logger.info(
        "[TASK WS] BROADCAST EVENT | "
        "task_id=%s | payload=%s",
        task_id,
        payload,
    )

    await manager.send_to_task(
        task_id,
        payload,
    )


async def broadcast_user_notification(
    user_id: int,
    payload: dict,
):

    logger.info(
        "[NOTIFICATION WS] BROADCAST NOTIFICATION | "
        "user_id=%s | payload=%s",
        user_id,
        payload,
    )

    await manager.send_to_user(
        user_id,
        payload,
    )




# from collections import defaultdict
# from fastapi import WebSocket
# from typing import Dict, List


# class ConnectionManager:

#     def __init__(self):

#         # task_id -> list of websocket connections
#         self.task_connections: Dict[
#             int,
#             List[WebSocket]
#         ] = defaultdict(list)

#         # user_id -> list of websocket connections
#         self.user_connections: Dict[
#             int,
#             List[WebSocket]
#         ] = defaultdict(list)

#     # --------------------------------------------------
#     # TASK CONNECTIONS
#     # --------------------------------------------------

#     async def connect_task(
#         self,
#         task_id: int,
#         websocket: WebSocket,
#     ):
#         print("=" * 70)
#         print("=" * 70)
#         print("WEBSOCKET TASK CONNECTION ATTEMPT")
#         print(f"Task ID: {task_id}")
#         print(f"Client: {websocket.client}")
#         print(f"Headers: {dict(websocket.headers)}")

#         await websocket.accept()

#         self.task_connections[
#             task_id
#         ].append(websocket)




#     def disconnect_task(
#         self,
#         task_id: int,
#         websocket: WebSocket,
#     ):

#         if task_id in self.task_connections:

#             if websocket in self.task_connections[
#                 task_id
#             ]:

#                 self.task_connections[
#                     task_id
#                 ].remove(websocket)

#             if not self.task_connections[
#                 task_id
#             ]:

#                 del self.task_connections[
#                     task_id
#                 ]

#     async def send_to_task(
#         self,
#         task_id: int,
#         message: dict,
#     ):

#         if task_id not in self.task_connections:
#             return

#         disconnected = []

#         for connection in list(
#             self.task_connections[task_id]
#         ):

#             try:

#                 await connection.send_json(
#                     message
#                 )

#             except Exception:

#                 disconnected.append(
#                     connection
#                 )

#         for socket in disconnected:

#             self.disconnect_task(
#                 task_id,
#                 socket
#             )

#     # --------------------------------------------------
#     # USER CONNECTIONS
#     # --------------------------------------------------

#     async def connect_user(
#         self,
#         user_id: int,
#         websocket: WebSocket,
#     ):

       

#         await websocket.accept()


#         self.user_connections[
#             user_id
#         ].append(websocket)

#     def disconnect_user(
#         self,
#         user_id: int,
#         websocket: WebSocket,
#     ):

#         if user_id in self.user_connections:

#             if websocket in self.user_connections[
#                 user_id
#             ]:

#                 self.user_connections[
#                     user_id
#                 ].remove(websocket)

#             if not self.user_connections[
#                 user_id
#             ]:

#                 del self.user_connections[
#                     user_id
#                 ]

#     async def send_to_user(
#         self,
#         user_id: int,
#         message: dict,
#     ):

#         print(
#             "SEND NOTIFICATION:",
#             user_id,
#             message
#         )

#         print(
#             "CONNECTED USERS:",
#             self.user_connections
#         )

#         if user_id not in self.user_connections:
#             return

#         disconnected = []

#         for connection in list(
#             self.user_connections[user_id]
#         ):

#             try:

#                 await connection.send_json(
#                     message
#                 )

#             except Exception:

#                 disconnected.append(
#                     connection
#                 )

#         for socket in disconnected:

#             self.disconnect_user(
#                 user_id,
#                 socket
#             )


# manager = ConnectionManager()

# async def broadcast_task_event(
#     task_id: int,
#     payload: dict,
# ):
#     await manager.send_to_task(
#         task_id,
#         payload,
#     )


# async def broadcast_user_notification(
#     user_id: int,
#     payload: dict,
# ):
#     await manager.send_to_user(
#         user_id,
#         payload,
#     )