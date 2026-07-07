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
    socialLinks: Optional[list[str]] = None

class GoogleLoginBody(BaseModel):
    credential: str


class VerifyRegistrationBody(BaseModel):
    email: str
    otp: str

class ForgotPasswordBody(BaseModel):
    email: str

class ResetPasswordBody(BaseModel):
    email: str
    otp: str
    new_password: str

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
        "archivedChats": getattr(user, 'archivedChats', []),
        "socialLinks": getattr(user, 'socialLinks', []),
        "isAdmin": getattr(user, 'isAdmin', False),
        "banned_until": (user.banned_until.replace(microsecond=0).isoformat() + "Z") if getattr(user, 'banned_until', None) else None,
        "lastSeen": (user.lastSeen.replace(microsecond=0).isoformat() + "Z") if getattr(user, 'lastSeen', None) else None,
        "createdAt": user.createdAt.replace(microsecond=0).isoformat() + "Z",
        "updatedAt": user.updatedAt.replace(microsecond=0).isoformat() + "Z",
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
        if existing.is_verified:
            return {"success": False, "message": "Tài khoản đã tồn tại"}
        else:
            # Nếu chưa verify, cho phép gửi lại OTP
            pass

    import random
    from datetime import datetime, timedelta
    from app.email_service import send_otp_email

    otp = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=5)

    if existing and not existing.is_verified:
        # Cập nhật mã OTP mới cho account chưa verify
        hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
        await existing.set({
            "fullName": body.fullName,
            "password": hashed,
            "otp_code": otp,
            "otp_expiry": expiry
        })
        user_to_send = existing
    else:
        # Tạo mới user
        hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
        new_user = User(
            fullName=body.fullName,
            email=body.email,
            password=hashed,
            bio=body.bio or "",
            isAdmin=(body.email == "quynh0369505599@gmail.com"),
            is_verified=False,
            otp_code=otp,
            otp_expiry=expiry
        )
        await new_user.insert()
        user_to_send = new_user

    # Gửi email OTP
    email_sent = send_otp_email(body.email, otp, context="Đăng ký tài khoản")
    if not email_sent:
        return {"success": False, "message": "Không thể gửi email OTP, vui lòng thử lại sau."}

    return {
        "success": True,
        "requireOtp": True,
        "email": body.email,
        "message": "Đã gửi mã OTP đến email của bạn",
    }


@user_router.post("/verify-registration")
async def verify_registration(body: VerifyRegistrationBody):
    """Xác thực OTP khi đăng ký"""
    user = await User.find_one(User.email == body.email)
    if not user:
        return {"success": False, "message": "Tài khoản không tồn tại"}
    if user.is_verified:
        return {"success": False, "message": "Tài khoản đã được xác thực trước đó"}
    
    from datetime import datetime
    if user.otp_code != body.otp:
        return {"success": False, "message": "Mã OTP không chính xác"}
    if user.otp_expiry and datetime.utcnow() > user.otp_expiry:
        return {"success": False, "message": "Mã OTP đã hết hạn"}

    # Thành công -> xác thực user
    await user.set({"is_verified": True, "otp_code": None, "otp_expiry": None})
    user.is_verified = True

    # Thông báo real-time cho tất cả client đang online biết có user mới
    from app.socket_manager import sio as _sio
    await _sio.emit("newUserRegistered", _user_dict(user))

    # Tạo JWT Token cho phiên làm việc mới
    token = generate_token(str(user.id))
    return {
        "success": True,
        "userData": _user_dict(user),
        "token": token,
        "message": "Xác thực tài khoản thành công",
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
        
    if not getattr(user, 'is_verified', True):
        # Tạo OTP mới và gửi lại
        import random
        from datetime import datetime, timedelta
        from app.email_service import send_otp_email
        
        otp = str(random.randint(100000, 999999))
        expiry = datetime.utcnow() + timedelta(minutes=5)
        await user.set({"otp_code": otp, "otp_expiry": expiry})
        send_otp_email(body.email, otp, context="Kích hoạt tài khoản")
        
        return {
            "success": False, 
            "requireOtp": True, 
            "email": body.email,
            "message": "Tài khoản chưa xác thực. Đã gửi mã OTP đến email của bạn."
        }

    # Auto grant admin if it's the designated admin email
    if user.email == "quynh0369505599@gmail.com" and not getattr(user, 'isAdmin', False):
        await user.set({"isAdmin": True})
        user.isAdmin = True

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
                isAdmin=(email == "quynh0369505599@gmail.com")
            )
            await user.insert()
            
            # Thông báo real-time có user mới
            from app.socket_manager import sio as _sio
            await _sio.emit("newUserRegistered", _user_dict(user))
        else:
            if user.email == "quynh0369505599@gmail.com" and not user.isAdmin:
                await user.set({"isAdmin": True})
                user.isAdmin = True

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


# ── FORGOT PASSWORD FLOW ─────────────────────────────────────────────────────

@user_router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordBody):
    """Gửi mã OTP để khôi phục mật khẩu"""
    user = await User.find_one(User.email == body.email)
    if not user:
        return {"success": False, "message": "Email không tồn tại trong hệ thống"}
        
    import random
    from datetime import datetime, timedelta
    from app.email_service import send_otp_email
    
    otp = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=5)
    
    await user.set({"otp_code": otp, "otp_expiry": expiry})
    
    email_sent = send_otp_email(body.email, otp, context="Khôi phục mật khẩu")
    if not email_sent:
        return {"success": False, "message": "Lỗi hệ thống khi gửi email."}
        
    return {"success": True, "message": "Đã gửi mã xác thực đến email của bạn"}

