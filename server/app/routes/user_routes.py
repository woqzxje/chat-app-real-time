from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
import bcrypt

from app.models import User
from app.utils import generate_token
from app.cloudinary_client import upload_image
from app.dependencies import get_current_user

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


# ── Các hàm hỗ trợ (Helpers) ──────────────────────────────────────────────────

def _user_dict(user: User, exclude_password: bool = True) -> dict:
    """Chuyển đổi đối tượng User (Beanie) sang dictionary để trả về cho Frontend."""
    data = {
        "_id": str(user.id),
        "fullName": user.fullName,
        "email": user.email,
        "profilePic": user.profilePic,
        "bio": user.bio,
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


# ── GET /api/auth/check ──────────────────────────────────────────────────────

@user_router.get("/check")
async def check_auth(current_user: User = Depends(get_current_user)):
    """Kiểm tra trạng thái đăng nhập (dùng Token gửi kèm trong header)"""
    return {"success": True, "user": _user_dict(current_user)}


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
