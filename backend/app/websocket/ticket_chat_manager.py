from collections import defaultdict
import logging

from fastapi import WebSocket

logger = logging.getLogger("websocket")


class TicketChatManager:

    def __init__(self):
        # ticket_id -> set of connected websockets
        self.connections = defaultdict(set)

        logger.info(
            "[TICKET WS] TicketChatManager initialized"
        )

    async def connect(
        self,
        ticket_id: int,
        websocket: WebSocket
    ):
        client = websocket.client

        logger.info(
            "[TICKET WS] CONNECTION REQUEST | "
            "ticket_id=%s | client=%s",
            ticket_id,
            client,
        )

        try:

            logger.info(
                "[TICKET WS] ACCEPTING CONNECTION | "
                "ticket_id=%s",
                ticket_id,
            )
            await websocket.accept()

            self.connections[ticket_id].add(
                websocket
            )
            connection_count = len(
                self.connections[ticket_id]
            )

            logger.info(
                "[TICKET WS] CONNECTION ESTABLISHED | "
                "ticket_id=%s | client=%s | active_connections=%s",
                ticket_id,
                client,
                connection_count,
            )

        except Exception as e:

            logger.error(
                "[TICKET WS] CONNECTION ERROR | "
                "ticket_id=%s | client=%s | "
                "error_type=%s | error=%s",
                ticket_id,
                client,
                type(e).__name__,
                str(e),
                exc_info=True,
            )
            raise


    def disconnect(
        self,
        ticket_id: int,
        websocket: WebSocket
    ):

        client = websocket.client

        logger.info(
            "[TICKET WS] DISCONNECT REQUEST | "
            "ticket_id=%s | client=%s",
            ticket_id,
            client,
        )

        if ticket_id not in self.connections:

            logger.warning(
                "[TICKET WS] TICKET ROOM NOT FOUND | "
                "ticket_id=%s",
                ticket_id,
            )

            return
        
        self.connections[ticket_id].discard(
            websocket
        )
        remaining_connections = len(
            self.connections[ticket_id]
        )

        logger.info(
            "[TICKET WS] CONNECTION REMOVED | "
            "ticket_id=%s | client=%s | "
            "remaining_connections=%s",
            ticket_id,
            client,
            remaining_connections,
        )


        # Remove empty room
        if not self.connections[ticket_id]:
            del self.connections[ticket_id]

            logger.info(
                "[TICKET WS] EMPTY ROOM REMOVED | "
                "ticket_id=%s",
                ticket_id,
            )

    async def broadcast_to_ticket(
        self,
        ticket_id: int,
        message: dict
    ):
        connections = self.connections.get(
            ticket_id,
            set()
        )

        logger.info(
            "[TICKET WS] BROADCAST START | "
            "ticket_id=%s | "
            "connections=%s | message_type=%s",
            ticket_id,
            len(connections),
            message.get("type"),
        )

        if not connections:

            logger.warning(
                "[TICKET WS] NO ACTIVE CONNECTIONS | "
                "ticket_id=%s",
                ticket_id,
            )

            return
        dead_connections = set()

        for websocket in self.connections.get(ticket_id, set()):

            client = websocket.client
            try:
                logger.debug(
                    "[TICKET WS] SENDING MESSAGE | "
                    "ticket_id=%s | client=%s | message=%s",
                    ticket_id,
                    client,
                    message,
                )

                await websocket.send_json(
                    message
                )

                logger.info(
                    "[TICKET WS] MESSAGE SENT | "
                    "ticket_id=%s | client=%s",
                    ticket_id,
                    client,
                )

            except Exception as e:

                logger.error(
                    "[TICKET WS] SEND FAILED | "
                    "ticket_id=%s | client=%s | "
                    "error_type=%s | error=%s",
                    ticket_id,
                    client,
                    type(e).__name__,
                    str(e),
                    exc_info=True,
                )

                dead_connections.add(
                    websocket
                )

        # Remove disconnected sockets
        for websocket in dead_connections:

            logger.warning(
                "[TICKET WS] REMOVING DEAD CONNECTION | "
                "ticket_id=%s | client=%s",
                ticket_id,
                websocket.client,
            )

            self.disconnect(
                ticket_id,
                websocket
            )

        logger.info(
            "[TICKET WS] BROADCAST COMPLETE | "
            "ticket_id=%s | "
            "sent=%s | failed=%s",
            ticket_id,
            len(connections) - len(dead_connections),
            len(dead_connections),
        )


manager = TicketChatManager()