# BÁO CÁO TỔNG HỢP DỰ ÁN CHAT APP

Dự án Chat App là một ứng dụng nhắn tin thời gian thực đa nền tảng, được xây dựng với kiến trúc Client-Server hiện đại, tập trung vào giao diện người dùng cực kỳ chau chuốt (Dark/Cyan Glassmorphism) và các tính năng giao tiếp đa phương tiện mạnh mẽ.

Dưới đây là tài liệu báo cáo toàn diện các chức năng hiện có của hệ thống cũng như tài liệu kỹ thuật chuyên sâu phục vụ cho việc bảo vệ đồ án/dự án.

---

## PHẦN I: TỔNG QUAN DỰ ÁN & CÁC TÍNH NĂNG CHÍNH

### 1. TỔNG QUAN VỀ KIẾN TRÚC HỆ THỐNG

Dự án được phân tách thành hai phần độc lập:
- **Client (Frontend):** Ứng dụng Single Page Application (SPA) xây dựng bằng React 19, Vite, TailwindCSS 4, Framer Motion. Quản lý trạng thái bằng Context API và giao tiếp với máy chủ thông qua HTTP Requests (Axios) và WebSockets (Socket.io-client).
- **Server (Backend):** Máy chủ API mạnh mẽ xây dựng bằng Python với framework FastAPI, xử lý bất đồng bộ toàn diện. Cổng giao tiếp thời gian thực được hỗ trợ bởi `python-socketio`. Cơ sở dữ liệu NoSQL MongoDB được thao tác thông qua Beanie ODM và Motor.

### 2. CÁC TÍNH NĂNG CHÍNH ĐÃ HOÀN THIỆN

#### 2.1 Xác thực & Phân quyền (Authentication)
- **Đăng ký / Đăng nhập truyền thống:** Bảo mật bằng mật khẩu được mã hóa băm (Bcrypt).
- **Đăng nhập Google OAuth 2.0:** Cho phép người dùng đăng nhập nhanh qua tài khoản Google mà không cần nhớ mật khẩu.
- **Bảo mật phiên đăng nhập:** Quản lý phiên bằng JSON Web Token (JWT).

#### 2.2 Hệ thống Bạn bè (Friend System)
- **Tìm kiếm người dùng:** Tìm kiếm bất kỳ ai trên hệ thống thông qua tên hoặc email.
- **Gửi / Chấp nhận / Từ chối kết bạn:** Các lời mời kết bạn được hiển thị thông báo thời gian thực.
- **Quản lý danh sách bạn bè:** Hủy kết bạn (Unfriend) và theo dõi trạng thái online/offline của bạn bè.

#### 2.3 Hệ thống Nhắn tin Thời gian thực (Real-time Chat)
- **Gửi tin nhắn siêu tốc:** Nhắn tin tức thời không có độ trễ qua WebSockets.
- **Trạng thái tin nhắn (Read Receipts):** Hiển thị trạng thái "Đã gửi" và chuyển sang "Đã xem" ngay khi đối phương mở khung chat.
- **Tương tác tin nhắn nâng cao:**
  - **Thu hồi tin nhắn (Soft Delete):** Xóa nội dung tin nhắn nhưng vẫn giữ khung thông báo "Tin nhắn đã bị thu hồi".
  - **Chỉnh sửa tin nhắn (Edit):** Cập nhật nội dung tin nhắn đã gửi.
  - **Thả cảm xúc (Reaction):** Cho phép thả biểu tượng cảm xúc lên từng tin nhắn riêng biệt.
  - **Báo cáo tin nhắn (Report):** Cho phép người dùng báo cáo các tin nhắn vi phạm, admin có thể xem lại lịch sử và thiết lập cấm chat người vi phạm (ban).
- **Tự động cuộn (Smart Auto-Scroll):** Thông minh tự cuộn xuống tin nhắn mới nhất, tối ưu cho thao tác di động.

