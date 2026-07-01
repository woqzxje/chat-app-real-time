# 💬 QuickChat — Ứng dụng nhắn tin thời gian thực cao cấp

**QuickChat** là một ứng dụng chat 1-1 thời gian thực được xây dựng dựa trên kiến trúc tách biệt giữa **Client (React + Vite)** và **Server (FastAPI + Socket.IO)**. Dự án được thiết kế với giao diện người dùng hiện đại, nhiều hiệu ứng động mượt mà và các tính năng truyền tải tập tin cao cấp.

---

## 🎯 Điểm nổi bật & Tính năng chính

- **Giao diện Modern Glassmorphism**: Trang đăng nhập và đăng ký được thiết kế với hiệu ứng kính mờ cao cấp, hiệu ứng nghiêng 3D (3D Tilt Effect) động theo con trỏ chuột, và viền sáng phát quang chuyển động (Animated Border Light Beams).
- **Trải nghiệm Realtime mượt mà**: Đồng bộ hóa tin nhắn, thông báo cuộc gọi và danh sách người dùng online tức thì thông qua Socket.IO.
- **Cuộc gọi Video Call (WebRTC)**: Tích hợp cuộc gọi video trực tuyến giữa hai người dùng với giao diện modal chuyên nghiệp, xử lý ngắt kết nối an toàn và hiển thị lịch sử cuộc gọi trực quan.
- **Truyền tải File & Thư mục**:
  - Hỗ trợ gửi ảnh trực tiếp (preview nhanh).
  - Đính kèm tập tin riêng lẻ (PDF, Word, Excel, ZIP, RAR, v.v.).
  - **Gửi và tải cả thư mục (Folder)**: Giữ nguyên cấu trúc thư mục con bên trong. Khi tải xuống, hệ thống tự động đóng gói zip an toàn qua proxy từ Cloudinary giúp giải quyết lỗi tải file archive (.zip, .rar).
- **Trình tải an toàn (Proxy Download)**: Toàn bộ quá trình tải tập tin được xử lý qua proxy backend giúp bỏ qua chính sách chặn CORS của trình duyệt đối với các liên kết từ bên ngoài (Cloudinary).

---

## 🧩 Kiến trúc hệ thống

```
CLIENT (React 19 + Vite)  <======>  SERVER (FastAPI + Socket.IO)
      │                                     │
      │ - HTTP / REST API (JWT Auth)         │
      │ - WebSockets (Socket.IO realtime)   │
      │                                     │
      ▼                                     ▼
   Browser                              MongoDB + Cloudinary
```

### Phân bổ thư mục

- `client/`: Mã nguồn giao diện người dùng React, quản lý Auth Context, Chat Context và Socket.IO Client.
- `server/`: REST API FastAPI, quản lý Socket.IO Server, điều phối WebRTC signaling và lưu trữ tệp Cloudinary.
- `render.yaml`: Tệp cấu hình tự động triển khai hệ thống lên dịch vụ Render.

---

## ⚙️ Hướng dẫn cài đặt & Chạy cục bộ

### 1. Cấu hình & Chạy Backend (Server)

Di chuyển vào thư mục server và cài đặt các thư viện Python cần thiết:
```bash
cd server
pip install -r requirements.txt
```

Tạo tệp cấu hình môi trường `.env` từ tệp `.env.example`:
```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=5000
```

Khởi động Backend Server:
```bash
py run.py
# Hoặc sử dụng Uvicorn trực tiếp:
uvicorn main:socket_app --host 0.0.0.0 --port 5000 --reload
```

### 2. Cấu hình & Chạy Frontend (Client)

Di chuyển vào thư mục client và cài đặt các gói Node.js:
```bash
cd client
npm install
```

Tạo tệp cấu hình môi trường `.env` trong thư mục `client/`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

Khởi động môi trường phát triển Frontend:
```bash
npm run dev
```

---

## 📦 Triển khai sản phẩm (Deployment)

### Triển khai Backend (ví dụ: Render)
- **Thư mục gốc**: `server`
- **Lệnh Build**: `pip install -r requirements.txt`
- **Lệnh Start**: `uvicorn main:socket_app --host 0.0.0.0 --port $PORT`
- *Lưu ý*: Cần điền đầy đủ các biến môi trường cấu hình trong phần Environment Variables của Render.

### Triển khai Frontend (ví dụ: Vercel)
- **Thư mục gốc**: `client`
- **Lệnh Build**: `npm run build`
- **Thư mục Output**: `dist`
- *Lưu ý*: Thêm biến môi trường `VITE_BACKEND_URL` trỏ tới URL API Backend đã deploy.

---

## 🙋‍♂️ Tác giả
Dự án được xây dựng và phát triển bởi **Thượng Mạnh Quỳnh**.