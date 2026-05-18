# Backend Chat App

Backend của dự án chat realtime sử dụng:
- FastAPI
- Socket.IO
- MongoDB
- Beanie (ODM cho MongoDB)
- JWT để xác thực
- Cloudinary để upload ảnh

## Yêu cầu

- Python 3.11+
- MongoDB đang chạy và truy cập được qua biến môi trường `MONGODB_URL`
- Tài khoản Cloudinary

## Cài đặt

```bash
cd server
pip install -r requirements.txt
```

## Biến môi trường

Tạo file `.env` hoặc sao chép từ `.env.example`:

```bash
cd server
copy .env.example .env
```

Nội dung mẫu:

```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

## Chạy server

```bash
cd server
python run.py
```

Hoặc dùng Uvicorn:

```bash
cd server
uvicorn main:socket_app --host 0.0.0.0 --port 5000 --reload
```

## API chính

- `GET /api/status` - kiểm tra server đang chạy
- `POST /api/auth/signup` - đăng ký tài khoản
- `POST /api/auth/login` - đăng nhập
- `GET /api/auth/check` - kiểm tra token và lấy thông tin user
- `PUT /api/auth/update-profile` - cập nhật profile
- `GET /api/messages/users` - lấy danh sách người dùng và tin nhắn chưa đọc
- `GET /api/messages/{id}` - lấy lịch sử chat với một người dùng
- `PUT /api/messages/mark/{id}` - đánh dấu tin nhắn đã xem
- `POST /api/messages/send/{id}` - gửi tin nhắn đến người dùng khác

## Ghi chú

- Header `token` được dùng để truyền JWT cho các endpoint bảo mật.
- Socket.IO dùng để cập nhật trạng thái online và nhận tin nhắn realtime.
- Dữ liệu ảnh upload được lưu trên Cloudinary.