#### 2.4 Chat Nhóm (Group Chat)
- **Tạo nhóm mới:** Mời bạn bè vào chung một phòng chat.
- **Quản lý thành viên:** Trưởng nhóm có quyền thêm thành viên mới hoặc kích (kick) thành viên ra khỏi nhóm.
- **Cập nhật thông tin nhóm:** Đổi tên nhóm và cập nhật hình đại diện nhóm.
- **Rời nhóm / Giải tán nhóm:** Cho phép tự rời đi, hoặc giải tán hoàn toàn nhóm nếu là trưởng nhóm.

#### 2.5 Chia sẻ Tệp đa phương tiện (Media & File Sharing)
- **Gửi hình ảnh/tệp tin lẻ:** Hỗ trợ tải lên ảnh hoặc tài liệu. Tích hợp nén ảnh ở phía Client để giảm băng thông trước khi đẩy lên Cloudinary.
- **Gửi thư mục (Folder Upload/Download):**
  - **Upload:** Tự động duyệt cây thư mục từ máy khách và tải toàn bộ lên mây.
  - **Download:** Tính năng *Zip on-the-fly* (nén trực tiếp trên RAM máy chủ) cho phép người dùng tải toàn bộ thư mục về dưới dạng 1 file `.zip` duy nhất, không tạo rác trên ổ cứng Server.

#### 2.6 Cuộc gọi Video (Video Call P2P - WebRTC)
- **Thiết lập kết nối ngang hàng (Peer-to-Peer):** Hình ảnh và âm thanh được truyền trực tiếp giữa 2 người dùng thông qua giao thức WebRTC, đảm bảo độ trễ thấp nhất.
- **Tích hợp STUN/TURN Server:** Đảm bảo cuộc gọi có thể vượt qua mọi tường lửa (Firewall) hoặc NAT trên các mạng 4G/Wifi công cộng.
- **Giao diện đa nhiệm:** Có thể thu nhỏ khung gọi video để vừa gọi vừa nhắn tin.
- **Lưu lịch sử cuộc gọi:** Tự động tạo bong bóng chat báo cáo "Cuộc gọi đã kết thúc" kèm thời lượng sau khi tắt máy.

#### 2.7 Giao diện & Trải nghiệm Người dùng (UI/UX)
- **Dark Mode & Glassmorphism:** Thiết kế sang trọng với nền tối, kính mờ và màu sắc Neon (Cyan/Orange) nổi bật. Tùy chọn chuyển đổi qua Light Mode thông qua nút gạt độc đáo.
- **Responsive Mobile-First:** Giao diện co giãn hoàn hảo trên các thiết bị di động, không bị tràn viền (h-[100dvh]).
- **Micro-interactions:** Hiệu ứng hover, click, thả tim được bổ sung mượt mà bằng Framer Motion. Menu ngữ cảnh (Right-click / Long-press trên mobile) giúp tương tác với tin nhắn tự nhiên như ứng dụng Native.

#### 2.8 Trợ lý ảo AI & Tóm tắt tin nhắn (AI Features)
- **Trợ lý ảo thông minh (AI Chatbot):** Tích hợp Google Gemini hoạt động như một trợ lý ảo, hướng dẫn người dùng mới cách sử dụng các tính năng của ứng dụng (nhắn tin, tạo nhóm, gọi video) một cách thân thiện.
- **Tóm tắt hội thoại (Chat Summarization):** Tự động đọc và tóm tắt 50 tin nhắn gần nhất, giúp người dùng nhanh chóng nắm bắt các ý chính và quyết định trong nhóm chat hoặc đoạn hội thoại cá nhân mà không cần phải cuộn lên xem lại.

### 3. THÔNG SỐ CÔNG NGHỆ ÁP DỤNG

#### Frontend (Client)
- **Core:** React 19, Vite.
- **Styling/UI:** Tailwind CSS 4, Framer Motion, Radix UI.
- **Kết nối API & Socket:** Axios, Socket.io-client.
- **Xác thực:** `@react-oauth/google`.
- **Đa phương tiện:** WebRTC (Simple-Peer).

#### Backend (Server)
- **Core:** Python 3, FastAPI, Uvicorn.
- **Database:** MongoDB, Motor (Async driver), Beanie (ODM).
- **Kết nối Socket:** `python-socketio`.
- **Bảo mật:** Bcrypt, PyJWT.
- **Dịch vụ bên thứ ba:** Cloudinary API (lưu trữ ảnh/file), Google Gemini API (Tích hợp AI).

