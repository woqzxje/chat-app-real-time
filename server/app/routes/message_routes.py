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
        "isDeleted": getattr(msg, 'isDeleted', False),
        "isEdited": getattr(msg, 'isEdited', False),
        "editedAt": msg.editedAt.isoformat() if getattr(msg, 'editedAt', None) else None,
        "reactions": [r.dict() for r in getattr(msg, 'reactions', [])],
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
    """Lấy danh sách bạn bè và những người lạ đã nhắn tin"""
    my_id = str(current_user.id)

    # 1. Danh sách bạn bè
    friends = current_user.friends or []
    
    # 2. Tìm ID những người lạ đã nhắn tin
    messages_sent = await Message.distinct("receiverId", {"senderId": my_id})
    messages_received = await Message.distinct("senderId", {"receiverId": my_id})
    chatted_user_ids = set(messages_sent + messages_received)
    chatted_user_ids.discard(my_id)
    
    # Gom tất cả ID cần lấy (bạn bè + người lạ)
    strangers = [uid for uid in chatted_user_ids if uid not in friends]
    all_user_ids = set(friends + strangers)
    
    from bson import ObjectId
    object_ids = [ObjectId(uid) for uid in all_user_ids if ObjectId.is_valid(uid)]
    
    from beanie.operators import In
    all_users = await User.find(In(User.id, object_ids)).to_list() if object_ids else []

    # Định dạng dữ liệu kèm cờ isFriend
    users_data = []
    for u in all_users:
        u_dict = _user_dict(u)
        u_dict['isFriend'] = str(u.id) in friends
        users_data.append(u_dict)

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
        "users": users_data,
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
    unseen_msgs = await Message.find(
        Message.senderId == id,
        Message.receiverId == my_id,
        Message.seen == False,  # noqa: E712
    ).to_list()
    
    if unseen_msgs:
        await Message.find(
            Message.senderId == id,
            Message.receiverId == my_id,
            Message.seen == False,  # noqa: E712
        ).update({"$set": {"seen": True}})
        
        # Bắn sự kiện qua socket cho người gửi biết mình đã xem
        sender_socket_id = user_socket_map.get(id)
        if sender_socket_id:
            await sio.emit("messagesSeen", {"receiverId": my_id}, to=sender_socket_id)

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

# ── PUT /api/messages/edit/{id} ──────────────────────────────────────────────

class EditMessageBody(BaseModel):
    text: str

@message_router.put("/edit/{id}")
async def edit_message(
    id: str,
    body: EditMessageBody,
    current_user: User = Depends(get_current_user),
):
    """Chỉnh sửa nội dung tin nhắn"""
    msg = await Message.get(id)
    if not msg:
        return {"success": False, "message": "Tin nhắn không tồn tại"}
    
    if msg.senderId != str(current_user.id):
        return {"success": False, "message": "Không có quyền chỉnh sửa"}

    if msg.image or msg.attachment:
        return {"success": False, "message": "Chỉ có thể chỉnh sửa tin nhắn văn bản"}

    await msg.set({
        "text": body.text,
        "isEdited": True,
        "editedAt": datetime.utcnow()
    })
    
    # Phát sự kiện qua Socket.io
    receiver_socket_id = user_socket_map.get(msg.receiverId)
    if receiver_socket_id:
        await sio.emit("messageEdited", {"msgId": id, "text": body.text}, to=receiver_socket_id)

    return {"success": True, "message": _msg_dict(msg)}

# ── PUT /api/messages/revoke/{id} ─────────────────────────────────────────────

@message_router.put("/revoke/{id}")
async def revoke_message(
    id: str,
    current_user: User = Depends(get_current_user),
):
    """Thu hồi tin nhắn (Soft Delete)"""
    msg = await Message.get(id)
    if not msg:
        return {"success": False, "message": "Tin nhắn không tồn tại"}
    
    if msg.senderId != str(current_user.id):
        return {"success": False, "message": "Không có quyền thu hồi"}

    # Xóa nội dung để giải phóng và bảo mật, đánh dấu là đã xóa
    await msg.set({
        "isDeleted": True,
        "text": None,
        "image": None,
        "attachment": None
    })
    
    # Phát sự kiện qua Socket.io
    receiver_socket_id = user_socket_map.get(msg.receiverId)
    if receiver_socket_id:
        await sio.emit("messageDeleted", {"msgId": id}, to=receiver_socket_id)

    return {"success": True, "message": _msg_dict(msg)}

# ── POST /api/messages/react/{id} ─────────────────────────────────────────────

class ReactMessageBody(BaseModel):
    emoji: str

@message_router.post("/react/{id}")
async def react_message(
    id: str,
    body: ReactMessageBody,
    current_user: User = Depends(get_current_user),
):
    """Thả hoặc bỏ cảm xúc trên tin nhắn"""
    msg = await Message.get(id)
    if not msg:
        return {"success": False, "message": "Tin nhắn không tồn tại"}
    
    uid = str(current_user.id)
    emoji = body.emoji
    
    # Khởi tạo mảng reactions nếu rỗng (phòng hờ dữ liệu cũ)
    reactions = msg.reactions or []
    
    # Kiểm tra xem user này đã thả cảm xúc đó chưa
    existing_reaction = next((r for r in reactions if r.userId == uid and r.emoji == emoji), None)
    
    if existing_reaction:
        # Nếu đã có, tiến hành xóa (toggle off)
        reactions = [r for r in reactions if not (r.userId == uid and r.emoji == emoji)]
    else:
        # Nếu chưa có, thêm mới (có thể xóa các cảm xúc khác của user này nếu chỉ cho phép 1, nhưng ở đây cho phép nhiều như Discord/Slack)
        # Hoặc như Zalo/Messenger: Chỉ được thả 1 loại. Ta sẽ xóa tất cả các cảm xúc cũ của user này trước khi thêm mới.
        reactions = [r for r in reactions if r.userId != uid]
        
        # Để import Reaction thì dùng dict, do Beanie hỗ trợ mapping
        # Ta có thể import Reaction class ở đầu file hoặc append một dict
        from app.models import Reaction
        reactions.append(Reaction(emoji=emoji, userId=uid))
        
    await msg.set({"reactions": reactions})
    
    # Bắn socket cho mọi người biết
    # Ở đây cần bắn cho cả 2 người, hoặc chỉ người kia nếu họ online
    receiver_socket_id = user_socket_map.get(msg.receiverId if msg.senderId == uid else msg.senderId)
    if receiver_socket_id:
        await sio.emit("messageReacted", {"msgId": id, "reactions": [r.dict() for r in reactions]}, to=receiver_socket_id)

    return {"success": True, "message": _msg_dict(msg)}
