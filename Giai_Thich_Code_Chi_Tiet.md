# 📖 CUỐN SÁCH: GIẢI THÍCH CHI TIẾT SOURCE CODE TỪ A-Z (DỰ ÁN CHAT APP)

**LỜI NÓI ĐẦU**
Tài liệu này không phải là bản tóm tắt, mà là một cuốn cẩm nang "mổ xẻ" toàn bộ dự án từ Frontend (ReactJS) đến Backend (FastAPI). 
Mỗi tính năng dưới đây được giải thích theo **Luồng dữ liệu (Data Flow)**: Bắt đầu từ lúc người dùng thao tác trên Giao diện (UI) -> Trạng thái lưu ở Client (State/Context) -> Gọi API (Axios/Socket) -> Xử lý logic tại Controller (Backend) -> Thao tác với Database (MongoDB).

---

## CHƯƠNG 1: CƠ SỞ DỮ LIỆU & KIẾN TRÚC LÕI (CORE ARCHITECTURE)

### 1. Database Schemas (`server/app/models.py`)
Dự án sử dụng NoSQL (MongoDB) và thư viện **Beanie ODM** để ánh xạ dữ liệu thành các Object Python.
- **`User` Schema:**
  - Lưu thông tin tài khoản: `email`, `fullName`, `password` (đã băm bằng bcrypt), `profilePic` (URL ảnh đại diện).
  - Các mảng lưu quan hệ xã hội: `friends` (Danh sách ID bạn bè), `friendRequests` (Danh sách ID người gửi lời mời).
- **`Message` Schema:**
  - Lưu thông tin tin nhắn: `senderId` (Người gửi), `receiverId` (Người nhận hoặc ID Nhóm), `text` (Nội dung văn bản), `image` / `fileUrl` (Link đính kèm).
  - Trạng thái tin nhắn: `isSeen` (Đã xem), `isDeleted` (Bị thu hồi - Soft delete).
  - Mảng `reactions`: Lưu các biểu tượng cảm xúc mà user thả vào tin nhắn.
- **`ChatGroup` Schema (Tích hợp trong Message hoặc bảng riêng):**
  - Chứa `name`, `avatar`, `adminId` (Trưởng nhóm), và mảng `members` (Chứa danh sách ID các thành viên).

### 2. Kiến trúc Socket.IO (`server/app/socket_manager.py`)
- Backend dùng `python-socketio` chạy chung port với FastAPI thông qua `ASGIApp`.
- **Biến `user_socket_map` (Dictionary):** Khi một user kết nối (gọi sự kiện `connect`), server lưu `userId` và `socket.id` vào từ điển này. Nhờ đó, khi User A muốn gửi real-time cho User B, server chỉ cần tra cứu `user_socket_map[UserB_ID]` để đẩy dữ liệu thẳng vào thiết bị của B (bằng lệnh `sio.emit(..., room=socket_id)`).

---

## CHƯƠNG 2: XÁC THỰC VÀ PHÂN QUYỀN (AUTHENTICATION)

### 2.1 Đăng ký & Đăng nhập (Traditional Auth)
- **Frontend (`client/src/pages/LoginPage.jsx` & `AuthContext.jsx`):**
  - Người dùng nhập Email, Mật khẩu. React quản lý bằng `useState`.
  - Hàm `login(email, password)` trong `AuthContext` gọi Axios POST đến `/api/auth/login`.
- **Backend (`server/app/routes/user_routes.py`):**
  - Nhận HTTP POST request. Truy vấn MongoDB: `await User.find_one(User.email == email)`.
  - Nếu tài khoản tồn tại, dùng thư viện `bcrypt.checkpw(password, hashed_password)` để so khớp mật khẩu.
  - Tạo JSON Web Token (JWT) bằng thư viện `PyJWT`, lưu thông tin `userId` vào Payload, gài hạn sử dụng (Expiration). Trả token về cho Client.
- **Bảo vệ Routes (`server/app/dependencies.py`):**
  - Mỗi API yêu cầu đăng nhập sẽ đi qua hàm `get_current_user`. Hàm này đọc header `Authorization: Bearer <token>`, giải mã JWT. Nếu token hợp lệ, nó query ra Object User và truyền vào controller.

### 2.2 Đăng nhập Google (OAuth 2.0)
- **Frontend (`GoogleOAuthProvider` & `LoginPage`):**
  - Sử dụng thư viện `@react-oauth/google`. Khi người dùng click nút "Login with Google", popup hiện lên. Nếu thành công, Google trả về một chuỗi `credential` (chính là `id_token`).
  - Client gửi chuỗi này xuống API `POST /api/auth/google-login`.
