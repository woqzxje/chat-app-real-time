<div align="center">
  <h1 align="center">ChatApp - Server (Máy Chủ & Định Tuyến)</h1>

  <p align="center">
    Mã nguồn Backend của ChatApp, được xây dựng bằng Python FastAPI. Xử lý xác thực, định tuyến API, cơ sở dữ liệu MongoDB và quản lý kết nối Socket đồng thời.
  </p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-010101?&style=for-the-badge&logo=Socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google OAuth" />
</div>

<br />

---

## Công Nghệ Nền Tảng

* **Core:** Python 3 + FastAPI (Framework bất đồng bộ hiệu năng cao) + Uvicorn (ASGI Server).
* **Database:** MongoDB kết hợp với Motor (Async driver) và Beanie (ODM - Object Document Mapper).
* **Real-time:** `python-socketio` (Phiên bản 5.x) chạy chung port với FastAPI qua `ASGIApp`.
* **Authentication & Security:** 
  * Cấp phát và quản lý phiên đăng nhập bằng **JWT (JSON Web Tokens)** qua header Authorization.
  * Giải mã và xác thực tài khoản Google bằng thư viện `google-auth`.
  * Mã hóa mật khẩu bảo mật tuyệt đối với `bcrypt`.
* **Media & Storage:** Tích hợp nền tảng **Cloudinary** để xử lý tải lên hình ảnh, tài liệu, và nén Zip trên RAM.
* **AI Integration:** Google Generative AI (Gemini) cho Chatbot trợ lý ảo và Tóm tắt hội thoại.

---

## Cấu Trúc Thư Mục Chính

```
server/
├── main.py              # Entry point - Khởi tạo FastAPI, CORS, Socket.IO
├── run.py               # Script khởi chạy Uvicorn (dev mode)
├── requirements.txt     # Danh sách thư viện Python
├── .env.example         # Mẫu biến môi trường
├── vercel.json          # Cấu hình deploy Vercel
└── app/
    ├── __init__.py
    ├── database.py          # Kết nối MongoDB (Motor + Beanie)
    ├── models.py            # Schema: User, Message, ChatGroup, Report
    ├── dependencies.py      # Middleware xác thực JWT (get_current_user)
    ├── socket_manager.py    # Real-time: Online status, WebRTC signaling
    ├── cloudinary_client.py # Cấu hình Cloudinary SDK
    ├── email_service.py     # Dịch vụ gửi email
    ├── utils.py             # Hàm tiện ích
    └── routes/
        ├── __init__.py
        ├── user_routes.py      # Auth: Đăng ký, Đăng nhập, Google OAuth, Kết bạn
        ├── message_routes.py   # Chat: Gửi/Sửa/Thu hồi tin nhắn, Nhóm chat
        ├── file_routes.py      # Upload/Download file & folder (Zip on-the-fly)
        ├── ai_routes.py        # AI Chatbot & Tóm tắt hội thoại (Gemini)
        └── report_routes.py    # Báo cáo vi phạm & Admin quản lý
```

---

## Kiến Trúc Socket & WebRTC Signaling

Backend không chỉ cung cấp RESTful APIs mà còn là **Signaling Server** cho WebRTC:

1. **Trạng Thái Online (Presence):** Dùng `user_socket_map` (Dict) ánh xạ `userId → socketId`. Broadcast danh sách người dùng trực tuyến khi có thay đổi.
2. **WebRTC Signaling:** Định tuyến tín hiệu ICE Candidates và Session Descriptions (Offer/Answer) giữa hai User qua Socket.
3. **Đồng Bộ Dữ Liệu:** Đẩy các sự kiện `receiveMessage`, `messageEdited`, `messageRevoked`, `newFriendRequest`... ngay lập tức đến Client.

---

## Cấu Hình Môi Trường (Environment Variables)

Hãy tạo file `.env` ở thư mục gốc của `/server` (tham khảo `.env.example`):

```env
# Port chạy Server
PORT=5001

# Đường dẫn chuỗi kết nối MongoDB (Nên dùng MongoDB Atlas)
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat_db

# Chữ ký bảo mật JWT
JWT_SECRET=your_super_secret_key_here

# Thông tin Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URL Frontend (Dùng cho CORS)
CLIENT_URL=http://localhost:5173

# Google Auth Client ID
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Khởi Chạy

```bash
# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy server (dev mode với hot reload)
python run.py

# Hoặc chạy trực tiếp bằng uvicorn
uvicorn main:socket_app --host 0.0.0.0 --port 5001 --reload
```