---

## PHẦN II: TÀI LIỆU KỸ THUẬT CHUYÊN SÂU & KIẾN TRÚC BACKEND

Tài liệu này được biên soạn chi tiết giúp bạn tự tin trả lời các câu hỏi phản biện của giảng viên liên quan đến cấu trúc, chức năng và công nghệ Backend của dự án Chat App.

### 1. Hướng Dẫn Demo & Trình Bày Code
Khi giảng viên yêu cầu demo, hãy thực hiện theo quy trình sau để thể hiện sự mượt mà và logic của hệ thống:

1. **Chuẩn bị:** Mở 2 trình duyệt khác nhau (hoặc 1 cửa sổ thường, 1 cửa sổ ẩn danh) đại diện cho 2 người dùng (User A và User B).
2. **Demo luồng Auth (Xác thực):** 
   - Đăng ký 1 tài khoản mới theo cách truyền thống.
   - Trình duyệt kia Đăng nhập bằng tài khoản Google (OAuth2).
3. **Demo luồng Bạn bè:** 
   - Thực hiện tìm kiếm theo tên -> Bấm "Thêm bạn bè". 
   - *Nhấn mạnh:* Bên phía User B nhận được lời mời kết bạn **ngay lập tức** (Real-time) mà không cần tải lại trang. Bấm chấp nhận.
4. **Demo Chat (Real-time):** 
   - Nhắn tin văn bản, gửi Emoji. 
   - *Nhấn mạnh:* Trạng thái tin nhắn chuyển từ "Đã gửi" sang "Đã xem" tức thời khi đối phương đang mở khung chat.
5. **Demo tính năng File/Thư mục (Điểm cộng lớn):** 
   - Upload 1 hình ảnh đính kèm. Upload 1 folder đính kèm. 
   - Bấm nút Download (Tải xuống) để chứng minh chức năng Stream tải file hoạt động tốt.
6. **Demo Call (WebRTC):** 
   - Bấm nút gọi Video Call -> Nhấc máy -> Tắt máy. 
   - Hiển thị thông báo "Cuộc gọi đã kết thúc..." lưu lại dưới dạng tin nhắn trong khung chat.
7. **Demo tính năng phụ trợ:** 
   - Thu hồi tin nhắn (Soft delete), Chỉnh sửa nội dung tin nhắn đã gửi, Thả biểu tượng cảm xúc (React) trên tin nhắn.

### 2. Danh sách chính xác các API & Socket Events
Hệ thống Backend cung cấp tổng cộng **31 RESTful APIs** và **9 sự kiện WebSockets (Socket.IO)** do Client gửi lên để xử lý real-time. Dưới đây là danh sách chính xác trích xuất từ mã nguồn để bạn đưa vào báo cáo:

#### 2.1. Nhóm REST API (31 Endpoints)

**Nhóm Auth & User (`/api/auth`) - Chứa trong file `app/routes/user_routes.py`:**
- `POST /api/auth/signup`: Đăng ký tài khoản (Dòng 67)
- `POST /api/auth/login`: Đăng nhập thường (Dòng 104)
- `POST /api/auth/google-login`: Đăng nhập Google (Dòng 127)
- `GET /api/auth/check`: Kiểm tra token & lấy thông tin user hiện tại (Dòng 174)
- `GET /api/auth/search`: Tìm kiếm người dùng (Dòng 294)
- `PUT /api/auth/update-profile`: Cập nhật thông tin/Avatar (Dòng 308)
- `POST /api/auth/send-friend-request`: Gửi lời mời kết bạn (Dòng 185)
- `POST /api/auth/accept-friend-request`: Chấp nhận kết bạn (Dòng 214)
- `POST /api/auth/reject-friend-request`: Từ chối kết bạn (Dòng 245)
- `POST /api/auth/unfriend`: Hủy kết bạn (Dòng 255)
- `GET /api/auth/friend-requests`: Lấy danh sách lời mời kết bạn (Dòng 279)

