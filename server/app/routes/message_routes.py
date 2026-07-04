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

def _msg_dict(msg: Message, sender: User = None, seen_by_users: list = None) -> dict:
    """Chuyển đổi đối tượng Message (Beanie) sang dictionary."""
    base = {
        "_id": str(msg.id),
        "senderId": msg.senderId,
        "receiverId": msg.receiverId,
        "text": msg.text,
        "image": msg.image,
        "attachment": msg.attachment.dict() if msg.attachment else None,
        "callInfo": msg.callInfo.dict() if msg.callInfo else None,
        "seen": msg.seen,
        "seenBy": getattr(msg, 'seenBy', []),
        "isDeleted": getattr(msg, 'isDeleted', False),
        "isEdited": getattr(msg, 'isEdited', False),
        "isSystemMessage": getattr(msg, 'isSystemMessage', False),
        "editedAt": msg.editedAt.isoformat() if getattr(msg, 'editedAt', None) else None,
        "reactions": [r.dict() for r in getattr(msg, 'reactions', [])],
        "createdAt": msg.createdAt.isoformat(),
        "updatedAt": msg.updatedAt.isoformat(),
    }
    if sender:
        base["senderInfo"] = {
            "fullName": sender.fullName,
            "profilePic": sender.profilePic,
        }
    if seen_by_users is not None:
        base["seenByUsers"] = seen_by_users
    return base


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

    # 3. Danh sách các nhóm chat mà user tham gia
    from app.models import ChatGroup
    my_groups = await ChatGroup.find({"members": my_id}).to_list()
    
    for g in my_groups:
        g_dict = {
            "_id": str(g.id),
            "fullName": g.name, # Để giao diện cũ hiển thị fullName bình thường
            "email": "",
            "profilePic": g.avatar or "https://cdn-icons-png.flaticon.com/512/615/615075.png", 
            "bio": f"Nhóm có {len(g.members)} thành viên",
            "isGroup": True,
            "admin": g.admin,
            "members": g.members,
            "isFriend": True, # Để nó hiện ở mục Bạn bè
        }
        users_data.append(g_dict)

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
            
    # Đối với nhóm chat, tạm thời bỏ qua tính năng "đã xem" phức tạp, 
    # hoặc có thể đếm số tin nhắn trong group gửi sau lần cuối user xem.
    # Để đơn giản, gán unseenMessages của group = 0
    for g in my_groups:
        unseen_messages[str(g.id)] = 0

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

    from app.models import ChatGroup
    group = await ChatGroup.get(id)

    if group:
        # Nếu là nhóm chat, lấy tất cả tin nhắn gửi vào nhóm này
        messages = await Message.find(Message.receiverId == id).to_list()
        
        # Đánh dấu đã xem cho các tin nhắn trong group chưa được xem bởi my_id
        unseen_group_msgs = [m for m in messages if m.senderId != my_id and my_id not in (getattr(m, 'seenBy', []) or [])]
        if unseen_group_msgs:
            for m in unseen_group_msgs:
                seen_by = getattr(m, 'seenBy', []) or []
                seen_by.append(my_id)
                await m.set({"seenBy": seen_by})
                m.seenBy = seen_by
                
            # Lấy thông tin user hiện tại để gửi kèm
            user_info = {
                "_id": str(current_user.id),
                "fullName": current_user.fullName,
                "profilePic": current_user.profilePic
            }
                
            # Broadcast cho các thành viên trong nhóm biết mình đã xem
            for member_id in group.members:
                if member_id != my_id:
                    member_socket_id = user_socket_map.get(member_id)
                    if member_socket_id:
                        await sio.emit("groupMessagesSeen", {"groupId": id, "userId": my_id, "userInfo": user_info}, to=member_socket_id)
    else:
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

    # Fetch senders info and seenBy info
    sender_ids = list(set([m.senderId for m in messages]))
    seen_by_ids = []
    for m in messages:
        if getattr(m, 'seenBy', None):
            seen_by_ids.extend(m.seenBy)
            
    all_user_ids = list(set(sender_ids + seen_by_ids))
    from bson import ObjectId
    from beanie.operators import In
    valid_user_ids = [ObjectId(uid) for uid in all_user_ids if ObjectId.is_valid(uid)]
    users = await User.find(In(User.id, valid_user_ids)).to_list() if valid_user_ids else []
    user_map = {str(s.id): s for s in users}

    msgs_data = []
    for m in messages:
        sender = user_map.get(m.senderId)
        seen_by_users = []
        if getattr(m, 'seenBy', None):
            for uid in m.seenBy:
                u = user_map.get(uid)
                if u:
                    seen_by_users.append({
                        "_id": str(u.id),
                        "fullName": u.fullName,
                        "profilePic": u.profilePic
                    })
        msgs_data.append(_msg_dict(m, sender, seen_by_users))

    return {"success": True, "messages": msgs_data}


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
    
    msg_dict_data = _msg_dict(new_msg, current_user)

    # GỬI TIN NHẮN REAL-TIME QUA SOCKET.IO
    from app.models import ChatGroup
    group = await ChatGroup.get(id)

    if group:
        # Nếu là nhóm chat, gửi tin nhắn đến tất cả thành viên (trừ người gửi)
        for member_id in group.members:
            if member_id != sender_id:
                member_socket_id = user_socket_map.get(member_id)
                if member_socket_id:
                    await sio.emit("receiveMessage", msg_dict_data, to=member_socket_id)
    else:
        # Nếu nhắn 1-1
        receiver_socket_id = user_socket_map.get(id)
        if receiver_socket_id:
            await sio.emit("receiveMessage", msg_dict_data, to=receiver_socket_id)

    return {"success": True, "newMessage": msg_dict_data}

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
    from app.models import ChatGroup
    group = await ChatGroup.get(msg.receiverId)
    if group:
        for member_id in group.members:
            if member_id != str(current_user.id):
                s_id = user_socket_map.get(member_id)
                if s_id:
                    await sio.emit("messageEdited", {"msgId": id, "text": body.text}, to=s_id)
    else:
        receiver_socket_id = user_socket_map.get(msg.receiverId)
        if receiver_socket_id:
            await sio.emit("messageEdited", {"msgId": id, "text": body.text}, to=receiver_socket_id)

    return {"success": True, "message": _msg_dict(msg, current_user)}

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
    from app.models import ChatGroup
    group = await ChatGroup.get(msg.receiverId)
    if group:
        for member_id in group.members:
            if member_id != str(current_user.id):
                s_id = user_socket_map.get(member_id)
                if s_id:
                    await sio.emit("messageDeleted", {"msgId": id}, to=s_id)
    else:
        receiver_socket_id = user_socket_map.get(msg.receiverId)
        if receiver_socket_id:
            await sio.emit("messageDeleted", {"msgId": id}, to=receiver_socket_id)

    return {"success": True, "message": _msg_dict(msg, current_user)}

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
    from app.models import ChatGroup
    group = await ChatGroup.get(msg.receiverId)
    if group:
        for member_id in group.members:
            if member_id != uid:
                s_id = user_socket_map.get(member_id)
                if s_id:
                    await sio.emit("messageReacted", {"msgId": id, "reactions": [r.dict() for r in reactions]}, to=s_id)
    else:
        other_user_id = msg.receiverId if msg.senderId == uid else msg.senderId
        receiver_socket_id = user_socket_map.get(other_user_id)
        if receiver_socket_id:
            await sio.emit("messageReacted", {"msgId": id, "reactions": [r.dict() for r in reactions]}, to=receiver_socket_id)
        
    sender = await User.get(msg.senderId)

    return {"success": True, "message": _msg_dict(msg, sender)}