- **Backend:**
  - Nhận `id_token`. Sử dụng thư viện `google.oauth2.id_token` để verify chữ ký trực tiếp với Google Server.
  - Trích xuất `email`, `name`, `picture` từ token.
  - Logic: Nếu email này chưa có trong DB -> Tự động đăng ký (`insert`). Nếu đã có -> Cấp ngay JWT Token nội bộ và cho phép đăng nhập mà không cần password.

---

## CHƯƠNG 3: HỆ THỐNG BẠN BÈ & TÌM KIẾM

### 3.1 Tìm kiếm & Gửi lời mời kết bạn
- **Frontend (`client/src/components/SideBar.jsx`):**
  - Thanh Search có cơ chế `debounce` (gõ xong 0.5s mới tìm) để tránh spam API.
  - Gửi `GET /api/auth/search?query=...`
- **Backend (`user_routes.py` - `search`):**
  - Sử dụng Regex trong MongoDB (`{"$regex": query, "$options": "i"}`) để tìm gần đúng tên hoặc email.
- **Luồng gửi lời mời kết bạn (`send-friend-request`):**
  - Kích hoạt hàm `POST /api/auth/send-friend-request`.
  - Backend cập nhật DB: Thêm ID của người gửi vào mảng `friendRequests` của đối phương (`$push`).
  - **Real-time:** Backend ngay lập tức gọi Socket `sio.emit('newFriendRequest', data, room=receiver_socket_id)` để góc màn hình đối phương hiện popup Toast thông báo.

### 3.2 Chấp nhận kết bạn
- **API `POST /api/auth/accept-friend-request`:**
  - Kéo ID ra khỏi mảng `friendRequests` (`$pull`).
  - Đẩy ID của nhau vào mảng `friends` của cả 2 user (`$push`).
  - Emit Socket báo tin: "X đã chấp nhận lời mời kết bạn của bạn".

---

## CHƯƠNG 4: NHẮN TIN THỜI GIAN THỰC (REAL-TIME MESSAGING)

Đây là tính năng cốt lõi phức tạp nhất, được quản lý chủ yếu bởi `ChatContext.jsx` ở Client và `message_routes.py` ở Server.

### 4.1 Luồng gửi tin nhắn (Send Message)
- **Người dùng gõ tin nhắn** ở ô Input (`ChatContainer.jsx`) và nhấn Enter.
- **API Call:** Client gọi `POST /api/messages/send/{receiverId}` kèm nội dung (`text`, `image`).
- **Backend lưu DB:** Tạo Object `Message` mới, `insert()` vào DB. Mặc định cờ `isSeen = False`, `isDeleted = False`.
- **Phân phối Real-time:** 
  - Backend kiểm tra đối phương có đang Online không (check trong `user_socket_map`).
  - Nếu Online, gọi `sio.emit("receiveMessage", message_data, room=receiver_socket_id)`.
- **Client nhận tin:** Khối `useEffect` trong `ChatContext` lắng nghe sự kiện `receiveMessage`. Khi nhận được, nó dùng `setMessages((prev) => [...prev, newMessage])` để render tin nhắn mới lên màn hình ngay lập tức.
- **Auto-scroll:** Khối `<div ref={messagesEndRef} />` kết hợp với `scrollIntoView()` giúp màn hình tự trượt xuống dưới cùng mỗi khi mảng `messages` thay đổi.

### 4.2 Tính năng Thu hồi tin nhắn (Soft Delete)
- **Hành động:** Người dùng chuột phải (hoặc nhấn giữ trên mobile) vào tin nhắn -> Chọn "Thu hồi".
- **API Call:** Gọi `PUT /api/messages/revoke/{messageId}`.
- **Backend (Soft Delete):** Không dùng lệnh `delete()` cứng trong DB (để tránh mất hoàn toàn lịch sử phục vụ audit). Thay vào đó, backend thực hiện:
  - Update bản ghi: `message.isDeleted = True`, đồng thời xóa nội dung: `message.text = None`, `message.image = None`. 
  - Gọi Socket `sio.emit("messageDeleted", messageId)` báo cho đối tác.
- **Frontend:** Khi nhận Socket, React duyệt qua mảng state messages, tìm message có ID tương ứng và đổi nội dung thành thẻ `<i>Tin nhắn đã bị thu hồi</i>` với hiệu ứng in nghiêng, mờ (Opacity 0.5).

