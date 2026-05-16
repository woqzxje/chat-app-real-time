# Chat App Fullstack

Đây là dự án ứng dụng chat realtime fullstack, gồm:
- `client/`: frontend React + Vite + Tailwind CSS
- `server-python/`: backend FastAPI + Socket.IO

## Tính năng

- Đăng ký / đăng nhập người dùng
- Xác thực JWT cho các API bảo mật
- Cập nhật hồ sơ cá nhân (avatar, bio, tên)
- Danh sách người dùng và trạng thái online
- Gửi, nhận tin nhắn 1-1 realtime
- Gửi tin nhắn kèm ảnh
- Đánh dấu tin nhắn đã xem

## Yêu cầu

- Node.js 20+ cho frontend
- Python 3.11+ cho backend
- MongoDB đang chạy và kết nối được với biến môi trường `MONGODB_URL`
- Cloudinary để upload ảnh

## Thiết lập

### 1. Frontend

```bash
cd client
npm install
```

### 2. Backend

```bash
cd server-python
pip install -r requirements.txt
```

## Biến môi trường backend

Tạo file `.env` trong `server-python/` hoặc sao chép từ mẫu `.env.example`:

```bash
cd server-python
copy .env.example .env
```

`server-python/.env.example` chứa mẫu:

```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

## Chạy ứng dụng

### Backend

```bash
cd server-python
python run.py
```

Hoặc:

```bash
cd server-python
uvicorn main:socket_app --host 0.0.0.0 --port 5000 --reload
```

### Frontend

```bash
cd client
npm run dev
```

## API chính

- `GET /api/status` - kiểm tra server đang hoạt động
- `POST /api/auth/signup` - đăng ký người dùng
- `POST /api/auth/login` - đăng nhập
- `GET /api/auth/check` - kiểm tra token và lấy thông tin user
- `PUT /api/auth/update-profile` - cập nhật profile
- `GET /api/messages/users` - lấy danh sách người dùng và số tin nhắn chưa đọc
- `GET /api/messages/{id}` - lấy lịch sử chat với một người dùng
- `PUT /api/messages/mark/{id}` - đánh dấu tin nhắn đã xem
- `POST /api/messages/send/{id}` - gửi tin nhắn đến một người dùng khác

## Ghi chú

- Server cho phép mọi nguồn (`CORS *`) để phát triển nhanh.
- Token JWT được truyền qua header `token` trong request bảo mật.
- Socket.IO dùng để phát hiện người dùng online và nhận tin nhắn realtime.
- Ảnh gửi kèm và avatar được upload lên Cloudinary.

## Mở rộng

Bạn có thể mở rộng dự án bằng cách:
- Thêm chat nhóm
- Thêm typing indicator
- Quản lý state frontend với Redux hoặc Zustand
- Thêm refresh token và bảo mật CORS chặt hơn
