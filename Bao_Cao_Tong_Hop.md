<div align="center">

# 📊 BÁO CÁO TỔNG HỢP DỰ ÁN CHATITC

**Ứng dụng Nhắn tin Thời gian thực Đa nền tảng**

*Kiến trúc Client-Server | React 19 + FastAPI | MongoDB | WebRTC | AI Gemini*

---

</div>

## 📋 Mục lục

- [Phần I — Tổng quan & Tính năng](#phần-i--tổng-quan--tính-năng)
- [Phần II — Công nghệ Áp dụng](#phần-ii--công-nghệ-áp-dụng)
- [Phần III — Danh sách API & Socket Events](#phần-iii--danh-sách-api--socket-events)
- [Phần IV — Cấu trúc Backend](#phần-iv--cấu-trúc-backend)
- [Phần V — Giải thích từng Module](#phần-v--giải-thích-từng-module)
- [Phần VI — Hướng dẫn Demo](#phần-vi--hướng-dẫn-demo)
- [Phần VII — Phân chia Công việc](#phần-vii--phân-chia-công-việc)

---

## Phần I — Tổng quan & Tính năng

### 1.1 Kiến trúc Hệ thống

Dự án được phân tách thành **hai phần độc lập**:

| Thành phần | Công nghệ | Vai trò |
|:---|:---|:---|
| **Client (Frontend)** | React 19, Vite, TailwindCSS 4, Framer Motion | SPA giao tiếp qua HTTP (Axios) & WebSocket (Socket.IO) |
| **Server (Backend)** | Python 3, FastAPI, Uvicorn, python-socketio | API bất đồng bộ + Real-time Socket, MongoDB (Beanie ODM) |

### 1.2 Các tính năng đã hoàn thiện

#### 🔐 Xác thực & Phân quyền
- **Đăng ký / Đăng nhập truyền thống** — Mật khẩu mã hóa Bcrypt, xác thực OTP 6 số qua email (Brevo API)
- **Đăng nhập Google OAuth 2.0** — Đăng nhập nhanh qua tài khoản Google
- **Quên mật khẩu** — Gửi mã OTP qua email để đặt lại mật khẩu mới
- **Bảo mật phiên** — Quản lý bằng JSON Web Token (JWT)

#### 👥 Hệ thống Bạn bè
- Tìm kiếm người dùng theo tên/email (hỗ trợ tiếng Việt không dấu)
- Gửi / Chấp nhận / Từ chối kết bạn — thông báo **real-time**
- Hủy kết bạn, theo dõi trạng thái online/offline

#### 💬 Nhắn tin Thời gian thực
- Nhắn tin tức thời không độ trễ qua WebSocket
- **Read Receipts** — "Đã gửi" → "Đã xem" cập nhật real-time
- **Thu hồi tin nhắn (Soft Delete)** — Giữ khung "Tin nhắn đã bị thu hồi"
- **Chỉnh sửa tin nhắn** — Cập nhật nội dung đã gửi
- **Thả cảm xúc (Reaction)** — React emoji lên từng tin nhắn
- **Báo cáo tin nhắn** — Report vi phạm, Admin xử lý & cấm chat
- **Smart Auto-Scroll** — Tự cuộn thông minh, tối ưu cho mobile

#### 👥 Chat Nhóm
- Tạo nhóm, mời bạn bè vào phòng chat chung
- Trưởng nhóm: thêm/kích thành viên, đổi tên/avatar nhóm
- Rời nhóm / Giải tán nhóm

#### 📁 Chia sẻ Tệp đa phương tiện
- Upload ảnh/file (nén ảnh phía Client → Cloudinary CDN)
- Upload thư mục — giữ nguyên cấu trúc cây folder
- Download thư mục — **Zip on-the-fly** (nén ZIP trên RAM Server, không tạo rác ổ cứng)

#### 📹 Gọi Video P2P (WebRTC)
- Kết nối ngang hàng Peer-to-Peer, độ trễ thấp nhất
- STUN/TURN Server — vượt tường lửa/NAT trên mọi mạng
- Thu nhỏ khung gọi, vừa gọi vừa nhắn tin
- Lưu lịch sử "Cuộc gọi đã kết thúc" kèm thời lượng

#### 🤖 Trí tuệ Nhân tạo (Google Gemini)
- **AI Chatbot** — Trợ lý ảo hướng dẫn sử dụng ứng dụng
- **Tóm tắt hội thoại** — Tóm tắt 50 tin nhắn gần nhất

#### 🎨 Giao diện & UI/UX
- Dark/Light Mode + Glassmorphism (kính mờ, Neon Cyan/Orange)
- Responsive Mobile-First (`100dvh`, Smart Auto-Scroll)
- Micro-interactions: Framer Motion, context menu, long-press

#### 🛡️ Quản trị (Admin)
- Bảng điều khiển xem danh sách báo cáo vi phạm
- Cấm chat người dùng (ban) theo thời hạn
- Gỡ cấm chat

---

## Phần II — Công nghệ Áp dụng

### Frontend (Client)

| Loại | Công nghệ |
|:---|:---|
| Core | React 19, Vite |
| Styling/UI | Tailwind CSS 4, Framer Motion, Radix UI |
| API & Socket | Axios, Socket.IO-client |
| Xác thực | `@react-oauth/google` |
| Đa phương tiện | WebRTC (`simple-peer`) |

### Backend (Server)

| Loại | Công nghệ |
|:---|:---|
| Core | Python 3, FastAPI, Uvicorn |
| Database | MongoDB Atlas, Motor (Async driver), Beanie (ODM) |
| Real-time | `python-socketio` |
| Bảo mật | Bcrypt, PyJWT |
| Dịch vụ bên thứ 3 | Cloudinary API, Google Gemini API, Brevo Email API |

---

## Phần III — Danh sách API & Socket Events

> Hệ thống cung cấp **35 RESTful APIs** và **9 sự kiện WebSocket** chính.

### 3.1 REST API Endpoints

#### 🔐 Auth & User — `/api/auth` (`user_routes.py`)

| # | Method | Endpoint | Chức năng |
|:---:|:---:|:---|:---|
| 1 | `POST` | `/signup` | Đăng ký tài khoản (gửi OTP) |
| 2 | `POST` | `/verify-registration` | Xác thực mã OTP đăng ký |
| 3 | `POST` | `/login` | Đăng nhập thường |
| 4 | `POST` | `/google-login` | Đăng nhập Google OAuth |
| 5 | `POST` | `/forgot-password` | Gửi OTP khôi phục mật khẩu |
| 6 | `POST` | `/reset-password` | Đặt lại mật khẩu mới |
| 7 | `GET` | `/check` | Kiểm tra token & lấy user hiện tại |
| 8 | `GET` | `/search?q=...` | Tìm kiếm người dùng |
| 9 | `PUT` | `/update-profile` | Cập nhật thông tin/avatar |
| 10 | `POST` | `/send-friend-request` | Gửi lời mời kết bạn |
| 11 | `POST` | `/accept-friend-request` | Chấp nhận kết bạn |
| 12 | `POST` | `/reject-friend-request` | Từ chối kết bạn |
| 13 | `POST` | `/unfriend` | Hủy kết bạn |
| 14 | `GET` | `/friend-requests` | Danh sách lời mời kết bạn |
| 15 | `POST` | `/toggle-archive` | Lưu trữ / bỏ lưu trữ hội thoại |
| 16 | `POST` | `/unban/{user_id}` | Gỡ cấm chat (Admin) |

#### 💬 Messages — `/api/messages` (`message_routes.py`)

| # | Method | Endpoint | Chức năng |
|:---:|:---:|:---|:---|
| 17 | `GET` | `/users` | Danh sách sidebar (bạn bè + người lạ đã chat) |
| 18 | `GET` | `/{id}` | Lịch sử đoạn chat |
| 19 | `PUT` | `/mark/{id}` | Đánh dấu đã xem |
| 20 | `POST` | `/send/{id}` | Gửi tin nhắn mới |
| 21 | `PUT` | `/edit/{id}` | Chỉnh sửa tin nhắn |
| 22 | `PUT` | `/revoke/{id}` | Thu hồi tin nhắn (Soft Delete) |
| 23 | `POST` | `/react/{id}` | Thả biểu tượng cảm xúc |
| 24 | `POST` | `/groups/create` | Tạo nhóm mới |
| 25 | `POST` | `/groups/{id}/add-members` | Thêm thành viên vào nhóm |
| 26 | `PUT` | `/groups/{id}/update` | Cập nhật thông tin nhóm |
| 27 | `PUT` | `/groups/{id}/kick` | Kích thành viên ra khỏi nhóm |
| 28 | `PUT` | `/groups/{id}/leave` | Rời khỏi nhóm |
| 29 | `DELETE` | `/groups/{id}` | Giải tán nhóm |
| 30 | `GET` | `/groups/{id}/members` | Danh sách thành viên nhóm |

#### 📁 Files — `/api/files` (`file_routes.py`)

| # | Method | Endpoint | Chức năng |
|:---:|:---:|:---|:---|
| 31 | `POST` | `/upload` | Upload file lẻ |
| 32 | `POST` | `/upload-folder` | Upload thư mục |
| 33 | `GET` | `/download` | Download file (Proxy stream) |
| 34 | `POST` | `/download-folder` | Download folder (ZIP on-the-fly) |

#### 🛡️ Reports — `/api/reports` (`report_routes.py`)

| # | Method | Endpoint | Chức năng |
|:---:|:---:|:---|:---|
| 35 | `POST` | `/` | Báo cáo tin nhắn vi phạm |
| 36 | `GET` | `/` | Danh sách báo cáo (Admin) |
| 37 | `POST` | `/{id}/ban` | Cấm chat theo báo cáo (Admin) |
| 38 | `POST` | `/{id}/cancel` | Hủy báo cáo (Admin) |

#### 🤖 AI — `/api/ai` (`ai_routes.py`)

| # | Method | Endpoint | Chức năng |
|:---:|:---:|:---|:---|
| 39 | `POST` | `/chat` | Chat với AI Chatbot |
| 40 | `GET` | `/summarize/{target_id}` | Tóm tắt 50 tin nhắn gần nhất |

### 3.2 Socket.IO Events — `socket_manager.py`

| # | Event (Client → Server) | Chức năng |
|:---:|:---|:---|
| 1 | `connect` | Kết nối vào hệ thống (gửi kèm userId) |
| 2 | `disconnect` | Ngắt kết nối |
| 3 | `markMessagesSeen` | Báo đã xem tin nhắn khi mở khung chat |
| 4 | `video:initiate` | Bắt đầu gọi Video/Voice |
| 5 | `video:offer` | Gửi SDP WebRTC (Người gọi) |
| 6 | `video:answer` | Trả lời SDP (Người nghe) |
| 7 | `video:ice-candidate` | Gửi ICE candidate (thiết lập P2P) |
| 8 | `video:end` | Kết thúc cuộc gọi |
| 9 | `video:reject` | Từ chối cuộc gọi |

> **Server → Client Events:** `getOnlineUsers`, `receiveMessage`, `messageDeleted`, `messageEdited`, `messageReacted`, `messagesSeenUpdate`, `newFriendRequest`, `friendRequestAccepted`, `userUpdated`, `newUserRegistered`, `groupCreated`, `groupUpdated`, `removedFromGroup`, `groupDissolved`, `video:incoming`, `video:offer`, `video:answer`, `video:ice-candidate`, `video:ended`, `video:rejected`, `userBanned`...

---

## Phần IV — Cấu trúc Backend

```
server/
├── main.py                    ← Entry point: FastAPI + Socket.IO ASGI
├── run.py                     ← Script khởi chạy Uvicorn (dev mode)
├── .env                       ← Biến môi trường bảo mật
├── requirements.txt           ← Danh sách thư viện Python
└── app/
    ├── database.py            ← Kết nối MongoDB (Motor + Beanie)
    ├── models.py              ← Schema: User, Message, ChatGroup, Report
    ├── dependencies.py        ← JWT Middleware (bảo vệ API)
    ├── socket_manager.py      ← Real-time & WebRTC Signaling
    ├── cloudinary_client.py   ← Cấu hình Cloudinary SDK
    ├── email_service.py       ← Gửi email OTP (Brevo HTTP API)
    ├── utils.py               ← Hàm tiện ích (generate_token)
    └── routes/                ← Controllers (5 file)
        ├── user_routes.py     ← Auth, bạn bè, profile
        ├── message_routes.py  ← Chat, nhóm, reaction, thu hồi
        ├── file_routes.py     ← Upload/Download file & folder
        ├── ai_routes.py       ← AI Chatbot & tóm tắt
        └── report_routes.py   ← Báo cáo & cấm chat
```

---

## Phần V — Giải thích từng Module

### 5.1 `main.py` — Trái tim Backend

| Thành phần | Giải thích |
|:---|:---|
| `lifespan` | Gọi hàm kết nối DB ngay khi server khởi động |
| `CORSMiddleware` | Cho phép Frontend (domain khác) gọi API không bị lỗi CORS |
| `app.include_router()` | Đăng ký các nhóm API (Users, Messages, Files, AI, Reports) |
| `socketio.ASGIApp` | Bọc FastAPI + Socket.IO thành 1 app ASGI duy nhất chạy chung port |

### 5.2 `database.py` & `models.py` — Database Layer

- **`database.py`**: Dùng `AsyncIOMotorClient` kết nối MongoDB Atlas, gọi `init_beanie` đăng ký ODM
- **`models.py`**: Định nghĩa Schema — `User` (email, password, friends...), `Message` (senderId, receiverId, isSeen, isDeleted, reactions...), `ChatGroup` (name, adminId, members...), `Report` (reportedId, reason, status...)

> 💡 *"Dùng Beanie ODM trên nền Motor async — khác PyMongo blocking, giúp FastAPI xử lý hàng ngàn request đồng thời mà không bị treo khi đợi DB."*

### 5.3 `socket_manager.py` — Trạm điều phối Real-time

- **`user_socket_map`** (Dict): Lưu cặp `{userId: socketId}` → khi A gửi tin cho B, tra map lấy socketId của B để đẩy dữ liệu thẳng
- `connect` / `disconnect`: Quản lý danh sách online, emit `getOnlineUsers`
- `video:*` events: Trung gian luân chuyển SDP/ICE để 2 trình duyệt tự thiết lập P2P (WebRTC)
- `video:end`: Lưu tin nhắn lịch sử cuộc gọi vào Database

### 5.4 `user_routes.py` — Auth & Bạn bè

- **`signup`**: Tạo OTP → gửi email (Brevo) → chờ xác thực
- **`verify-registration`**: Kiểm tra OTP → xác thực → cấp JWT Token
- **`google_login`**: Verify `id_token` với Google → tạo/đăng nhập tự động
- **`forgot-password`**: Tạo OTP mới → gửi email khôi phục
- **`send_friend_request`**: Đẩy ID vào mảng `friendRequests` + Socket emit real-time

### 5.5 `message_routes.py` — Chat & Nhóm

- **`get_users_for_sidebar`**: Ghép danh sách bạn bè + người lạ đã chat, đếm tin chưa đọc
- **`revoke_message`** (Soft Delete): `isDeleted = True`, xóa nội dung nhưng giữ record
- **`react_message`** (Toggle): Bấm lần 2 = hủy, bấm emoji khác = ghi đè
- **Group Management**: CRUD nhóm, quản lý mảng `members`, đồng bộ real-time qua Socket

### 5.6 `file_routes.py` — Upload/Download

- **Upload**: Gọi `cloudinary.uploader.upload()` → lấy URL gắn vào Message
- **Download** (Proxy): Backend dùng `httpx` tải file từ Cloudinary → `StreamingResponse` + header `Content-Disposition: attachment`
- **Download Folder** (Zip on-the-fly): Tạo `io.BytesIO()` → nén ZIP trên RAM → stream về Client

> 💡 *"Thay vì lưu tạm xuống ổ cứng server, xử lý nén ZIP trực tiếp trên RAM (Memory Stream) giúp hệ thống nhẹ gọn và an toàn hơn."*

### 5.7 `ai_routes.py` — Tích hợp AI

- **`chat_with_ai`**: Gửi prompt + lịch sử hội thoại → `gemini-2.5-flash` → trả câu trả lời
- **`summarize_chat`**: Query 50 tin nhắn gần nhất → format hội thoại → Gemini tóm tắt ý chính

### 5.8 `email_service.py` — Gửi Email OTP

- Sử dụng **Brevo API** (HTTP/HTTPS port 443) — không bị chặn bởi tường lửa
- Template HTML email đẹp mắt với mã OTP 6 số
- Free plan: 300 email/ngày

---

## Phần VI — Hướng dẫn Demo

> Khi giảng viên yêu cầu demo, thực hiện theo quy trình sau:

### Chuẩn bị
Mở **2 trình duyệt** (hoặc 1 cửa sổ thường + 1 ẩn danh) đại diện cho **User A** và **User B**.

### Quy trình Demo

| Bước | Thao tác | Điểm nhấn |
|:---:|:---|:---|
| 1 | **Đăng ký** tài khoản mới → Nhập mã OTP từ email | Xác thực OTP 6 số, email gửi qua Brevo API |
| 2 | Trình duyệt kia **Đăng nhập Google** | OAuth 2.0 — không cần password |
| 3 | Tìm kiếm → **Gửi lời mời kết bạn** | User B nhận thông báo **ngay lập tức** (Real-time) |
| 4 | **Nhắn tin** văn bản + emoji | Trạng thái "Đã gửi" → "Đã xem" tức thời |
| 5 | **Upload file/folder** → Bấm Download | Chứng minh Zip on-the-fly hoạt động |
| 6 | **Gọi Video Call** → Nhấc máy → Tắt máy | Tin nhắn lịch sử cuộc gọi tự lưu |
| 7 | **Thu hồi / Chỉnh sửa / Thả cảm xúc** | Context menu (chuột phải / long-press) |
| 8 | **Tạo nhóm chat** → Thêm thành viên | Quản lý nhóm đầy đủ |
| 9 | Bấm nút **AI Tóm tắt** hội thoại | Gemini xử lý 50 tin nhắn gần nhất |
| 10 | **Quên mật khẩu** → Nhập OTP → Đặt lại | Luồng khôi phục mật khẩu hoàn chỉnh |

---

## Phần VII — Phân chia Công việc

<table>
<tr>
<td width="50%">

### 👨‍💻 Mạnh Quỳnh
**Backend Developer & System Architect**

| Module | Chức năng |
|:---|:---|
| `main.py` & `socket_manager.py` | Kiến trúc Server, WebSocket, WebRTC Signaling |
| `database.py` & `models.py` | Thiết kế DB NoSQL, Beanie ODM, tối ưu truy vấn async |
| `message_routes.py` & `user_routes.py` | RESTful API, JWT, chat nhóm, kết bạn, auth OTP |
| `file_routes.py` & `ai_routes.py` | Cloudinary, ZIP on-the-fly, Gemini AI |
| `report_routes.py` & `email_service.py` | Hệ thống Admin, báo cáo, cấm chat, email OTP |

</td>
<td width="50%">

### 👨‍💻 Duy Khánh
**Frontend Developer & UI/UX Designer**

| Module | Chức năng |
|:---|:---|
| `ChatContainer.jsx` & `RightSidebar.jsx` | Giao diện nhắn tin, hiển thị đa phương tiện, nhóm chat |
| `SideBar.jsx` & `AuthContext.jsx` | Context API, tìm kiếm, Google OAuth login |
| `VideoCallModal.jsx` & WebRTC Logic | Gọi Video P2P, STUN/TURN Server |
| `LoginPage.jsx` & Modal Components | Giao diện đăng nhập, OTP, quên mật khẩu |
| UI/UX Design & Tailwind CSS | Dark Mode Glassmorphism, Mobile-first, animations |

</td>
</tr>
</table>

---

<div align="center">

*Tài liệu được biên soạn phục vụ báo cáo & bảo vệ đồ án.*

</div>
