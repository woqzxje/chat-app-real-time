import socketio

# Async Socket.IO server — compatible with the socket.io JS client
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# In-memory map: { userId: socketId }  (same as JS userSocketMap)
user_socket_map: dict[str, str] = {}


@sio.event
async def connect(sid, environ, auth):
    """Called when a client connects. Reads userId from query string."""
    # socket.io JS client sends query params in environ["QUERY_STRING"]
    from urllib.parse import parse_qs
    qs = parse_qs(environ.get("QUERY_STRING", ""))
    user_id = qs.get("userId", [None])[0]

    if user_id:
        user_socket_map[user_id] = sid
        print(f"User Connected: {user_id} ({sid})")

    await sio.emit("getOnlineUsers", list(user_socket_map.keys()))


@sio.event
async def disconnect(sid):
    """Called when a client disconnects."""
    user_id = next((uid for uid, s in user_socket_map.items() if s == sid), None)
    if user_id:
        del user_socket_map[user_id]
        print(f"User Disconnected: {user_id}")

    await sio.emit("getOnlineUsers", list(user_socket_map.keys()))
