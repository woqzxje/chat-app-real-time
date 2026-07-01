# ⚙️ QuickChat Server

Phần Backend của **QuickChat**, sử dụng **FastAPI** và **python-socketio** để cung cấp REST API và kết nối WebSocket thời gian thực. Server chịu trách nhiệm quản lý xác thực JWT, cơ sở dữ liệu MongoDB (thông qua Beanie ODM), upload tài nguyên lên Cloudinary và điều phối signaling cuộc gọi Video WebRTC.

---

## 🎯 Tính năng nổi bật ở Server

- **Xác thực an toàn với JWT**: Bảo vệ các API nhạy cảm bằng token xác thực truyền qua header.
- **WebSocket Realtime**: Xử lý trạng thái online/offline, đồng bộ tin nhắn tức thì và điều phối WebRTC SDP/ICE candidates để thực hiện cuộc gọi video.
- **Hệ thống Quản lý Tệp tin đính kèm**:
  - Gửi ảnh đơn lẻ (lưu trữ Cloudinary).
  - Tải lên thư mục (giữ nguyên cấu trúc thư mục con và tải lên Cloudinary dưới dạng tài nguyên thô).
  - **Proxy Download Endpoint**: Endpoint `/api/files/download` tải tệp từ Cloudinary và stream trực tiếp về client với tiêu đề `application/octet-stream` giúp ngăn chặn lỗi CORS và buộc trình duyệt tải tệp xuống thay vì mở inline (áp dụng tốt cho cả tệp .zip, .rar).
  - **Download Folder Endpoint**: Endpoint `/api/files/download-folder` đóng gói các tệp tin trong thư mục thành định dạng `.zip` và stream trực tiếp về.

---

## 🛠 Công nghệ sử dụng

- **FastAPI** & **Uvicorn**
- **python-socketio** (quản lý WebSocket chất lượng cao)
- **Beanie ODM** & **Motor** (giao tiếp MongoDB)
- **PyJWT** (mã hóa & xác thực JWT)
- **Bcrypt** (băm mật khẩu)
- **Cloudinary** (lưu trữ đám mây cho tệp tin)
- **HTTPX** (giao tiếp bất đồng bộ cho proxy download)

---

## ⚙️ Cài đặt & Khởi chạy

Cài đặt các gói Python cần thiết:
```bash
pip install -r requirements.txt
```

Tạo tệp cấu hình môi trường `.env` trong thư mục `server/`:
```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=5000
```

Khởi động Server:
```bash
py run.py
# Hoặc sử dụng Uvicorn trực tiếp:
uvicorn main:socket_app --host 0.0.0.0 --port 5000 --reload
```

---

## 📡 Chi tiết REST API

### Xác thực & Người dùng (`/api/auth`)

| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/signup` | Đăng ký tài khoản mới |
| `POST` | `/login` | Đăng nhập và nhận JWT token |
| `GET` | `/check` | Xác thực token và lấy thông tin cá nhân |
| `PUT` | `/update-profile` | Cập nhật ảnh đại diện, tên hiển thị, bio |

### Tin nhắn (`/api/messages`)

| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/users` | Lấy danh sách người dùng và số tin chưa xem |
| `GET` | `/{userId}` | Lấy lịch sử trò chuyện với người dùng cụ thể |
| `POST` | `/send/{userId}` | Gửi tin nhắn mới (chữ, hình ảnh, hoặc file) |
| `PUT` | `/mark/{userId}` | Đánh dấu các tin nhắn của cuộc trò chuyện đã xem |

### Quản lý Tệp tin (`/api/files`)

| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/upload` | Tải lên một tệp tin đơn lẻ |
| `POST` | `/upload-folder` | Tải lên cấu trúc thư mục con |
| `GET` | `/download` | Proxy tải xuống tệp qua Backend (ép octet-stream) |
| `POST` | `/download-folder` | Đóng gói thư mục thành tập tin ZIP và tải xuống |

---

## 🔌 Socket.IO Events chính

- `connect`: Kết nối WebSocket, đăng ký ánh xạ `userId` -> `socketId`.
- `disconnect`: Hủy đăng ký, cập nhật trạng thái offline và phát thông báo danh sách online mới.
- `getOnlineUsers`: Phát danh sách ID người dùng đang online.
- `newMessage`: Điều phối tin nhắn mới đến socket người nhận.
- `callUser`, `answerCall`, `iceCandidate`, `endCall`: Các sự kiện phục vụ điều phối cuộc gọi video WebRTC.

---

## 🌐 Triển khai lên Render

1. Loại dịch vụ: **Web Service**
2. Thư mục gốc: `server`
3. Lệnh build (Build command): `pip install -r requirements.txt`
4. Lệnh start (Start command): `uvicorn main:socket_app --host 0.0.0.0 --port $PORT`
5. Khai báo đầy đủ các biến môi trường cấu hình từ `.env` vào phần cấu hình của Render.
