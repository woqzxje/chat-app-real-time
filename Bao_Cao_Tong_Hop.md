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
- [Phần V — Giải thích từng Module Backend](#phần-v--giải-thích-từng-module-backend)
- [Phần VI — Cấu trúc Frontend](#phần-vi--cấu-trúc-frontend)
- [Phần VII — Giải thích từng Module Frontend](#phần-vii--giải-thích-từng-module-frontend)
- [Phần VIII — Hướng dẫn Demo](#phần-viii--hướng-dẫn-demo)
- [Phần IX — Phân chia Công việc](#phần-ix--phân-chia-công-việc)
- [Phần X — Bài học & Kinh nghiệm rút ra](#phần-x--bài-học--kinh-nghiệm-rút-ra)

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

> Hệ thống cung cấp **40 RESTful APIs** và **9 sự kiện WebSocket** chính.

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

## Phần V — Giải thích từng Module Backend

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

- **`chat_with_ai`**: Gửi prompt + lịch sử hội thoại → `gemini-1.5-flash` → trả câu trả lời
- **`summarize_chat`**: Query 50 tin nhắn gần nhất → format hội thoại → Gemini tóm tắt ý chính

### 5.8 `email_service.py` — Gửi Email OTP

- Sử dụng **Brevo API** (HTTP/HTTPS port 443) — không bị chặn bởi tường lửa
- Template HTML email đẹp mắt với mã OTP 6 số
- Free plan: 300 email/ngày

---

## Phần VI — Cấu trúc Frontend

```text
client/
├── context/
│   ├── AuthContext.jsx       ← Quản lý trạng thái đăng nhập, người dùng và Socket.IO
│   ├── ChatContext.jsx       ← Quản lý State cốt lõi (tin nhắn, nhóm, bạn bè, online)
│   └── ThemeContext.jsx      ← Quản lý giao diện Sáng/Tối (Dark/Light mode)
├── src/
│   ├── components/
│   │   ├── ChatContainer.jsx ← Hiển thị luồng tin nhắn, gửi/nhận file, reaction
│   │   ├── SideBar.jsx       ← Sidebar trái: Danh sách bạn bè, tìm kiếm, nhóm chat
│   │   ├── RightSidebar.jsx  ← Sidebar phải: Info, media, tài liệu đã chia sẻ
│   │   ├── VideoCallModal.jsx← Logic và UI cuộc gọi Video ngang hàng (WebRTC)
│   │   ├── AIChatBot.jsx     ← Popup Chat với AI (Google Gemini)
│   │   └── ui/               ← Các component UI dùng chung (Button, Modal, Input...)
│   ├── pages/
│   │   ├── HomePage.jsx      ← Trang chính ứng dụng (gồm các Sidebar & ChatContainer)
│   │   ├── LoginPage.jsx     ← Trang Đăng nhập/Đăng ký (OTP, Google OAuth, Quên MK)
│   │   └── ProfilePage.jsx   ← Trang cập nhật thông tin cá nhân (Avatar, Bio)
│   └── App.jsx               ← Điều hướng Routes bảo vệ (Protected Routes)
```

---

## Phần VII — Giải thích từng Module Frontend

### 7.1 `AuthContext.jsx` — Quản lý Xác thực & Socket
- **State toàn cục**: Lưu trữ `authUser` sau khi đăng nhập thành công.
- **Xử lý đăng nhập/đăng ký**: Các hàm `login()`, `verifyRegistration()`, `googleLogin()` gọi API Backend, lấy JWT Token và lưu vào localStorage.
- **Quản lý Socket.IO**: Khi có `authUser`, tự động khởi tạo kết nối `io()` duy nhất đến Server. Ngắt kết nối khi đăng xuất.

### 7.2 `ChatContext.jsx` — Trái tim của ứng dụng Chat
- **Quản lý Messages**: Lưu trữ mảng `messages`, xử lý các hàm `sendMessage()`, `deleteMessage()`, `reactToMessage()`.
- **Lắng nghe sự kiện (Listeners)**: Sử dụng `useEffect` để lắng nghe các emit từ Socket.IO như `receiveMessage`, `messageDeleted`, `messageReacted`, `messagesSeenUpdate` để cập nhật UI tức thời mà không cần load lại trang.
- **Bạn bè & Nhóm**: Quản lý danh sách online `onlineUsers`, kết bạn, tạo nhóm, thêm thành viên.

### 7.3 `ChatContainer.jsx` — Khung hiển thị Tin nhắn chính
- **Render luồng tin nhắn**: Lặp qua mảng `messages` hiển thị giao diện bên trái (người khác) và bên phải (bản thân).
- **Auto-scroll thông minh**: Tự động cuộn xuống tin nhắn mới nhất bằng `useRef` và `scrollIntoView()`.
- **Đa phương tiện**: Hỗ trợ xem trước (preview) hình ảnh, tải xuống file, và hiển thị cấu trúc folder gửi đi/nhận lại.
- **Context Menu**: Click chuột phải / Long-press (trên điện thoại) để Thu hồi, Chỉnh sửa, hoặc Thả cảm xúc.

### 7.4 Các Sidebars (`SideBar.jsx` & `RightSidebar.jsx`)
- **SideBar**: Nơi tìm kiếm người dùng (so khớp tiếng Việt không dấu). Chuyển đổi giữa chat 1-1 và Group Chat. Nhận thông báo lời mời kết bạn tức thời.
- **RightSidebar**: Nơi tập hợp các File / Ảnh đã gửi trong nhóm. Hiển thị danh sách thành viên nhóm và tùy chọn quản lý (Kích, Rời nhóm, Giải tán).

### 7.5 `VideoCallModal.jsx` — Video Call P2P
- Sử dụng thư viện `simple-peer` thiết lập luồng WebRTC.
- Giao tiếp qua lại các tín hiệu SDP/ICE Candidate thông qua Socket.IO.
- Quản lý 2 luồng: `localStream` (Camera/Mic của mình) và `remoteStream` (của đối phương).

### 7.6 `LoginPage.jsx` — Cửa ngõ bảo mật
- Sử dụng **Framer Motion** để tạo hiệu ứng 3D mượt mà.
- Các biểu mẫu Đăng ký/Đăng nhập dùng chung một trang (Single Page).
- Gọi các Modals nhập OTP và Quên mật khẩu.

---

## Phần VIII — Hướng dẫn Demo

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

## Phần IX — Phân chia Công việc

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

## Phần X — Bài học & Kinh nghiệm rút ra

Sau quá trình thiết kế, phát triển và hoàn thiện dự án ChatITC, nhóm đã đúc kết được nhiều bài học và kinh nghiệm quý báu:

### 1. Kiến thức Chuyên môn (Technical Skills)
- **Hiểu sâu về Real-time Communication**: Nắm vững cơ chế hoạt động của WebSocket (`Socket.IO`), cách xử lý đồng bộ trạng thái (state) giữa Server và nhiều Client cùng lúc, khắc phục tình trạng mất kết nối hoặc xử lý hàng đợi sự kiện.
- **Làm chủ WebRTC**: Hiểu rõ luồng trao đổi SDP (Session Description Protocol) và ICE Candidates để thiết lập kết nối ngang hàng (P2P) cho tính năng Video Call, cũng như vai trò của STUN/TURN server trong việc vượt NAT/Firewall.
- **Tối ưu hóa Backend & Cơ sở dữ liệu**: Áp dụng kiến trúc xử lý bất đồng bộ (Asynchronous) toàn diện với `FastAPI` và `Motor` giúp xử lý số lượng lớn kết nối đồng thời. Làm quen với tư duy thiết kế schema NoSQL (`MongoDB`) tối ưu cho ứng dụng nhắn tin.
- **Xử lý luồng File phức tạp**: Trải nghiệm thực tế với việc stream file trực tiếp, nén thư mục "on-the-fly" ngay trên RAM server (Memory Stream) thay vì ghi rác xuống ổ cứng, giúp tối ưu hiệu năng và tài nguyên.
- **Tích hợp Service bên thứ ba**: Kinh nghiệm làm việc thực chiến với các hệ sinh thái bên ngoài như Cloudinary (lưu trữ CDN), Google OAuth (xác thực đa nền tảng), Brevo (gửi email OTP) và Google Gemini API (tích hợp AI Agent).

### 2. Kỹ năng Mềm (Soft Skills) & Quản lý Dự án
- **Kỹ năng làm việc nhóm (Teamwork)**: Áp dụng việc phân tách module rõ ràng (Frontend - Backend), rèn luyện giao tiếp để thống nhất chuẩn API (API Contracts) và cấu trúc payload gửi qua Socket trước khi code.
- **Giải quyết vấn đề (Problem Solving)**: Đối mặt và giải quyết các lỗi khó như xử lý bất đồng bộ trong real-time (race conditions), quản lý luồng media khi gọi video (tránh memory leak), tối ưu responsive và độ tương thích giao diện trên các thiết bị di động.
- **Tư duy hướng người dùng (UX/UI)**: Rèn luyện thói quen đặt mình vào vị trí người dùng để tinh chỉnh các vi tương tác (micro-interactions), xử lý các edge-case như tự động cuộn (auto-scroll) thông minh, giữ trạng thái tin nhắn chưa đọc, phản hồi thao tác nhanh.
- **Quản lý Source code**: Làm quen với quy trình sử dụng Git/GitHub để quản lý version (Version Control), hợp nhất code (merge) và kiểm soát xung đột (conflict) giữa các thành viên.

---

<div align="center">

*Tài liệu được biên soạn phục vụ báo cáo & bảo vệ đồ án.*

</div>
