class WebSocketLoggingMiddleware:

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):

        if scope["type"] == "websocket":

            client = scope.get("client")
            path = scope.get("path")
            query_string = scope.get("query_string", b"").decode()

            headers = {
                key.decode(errors="ignore"): value.decode(errors="ignore")
                for key, value in scope.get("headers", [])
            }

            print("\n" + "=" * 70)
            print("WEBSOCKET HANDSHAKE RECEIVED")
            print("=" * 70)
            print(f"Client      : {client}")
            print(f"Path        : {path}")
            print(f"Query       : {query_string}")
            print(f"Headers     : {headers}")
            print("=" * 70)

            async def logging_send(message):

                if message["type"] == "websocket.accept":
                    print(
                        f"WEBSOCKET ACCEPTED: {path}"
                    )

                elif message["type"] == "websocket.close":
                    print(
                        f"WEBSOCKET CLOSED: "
                        f"{path} | code={message.get('code')}"
                    )

                elif message["type"] == "websocket.http.response.start":
                    print(
                        f"WEBSOCKET HTTP RESPONSE: "
                        f"{path} | status={message.get('status')}"
                    )

                await send(message)

            try:

                await self.app(
                    scope,
                    receive,
                    logging_send
                )

            except Exception as e:

                print(
                    f"WEBSOCKET ERROR: "
                    f"{path} | {type(e).__name__}: {e}"
                )

                raise

            return

        await self.app(
            scope,
            receive,
            send
        )