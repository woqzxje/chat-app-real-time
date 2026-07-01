# 🖥️ QuickChat Client

Phần Frontend của **QuickChat**, xây dựng bằng **React 19 + Vite + Tailwind CSS v4**. Client xử lý giao diện chat thời gian thực, cuộc gọi Video Call WebRTC, đính kèm và tải thư mục tập tin, cùng thiết kế Glassmorphism hiện đại cho trang đăng nhập/đăng ký.

---

## 🎯 Tính năng nổi bật ở Client

- **Login/Register Glassmorphism**: Sử dụng React & CSS state để tạo hiệu ứng xoay 3D (3D Tilt) và viền sáng phát quang chạy xung quanh mượt mà, hạn chế lỗi hook của `framer-motion` trên một số phiên bản React cũ.
- **Tải tệp & Thư mục an toàn**: Tích hợp trình tải proxy tự động xử lý CORS giúp người dùng tải trực tiếp các tệp `.zip`, `.rar` và các cấu trúc thư mục mà không gặp sự cố chặn của trình duyệt.
- **Cuộc gọi Video Call trực tuyến**: Giao diện modal đàm thoại trực tiếp với các tín hiệu điều phối thời gian thực, thông báo lịch sử cuộc gọi trực quan.
- **Sidebar thông minh**: Cập nhật trạng thái hoạt động (online/offline) và bộ đếm tin nhắn chưa đọc của từng người dùng tức thì.

---

## 🛠 Công nghệ sử dụng

- **React 19** & **Vite**
- **Tailwind CSS v4** (thiết kế tối giản và hiện đại)
- **Framer Motion** & **Lucide React** (cho giao diện Glassmorphic)
- **Socket.IO Client** (kết nối thời gian thực)
- **Axios** (gửi yêu cầu API)
- **React Hot Toast** (thông báo popup trực quan)

---

## ⚙️ Cấu hình & Chạy cục bộ

Cài đặt các thư viện liên quan:
```bash
npm install
```

Tạo tệp cấu hình môi trường `.env` trong thư mục `client/`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

Khởi động dự án ở chế độ phát triển:
```bash
npm run dev
```

Build production:
```bash
npm run build
```

---

## 📡 Các API Backend sử dụng

| Phương thức | Endpoint | Mục đích |
|---|---|---|
| `POST` | `/api/auth/signup` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập hệ thống |
| `GET` | `/api/auth/check` | Xác thực token hiện tại |
| `PUT` | `/api/auth/update-profile` | Cập nhật hồ sơ |
| `GET` | `/api/messages/users` | Lấy danh sách người dùng & tin chưa đọc |
| `GET` | `/api/messages/{userId}` | Lấy lịch sử nhắn tin |
| `POST` | `/api/messages/send/{userId}` | Gửi tin nhắn / hình ảnh / tệp tin |
| `GET` | `/api/files/download` | Tải tập tin qua proxy (tránh CORS) |
| `POST` | `/api/files/download-folder` | Tải thư mục dạng nén ZIP |

---

## 🌐 Triển khai lên Vercel

1. Thư mục gốc (Root directory): `client`
2. Lệnh build (Build command): `npm run build`
3. Thư mục đầu ra (Output directory): `dist`
4. Biến môi trường: `VITE_BACKEND_URL` (trỏ đến API backend đã triển khai)