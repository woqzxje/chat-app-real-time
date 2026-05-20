# ⚙️ QuickChat Server

Backend của QuickChat sử dụng **FastAPI** và **python-socketio** để cung cấp REST API và kết nối realtime. Server xử lý xác thực JWT, lưu trữ dữ liệu MongoDB, đồng bộ trạng thái online và upload ảnh qua Cloudinary.

---

## 🎯 Mục tiêu

- Cung cấp API cho frontend chat realtime.
- Bảo mật bằng JWT cho mọi endpoint cần authentication.
- Quản lý tin nhắn, người dùng và trạng thái online.
- Hỗ trợ upload ảnh chat qua Cloudinary.

---

## 🛠 Công nghệ chính

- FastAPI
- Uvicorn
- python-socketio
- Beanie
- Motor
- PyJWT
- bcrypt
- Cloudinary
- python-dotenv
- python-multipart

---

## 📁 Cấu trúc thư mục

```
server/
├── app/
│   ├── routes/
│   │   ├── user_routes.py
│   │   └── message_routes.py
│   ├── models.py
│   ├── database.py
│   ├── socket_manager.py
│   ├── dependencies.py
│   ├── cloudinary_client.py
│   └── utils.py
├── main.py
├── run.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## ⚙️ Cài đặt

```bash
cd server
pip install -r requirements.txt
```

Tạo file `.env` từ mẫu:

```bash
copy .env.example .env
```

Nội dung `.env` cần có:

```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET=your_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

---

## ▶️ Chạy server

```bash
py run.py
```

Nếu `python run.py` không khởi động do Windows launcher, dùng `py run.py`.

hoặc dev mode:

```bash
uvicorn main:socket_app --host 0.0.0.0 --port 5000 --reload
```

Server mặc định chạy tại `http://localhost:5000`.

---

## 📡 API chính

### Auth

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/signup` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập và nhận token |
| `GET` | `/api/auth/check` | Kiểm tra token |
| `PUT` | `/api/auth/update-profile` | Cập nhật avatar, tên, bio |

### Messages

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/messages/users` | Lấy danh sách user + tin chưa đọc |
| `GET` | `/api/messages/{userId}` | Lấy lịch sử chat với user |
| `POST` | `/api/messages/send/{userId}` | Gửi tin nhắn text/ảnh |
| `PUT` | `/api/messages/mark/{userId}` | Đánh dấu tin nhắn đã đọc |

> 🔐 Các endpoint `/api/auth/check`, `/api/auth/update-profile`, `/api/messages/*` yêu cầu JWT header `token: <jwt_token>`.

---

## 🔌 Socket.IO events

| Event | Mô tả |
|---|---|
| `connect` | Client kết nối và đăng ký userId |
| `disconnect` | Cập nhật trạng thái offline |
| `getOnlineUsers` | Server gửi danh sách user online |
| `newMessage` | Server gửi tin nhắn mới cho user nhận |

---

## 🗃️ Mô hình dữ liệu

### User

- `email`: string
- `fullName`: string
- `password`: string (hash bcrypt)
- `profilePic`: string
- `bio`: string
- `createdAt`, `updatedAt`

### Message

- `senderId`: string
- `receiverId`: string
- `text`: string
- `image`: string
- `seen`: bool
- `createdAt`, `updatedAt`

---

## 🌐 Triển khai trên Render

1. Chọn repo, tạo Web Service mới.
2. Root directory: `server`.
3. Build command: `pip install -r requirements.txt`.
4. Start command: `uvicorn main:socket_app --host 0.0.0.0 --port $PORT`.
5. Cấu hình biến môi trường từ `.env`.

---

## 💡 Lưu ý

- Không commit file `.env`.
- Backend phải hoạt động trước khi frontend kết nối.
- Nếu đổi cổng hoặc domain, cập nhật `VITE_BACKEND_URL` ở client.
