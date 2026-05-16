# Chat App

Ứng dụng chat realtime fullstack với:
- Frontend React + Vite + Tailwind CSS
- Backend FastAPI + Socket.IO
- MongoDB làm datastore
- JWT cho xác thực
- Cloudinary để lưu ảnh

## Tính năng chính

- Đăng ký / đăng nhập người dùng
- Xác thực JWT cho API bảo mật
- Cập nhật hồ sơ cá nhân (avatar, bio, tên)
- Danh sách người dùng hiện có và trạng thái online
- Gửi, nhận tin nhắn 1-1 realtime
- Gửi tin nhắn kèm ảnh
- Đánh dấu tin nhắn đã xem

## Cấu trúc dự án

- `client/` - frontend React
- `server-python/` - backend FastAPI + Socket.IO
  - `app/routes/` - API routes cho auth và messages
  - `app/models.py` - mô hình dữ liệu User và Message
  - `app/database.py` - kết nối MongoDB
  - `app/socket_manager.py` - quản lý Socket.IO realtime

## Yêu cầu

- Node.js 20+ (cho frontend)
- Python 3.11+ (cho backend)
- MongoDB đang chạy và có kết nối qua `MONGODB_URL`
- Tài khoản Cloudinary để upload ảnh

## Cài đặt

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server-python
pip install -r requirements.txt
```

## Biến môi trường

Tạo file `.env` trong `server-python/` với các biến sau:

```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

## Chạy dự án

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

- `GET /api/status` - kiểm tra server đang chạy
- `POST /api/auth/signup` - đăng ký tài khoản
- `POST /api/auth/login` - đăng nhập
- `GET /api/auth/check` - kiểm tra token và lấy thông tin user
- `PUT /api/auth/update-profile` - cập nhật profile
- `GET /api/messages/users` - lấy danh sách người dùng và số tin nhắn chưa đọc
- `GET /api/messages/{id}` - lấy lịch sử chat với một user
- `PUT /api/messages/mark/{id}` - đánh dấu tin nhắn đã xem
- `POST /api/messages/send/{id}` - gửi tin nhắn cho user khác

## Ghi chú

- Backend cho phép mọi nguồn (`CORS *`) để phát triển nhanh.
- Token JWT được đọc từ header `token` trong các request auth.
- Socket.IO dùng để đồng bộ trạng thái online và nhận tin nhắn realtime.
- Ảnh gửi kèm và avatar được upload lên Cloudinary.

---

Nếu mở rộng, bạn có thể thêm:
- chat nhóm
- typing indicator
- quản lý state bằng Redux / Zustand
- refresh token và bảo mật CORS chặt hơn
