<div align="center">

# 📖 GIẢI THÍCH CHI TIẾT SOURCE CODE — DỰ ÁN CHATITC

**Tài liệu Data Flow: Từ Giao diện → State → API → Backend → Database**

---

</div>

## 📋 Mục lục

| Chương | Nội dung |
|:---|:---|
| [Chương 1](#chương-1-cơ-sở-dữ-liệu--kiến-trúc-lõi) | Cơ sở Dữ liệu & Kiến trúc Lõi |
| [Chương 2](#chương-2-xác-thực-và-bảo-mật) | Xác thực và Bảo mật (Auth + OTP + OAuth) |
| [Chương 3](#chương-3-hệ-thống-bạn-bè--tìm-kiếm) | Hệ thống Bạn bè & Tìm kiếm |
| [Chương 4](#chương-4-nhắn-tin-thời-gian-thực) | Nhắn tin Thời gian thực |
| [Chương 5](#chương-5-chat-nhóm--quản-lý-thành-viên) | Chat Nhóm & Quản lý Thành viên |
| [Chương 6](#chương-6-gửi-file--nén-thư-mục) | Gửi File & Nén Thư mục (Zip on-the-fly) |
| [Chương 7](#chương-7-gọi-video-ngang-hàng-webrtc) | Gọi Video ngang hàng (WebRTC P2P) |
| [Chương 8](#chương-8-trợ-lý-ảo-ai--tóm-tắt-tin-nhắn) | Trợ lý ảo AI & Tóm tắt Tin nhắn |
| [Chương 9](#chương-9-hệ-thống-email-otp) | Hệ thống Email OTP (Brevo API) |
| [Chương 10](#chương-10-quản-trị-admin) | Quản trị Admin (Báo cáo & Cấm chat) |
| [Chương 11](#chương-11-quản-lý-trạng-thái-frontend-context-api) | Quản lý Trạng thái Frontend (Context API) |

---

## Chương 1: Cơ sở Dữ liệu & Kiến trúc Lõi

### 1.1 Database Schemas — `server/app/models.py`

Dự án sử dụng **NoSQL (MongoDB)** và **Beanie ODM** để ánh xạ dữ liệu thành Object Python.

#### Schema `User`

| Trường | Kiểu | Mô tả |
|:---|:---|:---|
| `email` | `str` | Email đăng nhập (duy nhất) |
| `fullName` | `str` | Họ và tên |
| `password` | `str` | Mật khẩu đã băm Bcrypt (rỗng nếu Google) |
| `profilePic` | `str` | URL ảnh đại diện (Cloudinary) |
| `bio` | `str` | Giới thiệu bản thân |
| `friends` | `list[str]` | Mảng ID bạn bè |
| `friendRequests` | `list[str]` | Mảng ID người gửi lời mời |
| `archivedChats` | `list[str]` | Mảng ID hội thoại đã lưu trữ |
| `is_verified` | `bool` | Đã xác thực OTP chưa |
| `otp_code` | `str` | Mã OTP 6 số (tạm thời) |
| `otp_expiry` | `datetime` | Thời hạn OTP (5 phút) |
| `isAdmin` | `bool` | Quyền quản trị |
| `banned_until` | `datetime` | Thời hạn cấm chat |
| `lastSeen` | `datetime` | Lần cuối online |

#### Schema `Message`

| Trường | Kiểu | Mô tả |
|:---|:---|:---|
| `senderId` | `str` | ID người gửi |
| `receiverId` | `str` | ID người nhận hoặc ID nhóm (Đa hình) |
| `text` | `str` | Nội dung văn bản |
| `attachment` | `Object` | Object chứa thông tin file/folder đính kèm (`FileAttachment`) |
| `callInfo` | `Object` | Object lưu lịch sử cuộc gọi video/voice (`CallInfo`) |
| `seen` / `seenBy` | `bool/list` | Đã xem (1-1) / Danh sách ID đã xem (Nhóm) |
| `isDeleted` | `bool` | Đã thu hồi (Soft Delete) |
| `deletedByAdmin`| `bool` | Bị admin xóa do vi phạm |
| `isEdited` | `bool` | Đã chỉnh sửa (`editedAt` lưu thời gian) |
| `reactions` | `list[dict]` | Mảng Object `{userId, emoji}` |
| `isSystemMessage`| `bool` | Tin nhắn hệ thống (VD: "A đã thêm B vào nhóm") |

#### Schema `ChatGroup`

| Trường | Kiểu | Mô tả |
|:---|:---|:---|
| `name` | `str` | Tên nhóm |
| `avatar` | `str` | URL avatar nhóm |
| `adminId` | `str` | ID trưởng nhóm |
| `members` | `list[str]` | Danh sách ID thành viên |

### 1.2 Kiến trúc Socket.IO — `socket_manager.py`

```
Kết nối:  User A ──connect──→ Server lưu {userId_A: socketId_A} vào user_socket_map
Gửi tin:  User A ──HTTP POST──→ Server lưu DB → tra map[userId_B] → emit trực tiếp cho B
```

- **`user_socket_map`** (Dictionary): Lưu `{userId: socketId}`. Khi A gửi tin cho B, server tra map lấy socketId của B → `sio.emit(..., room=socket_id_B)`.
- Sự kiện `connect`/`disconnect`: Cập nhật map + broadcast danh sách online.

---

## Chương 2: Xác thực và Bảo mật

### 2.1 Đăng ký với OTP

```
User nhập thông tin → POST /signup → Server tạo OTP 6 số → Lưu DB
                                   → Gửi email OTP (Brevo API)
User nhập OTP      → POST /verify-registration → Server kiểm tra OTP + hạn
                                                → Thành công → Cấp JWT Token
```

- **Frontend** (`LoginPage.jsx`): Form đăng ký → gọi API → mở Modal OTP
- **Backend** (`user_routes.py`): Tạo OTP `random.randint(100000, 999999)`, hash password bằng `bcrypt.hashpw`, gửi email qua `send_otp_email()`, lưu `otp_code` + `otp_expiry` (5 phút)
- Xác thực: So khớp OTP → set `is_verified = True` → xóa OTP → cấp JWT Token

### 2.2 Đăng nhập truyền thống

```
User nhập email/password → POST /login → Server query DB → bcrypt.checkpw()
                                       → Nếu chưa verify → Gửi lại OTP
                                       → Nếu OK → Cấp JWT Token
```

### 2.3 Đăng nhập Google (OAuth 2.0)

```
User click "Login with Google" → Google popup → Trả credential (id_token)
→ POST /google-login → Server verify token với Google → Trích email/name/picture
                     → Chưa có tài khoản → Tự tạo mới (password="")
                     → Đã có → Cấp JWT Token
```

- Sử dụng `google.oauth2.id_token.verify_oauth2_token()` để verify chữ ký

### 2.4 Quên mật khẩu

```
User nhập email → POST /forgot-password → Server tạo OTP → Gửi email
User nhập OTP + mật khẩu mới → POST /reset-password → Kiểm tra OTP
                              → Hash mật khẩu mới → Cập nhật DB → Xóa OTP
```

### 2.5 Bảo vệ Routes — `dependencies.py`

- Mỗi API cần đăng nhập sẽ qua hàm `get_current_user()`:
  - Đọc header `token` → giải mã JWT bằng `PyJWT` → query DB lấy User object
  - Nếu token hết hạn hoặc sai → trả lỗi 401

---

## Chương 3: Hệ thống Bạn bè & Tìm kiếm

### 3.1 Tìm kiếm

```
User gõ tên/email → GET /search?q=... → Server normalize tiếng Việt
                  → So khớp không dấu trong memory → Trả danh sách kết quả
```

- Hàm `remove_vietnamese_accents()`: Chuyển "Quỳnh" → "Quynh" để tìm kiếm không dấu

### 3.2 Kết bạn (Real-time)

```
User A bấm "Thêm bạn" → POST /send-friend-request
→ Server push userId_A vào friendRequests[] của B
→ Socket emit "newFriendRequest" → B nhận popup Toast ngay lập tức

User B bấm "Chấp nhận" → POST /accept-friend-request
→ Xóa khỏi friendRequests[] → Push vào friends[] của cả 2
→ Socket emit "friendRequestAccepted"
```

---

## Chương 4: Nhắn tin Thời gian thực

### 4.1 Gửi tin nhắn

```
User A gõ tin → Enter → POST /messages/send/{receiverId}
→ Server tạo Message (isSeen=False) → insert DB
→ Tra user_socket_map[B] → sio.emit("receiveMessage", data, room=socketId_B)
→ Client B: useEffect lắng nghe → setMessages(prev => [...prev, newMsg])
→ Auto-scroll: messagesEndRef.scrollIntoView()
```

### 4.2 Thu hồi tin nhắn (Soft Delete)

```
User chuột phải → "Thu hồi" → PUT /messages/revoke/{messageId}
→ Server: isDeleted=True, text=None, image=None (KHÔNG xóa record)
→ Socket emit "messageDeleted"
→ Client: render <i>Tin nhắn đã bị thu hồi</i> (opacity 0.5)
```

> 💡 **Soft Delete** giữ record để phục vụ audit/báo cáo, chỉ xóa nội dung.

### 4.3 Thả cảm xúc (Reaction)

```
User bấm emoji → POST /messages/react/{id} + body {emoji: "❤️"}
→ Server duyệt mảng reactions[]:
  - Đã thả ❤️ + bấm ❤️ lần nữa → XÓA (toggle off)
  - Đã thả ❤️ + bấm 😂 → GHI ĐÈ thành 😂
  - Chưa thả → THÊM vào mảng
→ Socket emit "messageReacted" → Client cập nhật UI
```

### 4.4 Read Receipts (Đánh dấu Đã xem)

```
User A mở khung chat với B
→ Client emit Socket "markMessagesSeen" {senderId: B}
→ Server update tất cả Message (sender=B, receiver=A, isSeen=false) → isSeen=true
→ Socket emit "messagesSeenUpdate" → Máy B đổi "Đã gửi" → "Đã xem" ✓✓
```

---

## Chương 5: Chat Nhóm & Quản lý Thành viên

### 5.1 Tạo & Thêm thành viên

```
User chọn bạn bè → POST /groups/create {name, members[]}
→ Server tạo ChatGroup (adminId = người tạo) → insert DB
→ Socket emit cho TẤT CẢ members → Nhóm mới pop-up trên Sidebar

Thêm người: POST /groups/{id}/add-members → Verify là admin
→ Dùng Set để tránh trùng → Update members[] → Socket emit
```

### 5.2 Kích & Rời nhóm

```
Admin kích: PUT /groups/{id}/kick → Lọc userId khỏi members[]
→ Socket emit "removedFromGroup" cho người bị kích → UI tự đóng cửa sổ nhóm

User rời: PUT /groups/{id}/leave → Tự xóa mình khỏi members[]
→ Nếu admin rời → chuyển quyền admin cho người đầu tiên trong members[]

Giải tán: DELETE /groups/{id} → Xóa record Group → Socket emit "groupDissolved"
```

---

## Chương 6: Gửi File & Nén Thư mục

### 6.1 Upload lên Cloudinary

```
File: User chọn file → Client nén ảnh (giảm size) → POST /files/upload
→ Server gọi cloudinary.uploader.upload(file_bytes) → Trả URL
→ URL được gắn vào khối `attachment` của Message (phân loại file_type: image/video/document)

Folder: `<input webkitdirectory />` → Duyệt đệ quy → POST `/files/upload-folder`
→ Server upload từng file, lưu vào mảng `files` bên trong khối `attachment`, giữ nguyên cấu trúc đường dẫn tương đối.
```

### 6.2 Download Folder — Zip on-the-fly

```
User bấm "Tải thư mục" → POST /files/download-folder

Server:
  ① memory_file = io.BytesIO()              ← Tạo vùng nhớ ảo trên RAM
  ② zip_obj = zipfile.ZipFile(memory_file)   ← Mở bộ nén
  ③ Dùng httpx tải từng file từ Cloudinary
  ④ zip_obj.writestr(path, file_bytes)       ← Nhồi trực tiếp vào ZIP
  ⑤ StreamingResponse(memory_file)           ← Stream ZIP về Client

→ KHÔNG lưu file tạm trên ổ cứng → Tiết kiệm tài nguyên Server
```

> 💡 *"Chức năng tải folder là phần khó nhất. Thay vì lưu tạm xuống ổ cứng rất tốn tài nguyên, em xử lý nén file ZIP trực tiếp trên RAM (Memory Stream) giúp hệ thống nhẹ gọn và an toàn hơn."*

---

## Chương 7: Gọi Video ngang hàng (WebRTC)

> Video/Audio truyền **trực tiếp** giữa 2 trình duyệt (P2P), không qua Server.

### 7.1 Signaling — Thiết lập kết nối qua Socket

```
Bước 1 (Offer):
  User A nhấn gọi → Khởi tạo Peer (simple-peer)
  → Socket "video:offer" + SDP gửi Server → Server chuyển cho B

Bước 2 (Answer):
  User B nhấn nghe → Trình duyệt B tạo SDP Answer
  → Socket "video:answer" → Server chuyển cho A

Bước 3 (ICE Candidates):
  Cả A và B gửi các đường mạng (ICE Candidate) qua Socket
  → Tìm đường truyền ngắn nhất giữa 2 máy
```

### 7.2 STUN/TURN Server

- **STUN Server** (Google public): Giúp trình duyệt tìm IP Public thật sự → gửi cho đối phương
- Khi P2P thành công → `<video>` nhận `MediaStream` từ đối phương → phát real-time (< 50ms)

### 7.3 Kết thúc cuộc gọi

```
User tắt máy → `peer.destroy()` → Socket `video:end`
→ Server tạo Message với trường `callInfo` chứa loại cuộc gọi và thời lượng (`duration`) → Lưu DB
→ Tin nhắn lịch sử hiện trong khung chat
```

---

## Chương 8: Trợ lý ảo AI & Tóm tắt Tin nhắn

### 8.1 AI Chatbot — `POST /api/ai/chat`

```
User bấm nút Floating → Mở Modal AI → Gõ câu hỏi
→ Gửi {message, history[]} → Backend
→ Khởi tạo genai.GenerativeModel("gemini-2.5-flash")
→ System Prompt: "Bạn là trợ lý ảo ChatITC, hướng dẫn bằng tiếng Việt..."
→ Nối history + câu hỏi → model.generate_content()
→ Trả text về Frontend hiển thị
```

### 8.2 Tóm tắt Hội thoại — `GET /api/ai/summarize/{target_id}`

```
User bấm "Tóm tắt" → Backend query 50 tin nhắn gần nhất từ MongoDB
→ Format: "Tôi: Hello", "Người gửi: Đi ăn không?", "Tôi: Ok"
→ Prompt: "Dưới đây là đoạn hội thoại. Hãy tóm tắt ý chính và quyết định."
→ Gemini xử lý → Trả đoạn tóm tắt ngắn gọn
```

---

## Chương 9: Hệ thống Email OTP

### Luồng gửi email — `email_service.py`

```
Server gọi send_otp_email(email, otp_code, subject, context)
→ Đọc BREVO_API_KEY và BREVO_EMAIL từ .env
→ Tạo template HTML đẹp mắt (Dark theme, mã OTP nổi bật)
→ POST https://api.brevo.com/v3/smtp/email (HTTPS port 443)
→ Brevo API gửi email → User nhận trong Inbox
```

| Đặc điểm | Giải thích |
|:---|:---|
| **Brevo API (HTTP)** | Dùng cổng HTTPS 443 — không bị chặn tường lửa (khác SMTP port 587) |
| **Template HTML** | Email chuyên nghiệp với gradient header, mã OTP lớn dễ đọc |
| **Async** | `asyncio.to_thread()` gọi hàm sync mà không block event loop |
| **Hạn OTP** | 5 phút — hết hạn thì cần gửi lại |

---

## Chương 10: Quản trị Admin

### 10.1 Báo cáo tin nhắn — `report_routes.py`

```
User bấm "Báo cáo" trên tin nhắn → POST /api/reports
→ Server tạo Report {reporterId, reportedId, messageId, reason}
→ Admin mở bảng báo cáo (GET /api/reports)
→ Xem nội dung gốc + lý do
```

### 10.2 Cấm chat (Ban)

```
Admin bấm "Cấm chat" → POST /api/reports/{id}/ban + {duration}
→ Server set user.banned_until = now + duration
→ Socket emit "userBanned" → UI hiện thông báo cấm
→ Khi banned_until hết hạn → User tự được mở cấm

Gỡ cấm: POST /api/auth/unban/{user_id}
→ Set banned_until = None → Socket emit → UI cập nhật
```

---

## Chương 11: Quản lý Trạng thái Frontend (Context API)

> Kiến trúc luồng dữ liệu một chiều (One-way Data Flow) kết hợp với Global State quản lý bởi Context API giúp Frontend React hoạt động đồng bộ và mượt mà.

### 11.1 `AuthContext` — Vòng đời Người dùng & Kết nối Socket
- **Xác thực**: Lưu trữ thông tin `authUser` từ khi mở trang (gọi API `/api/auth/check`) để bảo vệ các tuyến đường (Protected Routes). Nếu không có `authUser`, ép chuyển hướng về `/login`.
- **Quản lý Socket**: 
  - Đóng vai trò là "Cầu dao tổng" của Socket. 
  - Ngay khi `authUser` hợp lệ, `AuthContext` sẽ khởi tạo `io(BACKEND_URL)`.
  - Nếu User đăng xuất, gọi `socket.disconnect()` để hủy phiên real-time.
  
### 11.2 `ChatContext` — Trung tâm Xử lý Real-time
- Là nơi chứa State tập trung nhất: `messages` (mảng tin nhắn hiện tại), `selectedUser` / `selectedGroup` (phòng chat đang mở), `onlineUsers` (danh sách ID online).
- **Lắng nghe sự kiện (Event Listeners)**: Trong `useEffect`, liên tục đăng ký các `socket.on()` như:
  - `receiveMessage`: Nếu tin nhắn thuộc về phòng đang mở → Push vào `messages`. Ngược lại → Tăng số đếm tin chưa đọc.
  - `messageDeleted` / `messageEdited`: Duyệt tìm trong mảng `messages` và cập nhật lại `text` hoặc cờ `isDeleted`, giúp UI render lại không cần F5.
  - `messageReacted`: Cập nhật mảng `reactions` nhúng (embedded) bên trong object tin nhắn tương ứng.
  
### 11.3 Tối ưu hóa UI/UX
- **Auto-scroll thông minh**: Trong `ChatContainer.jsx`, sử dụng `useRef` gán vào thẻ div cuối cùng, khi mảng `messages` thay đổi độ dài, gọi `.scrollIntoView({ behavior: 'smooth' })` để luôn cuộn xuống tin nhắn mới.
- **Tối ưu File Upload**: Thay vì đọc toàn bộ file to vào Base64 (làm crash trình duyệt), sử dụng `FormData` để truyền file nhị phân trực tiếp lên Server qua Axios multipart.
- **Micro-interactions**: Sử dụng thư viện `Framer Motion` cho hiệu ứng lật trang 3D ở màn hình đăng nhập, popup modal, và hiệu ứng của chatbot AI.

---

## Tổng kết

Toàn bộ dự án là sự kết hợp chặt chẽ giữa:

| # | Thành phần | Điểm nổi bật |
|:---:|:---|:---|
| 1 | **Giao diện** (React/Tailwind) | Dark Glassmorphism, Mobile-first, Framer Motion |
| 2 | **Real-time** (Socket.IO) | Không bỏ sót tin nhắn, thông báo tức thời |
| 3 | **Backend** (FastAPI) | Bất đồng bộ 100%, xử lý đồng thời lượng lớn |
| 4 | **Tối ưu** | Zip on-the-fly (RAM), WebRTC P2P (tiết kiệm băng thông) |
| 5 | **Bảo mật** | Bcrypt, JWT, OTP email, Google OAuth 2.0 |
| 6 | **AI** (Google Gemini) | Chatbot hướng dẫn + Tóm tắt hội thoại thông minh |

---

<div align="center">

*Tài liệu giải thích chi tiết phục vụ báo cáo & bảo vệ đồ án.*

</div>
