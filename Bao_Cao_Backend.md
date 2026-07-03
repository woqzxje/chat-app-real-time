# TÀI LIỆU CHUẨN BỊ BÁO CÁO DỰ ÁN CHAT APP (PHẦN BACKEND)

Tài liệu này được biên soạn chi tiết giúp bạn tự tin trả lời các câu hỏi phản biện của giảng viên liên quan đến cấu trúc, chức năng và công nghệ Backend của dự án Chat App.

---

## 1. Hướng Dẫn Demo & Trình Bày Code
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

---

## 2. Danh sách chính xác các API & Socket Events
Hệ thống Backend cung cấp tổng cộng **29 RESTful APIs** và **9 sự kiện WebSockets (Socket.IO)** do Client gửi lên để xử lý real-time. Dưới đây là danh sách chính xác trích xuất từ mã nguồn để bạn đưa vào báo cáo:

### 2.1. Nhóm REST API (29 Endpoints)

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
- `POST /api/messages/groups/create`: Tạo nhóm mới
- `GET /api/messages/groups/{id}/members`: Lấy danh sách thành viên nhóm
- `POST /api/messages/groups/{id}/add-members`: Thêm thành viên vào nhóm
- `PUT /api/messages/groups/{id}/update`: Cập nhật thông tin nhóm (Tên, Avatar)
- `PUT /api/messages/groups/{id}/kick`: Quản trị viên kích thành viên ra khỏi nhóm
- `PUT /api/messages/groups/{id}/leave`: Tự rời khỏi nhóm
- `DELETE /api/messages/groups/{id}`: Giải tán nhóm

**Nhóm Files (`/api/files`) - Chứa trong file `app/routes/file_routes.py`:**
- `POST /api/files/upload`: Upload 1 file lẻ (Dòng 38)
- `POST /api/files/upload-folder`: Upload 1 folder đính kèm (Dòng 77)
- `GET /api/files/download`: Download file (Proxy stream) (Dòng 142)
- `POST /api/files/download-folder`: Download folder (Stream nén ZIP) (Dòng 189)

*(Lưu ý: Không có API HTTP nào cho Video Call vì chức năng đó chạy 100% qua Socket)*

### 2.2. Nhóm Socket.IO Events (9 Sự kiện Client gửi lên)
**Toàn bộ sự kiện Socket được xử lý tại file `app/socket_manager.py`:**
- `connect`: Kết nối vào hệ thống (gửi kèm userId) (Dòng 33)
- `disconnect`: Ngắt kết nối (Dòng 50)
- `markMessagesSeen`: Báo cáo đã xem tin nhắn khi đang mở sẵn khung chat (Dòng 63)
- `video:initiate`: Bắt đầu gọi Video/Voice (Dòng 89)
- `video:offer`: Gửi cấu hình SDP WebRTC (Người gọi) (Dòng 105)
- `video:answer`: Trả lời cấu hình SDP (Người nghe) (Dòng 120)
- `video:ice-candidate`: Gửi thông tin mạng để thiết lập P2P (Dòng 134)
- `video:end`: Kết thúc cuộc gọi (Dòng 148)
- `video:reject`: Từ chối cuộc gọi (Dòng 194)

*(Và kèm theo rất nhiều sự kiện Server phát ngược lại Client như: `getOnlineUsers`, `receiveMessage`, `messageDeleted`... để cập nhật giao diện)*

---

## 3. Cấu Trúc Folder Backend (Giải thích từ ngoài vào trong)
Backend được xây dựng theo kiến trúc MVC/Controller-Service kết hợp với Real-time Socket.

- **Các file cấu hình bên ngoài:** 
  - `main.py`: Trái tim của Backend, file khởi chạy server FastAPI, gắn các middleware và cấu hình Socket.IO.
  - `.env`: Chứa các biến môi trường bảo mật (URL kết nối MongoDB, API Key của Cloudinary, Google Client ID...).
  - `requirements.txt`: Chứa danh sách các gói thư viện Python cần thiết (fastapi, motor, beanie, bcrypt...).
- **Thư mục lõi `app/` (Chứa logic xử lý chính):**
  - `database.py`: Chịu trách nhiệm kết nối đến MongoDB.
  - `models.py`: Chứa các Schema định nghĩa cấu trúc dữ liệu lưu trong DB (User, Message).
  - `dependencies.py`: File chứa các middleware (vd: chặn API nếu chưa có hoặc sai JWT Token).
  - `socket_manager.py`: Bộ não xử lý real-time, nắm giữ danh sách người dùng online và điều phối tín hiệu cuộc gọi (WebRTC).
  - **Thư mục `routes/` (Controllers):** Nơi định nghĩa các endpoint API (URL) và logic nghiệp vụ, chia làm 3 file: `user_routes.py`, `message_routes.py`, `file_routes.py`.

---

