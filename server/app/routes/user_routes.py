from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
import bcrypt

from app.models import User
from app.utils import generate_token
from app.cloudinary_client import upload_image
from app.dependencies import get_current_user
from google.oauth2 import id_token
from google.auth.transport import requests

GOOGLE_CLIENT_ID = "305811701965-jb4e6qmo0m3vs24llllv3455fm47b5q6.apps.googleusercontent.com"

# Khởi tạo router cho các tính năng liên quan đến người dùng (Xác thực)
user_router = APIRouter()


# ── Định nghĩa các cấu trúc dữ liệu (Request schemas) ──────────────────────────

class SignupBody(BaseModel):
    """Cấu trúc dữ liệu yêu cầu khi đăng ký"""
    fullName: str
    email: str
    password: str
    bio: Optional[str] = None


class LoginBody(BaseModel):
    """Cấu trúc dữ liệu yêu cầu khi đăng nhập"""
    email: str
    password: str


class UpdateProfileBody(BaseModel):
    """Cấu trúc dữ liệu yêu cầu khi cập nhật thông tin cá nhân"""
    profilePic: Optional[str] = None
    bio: Optional[str] = None
    fullName: Optional[str] = None

class GoogleLoginBody(BaseModel):
    credential: str


# ── Các hàm hỗ trợ (Helpers) ──────────────────────────────────────────────────

def _user_dict(user: User, exclude_password: bool = True) -> dict:
    """Chuyển đổi đối tượng User (Beanie) sang dictionary để trả về cho Frontend."""
    data = {
        "_id": str(user.id),
        "fullName": user.fullName,
        "email": user.email,
        "profilePic": user.profilePic,
        "bio": user.bio,
        "friends": user.friends or [],
        "friendRequests": getattr(user, 'friendRequests', []),
        "createdAt": user.createdAt.isoformat(),
        "updatedAt": user.updatedAt.isoformat(),
    }
    if not exclude_password:
        data["password"] = user.password
    return data


# ── POST /api/auth/signup ────────────────────────────────────────────────────

@user_router.post("/signup")
async def signup(body: SignupBody):
    """Đăng ký tài khoản mới"""
    if not body.fullName or not body.email or not body.password:
        return {"success": False, "message": "Vui lòng điền đầy đủ thông tin"}

    # Kiểm tra email đã tồn tại chưa
    existing = await User.find_one(User.email == body.email)
    if existing:
        return {"success": False, "message": "Tài khoản đã tồn tại"}

    # Mã hóa mật khẩu trước khi lưu vào database
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(
        fullName=body.fullName,
        email=body.email,
        password=hashed,
        bio=body.bio or "",
    )
    await new_user.insert()

    # Thông báo real-time cho tất cả client đang online biết có user mới
    from app.socket_manager import sio as _sio
    await _sio.emit("newUserRegistered", _user_dict(new_user))

    # Tạo JWT Token cho phiên làm việc mới
    token = generate_token(str(new_user.id))
    return {
        "success": True,
        "userData": _user_dict(new_user),
        "token": token,
        "message": "Tạo tài khoản thành công",
    }


# ── POST /api/auth/login ─────────────────────────────────────────────────────

@user_router.post("/login")
async def login(body: LoginBody):
    """Đăng nhập vào hệ thống"""
    user = await User.find_one(User.email == body.email)
    if not user:
        return {"success": False, "message": "Thông tin đăng nhập không chính xác"}

    # Kiểm tra mật khẩu có khớp không
    if not bcrypt.checkpw(body.password.encode(), user.password.encode()):
        return {"success": False, "message": "Thông tin đăng nhập không chính xác"}

    # Tạo Token sau khi đăng nhập thành công
    token = generate_token(str(user.id))
    return {
        "success": True,
        "userData": _user_dict(user),
        "token": token,
        "message": "Đăng nhập thành công",
    }


# ── POST /api/auth/google-login ──────────────────────────────────────────────