# ── POST /api/messages/groups/create ─────────────────────────────────────────

from typing import List

class CreateGroupBody(BaseModel):
    name: str
    members: List[str]

@message_router.post("/groups/create")
async def create_group(
    body: CreateGroupBody,
    current_user: User = Depends(get_current_user),
):
    from app.models import ChatGroup
    my_id = str(current_user.id)
    # Bao gồm cả người tạo vào danh sách thành viên (lọc trùng bằng set)
    all_members = list(set(body.members + [my_id]))

    new_group = ChatGroup(
        name=body.name,
        admin=my_id,
        members=all_members
    )
    await new_group.insert()

    group_data = {
        "_id": str(new_group.id),
        "fullName": new_group.name,
        "email": "",
        "profilePic": new_group.avatar or "https://cdn-icons-png.flaticon.com/512/615/615075.png",
        "bio": f"Nhóm có {len(new_group.members)} thành viên",
        "isGroup": True,
        "admin": new_group.admin,
        "members": new_group.members,
        "isFriend": True,
    }

    # Bắn sự kiện socket cho các thành viên
    for member_id in all_members:
        if member_id != my_id:
            s_id = user_socket_map.get(member_id)
            if s_id:
                # Dùng userUpdated để load lại
                await sio.emit("userUpdated", group_data, to=s_id)

    return {"success": True, "group": group_data}