@user_router.post("/reset-password")
async def reset_password(body: ResetPasswordBody):
    """Xác thực mã OTP và đặt lại mật khẩu mới"""
    user = await User.find_one(User.email == body.email)
    if not user:
        return {"success": False, "message": "Tài khoản không tồn tại"}
        
    from datetime import datetime
    if user.otp_code != body.otp:
        return {"success": False, "message": "Mã OTP không chính xác"}
    if user.otp_expiry and datetime.utcnow() > user.otp_expiry:
        return {"success": False, "message": "Mã OTP đã hết hạn"}
        
    # Đổi mật khẩu
    hashed = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    await user.set({
        "password": hashed,
        "otp_code": None,
        "otp_expiry": None,
        "is_verified": True # Nếu họ dùng reset pass thì coi như verify luôn
    })
    
    return {"success": True, "message": "Đổi mật khẩu thành công. Vui lòng đăng nhập lại."}



# ── GET /api/auth/check ──────────────────────────────────────────────────────

@user_router.get("/check")
async def check_auth(current_user: User = Depends(get_current_user)):
    """Kiểm tra trạng thái đăng nhập (dùng Token gửi kèm trong header)"""
    # Auto grant admin if it's the designated admin email
    if current_user.email == "quynh0369505599@gmail.com" and not getattr(current_user, 'isAdmin', False):
        await current_user.set({"isAdmin": True})
        current_user.isAdmin = True
        
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

import re

def remove_vietnamese_accents(s: str) -> str:
    s = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', s)
    s = re.sub(r'[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]', 'A', s)
    s = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', s)
    s = re.sub(r'[ÈÉẸẺẼÊỀẾỆỂỄ]', 'E', s)
    s = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', s)
    s = re.sub(r'[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]', 'O', s)
    s = re.sub(r'[ìíịỉĩ]', 'i', s)
    s = re.sub(r'[ÌÍỊỈĨ]', 'I', s)
    s = re.sub(r'[ùúụủũưừứựửữ]', 'u', s)
    s = re.sub(r'[ÙÚỤỦŨƯỪỨỰỬỮ]', 'U', s)
    s = re.sub(r'[ỳýỵỷỹ]', 'y', s)
    s = re.sub(r'[ỲÝỴỶỸ]', 'Y', s)
    s = re.sub(r'[Đđ]', 'd', s)
    return s

@user_router.get("/search")
async def search_users(q: str = "", current_user: User = Depends(get_current_user)):
    """Tìm kiếm người dùng theo tên (hỗ trợ tiếng Việt không dấu)"""
    if not q.strip():
        return {"success": True, "users": []}
    
    q_normalized = remove_vietnamese_accents(q.strip()).lower()
    
    # Lấy tất cả người dùng (trừ bản thân) để lọc trong memory
    # (Phù hợp cho dự án demo/quy mô nhỏ. Với quy mô lớn cần thêm trường normalized_name vào DB)
    users = await User.find({"_id": {"$ne": current_user.id}}).to_list()
    
    matched_users = []
    for u in users:
        name_normalized = remove_vietnamese_accents(u.fullName).lower()
        # Tìm kiếm theo tên hoặc email
        if q_normalized in name_normalized or q_normalized in u.email.lower():
            matched_users.append(u)
            
    return {"success": True, "users": [_user_dict(u) for u in matched_users]}


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
    if body.socialLinks is not None:
        update_data["socialLinks"] = body.socialLinks
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


@user_router.post("/toggle-archive")
async def toggle_archive(
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """
    API thêm hoặc xóa một user/group khỏi danh sách lưu trữ.
    Body: { targetId: "...", archive: true/false }
    """
    target_id = data.get("targetId")
    archive = data.get("archive", True)
    
    if not target_id:
        return JSONResponse(status_code=400, content={"success": False, "message": "Thiếu targetId"})
        
    archived = getattr(current_user, 'archivedChats', [])
    if not archived:
        archived = []
        
    if archive and target_id not in archived:
        archived.append(target_id)
    elif not archive and target_id in archived:
        archived.remove(target_id)
        
    await current_user.set({"archivedChats": archived})
    
    # Phát sự kiện cập nhật user cho client của chính họ
    from app.socket_manager import sio as _sio
    await _sio.emit("userUpdated", _user_dict(current_user))
    
    return {"success": True, "archivedChats": archived}

# ── POST /api/auth/unban/{user_id} ───────────────────────────────────────────

@user_router.post("/unban/{user_id}")
async def unban_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Gỡ cấm chat cho người dùng"""
    from bson import ObjectId
    if not ObjectId.is_valid(user_id):
        return {"success": False, "message": "ID không hợp lệ"}
        
    target_user = await User.get(ObjectId(user_id))
    if not target_user:
        return {"success": False, "message": "Người dùng không tồn tại"}
        
    await target_user.set({"banned_until": None})
    target_user.banned_until = None
    
    from app.models import Report
    reports = await Report.find(Report.reportedId == str(target_user.id)).to_list()
    for report in reports:
        if report.status == "resolved" and report.decision and "cấm chat" in report.decision.lower() and "gỡ" not in report.decision.lower():
            await report.set({"decision": "Đã gỡ cấm chat"})
    
    # Real-time event tới user được gỡ ban
    from app.socket_manager import sio as _sio, user_socket_map
    target_sid = user_socket_map.get(user_id)
    if target_sid:
        await _sio.emit("userBanned", {"banned_until": None, "reason": "Bạn đã được Admin gỡ cấm chat"}, to=target_sid)
        
    # Cập nhật thông tin cho mọi người (bao gồm trạng thái ban)
    await _sio.emit("userUpdated", _user_dict(target_user))
    
    return {"success": True, "message": f"Đã gỡ cấm chat cho {target_user.fullName}"}