**Nhóm Messages (`/api/messages`) - Chứa trong file `app/routes/message_routes.py`:**
- `GET /api/messages/users`: Lấy danh sách sidebar (bạn bè & người lạ đã chat) (Dòng 52)
- `GET /api/messages/{id}`: Lấy lịch sử đoạn chat (Dòng 104)
- `PUT /api/messages/mark/{id}`: Đánh dấu tin nhắn đã xem (Dòng 143)
- `POST /api/messages/send/{id}`: Gửi tin nhắn mới (Dòng 161)
- `PUT /api/messages/edit/{id}`: Chỉnh sửa tin nhắn (Dòng 199)
- `PUT /api/messages/revoke/{id}`: Thu hồi tin nhắn (Soft delete) (Dòng 231)
- `POST /api/messages/react/{id}`: Thả biểu tượng cảm xúc (Dòng 264)
- `POST /api/messages/groups/create`: Tạo nhóm mới (Dòng 380)
- `GET /api/messages/groups/{id}/members`: Lấy danh sách thành viên nhóm (Dòng 648)
- `POST /api/messages/groups/{id}/add-members`: Thêm thành viên vào nhóm (Dòng 424)
- `PUT /api/messages/groups/{id}/update`: Cập nhật thông tin nhóm (Tên, Avatar) (Dòng 594)
- `PUT /api/messages/groups/{id}/kick`: Quản trị viên kích thành viên ra khỏi nhóm (Dòng 685)
- `PUT /api/messages/groups/{id}/leave`: Tự rời khỏi nhóm (Dòng 484)
- `DELETE /api/messages/groups/{id}`: Giải tán nhóm (Dòng 563)

**Nhóm Files (`/api/files`) - Chứa trong file `app/routes/file_routes.py`:**
- `POST /api/files/upload`: Upload 1 file lẻ (Dòng 38)
- `POST /api/files/upload-folder`: Upload 1 folder đính kèm (Dòng 77)
- `GET /api/files/download`: Download file (Proxy stream) (Dòng 142)
- `POST /api/files/download-folder`: Download folder (Stream nén ZIP) (Dòng 189)

**Nhóm Reports (`/api/reports`) - Chứa trong file `app/routes/report_routes.py`:**
- `POST /api/reports`: Báo cáo tin nhắn vi phạm.
- `GET /api/reports`: Lấy danh sách báo cáo (Chỉ dành cho Admin).
- `POST /api/reports/{id}/ban`: Cấm người dùng dựa trên báo cáo (Chỉ dành cho Admin).
- `POST /api/reports/{id}/cancel`: Hủy báo cáo (Chỉ dành cho Admin).

**Nhóm AI Integration (`/api/ai`) - Chứa trong file `app/routes/ai_routes.py`:**
- `POST /api/ai/chat`: Giao tiếp với AI Chatbot hướng dẫn người dùng (Dòng 20)
- `GET /api/ai/summarize/{target_id}`: Tóm tắt 50 tin nhắn gần nhất bằng Gemini (Dòng 48)

*(Lưu ý: Không có API HTTP nào cho Video Call vì chức năng đó chạy 100% qua Socket)*

#### 2.2. Nhóm Socket.IO Events (9 Sự kiện Client gửi lên)
**Toàn bộ sự kiện Socket được xử lý tại file `app/socket_manager.py`:**
- `connect`: Kết nối vào hệ thống (gửi kèm userId) (Dòng 33)
- `disconnect`: Ngắt kết nối (Dòng 50)
- `markMessagesSeen`: Báo cáo đã xem tin nhắn khi đang mở sẵn khung chat (Dòng 63)
- `video:initiate`: Bắt đầu gọi Video/Voice (Dòng 89)
- `video:offer`: Gửi cấu hình SDP WebRTC (Người gọi) (Dòng 105)
- `video:answer`: Trả lời cấu hình SDP (Người nghe) (Dòng 120)
- `video:ice-candidate`: Gửi thông cấu hình mạng để thiết lập P2P (Dòng 134)
- `video:end`: Kết thúc cuộc gọi (Dòng 148)
- `video:reject`: Từ chối cuộc gọi (Dòng 194)

