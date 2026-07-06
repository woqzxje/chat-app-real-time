# BÁO CÁO TỔNG KẾT DỰ ÁN CHAT APP

Dự án Chat App là một ứng dụng nhắn tin thời gian thực đa nền tảng, được xây dựng với kiến trúc Client-Server hiện đại, tập trung vào giao diện người dùng cực kỳ chau chuốt (Dark/Cyan Glassmorphism) và các tính năng giao tiếp đa phương tiện mạnh mẽ.

Dưới đây là tài liệu báo cáo toàn diện các chức năng hiện có của hệ thống.

---

## 1. TỔNG QUAN VỀ KIẾN TRÚC HỆ THỐNG

Dự án được phân tách thành hai phần độc lập:
- **Client (Frontend):** Ứng dụng Single Page Application (SPA) xây dựng bằng React 18, Vite, TailwindCSS 4, Framer Motion. Quản lý trạng thái bằng Context API và giao tiếp với máy chủ thông qua HTTP Requests (Axios) và WebSockets (Socket.io-client).
- **Server (Backend):** Máy chủ API mạnh mẽ xây dựng bằng Python với framework FastAPI, xử lý bất đồng bộ toàn diện. Cổng giao tiếp thời gian thực được hỗ trợ bởi `python-socketio`. Cơ sở dữ liệu NoSQL MongoDB được thao tác thông qua Beanie ODM và Motor.

---

## 2. CÁC TÍNH NĂNG CHÍNH ĐÃ HOÀN THIỆN

### 2.1 Xác thực & Phân quyền (Authentication)
- **Đăng ký / Đăng nhập truyền thống:** Bảo mật bằng mật khẩu được mã hóa băm (Bcrypt).
- **Đăng nhập Google OAuth 2.0:** Cho phép người dùng đăng nhập nhanh qua tài khoản Google mà không cần nhớ mật khẩu.
- **Bảo mật phiên đăng nhập:** Quản lý phiên bằng JSON Web Token (JWT).

### 2.2 Hệ thống Bạn bè (Friend System)
- **Tìm kiếm người dùng:** Tìm kiếm bất kỳ ai trên hệ thống thông qua tên hoặc email.
- **Gửi / Chấp nhận / Từ chối kết bạn:** Các lời mời kết bạn được hiển thị thông báo thời gian thực.
- **Quản lý danh sách bạn bè:** Hủy kết bạn (Unfriend) và theo dõi trạng thái online/offline của bạn bè.

### 2.3 Hệ thống Nhắn tin Thời gian thực (Real-time Chat)
- **Gửi tin nhắn siêu tốc:** Nhắn tin tức thời không có độ trễ qua WebSockets.
- **Trạng thái tin nhắn (Read Receipts):** Hiển thị trạng thái "Đã gửi" và chuyển sang "Đã xem" ngay khi đối phương mở khung chat.
- **Tương tác tin nhắn nâng cao:**
  - **Thu hồi tin nhắn (Soft Delete):** Xóa nội dung tin nhắn nhưng vẫn giữ khung thông báo "Tin nhắn đã bị thu hồi".
  - **Chỉnh sửa tin nhắn (Edit):** Cập nhật nội dung tin nhắn đã gửi.
  - **Thả cảm xúc (Reaction):** Cho phép thả biểu tượng cảm xúc lên từng tin nhắn riêng biệt.
- **Tự động cuộn (Smart Auto-Scroll):** Thông minh tự cuộn xuống tin nhắn mới nhất, tối ưu cho thao tác di động.

### 2.4 Chat Nhóm (Group Chat)
- **Tạo nhóm mới:** Mời bạn bè vào chung một phòng chat.
- **Quản lý thành viên:** Trưởng nhóm có quyền thêm thành viên mới hoặc kích (kick) thành viên ra khỏi nhóm.
- **Cập nhật thông tin nhóm:** Đổi tên nhóm và cập nhật hình đại diện nhóm.
- **Rời nhóm / Giải tán nhóm:** Cho phép tự rời đi, hoặc giải tán hoàn toàn nhóm nếu là trưởng nhóm.

