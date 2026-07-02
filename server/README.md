<div align="center">
  <h1 align="center">ChatApp - Server (Máy Chủ & Định Tuyến)</h1>

  <p align="center">
    Mã nguồn Backend của ChatApp, đóng vai trò xử lý xác thực, định tuyến API, thiết lập cấu trúc cơ sở dữ liệu MongoDB và quản lý hàng nghìn kết nối Socket đồng thời.
  </p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-010101?&style=for-the-badge&logo=Socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google OAuth" />
</div>

<br />

---

## Công Nghệ Nền Tảng

* **Core:** Node.js + Express Framework.
* **Database:** MongoDB kết hợp với thư viện ODM Mongoose.
* **Real-time:** `socket.io` (Phiên bản 4.x).
* **Authentication & Security:** 
  * Cấp phát và quản lý phiên đăng nhập (Session) bằng **JWT (JSON Web Tokens)** lưu trữ an toàn trong HTTP-only Cookie. 
  * Giải mã và xác thực tài khoản qua Google bằng thư viện `google-auth-library` (`@react-oauth/google` phía Client).
  * Mã hóa mật khẩu bảo mật tuyệt đối với `bcryptjs`.
* **Media & Storage:** Tích hợp nền tảng **Cloudinary** (thông qua `cloudinary`, `multer`) để xử lý việc tải lên (upload) hình ảnh, video, tài liệu, và nén Zip an toàn trên đám mây CDN.

---

## Cấu Trúc Thư Mục Chính

* `index.js`: Điểm vào (Entry point). Khởi tạo Express, cài đặt CORS, định tuyến (Routing) và gắn kết Server Socket.
* `lib/`: Các mô-đun thiết lập kết nối lõi.
  * `db.js`: Khởi tạo và thiết lập kết nối MongoDB thông qua Mongoose.
  * `socket.js`: Xử lý logic Socket.IO (Khởi tạo kết nối, ánh xạ UserID với SocketID bằng `userSocketMap`, phát tín hiệu online/offline).
  * `cloudinary.js`: Cấu hình API key cho Cloudinary.
  * `utils.js`: Tiện ích tạo JWT và thiết lập Cookie xác thực.
* `models/`: Định nghĩa lược đồ dữ liệu (Schema) của MongoDB.
  * `user.model.js`: Hồ sơ người dùng (Email, Ảnh đại diện, Tên, ID Google).
  * `message.model.js`: Hồ sơ tin nhắn (Văn bản, File, Trạng thái đã xem, Phản hồi, Cuộc gọi).
* `routes/`: Định tuyến các API RESTful.
  * `auth.route.js`: APIs Đăng ký, Đăng nhập, Xác thực Google.
  * `message.route.js`: APIs tải lịch sử tin nhắn, Gửi tin nhắn mới, Cập nhật và Thu hồi tin nhắn.
  * `file.route.js`: APIs nén/giải nén thư mục Zip, tải tệp, tải lên Cloudinary.
* `controllers/`: Logic truy vấn Database cho từng Route.
* `middleware/`:
  * `auth.middleware.js`: Kiểm tra tính hợp lệ của Token trước khi cấp quyền truy cập các Route bảo mật.

---

## Kiến Trúc Socket & WebRTC Signaling

Backend không chỉ cung cấp RESTful APIs mà còn là "Trạm Trung Chuyển (Signaling Server)" cho WebRTC:
1. **Trạng Thái Giao Tiếp (Presence):** Gửi broadcast cập nhật danh sách người dùng trực tuyến.
2. **WebRTC Signaling:** Định tuyến tín hiệu ICE Candidates và Session Descriptions (Offer/Answer) trực tiếp giữa hai User đang kết nối.
3. **Đồng Bộ Dữ Liệu:** Đẩy các sự kiện `newMessage`, `messageEdited`, `messageRevoked` ngay lập tức đến các Client liên quan.

---

## Cấu Hình Môi Trường (Environment Variables)

Hãy tạo file `.env` ở thư mục gốc của `/server`:

```env
# Port chạy Server
PORT=5001

# Đường dẫn chuỗi kết nối MongoDB (Nên dùng MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat_db

# Chữ ký bảo mật JWT (Chuỗi bí mật tự chọn)
JWT_SECRET=your_super_secret_key_here

# Thông tin Cloudinary (Đăng nhập Cloudinary Dashboard để lấy thông tin)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URL Frontend (Dùng cho CORS)
CLIENT_URL=http://localhost:5173

# Google Auth Client ID (Cho tính năng đăng nhập Google)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Khởi Chạy

```bash
# Cài đặt thư viện
npm install

# Khởi chạy server ở chế độ tự động làm mới (Hot Reload với Nodemon)
npm run dev

# Hoặc chạy script tự động bằng Python
py run.py
```