### 4.3 Tính năng Thả cảm xúc (Reactions)
- **API:** `POST /api/messages/react/{id}` gửi kèm ký tự Emoji (vd: ❤️, 😂).
- **Backend Logic (Toggle):** 
  - Duyệt mảng `reactions` của tin nhắn đó. 
  - Nếu User hiện tại đã thả ❤️, và lại bấm ❤️ -> Nhấn lần 2 là Hủy (Xóa ❤️ khỏi mảng).
  - Nếu đã thả ❤️, nhưng bấm 😂 -> Ghi đè (Đổi ❤️ thành 😂).
  - Emit Socket `sio.emit("messageReacted", {messageId, reactions})`.

### 4.4 Đánh dấu đã xem (Read Receipts)
- Mỗi khi User A mở khung chat với User B.
- Client phát sự kiện Socket `sio.emit('markMessagesSeen', { senderId: B })`.
- Backend nhận sự kiện, Update toàn bộ bảng Message (có `senderId = B` và `receiverId = A`, `isSeen = False`) thành `isSeen = True`.
- Phát ngược Socket `sio.emit("messagesSeenUpdate")` về cho B. Máy B sẽ đổi chữ "Đã gửi" thành "Đã xem".

---

## CHƯƠNG 5: NHÓM CHAT (GROUP CHAT) & QUẢN LÝ THÀNH VIÊN

Quản lý luồng bằng API `message_routes.py` (Nhóm API /groups) và component `RightSidebar.jsx`.

### 5.1 Tạo & Thêm thành viên
- **Tạo nhóm (`POST /api/messages/groups/create`):**
  - Nhận mảng `members` (ID các bạn bè được chọn).
  - Gắn ID của người tạo vào trường `adminId`.
  - Tạo record Group vào DB, Socket emit thông báo đến tất cả thành viên trong mảng để nhóm mới tự pop-up trên Sidebar của họ.
- **Thêm thành viên (`POST .../add-members`):**
  - Backend verify user gọi API có phải là `adminId` hay không. 
  - Dùng mảng Set hoặc thao tác `$addToSet` của MongoDB để đảm bảo thêm người không bị trùng lặp.

### 5.2 Kích (Kick) & Rời nhóm (Leave)
- **Trưởng nhóm Kick người khác (`PUT .../kick`):**
  - `members.remove(userId)`. Lọc ID khỏi mảng. 
  - Bắn Socket cho người bị kích (để UI của họ tự đóng cửa sổ nhóm lại).
- **Giải tán nhóm (`DELETE .../groups/{id}`):**
  - Trưởng nhóm bấm xóa. DB xóa toàn bộ record Group, có thể xóa luôn (hoặc soft-delete) các tin nhắn liên quan đến group_id này.

---

## CHƯƠNG 6: GỬI FILE VÀ NÉN THƯ MỤC (FILE SHARING & ZIP ON-THE-FLY)

### 6.1 Upload (Tải lên Cloudinary)
- **Backend API (`POST /api/files/upload`):** 
  - Sử dụng thư viện `cloudinary.uploader.upload(file.file.read())`.
  - Cloudinary trả về một URL (vd: `https://res.cloudinary.com/.../image.jpg`). URL này được gắn vào trường `image` hoặc `fileUrl` của Message.
- **Upload Folder (`upload-folder`):**
  - Ở Frontend, thẻ `<input type="file" webkitdirectory />` cho phép chọn cả 1 folder.
  - Dùng đệ quy lặp qua tất cả file trong folder, đẩy tuần tự lên Server (hoặc đẩy đồng thời qua Promise.all), giữ nguyên cấu trúc đường dẫn tương đối (relative path).

### 6.2 Download Folder (Nén ZIP trên RAM)
Đây là một tính năng cực kì xuất sắc về mặt tối ưu hệ thống:
- Nếu người dùng tải thư mục, Server gọi API `POST /api/files/download-folder`.
- **Vấn đề thông thường:** Server tải file từ Cloudinary về lưu tạm trên ổ cứng (Disk), nén thành file .zip rồi gửi cho Client, sau đó phải viết logic xóa file rác.
- **Giải pháp áp dụng (Zip on-the-fly):**
  - Khởi tạo bộ nhớ tạm trên RAM: `memory_file = io.BytesIO()`.
  - Mở bộ nén: `zip_obj = zipfile.ZipFile(memory_file, 'w')`.
  - Tải từng byte của các file từ Cloudinary về qua `httpx`, ghi *trực tiếp* vào `zip_obj` mà không cần chạm vào ổ cứng.
  - Dùng `StreamingResponse(iterfile(), media_type="application/zip")` để đẩy luồng zip về máy tính người dùng.

---

## CHƯƠNG 7: CUỘC GỌI VIDEO NGANG HÀNG (WEBRTC P2P)

Không sử dụng Server để trung chuyển Video (rất tốn băng thông), mà kết nối trực tiếp Camera người A đến Màn hình người B thông qua **WebRTC**.