# ── POST /api/messages/groups/{id}/add-members ───────────────────────────────

class AddMembersBody(BaseModel):
    members: List[str]

@message_router.post("/groups/{id}/add-members")
async def add_group_members(
    id: str,
    body: AddMembersBody,
    current_user: User = Depends(get_current_user),
):
    from app.models import ChatGroup
    group = await ChatGroup.get(id)
    if not group:
        return {"success": False, "message": "Nhóm không tồn tại"}

    # Bất cứ ai trong nhóm cũng thêm được (hoặc chỉ admin)
    if str(current_user.id) not in group.members:
        return {"success": False, "message": "Bạn không phải thành viên của nhóm này"}

    new_members = list(set(group.members + body.members))
    await group.set({"members": new_members})

    updated_group_data = {
        "_id": str(group.id),
        "fullName": group.name,
        "email": "",
        "profilePic": group.avatar or "https://cdn-icons-png.flaticon.com/512/615/615075.png",
        "bio": f"Nhóm có {len(new_members)} thành viên",
        "isGroup": True,
        "admin": group.admin,
        "members": new_members,
        "isFriend": True,
    }

    # Thông báo cho tất cả thành viên mới và cũ (cập nhật thông tin nhóm)
    for member_id in new_members:
        s_id = user_socket_map.get(member_id)
        if s_id:
            await sio.emit("userUpdated", updated_group_data, to=s_id)
            
    # Tạo tin nhắn hệ thống
    from bson import ObjectId
    added_users = await User.find({"_id": {"$in": [ObjectId(uid) for uid in body.members]}}).to_list()
    added_names = ", ".join([u.fullName for u in added_users])
    
    system_msg = Message(
        senderId=str(current_user.id),
        receiverId=id,
        text=f"{current_user.fullName} đã thêm {added_names} vào nhóm",
        isSystemMessage=True
    )
    await system_msg.insert()
    
    msg_data = _msg_dict(system_msg, current_user)
    
    for member_id in new_members:
        s_id = user_socket_map.get(member_id)
        if s_id:
            await sio.emit("receiveMessage", msg_data, to=s_id)

    return {"success": True, "message": "Đã thêm thành viên", "group": updated_group_data}

# ── PUT /api/messages/groups/{id}/leave ───────────────────────────────────────

