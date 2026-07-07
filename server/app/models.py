from typing import Optional, List
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


# ── File item trong folder (Sub-document) ───────────────────────
class FileItem(BaseModel):
    """
    Sub-schema cho từng file con nằm bên trong một folder đính kèm.
    Được thiết kế dưới dạng nhúng (Embedded) để tối ưu số lượng collection.
    """
    url: str                          # URL trực tiếp tải từ mây (Cloudinary)
    file_name: str                    # Đường dẫn tương đối giúp tái tạo lại cấu trúc cây thư mục ở Client
    file_type: str                    # Phân loại để hiển thị icon (image | video | document | archive | other)
    file_size: int                    # Dung lượng tính bằng bytes (phục vụ hiển thị UI và giới hạn tải)
    resource_type: str                # Loại tài nguyên của Cloudinary (raw | image | video)


# ── Attachment model (Sub-document) ───────────────────────────
class FileAttachment(BaseModel):
    """
    Schema định nghĩa tệp đính kèm trong tin nhắn. 
    Hỗ trợ cả file đơn lẻ và nguyên một folder lớn (phục vụ chức năng nén Zip on-the-fly).
    """
    url: str                          # URL Cloudinary (Nếu là folder thì đây là URL của file đầu tiên đại diện)
    file_name: str                    # Tên file gốc hoặc tên Folder tổng
    file_type: str                    # Enum phân loại (image | video | document | archive | folder | other)
    file_size: int                    # Dung lượng tổng bằng bytes
    resource_type: str                # Loại tài nguyên cấu hình trên mây Cloudinary
    file_count: Optional[int] = None  # Cờ đếm số lượng file con (chỉ tồn tại nếu file_type == 'folder')
    files: Optional[List[FileItem]] = None  # Mảng chứa danh sách các file con (chỉ dùng cho folder)


# ── Thông tin cuộc gọi video (Sub-document) ───────────────────
class CallInfo(BaseModel):
    """
    Lưu trữ lịch sử cuộc gọi video ngay bên trong bảng Message.
    Thay vì tạo bảng CallHistory riêng, việc nhúng (embed) vào Message giúp query lịch sử chat cực kỳ nhanh (chỉ cần 1 query duy nhất).
    """
    call_type: str                    # Trạng thái cuộc gọi ("completed" | "missed" | "rejected")
    duration: int = 0                 # Thời lượng cuộc gọi (giây), mặc định = 0 nếu missed/rejected
    caller_id: str                    # ID người gọi (tham chiếu logic đến User)
    receiver_id: str                  # ID người nghe (tham chiếu logic đến User)
    is_video: bool = True             # True: Cuộc gọi hình (Video), False: Cuộc gọi thoại (Voice)


# ── Thông tin Reaction (thả cảm xúc - Sub-document) ───────────
class Reaction(BaseModel):
    """
    Lưu trữ lượt thả cảm xúc trên từng tin nhắn.
    Mỗi tin nhắn có một mảng các Reaction này.
    """
    emoji: str                        # Ký tự cảm xúc (vd: ❤️, 😂)
    userId: str                       # ID của user thả cảm xúc (để toggle/xóa nếu bấm lại)


# Định nghĩa cấu trúc dữ liệu người dùng (Root Document)
class User(Document):
    """
    Schema Người dùng: Lưu trữ thông tin tài khoản, cá nhân và các mối quan hệ xã hội.
    * Lưu ý thiết kế NoSQL: Các list friends, friendRequests được lưu trữ dưới dạng mảng ID (string). 
      Điều này tối ưu hơn việc dùng DBRef vì tránh được overhead khi serialize/deserialize dữ liệu.
    """
    email: str # Khóa định danh chính dùng để đăng nhập (Unique Index ngầm định)
    fullName: str # Họ và tên hiển thị trên UI
    password: str # Mật khẩu (luôn phải được mã hóa băm Bcrypt trước khi lưu)
    profilePic: str = "" # URL ảnh đại diện trên Cloudinary (trống = dùng ảnh mặc định client)
    bio: Optional[str] = None # Lời giới thiệu/Trạng thái của người dùng
    
    # Quan hệ người dùng
    friends: List[str] = Field(default_factory=list) # Mảng chứa ID (string) của bạn bè
    friendRequests: List[str] = Field(default_factory=list) # Mảng chứa ID (string) của những người đã gửi lời mời đến
    
    # Tracking thời gian và hoạt động
    createdAt: datetime = Field(default_factory=datetime.utcnow) # Thời gian đăng ký (UTC)
    updatedAt: datetime = Field(default_factory=datetime.utcnow) # Thời gian cập nhật hồ sơ gần nhất
    lastSeen: Optional[datetime] = None # Phục vụ tính năng hiển thị "Truy cập x phút trước"
    
    # Các tính năng nâng cao
    socialLinks: List[str] = Field(default_factory=list) # Mảng URL mạng xã hội (Facebook, Github...)
    archivedChats: List[str] = Field(default_factory=list) # Danh sách ID (User/Group) bị ẩn đi ở Sidebar
    banned_until: Optional[datetime] = None # Thời gian bị khóa mõm/khóa acc (dành cho Admin xử lý vi phạm)
    isAdmin: bool = False # Đánh dấu quyền quản trị viên hệ thống

    # Xác thực OTP
    is_verified: bool = True # Mặc định True cho các tài khoản cũ, tài khoản mới tạo sẽ là False
    otp_code: Optional[str] = None # Lưu mã OTP 6 số
    otp_expiry: Optional[datetime] = None # Thời gian hết hạn của OTP

    class Settings:
        name = "users" # Chỉ định tên Collection vật lý trong MongoDB


