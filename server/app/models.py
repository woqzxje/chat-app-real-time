from typing import Optional, List
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


# ── File item trong folder ────────────────────────────────────
class FileItem(BaseModel):
    """Thông tin một file bên trong folder."""
    url: str                          # URL Cloudinary
    file_name: str                    # Đường dẫn tương đối trong folder
    file_type: str                    # image | video | document | archive | other
    file_size: int                    # Kích thước bytes
    resource_type: str                # raw | image | video


# ── Attachment model ──────────────────────────────────────────
class FileAttachment(BaseModel):
    """Thông tin file/folder đính kèm trong tin nhắn."""
    url: str                          # URL Cloudinary (file đầu tiên nếu là folder)
    file_name: str                    # Tên file gốc hoặc tên folder
    file_type: str                    # image | video | document | archive | folder | other
    file_size: int                    # Kích thước bytes (tổng nếu folder)
    resource_type: str                # raw | image | video (Cloudinary resource type)
    file_count: Optional[int] = None  # Số file bên trong (chỉ dùng cho folder)
    files: Optional[List[FileItem]] = None  # Danh sách file (chỉ dùng cho folder)


# ── Thông tin cuộc gọi video ─────────────────────────────────
class CallInfo(BaseModel):
    """Lưu lịch sử cuộc gọi video trong tin nhắn."""
    call_type: str                    # "completed" | "missed" | "rejected"
    duration: int = 0                 # Thời lượng cuộc gọi (giây), 0 nếu missed/rejected
    caller_id: str                    # ID người gọi
    receiver_id: str                  # ID người nhận
    is_video: bool = True             # True: Video Call, False: Voice Call


# ── Thông tin Reaction (thả cảm xúc) ─────────────────────────
class Reaction(BaseModel):
    """Lưu thông tin một lượt thả cảm xúc trên tin nhắn."""
    emoji: str
    userId: str


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
    friends: List[str] = Field(default_factory=list) # Danh sách ID bạn bè
    friendRequests: List[str] = Field(default_factory=list) # Lời mời kết bạn đến
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
    callInfo: Optional[CallInfo] = None  # Thông tin cuộc gọi video (nếu là tin nhắn lịch sử cuộc gọi)
    seen: bool = False  # Trạng thái đã đọc hay chưa
    
    # Các trường phục vụ chức năng Thu hồi và Chỉnh sửa
    isDeleted: bool = False
    isEdited: bool = False
    editedAt: Optional[datetime] = None
    
    # Cảm xúc trên tin nhắn
    reactions: List[Reaction] = Field(default_factory=list)
    
    createdAt: datetime = Field(default_factory=datetime.utcnow) # Thời điểm gửi tin nhắn
    updatedAt: datetime = Field(default_factory=datetime.utcnow) # Thời điểm cập nhật (nếu có)

    class Settings:
        name = "messages" # Tên collection trong cơ sở dữ liệu MongoDB