*(Và kèm theo rất nhiều sự kiện Server phát ngược lại Client như: `getOnlineUsers`, `receiveMessage`, `messageDeleted`... để cập nhật giao diện)*

### 3. Cấu Trúc Folder Backend (Giải thích từ ngoài vào trong)
Backend được xây dựng theo kiến trúc FastAPI kết hợp với Real-time Socket.

- **Các file cấu hình bên ngoài:** 
  - `main.py`: Trái tim của Backend, file khởi chạy server FastAPI, gắn các middleware và cấu hình Socket.IO.
  - `run.py`: Script khởi chạy Uvicorn server (dev mode với hot reload).
  - `.env`: Chứa các biến môi trường bảo mật (URL kết nối MongoDB, API Key của Cloudinary, Google Client ID...).
  - `requirements.txt`: Chứa danh sách các gói thư viện Python cần thiết (fastapi, motor, beanie, bcrypt...).
- **Thư mục lõi `app/` (Chứa logic xử lý chính):**
  - `database.py`: Chịu trách nhiệm kết nối đến MongoDB (Motor + Beanie ODM).
  - `models.py`: Chứa các Schema định nghĩa cấu trúc dữ liệu lưu trong DB (User, Message, ChatGroup, Report).
  - `dependencies.py`: File chứa middleware xác thực (chặn API nếu chưa có hoặc sai JWT Token).
  - `socket_manager.py`: Bộ não xử lý real-time, nắm giữ danh sách người dùng online và điều phối tín hiệu cuộc gọi (WebRTC).
  - `cloudinary_client.py`: Cấu hình Cloudinary SDK.
  - `email_service.py`: Dịch vụ gửi email.
  - `utils.py`: Hàm tiện ích.
  - **Thư mục `routes/` (Controllers):** Nơi định nghĩa các endpoint API và logic nghiệp vụ, chia làm 5 file: `user_routes.py`, `message_routes.py`, `file_routes.py`, `ai_routes.py`, `report_routes.py`.

### 4. Giải thích sâu từng Source File 
*(Đây là phần để bạn trả lời khi giảng viên chỉ định hỏi 1 file bất kỳ)*

#### 4.1. File `main.py`
- **Tính năng:** Khởi tạo ứng dụng FastAPI, cấu hình luồng chạy, bảo mật CORS, và tích hợp Socket.IO chạy chung trên 1 port.
- **Logic code:**
  - Khởi tạo hàm `lifespan`: Gọi hàm kết nối DB ngay khi server vừa bật lên.
  - Gắn `CORSMiddleware`: Cho phép Frontend (chạy ở domain/port khác) được phép gọi API mà không bị trình duyệt chặn lỗi CORS.
  - Khai báo `app.include_router()`: Đăng ký các nhóm API (Users, Messages, Files) vào đường dẫn gốc.
  - Cuối file: Bọc ứng dụng FastAPI và Socket.IO bằng `socketio.ASGIApp` thành 1 app ASGI duy nhất.
- **Liên kết:** Là cửa ngõ (Entry point) tiếp nhận mọi request từ Frontend.
- **Công nghệ:** Framework FastAPI (hiệu năng cao, bất đồng bộ), python-socketio.

#### 4.2. File `app/database.py` & `app/models.py`
- **Tính năng:** Kết nối tới MongoDB và định nghĩa cấu trúc các Bảng (Collections).
- **Logic code:**
  - `database.py`: Sử dụng `AsyncIOMotorClient` kết nối tới chuỗi MONGODB_URL. Sau đó gọi `init_beanie` để đăng ký thao tác DB thông qua các object Python.
  - `models.py`: Định nghĩa Class `User` (email, fullName, password, mảng friends...) và Class `Message` (senderId, receiverId, isDeleted, mảng reactions...).
- **Công nghệ:** MongoDB (NoSQL). Dùng thư viện Motor (async driver) và Beanie (Object Document Mapper).
- *Điểm nhấn để trả lời:* "Em dùng Beanie ODM chạy trên nền Motor async. Khác với PyMongo thường bị chặn (blocking), cách này giúp FastAPI xử lý hàng ngàn request cùng lúc mà không bị treo khi đợi DB."