@message_router.put("/groups/{id}/leave")
async def leave_group(
    id: str,
    silent: bool = False,
    current_user: User = Depends(get_current_user),
):
    from app.models import ChatGroup, Message
    group = await ChatGroup.get(id)
    if not group:
        return {"success": False, "message": "Nhóm không tồn tại"}

    my_id = str(current_user.id)
    if my_id not in group.members:
        return {"success": False, "message": "Bạn không có trong nhóm này"}

    new_members = [m for m in group.members if m != my_id]

    if len(new_members) == 0:
        # Nếu không còn ai, xóa nhóm
        await group.delete()
        # Không cần báo cho ai vì chả còn ai
        return {"success": True, "message": "Đã rời và giải tán nhóm vì không còn ai", "isDisbanded": True}

    # Nếu admin rời nhóm, random chuyển quyền admin cho 1 người khác
    new_admin = group.admin
    if group.admin == my_id:
        new_admin = new_members[0]

    await group.set({"members": new_members, "admin": new_admin})

    updated_group_data = {
        "_id": str(group.id),
        "fullName": group.name,
        "email": "",
        "profilePic": group.avatar or "https://cdn-icons-png.flaticon.com/512/615/615075.png",
        "bio": f"Nhóm có {len(new_members)} thành viên",
        "isGroup": True,
        "admin": new_admin,
        "members": new_members,
        "isFriend": True,
    }

    # Bắn socket để những người còn lại biết có người rời (cập nhật thông tin nhóm)
    for member_id in new_members:
        s_id = user_socket_map.get(member_id)
        if s_id:
            await sio.emit("userUpdated", updated_group_data, to=s_id)
            
    # Có thể bắn 1 event cho người rời nhóm để xoá khỏi sidebar
    s_id_me = user_socket_map.get(my_id)
    if s_id_me:
        await sio.emit("groupRemoved", {"groupId": id}, to=s_id_me)

    if silent:
        # Nếu rời trong im lặng, chỉ báo cho admin
        admin_socket = user_socket_map.get(new_admin)
        if admin_socket:
            await sio.emit("memberLeftSilently", {"groupId": id, "groupName": group.name, "userName": current_user.fullName}, to=admin_socket)
    else:
        # Nếu rời bình thường, tạo tin nhắn hệ thống
        system_msg = Message(
            senderId=my_id,
            receiverId=id,
            text=f"{current_user.fullName} đã rời nhóm",
            isSystemMessage=True
        )
        await system_msg.insert()
        
        msg_data = _msg_dict(system_msg, current_user)
        
        for member_id in new_members:
            s_id = user_socket_map.get(member_id)
            if s_id:
                await sio.emit("receiveMessage", msg_data, to=s_id)

    return {"success": True, "message": "Đã rời nhóm thành công"}

# ── DELETE /api/messages/groups/{id} ──────────────────────────────────────────

@message_router.delete("/groups/{id}")
async def disband_group(
    id: str,
    current_user: User = Depends(get_current_user),
):
    from app.models import ChatGroup
    group = await ChatGroup.get(id)
    if not group:
        return {"success": False, "message": "Nhóm không tồn tại"}

    my_id = str(current_user.id)
    if group.admin != my_id:
        return {"success": False, "message": "Chỉ quản trị viên mới được giải tán nhóm"}

    old_members = group.members
    await group.delete()

    # Bắn socket để tất cả members biết nhóm đã bị xoá
    for member_id in old_members:
        s_id = user_socket_map.get(member_id)
        if s_id:
            await sio.emit("groupRemoved", {"groupId": id}, to=s_id)

    return {"success": True, "message": "Đã giải tán nhóm"}

# ── PUT /api/messages/groups/{id}/update ─────────────────────────────────────