## 4. Giải thích sâu từng Source File 
*(Đây là phần để bạn trả lời khi giảng viên chỉ định hỏi 1 file bất kỳ)*

### 4.1. File `main.py`
- **Tính năng:** Khởi tạo ứng dụng FastAPI, cấu hình luồng chạy, bảo mật CORS, và tích hợp Socket.IO chạy chung trên 1 port.
- **Logic code:**
  - Khởi tạo hàm `lifespan`: Gọi hàm kết nối DB ngay khi server vừa bật lên.
  - Gắn `CORSMiddleware`: Cho phép Frontend (chạy ở domain/port khác) được phép gọi API mà không bị trình duyệt chặn lỗi CORS.
  - Khai báo `app.include_router()`: Đăng ký các nhóm API (Users, Messages, Files) vào đường dẫn gốc.
  - Cuối file: Bọc ứng dụng FastAPI và Socket.IO bằng `socketio.ASGIApp` thành 1 app ASGI duy nhất.
- **Liên kết:** Là cửa ngõ (Entry point) tiếp nhận mọi request từ Frontend.
- **Công nghệ:** Framework FastAPI (hiệu năng cao, bất đồng bộ), python-socketio.

### 4.2. File `app/database.py` & `app/models.py`
- **Tính năng:** Kết nối tới MongoDB và định nghĩa cấu trúc các Bảng (Collections).
- **Logic code:**
  - `database.py`: Sử dụng `AsyncIOMotorClient` kết nối tới chuỗi MONGODB_URL. Sau đó gọi `init_beanie` để đăng ký thao tác DB thông qua các object Python.
  - `models.py`: Định nghĩa Class `User` (email, fullName, password, mảng friends...) và Class `Message` (senderId, receiverId, isDeleted, mảng reactions...).
- **Công nghệ:** MongoDB (NoSQL). Dùng thư viện Motor (async driver) và Beanie (Object Document Mapper).
- *Điểm nhấn để trả lời:* "Em dùng Beanie ODM chạy trên nền Motor async. Khác với PyMongo thường bị chặn (blocking), cách này giúp FastAPI xử lý hàng ngàn request cùng lúc mà không bị treo khi đợi DB."

### 4.3. File `app/socket_manager.py` (Rất quan trọng)
- **Tính năng:** Trạm điều phối Real-time. Biết ai đang online, trung chuyển tin nhắn đến đúng người, và làm Signaling Server cho Video Call.
- **Logic code:**
  - Sử dụng biến `user_socket_map` (Dictionary) để lưu cặp `{userId: socketId}`. Khi A gửi tin cho B, tra map xem B đang mang socketId nào để đẩy dữ liệu thẳng về máy B.
  - Sự kiện `connect` / `disconnect`: Lưu userId vào map và `emit` thông báo danh sách online mới nhất.
  - Các sự kiện `video:initiate`, `video:offer`, `video:answer`, `video:ice-candidate`: Làm trung gian luân chuyển cấu hình Media và mạng lưới (SDP/ICE) để 2 trình duyệt tự thiết lập kết nối P2P (WebRTC).
  - Sự kiện `video:end`: Khởi tạo 1 `Message` lưu thông tin lịch sử cuộc gọi vào Database.
- **Công nghệ:** Socket.IO, WebRTC (Web Real-Time Communication).

### 4.4. File `app/routes/user_routes.py`
- **Tính năng:** Xử lý Đăng ký, Đăng nhập, Google Auth, Kết bạn.
- **Logic code nổi bật:**
  - Hàm `signup`: Nhận thông tin, kiểm tra email trùng. Mã hóa mật khẩu bằng `bcrypt.hashpw` (bảo mật dữ liệu) trước khi lưu. Tạo JWT Token trả về.
  - Hàm `google_login`: Trích xuất token từ Google trả về, dùng `id_token.verify_oauth2_token` kiểm tra chữ ký token. Nếu hợp lệ, tạo/đăng nhập tài khoản tự động bằng email đó mà không cần password.
  - Hàm `send_friend_request`: Đẩy ID của mình vào mảng `friendRequests` của đối phương. Kích hoạt Socket phát sự kiện `newFriendRequest` để hiện thông báo ngay.
- **Công nghệ:** bcrypt (băm mật khẩu), JSON Web Token (JWT), Google OAuth2.

