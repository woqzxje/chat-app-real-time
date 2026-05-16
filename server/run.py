"""
Tệp tin khởi chạy ứng dụng (Entry Point) dành cho môi trường phát triển cục bộ (Local Development).

Cách chạy:
1. Chạy trực tiếp: python run.py
2. Hoặc sử dụng lệnh uvicorn: uvicorn main:socket_app --host 0.0.0.0 --port 5000 --reload
"""
import os
from dotenv import load_dotenv

# Tải các biến môi trường từ file .env vào hệ thống
load_dotenv()

import uvicorn

if __name__ == "__main__":
    # Lấy cổng (Port) từ biến môi trường, mặc định là 5000 nếu không có
    port = int(os.getenv("PORT", 5000))
    
    # Khởi chạy server Uvicorn
    uvicorn.run(
        "main:socket_app", # Tên ứng dụng (app) nằm trong file main.py
        host="0.0.0.0",   # Lắng nghe từ mọi địa chỉ IP
        port=port,        # Cổng chạy ứng dụng
        reload=True,      # Tự động tải lại server khi có thay đổi code (chỉ dùng khi code)
    )
