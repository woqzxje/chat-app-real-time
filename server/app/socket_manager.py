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

# =====================================================================================
#  VIDEO CALL SIGNALING (Python) — Xử lý WebRTC signaling cho cuộc gọi video
#  Tất cả logic signaling được viết bằng Python, chạy trên FastAPI + Socket.IO
# =====================================================================================

@sio.on("video:initiate")
async def on_video_initiate(sid, data):
    """
    Bước 1: Người gọi gửi yêu cầu gọi video.
    Server chuyển tiếp thông báo đến người nhận.
    data = { "to_user_id": "...", "from_user_id": "...", "caller_name": "..." }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:incoming", {
            "from_user_id": data["from_user_id"],
            "caller_name": data["caller_name"],
        }, to=to_sid)


@sio.on("video:offer")
async def on_video_offer(sid, data):
    """
    Bước 2: Người gọi gửi SDP Offer (mô tả khả năng media).
    Server chuyển tiếp Offer đến người nhận.
    data = { "to_user_id": "...", "offer": <SDP Offer object> }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:offer", {
            "offer": data["offer"],
            "from_sid": sid,
        }, to=to_sid)


@sio.on("video:answer")
async def on_video_answer(sid, data):
    """
    Bước 3: Người nhận gửi SDP Answer (phản hồi khả năng media).
    Server chuyển tiếp Answer về cho người gọi.
    data = { "to_user_id": "...", "answer": <SDP Answer object> }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:answer", {
            "answer": data["answer"],
        }, to=to_sid)


@sio.on("video:ice-candidate")
async def on_video_ice_candidate(sid, data):
    """
    Bước 4: Trao đổi ICE Candidate (thông tin mạng để thiết lập kết nối P2P).
    Cả hai bên gửi ICE candidates, server chuyển tiếp cho nhau.
    data = { "to_user_id": "...", "candidate": <ICE Candidate object> }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:ice-candidate", {
            "candidate": data["candidate"],
        }, to=to_sid)


@sio.on("video:end")
async def on_video_end(sid, data):
    """
    Kết thúc cuộc gọi video — thông báo cho bên còn lại.
    data = { "to_user_id": "..." }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:end", {}, to=to_sid)


@sio.on("video:reject")
async def on_video_reject(sid, data):
    """
    Từ chối cuộc gọi video — thông báo cho người gọi.
    data = { "to_user_id": "..." }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:reject", {}, to=to_sid)