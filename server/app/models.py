from typing import Optional, List
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


# ── Model thông tin từng file trong folder ────────────────────
class FolderFile(BaseModel):
    """Thông tin 1 file cụ thể bên trong folder."""
    path: str           # Đường dẫn tương đối trong folder (vd: "src/main.py")
    url: str            # URL Cloudinary của file này
    file_size: int      # Kích thước file (bytes)
    file_type: str      # image | video | document | archive | other


# ── Attachment model ──────────────────────────────────────────
class FileAttachment(BaseModel):
    """Thông tin file/folder đính kèm trong tin nhắn."""
    url: str = ""                     # URL Cloudinary (để trống nếu là folder)
    file_name: str                    # Tên file gốc hoặc tên folder
    file_type: str                    # image | video | document | archive | folder | other
    file_size: int                    # Kích thước tổng (bytes)
    resource_type: str                # raw | image | video (Cloudinary resource type)
    file_count: Optional[int] = None  # Số file bên trong folder
    files: Optional[List[FolderFile]] = None  # Danh sách file trong folder (chỉ dùng cho folder)


# Định nghĩa cấu trúc dữ liệu người dùng trong MongoDB (sử dụng Beanie ODM)
class User(Document):
    """
    Schema Người dùng: Lưu trữ thông tin tài khoản và cá nhân.
    """
    email: str # Địa chỉ email dùng để đăng nhập
    fullName: str # Họ và tên hiển thị
    password: str # Mật khẩu đã được mã hóa
    profilePic: str = "" # Đường dẫn ảnh đại diện (mặc định để trống)
    bio: Optional[str] = None # Lời giới thiệu ngắn về bản thân
    createdAt: datetime = Field(default_factory=datetime.utcnow) # Thời điểm tạo tài khoản
    updatedAt: datetime = Field(default_factory=datetime.utcnow) # Thời điểm cập nhật thông tin gần nhất

    class Settings:
        name = "users" # Tên collection trong cơ sở dữ liệu MongoDB


# Định nghĩa cấu trúc dữ liệu tin nhắn trong MongoDB
class Message(Document):
    """
    Schema Tin nhắn: Lưu trữ nội dung trao đổi giữa các người dùng.
    """
    senderId: str       # ID của người gửi (dạng chuỗi ObjectId)
    receiverId: str     # ID của người nhận (dạng chuỗi ObjectId)
    text: Optional[str] = None  # Nội dung tin nhắn dạng văn bản
    image: Optional[str] = None # Đường dẫn ảnh (nếu tin nhắn là hình ảnh)
    attachment: Optional[FileAttachment] = None
    seen: bool = False  # Trạng thái đã đọc hay chưa
    createdAt: datetime = Field(default_factory=datetime.utcnow) # Thời điểm gửi tin nhắn
    updatedAt: datetime = Field(default_factory=datetime.utcnow) # Thời điểm cập nhật (nếu có)

    class Settings:
        name = "messages" # Tên collection trong cơ sở dữ liệu MongoDB