@user_router.post("/google-login")
async def google_login(body: GoogleLoginBody):
    try:
        # Xác thực Token từ Google
        idinfo = id_token.verify_oauth2_token(body.credential, requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo['email']
        name = idinfo.get('name', 'User')
        picture = idinfo.get('picture', '')
        
        # Kiểm tra user đã tồn tại chưa
        user = await User.find_one(User.email == email)
        
        if not user:
            # Tạo tài khoản mới (không cần password)
            user = User(
                fullName=name,
                email=email,
                password="",  # Không dùng password
                profilePic=picture,
                bio="Đăng nhập bằng Google",
            )
            await user.insert()
            
            # Thông báo real-time có user mới
            from app.socket_manager import sio as _sio
            await _sio.emit("newUserRegistered", _user_dict(user))

        # Cấp token cho user
        token = generate_token(str(user.id))
        return {
            "success": True,
            "userData": _user_dict(user),
            "token": token,
            "message": "Đăng nhập bằng Google thành công",
        }
    except ValueError as e:
        print("Google Auth ValueError:", e)
        return {"success": False, "message": f"Token Google không hợp lệ: {str(e)}"}
    except Exception as e:
        print("Google Auth Exception:", e)
        return {"success": False, "message": f"Lỗi xác thực: {str(e)}"}



# ── GET /api/auth/check ──────────────────────────────────────────────────────

@user_router.get("/check")
async def check_auth(current_user: User = Depends(get_current_user)):
    """Kiểm tra trạng thái đăng nhập (dùng Token gửi kèm trong header)"""
    return {"success": True, "user": _user_dict(current_user)}


# ── FRIEND REQUESTS FLOW ─────────────────────────────────────────────────────

class FriendActionBody(BaseModel):
    friendId: str

@user_router.post("/send-friend-request")
async def send_friend_request(body: FriendActionBody, current_user: User = Depends(get_current_user)):
    """Gửi lời mời kết bạn"""
    target_id = body.friendId
    if target_id == str(current_user.id):
        return {"success": False, "message": "Không thể kết bạn với chính mình"}
    
    if target_id in (current_user.friends or []):
        return {"success": False, "message": "Đã là bạn bè"}
        
    target_user = await User.get(target_id)
    if not target_user:
        return {"success": False, "message": "Người dùng không tồn tại"}
        
    reqs = target_user.friendRequests or []
    if str(current_user.id) in reqs:
        return {"success": False, "message": "Đã gửi lời mời trước đó"}
        
    reqs.append(str(current_user.id))
    await target_user.set({"friendRequests": reqs})
    
    # Real-time event
    from app.socket_manager import sio as _sio, user_socket_map
    target_sid = user_socket_map.get(target_id)
    if target_sid:
        await _sio.emit("newFriendRequest", {"from": _user_dict(current_user)}, to=target_sid)
        
    return {"success": True, "message": "Đã gửi lời mời kết bạn"}

@user_router.post("/accept-friend-request")
async def accept_friend_request(body: FriendActionBody, current_user: User = Depends(get_current_user)):
    """Chấp nhận lời mời kết bạn"""
    req_id = body.friendId
    reqs = current_user.friendRequests or []
    if req_id not in reqs:
        return {"success": False, "message": "Không tìm thấy lời mời"}
        
    requester = await User.get(req_id)
    if not requester:
        return {"success": False, "message": "Người dùng không tồn tại"}
        
    reqs.remove(req_id)
    await current_user.set({"friendRequests": reqs})
    
    my_friends = current_user.friends or []
    if req_id not in my_friends: my_friends.append(req_id)
    await current_user.set({"friends": my_friends})
    
    their_friends = requester.friends or []
    if str(current_user.id) not in their_friends: their_friends.append(str(current_user.id))
    await requester.set({"friends": their_friends})
    
    # Real-time update
    from app.socket_manager import sio as _sio, user_socket_map
    req_sid = user_socket_map.get(req_id)
    if req_sid:
        await _sio.emit("friendRequestAccepted", {"newFriend": _user_dict(current_user)}, to=req_sid)
    
    return {"success": True, "message": "Đã chấp nhận kết bạn"}

@user_router.post("/reject-friend-request")
async def reject_friend_request(body: FriendActionBody, current_user: User = Depends(get_current_user)):
    """Từ chối lời mời kết bạn"""
    req_id = body.friendId
    reqs = current_user.friendRequests or []
    if req_id in reqs:
        reqs.remove(req_id)
        await current_user.set({"friendRequests": reqs})
    return {"success": True, "message": "Đã từ chối lời mời"}

@user_router.post("/unfriend")
async def unfriend(body: FriendActionBody, current_user: User = Depends(get_current_user)):
    """Hủy kết bạn"""
    friend_id = body.friendId
    
    my_friends = current_user.friends or []
    if friend_id in my_friends:
        my_friends.remove(friend_id)
        await current_user.set({"friends": my_friends})
        
    friend_user = await User.get(friend_id)
    if friend_user:
        their_friends = friend_user.friends or []
        if str(current_user.id) in their_friends:
            their_friends.remove(str(current_user.id))
            await friend_user.set({"friends": their_friends})
            
    from app.socket_manager import sio as _sio, user_socket_map
    friend_sid = user_socket_map.get(friend_id)
    if friend_sid:
        await _sio.emit("unfriended", {"by": str(current_user.id)}, to=friend_sid)
        
    return {"success": True, "message": "Đã hủy kết bạn"}

@user_router.get("/friend-requests")
async def get_friend_requests(current_user: User = Depends(get_current_user)):
    """Lấy danh sách người đã gửi lời mời kết bạn"""
    req_ids = current_user.friendRequests or []
    if not req_ids:
        return {"success": True, "requests": []}
        
    from bson import ObjectId
    from beanie.operators import In
    object_ids = [ObjectId(uid) for uid in req_ids if ObjectId.is_valid(uid)]
    users = await User.find(In(User.id, object_ids)).to_list() if object_ids else []
    return {"success": True, "requests": [_user_dict(u) for u in users]}

# ── GET /api/auth/search ─────────────────────────────────────────────────────

@user_router.get("/search")
async def search_users(q: str = "", current_user: User = Depends(get_current_user)):
    """Tìm kiếm người dùng theo tên"""
    if not q.strip():
        return {"success": True, "users": []}
    
    users = await User.find(
        {"fullName": {"$regex": q, "$options": "i"}, "_id": {"$ne": current_user.id}}
    ).to_list()
    return {"success": True, "users": [_user_dict(u) for u in users]}


# ── PUT /api/auth/update-profile ─────────────────────────────────────────────

@user_router.put("/update-profile")
async def update_profile(
    body: UpdateProfileBody,
    current_user: User = Depends(get_current_user),
):
    """Cập nhật thông tin cá nhân và ảnh đại diện"""
    update_data: dict = {}

    if body.bio is not None:
        update_data["bio"] = body.bio
    if body.fullName is not None:
        update_data["fullName"] = body.fullName
    if body.profilePic:
        # Nếu có gửi ảnh dạng base64, tải lên Cloudinary để lấy URL
        url = await upload_image(body.profilePic)
        update_data["profilePic"] = url

    if update_data:
        from datetime import datetime
        update_data["updatedAt"] = datetime.utcnow()
        # Cập nhật thông tin vào MongoDB
        await current_user.set(update_data)

        # Thông báo real-time cho tất cả client: avatar/tên/bio vừa thay đổi
        from app.socket_manager import sio as _sio
        await _sio.emit("userUpdated", _user_dict(current_user))

    return {"success": True, "user": _user_dict(current_user)}
