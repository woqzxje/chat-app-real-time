# 💬 QuickChat — Ứng dụng nhắn tin thời gian thực

**QuickChat** là dự án chat 1-1 theo thời gian thực với kiến trúc **Client – Server tách biệt**. Frontend là SPA React + Vite, backend cung cấp REST API và Socket.IO chạy bằng FastAPI. Dự án hướng tới giao tiếp nhanh, quản lý hồ sơ người dùng, trạng thái online và gửi ảnh trong cuộc hội thoại.

---

## 🎯 Mục tiêu dự án

- Xây dựng ứng dụng chat hiện đại với trải nghiệm realtime.
- Tách riêng frontend và backend để dễ triển khai, mở rộng.
- Sử dụng JWT cho xác thực và Socket.IO để đồng bộ tin nhắn, trạng thái online.
- Hỗ trợ gửi văn bản và ảnh, đồng thời cập nhật thông tin hồ sơ.

---

## 🧩 Kiến trúc tổng quan

```
CLIENT (React + Vite)  <=>  SERVER (FastAPI + Socket.IO)
     │                            │
     │ HTTP / REST API            │
     │ WebSocket / Socket.IO      │
     │                            │
     ▼                            ▼
  Browser                     MongoDB + Cloudinary
```

### Thành phần chính

- `client/`: giao diện người dùng, quản lý auth, kết nối Socket.IO
- `server/`: backend xử lý API, auth JWT, socket realtime, upload ảnh
- `render.yaml`: cấu hình deployment cho Render

---

## ✨ Tính năng chính

- Đăng ký và đăng nhập bằng email/password
- Xác thực JWT cho mọi API cần bảo mật
- Danh sách người dùng và trạng thái online realtime
- Gửi tin nhắn 1-1 ngay lập tức qua Socket.IO
- Hỗ trợ gửi ảnh trong cuộc trò chuyện
- Cập nhật avatar, tên hiển thị và bio
- Đánh dấu tin nhắn đã đọc

---

## 📁 Cấu trúc thư mục

```
chat-app-re/
├── client/          # Frontend React + Vite
├── server/          # Backend FastAPI + Socket.IO
├── render.yaml      # Cấu hình deploy Render
└── README.md        # Hướng dẫn tổng quát
```

---

## ⚙️ Chạy cục bộ

### 1. Backend

```bash
cd server
pip install -r requirements.txt
```

Tạo file `.env` dựa trên `.env.example`:

```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

Khởi động backend:

```bash
python run.py
```

hoặc dùng Uvicorn:

```bash
uvicorn main:socket_app --host 0.0.0.0 --port 5000 --reload
```

### 2. Frontend

```bash
cd client
npm install
```

Tạo file `.env` trong `client/`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Khởi động frontend:

```bash
npm run dev
```

---

## 📦 Triển khai

### Backend (Render)

- Root directory: `server`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:socket_app --host 0.0.0.0 --port $PORT`
- Thêm biến môi trường trong Render theo `.env`

### Frontend (Vercel)

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Biến môi trường: `VITE_BACKEND_URL` trỏ về backend deploy

---

## 📌 Ghi chú

- Kiểm tra `client/README.md` để biết cấu hình frontend chi tiết.
- Kiểm tra `server/README.md` để biết cấu hình backend chi tiết.
- Không commit file `.env` vào Git.

---

## 🙋‍♂️ Tác giả

Dự án phát triển bởi **Thượng Mạnh Quỳnh**.