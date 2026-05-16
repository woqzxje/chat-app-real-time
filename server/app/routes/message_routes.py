from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models import User, Message
from app.dependencies import get_current_user
from app.cloudinary_client import upload_image
from app.socket_manager import sio, user_socket_map

message_router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _msg_dict(msg: Message) -> dict:
    return {
        "_id": str(msg.id),
        "senderId": msg.senderId,
        "receiverId": msg.receiverId,
        "text": msg.text,
        "image": msg.image,
        "seen": msg.seen,
        "createdAt": msg.createdAt.isoformat(),
        "updatedAt": msg.updatedAt.isoformat(),
    }


def _user_dict(user: User) -> dict:
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
    my_id = str(current_user.id)

    # All users except the logged-in user
    all_users = await User.find(User.id != current_user.id).to_list()

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
    my_id = str(current_user.id)

    messages = await Message.find(
        {
            "$or": [
                {"senderId": my_id, "receiverId": id},
                {"senderId": id, "receiverId": my_id},
            ]
        }
    ).to_list()

    # Mark received messages as seen
    await Message.find(
        Message.senderId == id,
        Message.receiverId == my_id,
        Message.seen == False,  # noqa: E712
    ).update({"$set": {"seen": True}})

    return {"success": True, "messages": [_msg_dict(m) for m in messages]}


# ── PUT /api/messages/mark/{id} ──────────────────────────────────────────────

@message_router.put("/mark/{id}")
async def mark_message_as_seen(id: str, current_user: User = Depends(get_current_user)):
    msg = await Message.get(id)
    if msg:
        await msg.set({"seen": True})
    return {"success": True}


# ── POST /api/messages/send/{id} ─────────────────────────────────────────────

class SendMessageBody(BaseModel):
    text: Optional[str] = None
    image: Optional[str] = None


@message_router.post("/send/{id}")
async def send_message(
    id: str,
    body: SendMessageBody,
    current_user: User = Depends(get_current_user),
):
    sender_id = str(current_user.id)
    image_url: Optional[str] = None

    if body.image:
        image_url = await upload_image(body.image)

    new_msg = Message(
        senderId=sender_id,
        receiverId=id,
        text=body.text,
        image=image_url,
    )
    await new_msg.insert()

    # Emit to receiver via Socket.IO (mirrors JS behaviour)
    receiver_socket_id = user_socket_map.get(id)
    if receiver_socket_id:
        await sio.emit("receiveMessage", _msg_dict(new_msg), to=receiver_socket_id)

    return {"success": True, "newMessage": _msg_dict(new_msg)}
