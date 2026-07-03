import os
import socketio
from datetime import datetime

from app.utils import decode_token

# â”€â”€ CORS: doc danh sach origin tu bien moi truong (khong dung "*") â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# ALLOWED_ORIGINS = danh sach domain, ngan cach boi dau phay.
# Vi du: "https://myapp.vercel.app,http://localhost:5173"
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Khoi tao server Async Socket.IO â€” tuong thich voi thu vien socket.io cua Javascript
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=ALLOWED_ORIGINS,  # Chi cho phep cac origin trong allow-list
    logger=False,
    engineio_logger=False,
)

# Ban do luu tru trong bo nho: { userId: socketId }
# Giup server biet duoc user nao dang dung socket ID nao de gui tin nhan chinh xac
user_socket_map: dict[str, str] = {}


def _msg_dict(msg) -> dict:
    """Chuyen doi Message sang dictionary de gui qua socket."""
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


async def _current_user_id(sid) -> str | None:
    """Lay user_id da xac thuc tu session cua socket (khong tin payload client)."""
    try:
        session = await sio.get_session(sid)
    except KeyError:
        return None
    return session.get("user_id") if session else None


@sio.event
async def connect(sid, environ, auth):
    """
    Duoc goi khi mot client ket noi.
    BAO MAT: Yeu cau client gui JWT qua `auth` trong io() options.
    Server xac thuc token va suy ra user_id tu token da giai ma.
    Tu choi ket noi neu token thieu hoac khong hop le.
    """
    token = None
    if isinstance(auth, dict):
        token = auth.get("token")

    # Ho tro fallback: mot so client co the gui token qua header Authorization
    if not token:
        headers = {k.decode().lower(): v.decode() for k, v in environ.get("asgi.scope", {}).get("headers", [])} \
            if environ.get("asgi.scope") else {}
        auth_header = headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()

    if not token:
        print(f"[socket] Tu choi ket noi {sid}: thieu token")
        raise ConnectionRefusedError("Thieu token xac thuc")

    try:
        payload = decode_token(token)
        user_id = payload.get("userId")
        if not user_id:
            raise ValueError("Token khong chua userId")
    except Exception as e:
        print(f"[socket] Tu choi ket noi {sid}: token khong hop le ({e})")
        raise ConnectionRefusedError("Token khong hop le hoac da het han")

    # Luu user_id da xac thuc vao session cua socket
    await sio.save_session(sid, {"user_id": user_id})
    user_socket_map[user_id] = sid
    print(f"User Connected: {user_id} ({sid})")

    # Phat su kien (emit) cho tat ca client de cap nhat danh sach nguoi dung dang online
    await sio.emit("getOnlineUsers", list(user_socket_map.keys()))


@sio.event
async def disconnect(sid):
    """Duoc goi khi mot client ngat ket noi."""
    user_id = next((uid for uid, s in user_socket_map.items() if s == sid), None)
    if user_id:
        del user_socket_map[user_id]
        print(f"User Disconnected: {user_id}")

    await sio.emit("getOnlineUsers", list(user_socket_map.keys()))


@sio.on("typing")
async def on_typing(sid, data):
    """Chuyen tiep trang thai 'dang go' den nguoi nhan (danh cho typing indicator)."""
    from_user_id = await _current_user_id(sid)
    if not from_user_id:
        return
    to_user_id = (data or {}).get("to_user_id")
    is_typing = bool((data or {}).get("is_typing", False))
    if not to_user_id:
        return
    to_sid = user_socket_map.get(to_user_id)
    if to_sid:
        await sio.emit("typing", {"from_user_id": from_user_id, "is_typing": is_typing}, to=to_sid)


@sio.on("markMessagesSeen")
async def on_mark_messages_seen(sid, data):
    """Danh dau tin nhan da xem khi dang mo san khung chat.
    BAO MAT: receiver_id luon duoc suy ra tu phien xac thuc, khong tin client."""
    from app.models import Message

    receiver_id = await _current_user_id(sid)
    if not receiver_id:
        return

    sender_id = (data or {}).get("senderId")

    if sender_id and receiver_id:
        # Cap nhat database
        await Message.find(
            Message.senderId == sender_id,
            Message.receiverId == receiver_id,
            Message.seen == False,  # noqa: E712
        ).update({"$set": {"seen": True}})

        # Ban su kien cho nguoi gui
        sender_socket_id = user_socket_map.get(sender_id)
        if sender_socket_id:
            await sio.emit("messagesSeen", {"receiverId": receiver_id}, to=sender_socket_id)

# =====================================================================================
#  VIDEO CALL SIGNALING (Python) â€” Xu ly WebRTC signaling cho cuoc goi video
#  BAO MAT: Danh tinh nguoi goi/nguoi nhan luon suy ra tu phien xac thuc (sid),
#  khong tin cac truong from_user_id/caller_id do client gui len.
# =====================================================================================

