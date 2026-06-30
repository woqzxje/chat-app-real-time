from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models import User, Message, FileAttachment
from app.dependencies import get_current_user
from app.cloudinary_client import upload_image
from app.socket_manager import sio, user_socket_map

# Khởi tạo router cho các tính năng liên quan đến tin nhắn
message_router = APIRouter()


# ── Các hàm hỗ trợ (Helpers) ──────────────────────────────────────────────────

def _msg_dict(msg: Message) -> dict:
    """Chuyển đổi đối tượng Message (Beanie) sang dictionary."""
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


def _user_dict(user: User) -> dict:
    """Chuyển đổi đối tượng User (Beanie) sang dictionary."""
    return {
        "_id": str(user.id),
        "fullName": user.fullName,
        "email": user.email,
        "profilePic": user.profilePic,
        "bio": user.bio,
        "createdAt": user.createdAt.isoformat(),
        "updatedAt": user.updatedAt.isoformat(),
    }


# ── GET /api/messages/users ──────────────────────────────────────────────────

@message_router.get("/users")
async def get_users_for_sidebar(current_user: User = Depends(get_current_user)):
    """Lấy danh sách tất cả người dùng để hiển thị ở thanh bên (Sidebar)"""
    my_id = str(current_user.id)

    # Tìm tất cả người dùng ngoại trừ chính mình
    all_users = await User.find(User.id != current_user.id).to_list()

    # (Tùy chọn) Kiểm tra số tin nhắn chưa đọc từ mỗi người dùng
    unseen_messages: dict[str, int] = {}
    for user in all_users:
        uid = str(user.id)
        count = await Message.find(
            Message.senderId == uid,
            Message.receiverId == my_id,
            Message.seen == False,   # noqa: E712
        ).count()
        if count > 0:
            unseen_messages[uid] = count

    return {
        "success": True,
        "users": [_user_dict(u) for u in all_users],
        "unseenMessages": unseen_messages,
    }


# ── GET /api/messages/{id} ───────────────────────────────────────────────────

@message_router.get("/{id}")
async def get_messages(id: str, current_user: User = Depends(get_current_user)):
    """Lấy lịch sử tin nhắn giữa người dùng hiện tại và một người dùng khác (theo id)"""
    my_id = str(current_user.id)

    # Tìm các tin nhắn mà mình là người gửi và họ là người nhận HOẶC ngược lại
    messages = await Message.find(
        {
            "$or": [
                {"senderId": my_id, "receiverId": id},
                {"senderId": id, "receiverId": my_id},
            ]
        }
    ).to_list()

    # Đánh dấu các tin nhắn họ gửi cho mình là 'đã xem' (seen)
    await Message.find(
        Message.senderId == id,
        Message.receiverId == my_id,
        Message.seen == False,  # noqa: E712
    ).update({"$set": {"seen": True}})

    return {"success": True, "messages": [_msg_dict(m) for m in messages]}


# ── PUT /api/messages/mark/{id} ──────────────────────────────────────────────

@message_router.put("/mark/{id}")
async def mark_message_as_seen(id: str, current_user: User = Depends(get_current_user)):
    """Đánh dấu một tin nhắn cụ thể là đã xem"""
    msg = await Message.get(id)
    if msg:
        await msg.set({"seen": True})
    return {"success": True}


# ── POST /api/messages/send/{id} ─────────────────────────────────────────────

class SendMessageBody(BaseModel):
    """Cấu trúc dữ liệu gửi tin nhắn (có thể là chữ hoặc ảnh)"""
    text: Optional[str] = None
    image: Optional[str] = None
    attachment: Optional[FileAttachment] = None


@message_router.post("/send/{id}")
async def send_message(
    id: str,
    body: SendMessageBody,
    current_user: User = Depends(get_current_user),
):
    """Gửi tin nhắn mới cho một người dùng"""
    sender_id = str(current_user.id)
    image_url: Optional[str] = None

    # Nếu có gửi kèm ảnh, tải ảnh lên Cloudinary
    if body.image:
        image_url = await upload_image(body.image)

    # Lưu tin nhắn vào Database
    new_msg = Message(
        senderId=sender_id,
        receiverId=id,
        text=body.text,
        image=image_url,
        attachment=body.attachment,
    )
    await new_msg.insert()

    # GỬI TIN NHẮN REAL-TIME QUA SOCKET.IO
    # Tìm xem người nhận có đang online không
    receiver_socket_id = user_socket_map.get(id)
    if receiver_socket_id:
        # Nếu online, gửi tin nhắn trực tiếp đến socket của họ
        await sio.emit("receiveMessage", _msg_dict(new_msg), to=receiver_socket_id)

    return {"success": True, "newMessage": _msg_dict(new_msg)}
