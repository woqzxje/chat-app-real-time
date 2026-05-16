# 🚀 QuickChat - Real-time Chat Application

Ứng dụng trò chuyện trực tuyến thời gian thực được xây dựng với bộ công nghệ hiện đại (**FastAPI**, **React**, **MongoDB**). Hỗ trợ gửi tin nhắn văn bản, hình ảnh và trạng thái hoạt động của người dùng.

---

## ✨ Tính năng nổi bật

- 🔐 **Xác thực người dùng**: Đăng ký, Đăng nhập bảo mật với JWT (JSON Web Token).
- 💬 **Trò chuyện Real-time**: Nhận và gửi tin nhắn tức thì nhờ công nghệ Socket.IO.
- 📸 **Gửi hình ảnh**: Hỗ trợ chia sẻ hình ảnh trong cuộc trò chuyện thông qua Cloudinary.
- 👤 **Quản lý hồ sơ**: Cập nhật ảnh đại diện, tên hiển thị và lời giới thiệu cá nhân (Bio).
- 🟢 **Trạng thái Online**: Theo dõi ai đang trực tuyến trong danh sách bạn bè.
- 📱 **Giao diện hiện đại**: Thiết kế Responsive (tương thích mọi thiết bị) với Tailwind CSS và hiệu ứng Glassmorphism.
- 🌐 **Hỗ trợ Tiếng Việt**: Font chữ tùy chỉnh hỗ trợ đầy đủ tiếng Việt, không lỗi hiển thị.

---

## 🛠️ Công nghệ sử dụng

### Backend
- **FastAPI**: Framework Python hiệu năng cao để xây dựng API.
- **Socket.IO (python-socketio)**: Xử lý kết nối thời gian thực.
- **Beanie (ODM)**: Làm việc với MongoDB một cách dễ dàng và hiệu quả.
- **PyJWT**: Quản lý mã xác thực người dùng.
- **Cloudinary**: Lưu trữ và quản lý hình ảnh đám mây.

### Frontend
- **React**: Thư viện UI mạnh mẽ.
- **Vite**: Công cụ build siêu nhanh cho dự án web.
- **Tailwind CSS**: Framework CSS tiện lợi để thiết kế giao diện.
- **Context API**: Quản lý trạng thái (State Management) ứng dụng.
- **Axios**: Xử lý các yêu cầu HTTP đến Backend.

---

## ⚙️ Hướng dẫn cài đặt (Local)

### 1. Chuẩn bị Backend
```bash
cd server
pip install -r requirements.txt
```
Tạo file `.env` trong thư mục `server/` và cấu hình các biến sau:
```env
MONGODB_URL=đường_dẫn_kết_nối_mongodb
JWT_SECRET=khóa_bí_mật_tùy_chọn
CLOUDINARY_CLOUD_NAME=tên_cloud_của_bạn
CLOUDINARY_API_KEY=api_key_cloudinary
CLOUDINARY_API_SECRET=api_secret_cloudinary
```

### 2. Chuẩn bị Frontend
```bash
cd client
npm install
```
Tạo file `.env` trong thư mục `client/` và cấu hình:
```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🚀 Hướng dẫn Triển khai (Deployment)

### Backend (Khuyên dùng Render.com)
1. Kết nối kho lưu trữ GitHub với **Render**.
2. Chọn loại dịch vụ: **Web Service**.
3. **Language**: `Python`.
4. **Root Directory**: `server`.
5. **Build Command**: `pip install -r requirements.txt`.
6. **Start Command**: `uvicorn main:socket_app --host 0.0.0.0 --port $PORT`.
7. Cấu hình đầy đủ các biến môi trường trong mục **Advanced**.

### Frontend (Khuyên dùng Vercel)
1. Kết nối kho lưu trữ GitHub với **Vercel**.
2. Chọn thư mục root là `client`.
3. Framework Preset: **Vite**.
4. Cấu hình biến môi trường `VITE_BACKEND_URL` trỏ về link API của Render vừa tạo.
5. Nhấn **Deploy**.

---

## 📂 Cấu trúc thư mục

```text
├── client/                # Mã nguồn Frontend (React)
│   ├── src/
│   │   ├── components/    # Các thành phần giao diện (Sidebar, Chat,...)
│   │   ├── context/       # Quản lý trạng thái (Auth, Chat)
│   │   └── pages/         # Các trang chính (Login, Profile, Home)
│   └── index.css          # Cấu hình Style và Font chữ
├── server/                # Mã nguồn Backend (FastAPI)
│   ├── app/
│   │   ├── routes/        # Định nghĩa các đầu cuối API
│   │   ├── models.py      # Schema dữ liệu MongoDB
│   │   └── socket_manager.py # Xử lý Socket.IO
│   ├── main.py            # Khởi tạo ứng dụng chính
│   └── requirements.txt   # Danh sách thư viện Python
└── README.md
```

---

## 👨‍💻 Tác giả
Dự án được phát triển và tối ưu hóa cho cộng đồng lập trình viên Việt Nam. Chúc bạn có những trải nghiệm tuyệt vời với **QuickChat**!