#### 4.3. File `app/socket_manager.py` (Rất quan trọng)
- **Tính năng:** Trạm điều phối Real-time. Biết ai đang online, trung chuyển tin nhắn đến đúng người, và làm Signaling Server cho Video Call.
- **Logic code:**
  - Sử dụng biến `user_socket_map` (Dictionary) để lưu cặp `{userId: socketId}`. Khi A gửi tin cho B, tra map xem B đang mang socketId nào để đẩy dữ liệu thẳng về máy B.
  - Sự kiện `connect` / `disconnect`: Lưu userId vào map và `emit` thông báo danh sách online mới nhất.
  - Các sự kiện `video:initiate`, `video:offer`, `video:answer`, `video:ice-candidate`: Làm trung gian luân chuyển cấu hình Media và mạng lưới (SDP/ICE) để 2 trình duyệt tự thiết lập kết nối P2P (WebRTC).
  - Sự kiện `video:end`: Khởi tạo 1 `Message` lưu thông tin lịch sử cuộc gọi vào Database.
- **Công nghệ:** Socket.IO, WebRTC (Web Real-Time Communication).

#### 4.4. File `app/routes/user_routes.py`
- **Tính năng:** Xử lý Đăng ký, Đăng nhập, Google Auth, Kết bạn.
- **Logic code nổi bật:**
  - Hàm `signup`: Nhận thông tin, kiểm tra email trùng. Mã hóa mật khẩu bằng `bcrypt.hashpw` (bảo mật dữ liệu) trước khi lưu. Tạo JWT Token trả về.
  - Hàm `google_login`: Trích xuất token từ Google trả về, dùng `id_token.verify_oauth2_token` kiểm tra chữ ký token. Nếu hợp lệ, tạo/đăng nhập tài khoản tự động bằng email đó mà không cần password.
  - Hàm `send_friend_request`: Đẩy ID của mình vào mảng `friendRequests` của đối phương. Kích hoạt Socket phát sự kiện `newFriendRequest` để hiện thông báo ngay.
- **Công nghệ:** bcrypt (băm mật khẩu), JSON Web Token (JWT), Google OAuth2.

#### 4.5. File `app/routes/message_routes.py`
- **Tính năng:** Lấy lịch sử nhắn tin, gửi tin mới, sửa/thu hồi, thả cảm xúc.
- **Logic code nổi bật:**
  - Hàm `get_users_for_sidebar`: Tìm danh sách bạn bè, sau đó dùng query `distinct` trên bảng Message tìm ID người lạ đã từng nhắn tin. Ghép 2 danh sách lại và đếm tin "chưa đọc".
  - Hàm `revoke_message` (Thu hồi): Áp dụng kỹ thuật **Soft Delete** (Xóa mềm). Tức là không xóa cứng record, mà đổi cờ `isDeleted = True`, xóa nội dung văn bản `text = None`. Socket sẽ báo Client cập nhật giao diện thành "Tin nhắn đã thu hồi".
  - Hàm `react_message`: Toggle logic. Nếu user đã thả tim rồi mà bấm tiếp thì xóa biểu tượng đó đi. Nếu thả biểu tượng khác thì ghi đè biểu tượng mới vào mảng `reactions`.
  - **Quản lý Nhóm Chat (Group Management):** Xử lý mảng `members` trong schema `ChatGroup`. Logic kích thành viên (`kick_group_member`) đảm bảo tính toàn vẹn trạng thái thông qua việc cập nhật DB, trả về thông tin nhóm mới (`updated_group_data`) để đồng bộ ngay trên Client, đồng thời phát tín hiệu cập nhật qua Socket tới các thành viên.
- **Công nghệ:** Beanie MongoDB Queries (truy vấn nâng cao).

