<div align="center">
  <h1 align="center">ChatApp - Client (Giao Diện Người Dùng)</h1>

  <p align="center">
    Mã nguồn Frontend của ChatApp, được xây dựng bằng React 19 và Vite. Giao diện Dark Mode Glassmorphism bóng bẩy, hiệu năng cao và cực kỳ mượt mà trên cả thiết bị di động lẫn máy tính để bàn.
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

* **Core:** React 19 + Vite (Build tool siêu tốc).
* **Styling:** TailwindCSS 4, responsive hoàn hảo. Styled-components cho một số UI đặc biệt.
* **Animations:** Framer Motion giúp các component và popup xuất hiện mượt mà.
* **State Management:** React Context API (`AuthContext`, `ChatContext`, `ThemeContext`).
* **Giao Tiếp Real-time:** `socket.io-client` cho nhắn tin thời gian thực.
* **Video Call P2P:** WebRTC (Simple-Peer) cho cuộc gọi Video ngang hàng.
* **Xác thực:** `@react-oauth/google` để tích hợp đăng nhập Google an toàn.
* **UI Components:** Lucide React (Bộ icon), Radix UI (Dialog, Slot), React-Hot-Toast (Thông báo).

---

## Cấu Trúc Thư Mục Chính

```
client/
├── index.html           # HTML entry point
├── vite.config.js       # Cấu hình Vite
├── package.json         # Dependencies
├── vercel.json          # Cấu hình deploy Vercel
├── public/              # Static assets (logo, demo screenshots)
├── context/             # React Context (quản lý state toàn cục)
│   ├── AuthContext.jsx      # Quản lý user, token, kết nối Socket
│   ├── ChatContext.jsx      # Quản lý tin nhắn, thao tác chat
│   └── ThemeContext.jsx     # Quản lý Dark/Light mode
└── src/
    ├── App.jsx              # Root component với routing
    ├── main.jsx             # Entry point React
    ├── index.css            # Global styles
    ├── assets/              # Hình ảnh tĩnh (avatar, logo, icons)
    ├── lib/
    │   └── utils.js         # Hàm tiện ích (format thời gian, dung lượng)
    ├── hooks/
    │   └── useVideoCall.js  # Logic WebRTC trừu tượng hóa
    ├── pages/
    │   ├── HomePage.jsx     # Trang chính (sau đăng nhập)
    │   ├── LoginPage.jsx    # Trang đăng nhập/đăng ký
    │   └── ProfilePage.jsx  # Trang cá nhân
    └── components/
        ├── ChatContainer.jsx      # Khung hiển thị & điều khiển chat
        ├── SideBar.jsx            # Thanh bên trái (danh sách bạn bè)
        ├── RightSidebar.jsx       # Thanh bên phải (chi tiết user/nhóm)
        ├── VideoCallModal.jsx     # Giao diện gọi Video P2P
        ├── AIChatBot.jsx          # Trợ lý ảo AI (Gemini)
        ├── ProfileEditModal.jsx   # Modal chỉnh sửa hồ sơ
        ├── ConfirmModal.jsx       # Modal xác nhận hành động
        ├── ReportModal.jsx        # Modal báo cáo tin nhắn
        ├── AdminReportModal.jsx   # Modal quản lý báo cáo (Admin)
        ├── ThemeToggle.jsx        # Nút chuyển đổi Dark/Light mode
        ├── hooks/                 # Hooks riêng cho components
        │   ├── use-character-limit.js
        │   └── use-image-upload.js
        └── ui/                    # UI Components tái sử dụng
            ├── button.jsx
            ├── dialog.jsx
            ├── input.jsx
            ├── label.jsx
            ├── textarea.jsx
            ├── ShinyButton.jsx
            ├── GradientButton.jsx
            ├── SparklesText.jsx
            ├── ExpandableTabs.jsx
            ├── floating-action-menu.jsx
            ├── star-wars-toggle-switch.jsx
            ├── static-aurora-background.jsx
            └── wave-text.jsx
```

---

## Tính Năng Giao Diện Nổi Bật

1. **Dark Mode & Light Mode:** Chuyển đổi theme qua nút gạt Star Wars, lưu trạng thái vào localStorage.
2. **Chống Tràn Viền Mobile:** Áp dụng `h-[100dvh]` và `absolute inset-0` để ngăn lỗi trình duyệt mobile che mất navigation.
3. **Thả Cảm Xúc (Long-press):** Bắt sự kiện chạm 500ms để hiện thanh cảm xúc giống ứng dụng Native trên điện thoại.
4. **Cuộn Thông Minh (Smart Auto-Scroll):** Tự cuộn xuống tin mới khi ở cuối, không làm phiền khi đang xem lịch sử.
5. **Xác Thực Đa Kênh:** Đăng nhập truyền thống + Google OAuth thông qua `@react-oauth/google`.

---

## Cấu Hình Môi Trường (Environment Variables)

Tạo file `.env` ở thư mục gốc của `/client`:

```env
# URL của Server Backend (Dùng để kết nối API và Socket.IO)
VITE_BACKEND_URL=http://localhost:5001
```

## Khởi Chạy

```bash
# Cài đặt thư viện
pnpm install

# Chạy server phát triển
pnpm run dev
```