class UpdateGroupBody(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

@message_router.put("/groups/{id}/update")
async def update_group(
    id: str,
    body: UpdateGroupBody,
    current_user: User = Depends(get_current_user),
):
    from app.models import ChatGroup
    group = await ChatGroup.get(id)
    if not group:
        return {"success": False, "message": "Nhóm không tồn tại"}

    my_id = str(current_user.id)
    if my_id not in group.members:
        return {"success": False, "message": "Bạn không có trong nhóm này"}

    update_data = {}
    if body.name is not None:
        update_data["name"] = body.name
    
    if body.avatar is not None:
        # Nếu gửi ảnh base64, tải lên cloudinary
        if body.avatar.startswith("data:image"):
            avatar_url = await upload_image(body.avatar)
            update_data["avatar"] = avatar_url
        else:
            update_data["avatar"] = body.avatar

    if not update_data:
        return {"success": False, "message": "Không có dữ liệu cập nhật"}

    await group.set(update_data)

    updated_group_data = {
        "_id": str(group.id),
        "fullName": group.name,
        "email": "",
        "profilePic": group.avatar or "https://cdn-icons-png.flaticon.com/512/615/615075.png",
        "bio": f"Nhóm có {len(group.members)} thành viên",
        "isGroup": True,
        "admin": group.admin,
        "members": group.members,
        "isFriend": True,
    }

    # Bắn socket
    for member_id in group.members:
        s_id = user_socket_map.get(member_id)
        if s_id:
            await sio.emit("userUpdated", updated_group_data, to=s_id)

    return {"success": True, "message": "Cập nhật nhóm thành công", "group": updated_group_data}

# ── GET /api/messages/groups/{id}/members ────────────────────────────────────

@message_router.get("/groups/{id}/members")
async def get_group_members(
    id: str,
    current_user: User = Depends(get_current_user),
):
    from app.models import ChatGroup
    group = await ChatGroup.get(id)
    if not group:
        return {"success": False, "message": "Nhóm không tồn tại"}

    if str(current_user.id) not in group.members:
        return {"success": False, "message": "Bạn không có trong nhóm này"}

    from bson import ObjectId
    from beanie.operators import In
    
    object_ids = [ObjectId(uid) for uid in group.members if ObjectId.is_valid(uid)]
    members = await User.find(In(User.id, object_ids)).to_list() if object_ids else []

    members_data = []
    my_friends = current_user.friends or []
    for u in members:
        members_data.append({
            "_id": str(u.id),
            "fullName": u.fullName,
            "profilePic": u.profilePic,
            "isAdmin": str(u.id) == group.admin,
            "isFriend": str(u.id) in my_friends
        })

    return {"success": True, "members": members_data}

# ── PUT /api/messages/groups/{id}/kick ───────────────────────────────────────

class KickMemberBody(BaseModel):
    userId: str

@message_router.put("/groups/{id}/kick")
async def kick_group_member(
    id: str,
    body: KickMemberBody,
    current_user: User = Depends(get_current_user),
):
    from app.models import ChatGroup, Message
    group = await ChatGroup.get(id)
    if not group:
        return {"success": False, "message": "Nhóm không tồn tại"}

    my_id = str(current_user.id)
    if group.admin != my_id:
        return {"success": False, "message": "Chỉ quản trị viên mới có quyền mời thành viên ra khỏi nhóm"}

    if body.userId not in group.members:
        return {"success": False, "message": "Thành viên không có trong nhóm"}

    if body.userId == my_id:
        return {"success": False, "message": "Bạn không thể tự mời chính mình"}

    new_members = [m for m in group.members if m != body.userId]
    await group.set({"members": new_members})

    updated_group_data = {
        "_id": str(group.id),
        "fullName": group.name,
        "email": "",
        "profilePic": group.avatar or "https://cdn-icons-png.flaticon.com/512/615/615075.png",
        "bio": f"Nhóm có {len(new_members)} thành viên",
        "isGroup": True,
        "admin": group.admin,
        "members": new_members,
        "isFriend": True,
    }

    kicked_user = await User.get(body.userId)
    kicked_name = kicked_user.fullName if kicked_user else "Một thành viên"

    # Tạo tin nhắn hệ thống
    system_msg = Message(
        senderId=my_id,
        receiverId=id,
        text=f"{current_user.fullName} đã mời {kicked_name} ra khỏi nhóm",
        isSystemMessage=True
    )
    await system_msg.insert()
    
    msg_data = _msg_dict(system_msg, current_user)

    # Bắn socket cho các thành viên còn lại
    for member_id in new_members:
        s_id = user_socket_map.get(member_id)
        if s_id:
            await sio.emit("userUpdated", updated_group_data, to=s_id)
            await sio.emit("receiveMessage", msg_data, to=s_id)
            
    # Bắn socket cho người bị kích
    kicked_s_id = user_socket_map.get(body.userId)
    if kicked_s_id:
        await sio.emit("groupRemoved", {"groupId": id}, to=kicked_s_id)

    return {"success": True, "message": f"Đã mời {kicked_name} ra khỏi nhóm", "group": updated_group_data}