### 4.5. File `app/routes/message_routes.py`
- **Tính năng:** Lấy lịch sử nhắn tin, gửi tin mới, sửa/thu hồi, thả cảm xúc.
- **Logic code nổi bật:**
  - Hàm `get_users_for_sidebar`: Tìm danh sách bạn bè, sau đó dùng query `distinct` trên bảng Message tìm ID người lạ đã từng nhắn tin. Ghép 2 danh sách lại và đếm tin "chưa đọc".
  - Hàm `revoke_message` (Thu hồi): Áp dụng kỹ thuật **Soft Delete** (Xóa mềm). Tức là không xóa cứng record, mà đổi cờ `isDeleted = True`, xóa nội dung văn bản `text = None`. Socket sẽ báo Client cập nhật giao diện thành "Tin nhắn đã thu hồi".
  - Hàm `react_message`: Toggle logic. Nếu user đã thả tim rồi mà bấm tiếp thì xóa biểu tượng đó đi. Nếu thả biểu tượng khác thì ghi đè biểu tượng mới vào mảng `reactions`.
  - **Quản lý Nhóm Chat (Group Management):** Xử lý mảng `members` trong schema `ChatGroup`. Logic kích thành viên (`kick_group_member`) đảm bảo tính toàn vẹn trạng thái thông qua việc cập nhật DB, trả về thông tin nhóm mới (`updated_group_data`) để đồng bộ ngay trên Client, đồng thời phát tín hiệu cập nhật qua Socket tới các thành viên.
- **Công nghệ:** Beanie MongoDB Queries (truy vấn nâng cao).

### 4.6. File `app/routes/file_routes.py`
- **Tính năng:** Luồng Upload/Download File và Folder.
- **Logic code nổi bật:**
  - Hàm `upload` / `upload_folder`: Gọi SDK `cloudinary.uploader.upload` để đẩy byte lên mây Cloudinary lấy URL. Với folder, bóc tách cấu trúc cây thư mục ở Frontend và đẩy từng file lên.
  - Hàm `download_file` (Proxy Download): Do khác domain nên HTML `download` bị chặn (CORS). Backend đứng ra dùng thư viện `httpx` tải nội dung file từ mây về, sau đó đặt header `Content-Disposition: attachment` và dùng `StreamingResponse` xả thẳng về máy tính client.
  - Hàm `download_folder` (Zip on-the-fly): Backend tạo 1 vùng nhớ ảo `io.BytesIO()`. Tải từng file lẻ về, nhồi trực tiếp vào nén `.zip` ngay trong RAM (không ghi ra ổ cứng server tránh rác), sau đó trả Stream `.zip` đó xuống.
- **Công nghệ:** FastAPI StreamingResponse, httpx, zipfile, Cloudinary API.
- *Điểm nhấn để trả lời:* "Chức năng tải folder là phần khó. Thay vì lưu tạm xuống ổ cứng server rất tốn tài nguyên, em xử lý nén file zip trực tiếp trên RAM (Memory Stream) giúp hệ thống nhẹ gọn và an toàn hơn."

---

## 5. Phân Chia Công Việc (Task Division)

Dưới đây là bảng phân chia công việc chi tiết giữa 2 thành viên trong nhóm, được trình bày theo cấu trúc chuẩn xác của dự án:

### MẠNH QUỲNH
**Nhiệm vụ:** Quản lý vòng đời dữ liệu, kiến trúc hệ thống Backend và xử lý logic thời gian thực (Real-time).

| Module đảm nhận | Chức năng |
| :--- | :--- |
| **`main.py` & `socket_manager.py`** | Thiết lập kiến trúc Server bất đồng bộ (FastAPI), cấu hình WebSockets và điều phối tín hiệu WebRTC (P2P). |
| **`database.py` & `models.py`** | Thiết kế cơ sở dữ liệu NoSQL (MongoDB), tích hợp Beanie ODM, tối ưu hóa truy vấn dữ liệu bất đồng bộ. |
| **`message_routes.py` & `user_routes.py`** | Xây dựng RESTful API bảo mật với JWT, xử lý logic chat nhóm, quản lý thành viên, và luồng kết bạn. |
| **`file_routes.py`** | Tích hợp Cloudinary API, xây dựng luồng nén file ZIP trực tiếp trên RAM (Memory Stream) để tải thư mục. |

<br/>

### DUY KHÁNH
**Nhiệm vụ:** Quản lý luồng tương tác của người dùng, dịch vụ đầu cuối và phát triển giao diện Client (Frontend).

| Module đảm nhận | Chức năng |
| :--- | :--- |
| **`ChatContainer.jsx` & `RightSidebar.jsx`** | Phát triển giao diện nhắn tin thời gian thực, hiển thị tin nhắn đa phương tiện, xử lý giao diện nhóm chat. |
| **`SideBar.jsx` & `AuthContext.jsx`** | Quản lý trạng thái toàn cục (Context API), tính năng tìm kiếm bạn bè, tích hợp luồng đăng nhập Google OAuth 2.0. |
| **Logic WebRTC & `VideoCall`** | Xây dựng logic gọi Video ngang hàng (Peer-to-Peer), cấu hình STUN/TURN Server để vượt màn lọc tường lửa. |
| **UI/UX Design & Tailwind CSS** | Thiết kế giao diện Dark Mode Glassmorphism, tối ưu hóa trải nghiệm thao tác cảm ứng (Mobile-first). |