### 7.1 Signaling (Thiết lập kết nối qua Socket)
- Mặc dù dữ liệu video không qua Server, nhưng User A và B cần biết "địa chỉ mạng" (IP/Port) của nhau để kết nối. Quá trình trao đổi danh thiếp này gọi là **Signaling** (do Socket đảm nhận).
- **Bước 1 (Offer):** User A nhấn gọi. Khởi tạo đối tượng `Peer` (thư viện `simple-peer`). Bắn Socket `video:offer` kèm gói dữ liệu SDP (Session Description Protocol) của mình cho Server. Server chuyển cho B.
- **Bước 2 (Answer):** User B nhấn nghe máy. Trình duyệt B sinh ra gói SDP Answer, bắn Socket `video:answer` trả lại cho A.
- **Bước 3 (ICE Candidates):** Cả A và B liên tục gửi các con đường mạng (ICE Candidate) cho nhau qua sự kiện Socket `video:ice-candidate` để tìm đường truyền ngắn nhất.

### 7.2 Truyền thông tin liên lạc ngang hàng (STUN/TURN)
- Để xuyên thủng tường lửa mạng nội bộ (NAT/Router), hệ thống được config các `iceServers` public (STUN Server của Google). STUN Server giúp trình duyệt tìm ra địa chỉ IP Public thật sự của nó để gửi cho đối phương.
- Khi kết nối P2P thành công, thẻ `<video>` ở Frontend sẽ nhận luồng `MediaStream` từ máy đối phương và phát trực tiếp (Real-time latency < 50ms).

### 7.3 Kết thúc cuộc gọi
- Ấn nút "Tắt máy". Kích hoạt `peer.destroy()`. 
- Bắn API hoặc Socket `video:end` để Server lưu 1 tin nhắn vào Database: *"Cuộc gọi video kéo dài 05:23"*.

---

## CHƯƠNG 8: TRỢ LÝ ẢO AI & TÓM TẮT TIN NHẮN (GEMINI)

Sự kết hợp hoàn hảo giữa Chat App và Trí tuệ nhân tạo (Google Generative AI).

### 8.1 Trợ lý ảo AI (AI Chatbot)
- **Frontend (`AIChatBot.jsx`):** 
  - Một nút Floating (Góc phải dưới màn hình), bấm vào sẽ mở Modal Chatbot.
  - Quản lý lịch sử nói chuyện (`request.history`) để AI có ngữ cảnh.
- **Backend (`POST /api/ai/chat`):**
  - Khởi tạo SDK: `genai.GenerativeModel('gemini-2.5-flash')`.
  - Cấu hình Prompt mồi (System Prompt): *"Bạn là trợ lý ảo của ChatApp. Hãy hướng dẫn cách gửi tin, tạo nhóm... bằng tiếng Việt."*
  - Nối chuỗi lịch sử hội thoại + Câu hỏi mới của người dùng -> Gọi `model.generate_content()`. Trả kết quả chữ (text) về cho Frontend hiển thị.

### 8.2 Tóm tắt hội thoại (Summarization)
- **Tính năng:** Khi lười đọc lại hàng chục tin nhắn trong nhóm chat, bấm nút "Tóm tắt".
- **Backend (`GET /api/ai/summarize/{target_id}`):**
  - Dùng Query MongoDB lấy **50 tin nhắn gần nhất** giữa User hiện tại và Nhóm (hoặc Bạn bè). Sort theo thời gian `createdAt`.
  - Lặp qua mảng, ghép nối nội dung thành một kịch bản văn bản. 
    *(Ví dụ: "Tôi: Hello", "Người gửi: Đi ăn không?", "Tôi: Ok").*
  - Nạp kịch bản đó vào Prompt: *"Dưới đây là đoạn hội thoại. Hãy tóm tắt ý chính và các công việc/quyết định."*
  - Gửi cho Gemini xử lý, trả về 1 đoạn tóm tắt ngắn gọn. Tính năng này giúp người dùng nắm bắt nhịp độ trò chuyện cực nhanh.

---
**TỔNG KẾT:**
Toàn bộ dự án là một sự kết hợp chặt chẽ giữa:
1. Giao diện (React/Tailwind) mượt mà tối ưu hiển thị.
2. Quản lý luồng sự kiện Socket.IO hoàn hảo (Không bỏ sót tin, thông báo Real-time).
3. Backend (FastAPI) bất đồng bộ 100% giúp xử lý đồng thời lượng truy cập lớn mà không giật lag.
4. Tối ưu bộ nhớ (Zip on-the-fly) và tiết kiệm băng thông Server (WebRTC P2P).
5. Ứng dụng AI (Gemini) đón đầu xu hướng công nghệ tương lai.
