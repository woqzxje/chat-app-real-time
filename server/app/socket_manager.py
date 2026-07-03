import socketio
from datetime import datetime

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


def _msg_dict(msg) -> dict:
    """Chuyển đổi Message sang dictionary để gửi qua socket."""
    return {
        "_id": str(msg.id),
        "senderId": msg.senderId,
        "receiverId": msg.receiverId,
        "text": msg.text,
        "image": msg.image,
        "attachment": msg.attachment.dict() if msg.attachment else None,
        "callInfo": msg.callInfo.dict() if msg.callInfo else None,
        "seen": msg.seen,
        "createdAt": msg.createdAt.isoformat(),
        "updatedAt": msg.updatedAt.isoformat(),
    }


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

@sio.on("markMessagesSeen")
async def on_mark_messages_seen(sid, data):
    """Đánh dấu tin nhắn đã xem khi đang mở sẵn khung chat"""
    from app.models import Message
    
    sender_id = data.get("senderId")
    receiver_id = data.get("receiverId")
    
    if sender_id and receiver_id:
        # Cập nhật database
        await Message.find(
            Message.senderId == sender_id,
            Message.receiverId == receiver_id,
            Message.seen == False
        ).update({"$set": {"seen": True}})
        
        # Bắn sự kiện cho người gửi
        sender_socket_id = user_socket_map.get(sender_id)
        if sender_socket_id:
            await sio.emit("messagesSeen", {"receiverId": receiver_id}, to=sender_socket_id)

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
            "isVideo": data.get("isVideo", True),
        }, to=to_sid)


@sio.on("video:offer")
async def on_video_offer(sid, data):
    """
    Bước 2: Người gọi gửi SDP Offer (mô tả khả năng media).
    Server chuyển tiếp Offer đến người nhận.
    data = { "to_user_id": "...", "from_user_id": "...", "offer": <SDP Offer object> }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:offer", {
            "offer": data["offer"],
            "from_user_id": data.get("from_user_id", ""),
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
    Kết thúc cuộc gọi video — thông báo cho bên còn lại và lưu lịch sử.
    data = { "to_user_id": "...", "caller_id": "...", "receiver_id": "...",
             "call_type": "completed"|"missed", "duration": <int giây> }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:end", {}, to=to_sid)

    # Lưu lịch sử cuộc gọi vào database
    caller_id = data.get("caller_id", "")
    receiver_id = data.get("receiver_id", "")
    call_type = data.get("call_type", "completed")
    duration = data.get("duration", 0)
    is_video = data.get("is_video", True)

    if caller_id and receiver_id:
        try:
            from app.models import Message, CallInfo
            call_msg = Message(
                senderId=caller_id,
                receiverId=receiver_id,
                callInfo=CallInfo(
                    call_type=call_type,
                    duration=duration,
                    caller_id=caller_id,
                    receiver_id=receiver_id,
                    is_video=is_video,
                ),
            )
            await call_msg.insert()
            msg_data = _msg_dict(call_msg)

            # Gửi tin nhắn lịch sử cuộc gọi cho cả hai bên
            caller_sid = user_socket_map.get(caller_id)
            receiver_sid = user_socket_map.get(receiver_id)
            if caller_sid:
                await sio.emit("receiveMessage", msg_data, to=caller_sid)
            if receiver_sid:
                await sio.emit("receiveMessage", msg_data, to=receiver_sid)
        except Exception as e:
            print(f"[video:end] Lỗi lưu lịch sử cuộc gọi: {e}")


@sio.on("video:reject")
async def on_video_reject(sid, data):
    """
    Từ chối cuộc gọi video — thông báo cho người gọi và lưu lịch sử.
    data = { "to_user_id": "...", "caller_id": "...", "receiver_id": "..." }
    """
    to_sid = user_socket_map.get(data["to_user_id"])
    if to_sid:
        await sio.emit("video:reject", {}, to=to_sid)

    # Lưu lịch sử cuộc gọi bị từ chối
    caller_id = data.get("caller_id", "")
    receiver_id = data.get("receiver_id", "")
    is_video = data.get("is_video", True)

    if caller_id and receiver_id:
        try:
            from app.models import Message, CallInfo
            call_msg = Message(
                senderId=caller_id,
                receiverId=receiver_id,
                callInfo=CallInfo(
                    call_type="rejected",
                    duration=0,
                    caller_id=caller_id,
                    receiver_id=receiver_id,
                    is_video=is_video,
                ),
            )
            await call_msg.insert()
            msg_data = _msg_dict(call_msg)

            # Gửi tin nhắn lịch sử cuộc gọi cho cả hai bên
            caller_sid = user_socket_map.get(caller_id)
            receiver_sid = user_socket_map.get(receiver_id)
            if caller_sid:
                await sio.emit("receiveMessage", msg_data, to=caller_sid)
            if receiver_sid:
                await sio.emit("receiveMessage", msg_data, to=receiver_sid)
        except Exception as e:
            print(f"[video:reject] Lỗi lưu lịch sử cuộc gọi: {e}")