#### 4.6. File `app/routes/file_routes.py`
- **Tính năng:** Luồng Upload/Download File và Folder.
- **Logic code nổi bật:**
  - Hàm `upload` / `upload_folder`: Gọi SDK `cloudinary.uploader.upload` để đẩy byte lên mây Cloudinary lấy URL. Với folder, bóc tách cấu trúc cây thư mục ở Frontend và đẩy từng file lên.
  - Hàm `download_file` (Proxy Download): Do khác domain nên HTML `download` bị chặn (CORS). Backend đứng ra dùng thư viện `httpx` tải nội dung file từ mây về, sau đó đặt header `Content-Disposition: attachment` và dùng `StreamingResponse` xả thẳng về máy tính client.
  - Hàm `download_folder` (Zip on-the-fly): Backend tạo 1 vùng nhớ ảo `io.BytesIO()`. Tải từng file lẻ về, nhồi trực tiếp vào nén `.zip` ngay trong RAM (không ghi ra ổ cứng server tránh rác), sau đó trả Stream `.zip` đó xuống.
- **Công nghệ:** FastAPI StreamingResponse, httpx, zipfile, Cloudinary API.
- *Điểm nhấn để trả lời:* "Chức năng tải folder là phần khó. Thay vì lưu tạm xuống ổ cứng server rất tốn tài nguyên, em xử lý nén file zip trực tiếp trên RAM (Memory Stream) giúp hệ thống nhẹ gọn và an toàn hơn."

#### 4.7. File `app/routes/ai_routes.py`
- **Tính năng:** Tích hợp AI Google Gemini để làm trợ lý ảo và tóm tắt tin nhắn.
- **Logic code nổi bật:**
  - Hàm `chat_with_ai`: Nhận lịch sử chat và câu hỏi, tạo prompt truyền cho model `gemini-2.5-flash` để sinh câu trả lời hướng dẫn người dùng.
  - Hàm `summarize_chat`: Query 50 tin nhắn gần nhất trong MongoDB dựa vào `target_id`, xử lý định dạng hội thoại, sau đó yêu cầu AI tóm tắt nội dung chính và các quyết định.
- **Công nghệ:** Google Generative AI (Gemini).

### 5. Phân Chia Công Việc (Task Division)

Dưới đây là bảng phân chia công việc chi tiết giữa 2 thành viên trong nhóm, được trình bày theo cấu trúc chuẩn xác của dự án:

#### MẠNH QUỲNH
**Nhiệm vụ:** Quản lý vòng đời dữ liệu, kiến trúc hệ thống Backend và xử lý logic thời gian thực (Real-time).

| Module đảm nhận | Chức năng |
| :--- | :--- |
| **`main.py` & `socket_manager.py`** | Thiết lập kiến trúc Server bất đồng bộ (FastAPI), cấu hình WebSockets và điều phối tín hiệu WebRTC (P2P). |
| **`database.py` & `models.py`** | Thiết kế cơ sở dữ liệu NoSQL (MongoDB), tích hợp Beanie ODM, tối ưu hóa truy vấn dữ liệu bất đồng bộ. |
| **`message_routes.py` & `user_routes.py`** | Xây dựng RESTful API bảo mật với JWT, xử lý logic chat nhóm, quản lý thành viên, và luồng kết bạn. |
| **`file_routes.py` & `ai_routes.py`** | Tích hợp Cloudinary API, xử lý nén ZIP trên RAM, tích hợp Google Gemini API xử lý luồng AI Chatbot & Tóm tắt. |

#### DUY KHÁNH
**Nhiệm vụ:** Quản lý luồng tương tác của người dùng, dịch vụ đầu cuối và phát triển giao diện Client (Frontend).

| Module đảm nhận | Chức năng |
| :--- | :--- |
| **`ChatContainer.jsx` & `RightSidebar.jsx`** | Phát triển giao diện nhắn tin thời gian thực, hiển thị tin nhắn đa phương tiện, xử lý giao diện nhóm chat. |
| **`SideBar.jsx` & `AuthContext.jsx`** | Quản lý trạng thái toàn cục (Context API), tính năng tìm kiếm bạn bè, tích hợp luồng đăng nhập Google OAuth 2.0. |
| **Logic WebRTC & `VideoCall`** | Xây dựng logic gọi Video ngang hàng (Peer-to-Peer), cấu hình STUN/TURN Server để vượt màn lọc tường lửa. |
| **UI/UX Design & Tailwind CSS** | Thiết kế giao diện Dark Mode Glassmorphism, tối ưu hóa trải nghiệm thao tác cảm ứng (Mobile-first). |