@sio.on("video:initiate")
async def on_video_initiate(sid, data):
    """Buoc 1: Nguoi goi gui yeu cau goi video. Server chuyen tiep den nguoi nhan."""
    from_user_id = await _current_user_id(sid)
    if not from_user_id:
        return
    to_user_id = (data or {}).get("to_user_id")
    to_sid = user_socket_map.get(to_user_id)
    if to_sid:
        await sio.emit("video:incoming", {
            "from_user_id": from_user_id,
            "caller_name": (data or {}).get("caller_name", ""),
            "isVideo": (data or {}).get("isVideo", True),
        }, to=to_sid)


@sio.on("video:offer")
async def on_video_offer(sid, data):
    """Buoc 2: Nguoi goi gui SDP Offer. Server chuyen tiep Offer den nguoi nhan."""
    from_user_id = await _current_user_id(sid)
    if not from_user_id:
        return
    to_user_id = (data or {}).get("to_user_id")
    to_sid = user_socket_map.get(to_user_id)
    if to_sid:
        await sio.emit("video:offer", {
            "offer": (data or {}).get("offer"),
            "from_user_id": from_user_id,
        }, to=to_sid)


@sio.on("video:answer")
async def on_video_answer(sid, data):
    """Buoc 3: Nguoi nhan gui SDP Answer. Server chuyen tiep Answer ve cho nguoi goi."""
    if not await _current_user_id(sid):
        return
    to_user_id = (data or {}).get("to_user_id")
    to_sid = user_socket_map.get(to_user_id)
    if to_sid:
        await sio.emit("video:answer", {
            "answer": (data or {}).get("answer"),
        }, to=to_sid)


@sio.on("video:ice-candidate")
async def on_video_ice_candidate(sid, data):
    """Buoc 4: Trao doi ICE Candidate (thong tin mang de thiet lap ket noi P2P)."""
    if not await _current_user_id(sid):
        return
    to_user_id = (data or {}).get("to_user_id")
    to_sid = user_socket_map.get(to_user_id)
    if to_sid:
        await sio.emit("video:ice-candidate", {
            "candidate": (data or {}).get("candidate"),
        }, to=to_sid)


@sio.on("video:end")
async def on_video_end(sid, data):
    """Ket thuc cuoc goi video â€” thong bao cho ben con lai va luu lich su.
    BAO MAT: Nguoi thuc hien phai la mot trong hai ben (caller/receiver)."""
    acting_user = await _current_user_id(sid)
    if not acting_user:
        return

    to_user_id = (data or {}).get("to_user_id")
    to_sid = user_socket_map.get(to_user_id)
    if to_sid:
        await sio.emit("video:end", {}, to=to_sid)

    # Luu lich su cuoc goi vao database
    caller_id = (data or {}).get("caller_id", "")
    receiver_id = (data or {}).get("receiver_id", "")
    call_type = (data or {}).get("call_type", "completed")
    duration = (data or {}).get("duration", 0)
    is_video = (data or {}).get("is_video", True)

    # Nguoi thuc hien phai la mot trong hai ben, tranh nguy tao lich su gia mao
    if acting_user not in (caller_id, receiver_id):
        return

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

            caller_sid = user_socket_map.get(caller_id)
            receiver_sid = user_socket_map.get(receiver_id)
            if caller_sid:
                await sio.emit("receiveMessage", msg_data, to=caller_sid)
            if receiver_sid:
                await sio.emit("receiveMessage", msg_data, to=receiver_sid)
        except Exception as e:
            print(f"[video:end] Loi luu lich su cuoc goi: {e}")


@sio.on("video:reject")
async def on_video_reject(sid, data):
    """Tu choi cuoc goi video â€” thong bao cho nguoi goi va luu lich su.
    BAO MAT: Nguoi thuc hien phai la mot trong hai ben."""
    acting_user = await _current_user_id(sid)
    if not acting_user:
        return

    to_user_id = (data or {}).get("to_user_id")
    to_sid = user_socket_map.get(to_user_id)
    if to_sid:
        await sio.emit("video:reject", {}, to=to_sid)

    caller_id = (data or {}).get("caller_id", "")
    receiver_id = (data or {}).get("receiver_id", "")
    is_video = (data or {}).get("is_video", True)

    if acting_user not in (caller_id, receiver_id):
        return

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

            caller_sid = user_socket_map.get(caller_id)
            receiver_sid = user_socket_map.get(receiver_id)
            if caller_sid:
                await sio.emit("receiveMessage", msg_data, to=caller_sid)
            if receiver_sid:
                await sio.emit("receiveMessage", msg_data, to=receiver_sid)
        except Exception as e:
            print(f"[video:reject] Loi luu lich su cuoc goi: {e}")
