import socketio

# Khởi tạo server Async Socket.IO — tương thích với thư viện socket.io của Javascript
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*", # Cho phép kết nối từ mọi nguồn
    logger=False,
    engineio_logger=False,
)

# Bản đồ lưu trữ trong bộ nhớ: { userId: socketId } 
# Giúp server biết được user nào đang dùng socket ID nào để gửi tin nhắn chính xác
user_socket_map: dict[str, str] = {}


@sio.event
async def connect(sid, environ, auth):
    """Được gọi khi một client kết nối. Đọc userId từ query string."""
    # Client JS gửi userId qua query params: io(url, { query: { userId: ... } })
    from urllib.parse import parse_qs
    qs = parse_qs(environ.get("QUERY_STRING", ""))
    user_id = qs.get("userId", [None])[0]

    if user_id:
        # Lưu socket ID vào map ứng với userId
        user_socket_map[user_id] = sid
        print(f"User Connected: {user_id} ({sid})")

    # Phát sự kiện (emit) cho tất cả client để cập nhật danh sách người dùng đang online
    await sio.emit("getOnlineUsers", list(user_socket_map.keys()))


@sio.event
async def disconnect(sid):
    """Được gọi khi một client ngắt kết nối."""
    # Tìm userId tương ứng với socket ID đang ngắt kết nối
    user_id = next((uid for uid, s in user_socket_map.items() if s == sid), None)
    if user_id:
        # Xóa khỏi danh sách online
        del user_socket_map[user_id]
        print(f"User Disconnected: {user_id}")

    # Thông báo cho các client khác cập nhật lại danh sách online
    await sio.emit("getOnlineUsers", list(user_socket_map.keys()))

#-------------------------------------------------------------------------------------

@sio.on("call:initiate")
async def on_call_initiate(sid, data):
    # data = { "to_user_id": "...", "from_user_id": "...", "caller_name": "..." }
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("call:incoming", {
            "from_user_id": data["from_user_id"],
            "caller_name": data["caller_name"],
        }, to=to_sid)

@sio.on("call:offer")
async def on_call_offer(sid, data):
    # data = { "to_user_id": "...", "offer": <SDP offer> }
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("call:offer", {"offer": data["offer"], "from_sid": sid}, to=to_sid)

@sio.on("call:answer")
async def on_call_answer(sid, data):
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("call:answer", {"answer": data["answer"]}, to=to_sid)

@sio.on("call:ice-candidate")
async def on_ice_candidate(sid, data):
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("call:ice-candidate", {"candidate": data["candidate"]}, to=to_sid)

@sio.on("call:end")
async def on_call_end(sid, data):
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("call:end", {}, to=to_sid)

@sio.on("call:reject")
async def on_call_reject(sid, data):
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("call:reject", {}, to=to_sid)