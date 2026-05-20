# 🖥️ QuickChat Client

Frontend của QuickChat, xây dựng bằng **React 19 + Vite + Tailwind CSS**. Client xử lý giao diện chat, xác thực người dùng, kết nối Socket.IO và gọi API backend để gửi nhận dữ liệu.

---

## 🎯 Mục tiêu

- Cung cấp giao diện chat 1-1 rõ ràng và nhanh.
- Đồng bộ trạng thái người dùng và tin nhắn thời gian thực.
- Kết nối an toàn với backend bằng JWT.

---

## 🛠 Công nghệ chính

- React 19
- Vite
- Tailwind CSS v4
- React Router DOM
- Axios
- socket.io-client
- react-hot-toast

---

## 📁 Cấu trúc thư mục

```
client/
├── public/                # Tài nguyên tĩnh
├── src/
│   ├── components/        # UI components chính
│   │   ├── ChatContainer.jsx
│   │   ├── SideBar.jsx
│   │   └── RightSidebar.jsx
│   ├── context/           # Quản lý trạng thái auth và chat
│   │   ├── AuthContext.jsx
│   │   └── ChatContext.jsx
│   ├── pages/             # Các trang chính
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   └── ProfilePage.jsx
│   ├── lib/               # Axios instance, helper
│   ├── App.jsx            # Router chính
│   └── main.jsx           # Entry point
├── .env                   # Biến môi trường
├── package.json
├── vite.config.js
└── vercel.json            # Cấu hình triển khai Vercel
```

---

## ⚙️ Cài đặt

```bash
cd client
npm install
```

Tạo file `.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## ▶️ Chạy dự án

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

## 🔄 Luồng hoạt động

1. Người dùng vào app và đăng nhập/đăng ký.
2. `AuthContext` lưu token JWT và thông tin user.
3. `ChatContext` kết nối Socket.IO để nhận tin nhắn và trạng thái online.
4. UI cập nhật tức thì khi có tin nhắn mới hoặc thay đổi trạng thái người dùng.

---

## 📡 API backend sử dụng

| Method | Endpoint | Mục đích |
|---|---|---|
| `POST` | `/api/auth/signup` | Đăng ký |
| `POST` | `/api/auth/login` | Đăng nhập |
| `GET` | `/api/auth/check` | Kiểm tra token |
| `PUT` | `/api/auth/update-profile` | Cập nhật profile |
| `GET` | `/api/messages/users` | Lấy danh sách user |
| `GET` | `/api/messages/{id}` | Lấy lịch sử chat |
| `POST` | `/api/messages/send/{id}` | Gửi tin nhắn |
| `PUT` | `/api/messages/mark/{id}` | Đánh dấu tin nhắn đã đọc |

---

## 🌐 Triển khai lên Vercel

1. Chọn root directory là `client`.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Thêm biến môi trường `VITE_BACKEND_URL` trỏ tới backend deploy.

---

## 💡 Lưu ý

- Không commit file `.env`.
- Nếu backend nằm ở URL khác, cập nhật `VITE_BACKEND_URL` tương ứng.
- Frontend sẽ không hoạt động nếu backend chưa chạy.