### 2.5 Chia sẻ Tệp đa phương tiện (Media & File Sharing)
- **Gửi hình ảnh/tệp tin lẻ:** Hỗ trợ tải lên ảnh hoặc tài liệu. Tích hợp nén ảnh ở phía Client để giảm băng thông trước khi đẩy lên Cloudinary.
- **Gửi thư mục (Folder Upload/Download):**
  - **Upload:** Tự động duyệt cây thư mục từ máy khách và tải toàn bộ lên mây.
  - **Download:** Tính năng *Zip on-the-fly* (nén trực tiếp trên RAM máy chủ) cho phép người dùng tải toàn bộ thư mục về dưới dạng 1 file `.zip` duy nhất, không tạo rác trên ổ cứng Server.

### 2.6 Cuộc gọi Video (Video Call P2P - WebRTC)
- **Thiết lập kết nối ngang hàng (Peer-to-Peer):** Hình ảnh và âm thanh được truyền trực tiếp giữa 2 người dùng thông qua giao thức WebRTC, đảm bảo độ trễ thấp nhất.
- **Tích hợp STUN/TURN Server:** Đảm bảo cuộc gọi có thể vượt qua mọi tường lửa (Firewall) hoặc NAT trên các mạng 4G/Wifi công cộng.
- **Giao diện đa nhiệm:** Có thể thu nhỏ khung gọi video để vừa gọi vừa nhắn tin.
- **Lưu lịch sử cuộc gọi:** Tự động tạo bong bóng chat báo cáo "Cuộc gọi đã kết thúc" kèm thời lượng sau khi tắt máy.

### 2.7 Giao diện & Trải nghiệm Người dùng (UI/UX)
- **Dark Mode & Glassmorphism:** Thiết kế sang trọng với nền tối, kính mờ và màu sắc Neon (Cyan/Orange) nổi bật. Tùy chọn chuyển đổi qua Light Mode thông qua nút gạt độc đáo.
- **Responsive Mobile-First:** Giao diện co giãn hoàn hảo trên các thiết bị di động, không bị tràn viền (h-[100dvh]).
- **Micro-interactions:** Hiệu ứng hover, click, thả tim được bổ sung mượt mà bằng Framer Motion. Menu ngữ cảnh (Right-click / Long-press trên mobile) giúp tương tác với tin nhắn tự nhiên như ứng dụng Native.

### 2.8 Trợ lý ảo AI & Tóm tắt tin nhắn (AI Features)
- **Trợ lý ảo thông minh (AI Chatbot):** Tích hợp Google Gemini hoạt động như một trợ lý ảo, hướng dẫn người dùng mới cách sử dụng các tính năng của ứng dụng (nhắn tin, tạo nhóm, gọi video) một cách thân thiện.
- **Tóm tắt hội thoại (Chat Summarization):** Tự động đọc và tóm tắt 50 tin nhắn gần nhất, giúp người dùng nhanh chóng nắm bắt các ý chính và quyết định trong nhóm chat hoặc đoạn hội thoại cá nhân mà không cần phải cuộn lên xem lại.

---

## 3. THÔNG SỐ CÔNG NGHỆ ÁP DỤNG

### Frontend (Client)
- **Core:** React 18, Vite.
- **Styling/UI:** Tailwind CSS 4, Framer Motion, Radix UI.
- **Kết nối API & Socket:** Axios, Socket.io-client.
- **Xác thực:** `@react-oauth/google`.
- **Đa phương tiện:** WebRTC (Simple-Peer).

### Backend (Server)
- **Core:** Python 3, FastAPI, Uvicorn.
- **Database:** MongoDB, Motor (Async driver), Beanie (ODM).
- **Kết nối Socket:** `python-socketio`.
- **Bảo mật:** Bcrypt, PyJWT.
- **Dịch vụ bên thứ ba:** Cloudinary API (lưu trữ ảnh/file), Google Gemini API (Tích hợp AI).
