<div align="center">
  <h1 align="center">ChatApp - Client (Giao Diện Người Dùng)</h1>

  <p align="center">
    Mã nguồn Frontend của ChatApp, được xây dựng bằng ReactJS và Vite. Nó cung cấp một giao diện Dark Mode bóng bẩy, hiệu năng cao và cực kỳ mượt mà trên cả thiết bị di động lẫn máy tính để bàn.
  </p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Socket.io-010101?&style=for-the-badge&logo=Socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google OAuth" />
</div>

<br />

---

## Công Nghệ Nền Tảng

* **Core:** ReactJS 19 + Vite (Build tool siêu tốc).
* **Styling:** TailwindCSS 4, hỗ trợ responsive hoàn hảo qua các thẻ tiện ích.
* **Animations:** Framer Motion & GSAP giúp các biểu tượng và popup xuất hiện mượt mà.
* **State Management:** React Context API (`AuthContext`, `ChatContext`).
* **Giao Tiếp (Real-time):** `socket.io-client` cho nhắn tin & `simple-peer` cho WebRTC Video Call.
* **Xác thực (Auth):** `@react-oauth/google` để tích hợp đăng nhập Google an toàn.
* **Kết nối Mạng (Video Call):** Kết nối P2P được đảm bảo bởi STUN/TURN server mạnh mẽ từ **Metered.ca** và **Cloudflare/Twilio** giúp đàm thoại không gián đoạn.
* **UI Components:** `lucide-react` (Bộ icon tối giản), React-Hot-Toast (Thông báo nổi).

---

## Cấu Trúc Thư Mục Chính

Toàn bộ logic cốt lõi nằm trong thư mục `/src`:
* `assets/`: Chứa hình ảnh tĩnh, avatar mặc định, logo.
* `components/`: Các thành phần tái sử dụng.
  * `ChatContainer.jsx`: Khung hiển thị và điều khiển luồng chat (chứa `MessageItem`, `AttachmentBubble`, `CallBubble`).
  * `SideBar.jsx` & `RightSidebar.jsx`: Thanh công cụ hai bên.
  * `VideoCallModal.jsx`: Giao diện gọi điện P2P.
  * `ui/`: Các thành phần giao diện nhỏ như Button, FlickerSpinner.
* `context/`: Quản lý trạng thái toàn cầu.
  * `AuthContext.jsx`: Quản lý user, token, thiết lập kết nối Socket.
  * `ChatContext.jsx`: Quản lý danh sách tin nhắn, thao tác với tin nhắn (gửi, sửa, thu hồi, thả cảm xúc).
* `hooks/`: 
  * `useVideoCall.js`: Trừu tượng hóa logic phức tạp của WebRTC ra khỏi component giao diện.
* `pages/`: Các trang chính (`HomePage`, `LoginPage`, `ProfilePage`).
* `lib/`: Chứa file `utils.js` (hàm tiện ích format thời gian, định dạng dung lượng file).

---

## Tính Năng Giao Diện Nổi Bật

1. **Chống Tràn Viền Mobile:** Áp dụng thuật toán tính chiều cao động `h-[100dvh]` và `absolute inset-0` để ngăn chặn lỗi trình duyệt điện thoại che mất các thành phần điều hướng.
2. **Trải Nghiệm Thả Cảm Xúc (Long-press):** Bắt sự kiện chạm cảm ứng 500ms để hiện thanh cảm xúc giống ứng dụng gốc (Native App) trên điện thoại di động.
3. **Cuộn Thông Minh (Smart Auto-Scroll):** Theo dõi vị trí cuộn chuột; tự động cuộn xuống khi có tin nhắn mới nếu người dùng đang ở cuối, nhưng không làm phiền nếu họ đang xem lịch sử cũ.
4. **Xác Thực Đa Kênh:** Đăng nhập truyền thống và hỗ trợ Google OAuth thông qua `@react-oauth/google`.

---

## Cấu Hình Môi Trường (Environment Variables)

Tạo file `.env` ở thư mục gốc của `/client` với các biến sau:

```env
# URL của Server Backend (Dùng để kết nối API và Socket.IO)
VITE_BACKEND_URL=http://localhost:5001

# Google Client ID (Dành cho tính năng đăng nhập Google)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Khởi Chạy

```bash
# Cài đặt thư viện
pnpm install

# Chạy server lập trình
pnpm run dev
```