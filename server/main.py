from dotenv import load_dotenv
# Phải nạp các biến môi trường từ file .env đầu tiên để các module khác có thể sử dụng (ví dụ: MONGODB_URL)
load_dotenv()

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import các hàm và router từ các module trong thư mục app
from app.database import connect_db
from app.routes import user_router, message_router
from app.socket_manager import sio
from app.routes.file_routes import router as file_router

# ── Lifespan: Xử lý các sự kiện khi ứng dụng khởi chạy và kết thúc ──────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kết nối đến Database MongoDB ngay khi server bắt đầu chạy
    await connect_db()
    yield
    # Có thể thêm các tác vụ dọn dẹp ở đây nếu cần

# ── Khởi tạo ứng dụng FastAPI ───────────────────────────────────────────────────
app = FastAPI(title="Chat App API", lifespan=lifespan)

# Cấu hình Middleware CORS để cho phép Frontend từ các domain khác truy cập vào API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả các nguồn (có thể thay bằng URL cụ thể của Vercel khi deploy)
    allow_credentials=True,
    allow_methods=["*"], # Cho phép tất cả các phương thức HTTP (GET, POST, PUT, DELETE...)
    allow_headers=["*"], # Cho phép tất cả các header
)

# ── Đăng ký các Routes (Đường dẫn API) ──────────────────────────────────────────
# Route liên quan đến xác thực người dùng (đăng ký, đăng nhập)
app.include_router(user_router,    prefix="/api/auth")
# Route liên quan đến tin nhắn và danh sách người dùng
app.include_router(message_router, prefix="/api/messages")
# Route liên quan đến file và folder
app.include_router(file_router,    prefix="/api/files")

# Route kiểm tra trạng thái hoạt động của server
@app.get("/api/status")
async def status():
    return {"message": "Server is live"}

# ── Gắn Socket.IO vào FastAPI ──────────────────────────────────────────────────
# Tạo một ứng dụng ASGI kết hợp cả FastAPI và Socket.IO
# Mọi sự kiện socket sẽ được xử lý trong file socket_manager.py
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