# Định nghĩa cấu trúc dữ liệu tin nhắn (Root Document)
class Message(Document):
    """
    Schema Tin nhắn: Trái tim của ứng dụng Chat.
    * Áp dụng Polymorphic Design (Đa hình) cho trường receiverId: 
      receiverId có thể là ID của một cá nhân (1-1 Chat) HOẶC là ID của một nhóm (Group Chat).
    """
    senderId: str       # ID người gửi tin nhắn (String format của ObjectId)
    receiverId: str     # ID người nhận cá nhân HOẶC ID nhóm chat
    text: Optional[str] = None  # Nội dung văn bản (đặt Optional để hỗ trợ tin nhắn chỉ có ảnh/file)
    image: Optional[str] = None # (Cũ) Đường dẫn ảnh đơn lẻ. Dự kiến có thể thay hoàn toàn bằng attachment
    attachment: Optional[FileAttachment] = None # Khối dữ liệu chứa thông tin file đính kèm/folder
    callInfo: Optional[CallInfo] = None  # Block thông tin nếu tin nhắn này thực chất là 1 thông báo kết thúc cuộc gọi
    
    # Quản lý trạng thái đọc tin
    seen: bool = False  # Đánh dấu đã xem (Dành cho Chat 1-1)
    seenBy: List[str] = Field(default_factory=list) # Danh sách ID những người đã xem (Dành cho Chat Group)
    
    # ── CƠ CHẾ SOFT-DELETE & EDIT ──
    # Thay vì dùng lệnh xóa cứng (hard delete), ta chỉ set cờ isDeleted = True và gỡ nội dung `text` ra.
    # Điều này giúp Client hiển thị "Tin nhắn đã bị thu hồi" và giữ vẹn toàn cấu trúc hội thoại.
    isDeleted: bool = False # Cờ báo tin nhắn đã bị thu hồi
    deletedByAdmin: bool = False # Cờ báo tin nhắn bị xóa bởi Admin (do vi phạm báo cáo)
    isEdited: bool = False # Cờ báo tin nhắn đã bị chỉnh sửa
    editedAt: Optional[datetime] = None # Đóng dấu thời gian chỉnh sửa
    
    # ── MẢNG CẢM XÚC NHÚNG ──
    reactions: List[Reaction] = Field(default_factory=list) # Lưu trực tiếp vào mảng, tối ưu tốc độ load
    
    # Tin nhắn hệ thống (Auto generated)
    isSystemMessage: bool = False # Đánh dấu các tin như: "User A đã thêm User B vào nhóm"
    is_nsfw: bool = False # Cờ do AI phân tích tự động gắn mác nội dung nhạy cảm (nếu có cấu hình)

    createdAt: datetime = Field(default_factory=datetime.utcnow) # Thời điểm tin được tạo
    updatedAt: datetime = Field(default_factory=datetime.utcnow) # Thời điểm cập nhật cuối

    class Settings:
        name = "messages" # Tên collection vật lý

# Định nghĩa cấu trúc dữ liệu Nhóm Chat trong MongoDB
# Định nghĩa cấu trúc dữ liệu Nhóm Chat (Root Document)
class ChatGroup(Document):
    """
    Schema Nhóm Chat: Bản thân Group đóng vai trò như một "phòng chat", 
    mỗi thành viên gửi tin vào phòng này thì `receiverId` của Message chính là ID của ChatGroup này.
    """
    name: str # Tên nhóm chat
    avatar: str = "" # Ảnh đại diện nhóm (Cloudinary URL)
    admin: str # ID của người trưởng nhóm (Có quyền đổi tên, kick thành viên, giải tán nhóm)
    members: List[str] = Field(default_factory=list) # Mảng ID những người thuộc nhóm này
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "chat_groups"


# Định nghĩa Report
class Report(Document):
    """
    Schema Report: Lưu trữ thông tin report (ví dụ spam) để admin xử lý.
    """
    reporterId: str
    reportedId: str
    messageId: str
    reason: str
    status: str = "pending"
    decision: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reports"
