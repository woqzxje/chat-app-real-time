import os
import motor.motor_asyncio
from beanie import init_beanie
from app.models import User, Message

# Lấy URL kết nối MongoDB từ biến môi trường
MONGODB_URL = os.getenv("MONGODB_URL")

async def connect_db():
    """Khởi tạo kết nối với MongoDB và thiết lập Beanie ODM."""
    # Tạo client kết nối với MongoDB bằng thư viện Motor (async)
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    # Chọn database có tên là "chat-app"
    db = client["chat-app"]
    
    # Khởi tạo Beanie với các models User và Message đã định nghĩa
    # Điều này giúp ta thao tác với MongoDB thông qua các class Python một cách dễ dàng
    await init_beanie(database=db, document_models=[User, Message])
    print("Database Connected successfully")
