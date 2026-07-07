<div align="center">
  <br />
  <a href="#">
    <img src="client/public/logo.jpg" alt="ChatITC Logo" width="140" height="140" style="border-radius: 24px;">
  </a>

  <h1>💬 ChatITC — Ứng dụng Nhắn tin Thời gian thực</h1>

  <p>
    <b>Full-Stack Real-time Chat Application</b> với giao diện <b>Dark Glassmorphism</b> hiện đại,
    <br /> tích hợp Video Call P2P, AI Chatbot, và truyền tệp đa phương tiện.
  </p>

  <br />

  <a href="https://chat-app-itc.vercel.app"><img src="https://img.shields.io/badge/🌐_Live_Demo-chat--app--itc.vercel.app-0ea5e9?style=for-the-badge" alt="Live Demo" /></a>
  <a href="#-hướng-dẫn-cài-đặt"><img src="https://img.shields.io/badge/📦_Cài_Đặt-Hướng_Dẫn-22c55e?style=for-the-badge" alt="Installation" /></a>
  <a href="#-tài-liệu-kỹ-thuật"><img src="https://img.shields.io/badge/📖_Tài_Liệu-Kỹ_Thuật-a855f7?style=for-the-badge" alt="Documentation" /></a>

</div>

<br />

<div align="center">

  ![React](https://img.shields.io/badge/React_19-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![Vite](https://img.shields.io/badge/Vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
  ![Python](https://img.shields.io/badge/Python_3-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![Socket.io](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=Socket.io&logoColor=white)
  ![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
  ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white)
  ![Google OAuth](https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)
  ![Gemini AI](https://img.shields.io/badge/Gemini_AI-886FBF?style=for-the-badge&logo=googlegemini&logoColor=white)

</div>

<br />

<div align="center">
  <img src="client/public/demo-chat.png" alt="Main Chat Interface" width="800" style="border-radius: 12px;">
  <br /><br />
  <img src="client/public/demo-login.png" alt="Login Interface" width="800" style="border-radius: 12px;">
</div>

<br />

---

## 📋 Mục lục

- [🏗️ Kiến trúc Hệ thống](#️-kiến-trúc-hệ-thống)
- [✨ Tính năng Chính](#-tính-năng-chính)
- [🛠️ Công nghệ Sử dụng](#️-công-nghệ-sử-dụng)
- [📦 Hướng dẫn Cài đặt](#-hướng-dẫn-cài-đặt)
- [🚀 Khởi chạy Dự án](#-khởi-chạy-dự-án)
- [📖 Tài liệu Kỹ thuật](#-tài-liệu-kỹ-thuật)
- [🗂️ Cấu trúc Thư mục](#️-cấu-trúc-thư-mục)
- [🗺️ Roadmap](#️-roadmap)
- [👥 Thành viên Nhóm](#-thành-viên-nhóm)
- [📄 Giấy phép](#-giấy-phép)

---

## 🏗️ Kiến trúc Hệ thống

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19 + Vite)                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ LoginPage│  │ChatContainer │  │  SideBar   │  │ VideoCall    │  │
│  │ HomePage │  │RightSidebar  │  │  AIChatBot │  │ ProfileEdit  │  │
│  └──────────┘  └──────────────┘  └────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │    AuthContext  ←→  ChatContext  ←→  ThemeContext            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                    ↕ Axios (HTTP)          ↕ Socket.IO-client       │
└─────────────────────────────────────────────────────────────────────┘
                              │                        │
                    ┌─────────┴────────────────────────┴───────┐
                    │         SERVER (FastAPI + Python)         │
                    │  ┌──────────────────────────────────────┐│
                    │  │  main.py (ASGI: FastAPI + SocketIO)  ││
                    │  └──────────────────────────────────────┘│
                    │  ┌────────────┐  ┌───────────────────┐   │
                    │  │ Routes:    │  │ Core:             │   │
                    │  │ • user     │  │ • socket_manager  │   │
                    │  │ • message  │  │ • models (Beanie) │   │
                    │  │ • file     │  │ • database        │   │
                    │  │ • ai       │  │ • dependencies    │   │
                    │  │ • report   │  │ • email_service   │   │
                    │  └────────────┘  └───────────────────┘   │
                    │                    ↕                      │
                    │  ┌──────────────────────────────────────┐│
                    │  │  MongoDB Atlas  │  Cloudinary CDN    ││
                    │  │  Brevo Email    │  Google Gemini AI  ││
                    │  └──────────────────────────────────────┘│
                    └──────────────────────────────────────────┘
```

> **Client** và **Server** là 2 project độc lập, giao tiếp qua HTTP REST API + WebSocket (Socket.IO).

---

## ✨ Tính năng Chính

### 🔐 Xác thực & Bảo mật
| Tính năng | Mô tả |
|:---|:---|
| Đăng ký / Đăng nhập | Mật khẩu mã hóa **Bcrypt**, xác thực **OTP qua email** (Brevo API) |
| Google OAuth 2.0 | Đăng nhập nhanh bằng tài khoản Google |
| Quên mật khẩu | Khôi phục mật khẩu qua mã OTP gửi về email |
| JWT Token | Quản lý phiên đăng nhập, bảo vệ tất cả API endpoint |

### 💬 Nhắn tin Thời gian thực
| Tính năng | Mô tả |
|:---|:---|
| Chat tức thời | Nhắn tin không độ trễ qua **WebSocket (Socket.IO)** |
| Read Receipts | Trạng thái "Đã gửi" → "Đã xem" cập nhật real-time |
| Thu hồi tin nhắn | Soft Delete — giữ khung "Tin nhắn đã bị thu hồi" |
| Chỉnh sửa tin nhắn | Cập nhật nội dung tin nhắn đã gửi |
| Thả cảm xúc | React emoji (❤️ 😂 😮...) lên từng tin nhắn |
| Báo cáo tin nhắn | Report vi phạm, Admin xử lý & cấm chat |

### 👥 Hệ thống Xã hội
| Tính năng | Mô tả |
|:---|:---|
| Tìm kiếm người dùng | Tìm theo tên/email, **hỗ trợ tiếng Việt không dấu** |
| Kết bạn | Gửi / Chấp nhận / Từ chối lời mời — thông báo **real-time** |
| Chat Nhóm | Tạo nhóm, thêm/kích thành viên, đổi tên/avatar nhóm |
| Lưu trữ hội thoại | Archive chat cá nhân và nhóm |

### 📹 Gọi Video P2P (WebRTC)
| Tính năng | Mô tả |
|:---|:---|
| Video Call ngang hàng | Kết nối trực tiếp Camera → Màn hình qua **WebRTC** |
| STUN/TURN Server | Vượt tường lửa, NAT trên mọi mạng (4G, Wifi công cộng) |
| Giao diện đa nhiệm | Thu nhỏ khung gọi, vừa gọi vừa nhắn tin |
| Lịch sử cuộc gọi | Tự động lưu tin nhắn "Cuộc gọi kết thúc" kèm thời lượng |

### 📁 Truyền tệp Đa phương tiện
| Tính năng | Mô tả |
|:---|:---|
| Upload ảnh/file | Nén ảnh phía Client trước khi đẩy lên **Cloudinary CDN** |
| Upload thư mục | Duyệt cây thư mục, giữ nguyên cấu trúc folder |
| Download thư mục | **Zip on-the-fly** — nén ZIP trực tiếp trên RAM Server |

### 🤖 Trí tuệ Nhân tạo (Google Gemini)
| Tính năng | Mô tả |
|:---|:---|
| AI Chatbot | Trợ lý ảo hướng dẫn sử dụng ứng dụng bằng tiếng Việt |
| Tóm tắt hội thoại | Tóm tắt 50 tin nhắn gần nhất bằng Gemini AI |

### 🎨 Giao diện & Trải nghiệm
| Tính năng | Mô tả |
|:---|:---|
| Dark/Light Mode | Chuyển đổi theme với hiệu ứng mượt mà |
| Glassmorphism | Thiết kế kính mờ sang trọng, Neon Cyan/Orange |
| Mobile-First | Responsive hoàn hảo, `100dvh`, Smart Auto-Scroll |
| Micro-interactions | Framer Motion animations, long-press, context menu |

---

## 🛠️ Công nghệ Sử dụng

<table>
<tr>
<td width="50%">

### 🖥️ Frontend
| Công nghệ | Vai trò |
|:---|:---|
| React 19 | UI Library |
| Vite | Build Tool & Dev Server |
| Tailwind CSS 4 | Styling Framework |
| Framer Motion | Animation Library |
| Axios | HTTP Client |
| Socket.IO Client | WebSocket Client |
| Simple-Peer | WebRTC P2P Library |
| React OAuth Google | Google Login SDK |

</td>
<td width="50%">

### ⚙️ Backend
| Công nghệ | Vai trò |
|:---|:---|
| Python 3 + FastAPI | Web Framework (Async) |
| Uvicorn | ASGI Server |
| python-socketio | WebSocket Server |
| MongoDB + Motor | Database (Async Driver) |
| Beanie | ODM (Object Document Mapper) |
| Bcrypt + PyJWT | Mã hóa & Token |
| Cloudinary SDK | Lưu trữ File/Ảnh |
| Google Gemini API | Tích hợp AI |
| Brevo API | Gửi email OTP |

</td>
</tr>
</table>

---

## 📦 Hướng dẫn Cài đặt

### Yêu cầu Hệ thống
- **Node.js** ≥ 18.x và **pnpm** (hoặc npm)
- **Python** ≥ 3.9
- **Git**

### Bước 1 — Clone Dự án

```bash
git clone https://github.com/woqzxje/chat-app-with-python.git
cd chat-app-with-python
```

### Bước 2 — Cài đặt Server (Backend)

```bash
cd server
pip install -r requirements.txt
```

Tạo file `.env` trong thư mục `server/`:

```env
# Database
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/quickchat

# Server
PORT=5000
JWT_SECRET=your_super_secret_key

# Cloudinary (Lưu trữ file/ảnh)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Brevo Email Service (Gửi OTP)
BREVO_API_KEY=your_brevo_api_key
BREVO_EMAIL=your_sender_email@gmail.com
```

### Bước 3 — Cài đặt Client (Frontend)

```bash
cd client
pnpm install
```

Tạo file `.env` trong thư mục `client/`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🚀 Khởi chạy Dự án

Mở **2 Terminal** cùng lúc:

```bash
# Terminal 1 — Khởi chạy Server
cd server
python run.py
```

```bash
# Terminal 2 — Khởi chạy Client
cd client
pnpm run dev
```

> 🌐 Mở trình duyệt: **http://localhost:5173**

---

## 📖 Tài liệu Kỹ thuật

| Tài liệu | Nội dung | File |
|:---|:---|:---|
| **Báo cáo Tổng hợp** | Kiến trúc, API, Socket Events, phân chia công việc | [`Bao_Cao_Tong_Hop.md`](Bao_Cao_Tong_Hop.md) |
| **Giải thích Code** | Data Flow chi tiết từ Frontend → Backend → Database | [`Giai_Thich_Code_Chi_Tiet.md`](Giai_Thich_Code_Chi_Tiet.md) |

---

## 🗂️ Cấu trúc Thư mục

```
ChatApp/
├── client/                          # Frontend (React 19 + Vite)
│   ├── context/                     # State Management
│   │   ├── AuthContext.jsx          #   Xác thực, JWT, Socket connection
│   │   ├── ChatContext.jsx          #   Quản lý tin nhắn, nhóm, real-time
│   │   └── ThemeContext.jsx         #   Dark/Light mode
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatContainer.jsx    #   Khung chat chính (gửi/nhận tin nhắn)
│   │   │   ├── SideBar.jsx          #   Sidebar: danh sách bạn bè, nhóm, tìm kiếm
│   │   │   ├── RightSidebar.jsx     #   Thông tin user/nhóm, quản lý thành viên
│   │   │   ├── VideoCallModal.jsx   #   Giao diện gọi Video (WebRTC)
│   │   │   ├── AIChatBot.jsx        #   Modal AI Chatbot (Gemini)
│   │   │   ├── AdminReportModal.jsx #   Quản lý báo cáo (Admin)
│   │   │   └── ...                  #   Các modal phụ trợ
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        #   Trang đăng nhập/đăng ký + OTP
│   │   │   ├── HomePage.jsx         #   Trang chính (layout chứa Sidebar + Chat)
│   │   │   └── ProfilePage.jsx      #   Trang hồ sơ cá nhân
│   │   └── index.css                #   Global styles
│   └── package.json
│
├── server/                          # Backend (FastAPI + Python)
│   ├── app/
│   │   ├── routes/
│   │   │   ├── user_routes.py       #   Auth, bạn bè, profile, quên mật khẩu
│   │   │   ├── message_routes.py    #   Chat, nhóm, reaction, thu hồi
│   │   │   ├── file_routes.py       #   Upload/Download file & folder
│   │   │   ├── ai_routes.py         #   AI Chatbot & tóm tắt tin nhắn
│   │   │   └── report_routes.py     #   Báo cáo & cấm chat
│   │   ├── models.py                #   MongoDB Schemas (User, Message, Group...)
│   │   ├── database.py              #   Kết nối MongoDB (Motor + Beanie)
│   │   ├── socket_manager.py        #   Real-time & WebRTC Signaling
│   │   ├── dependencies.py          #   JWT Middleware
│   │   ├── email_service.py         #   Gửi email OTP (Brevo API)
│   │   ├── cloudinary_client.py     #   Cloudinary SDK config
│   │   └── utils.py                 #   Hàm tiện ích (generate_token...)
│   ├── main.py                      #   Entry point — FastAPI + Socket.IO ASGI
│   ├── run.py                       #   Script chạy Uvicorn
│   ├── requirements.txt             #   Python dependencies
│   └── .env                         #   Biến môi trường (bảo mật)
│
├── Bao_Cao_Tong_Hop.md              # 📊 Tài liệu báo cáo dự án
├── Giai_Thich_Code_Chi_Tiet.md      # 📖 Giải thích code chi tiết A-Z
├── render.yaml                      #   Cấu hình deploy Render
└── README.md                        # 📋 File này
```

---

## 🗺️ Roadmap

- [x] Đăng ký / Đăng nhập (Traditional + Google OAuth 2.0)
- [x] Xác thực OTP qua email (Brevo API)
- [x] Quên mật khẩu & Đặt lại mật khẩu
- [x] Hệ thống kết bạn real-time
- [x] Nhắn tin thời gian thực + Read Receipts
- [x] Thu hồi, Chỉnh sửa, Thả cảm xúc tin nhắn
- [x] Chat Nhóm (tạo, quản lý thành viên, giải tán)
- [x] Video Call P2P (WebRTC + STUN/TURN)
- [x] Upload/Download File & Folder (Zip on-the-fly)
- [x] AI Chatbot & Tóm tắt hội thoại (Google Gemini)
- [x] Dark/Light Mode Glassmorphism UI
- [x] Responsive Mobile-First
- [x] Hệ thống Admin: Báo cáo, Cấm chat, Gỡ cấm
- [x] Lưu trữ (Archive) hội thoại
- [x] Deploy lên Vercel (Frontend) + Render (Backend)

---

## 👥 Thành viên Nhóm

<table>
<tr>
<td align="center" width="50%">
<h3>Mạnh Quỳnh</h3>
<b>Backend Developer & System Architect</b>
<br /><br />
Kiến trúc Server (FastAPI), Database (MongoDB),<br />
WebSocket real-time, WebRTC Signaling,<br />
Tích hợp AI (Gemini), Cloudinary, Email OTP
</td>
<td align="center" width="50%">
<h3>Duy Khánh</h3>
<b>Frontend Developer & UI/UX Designer</b>
<br /><br />
Giao diện React (Glassmorphism UI),<br />
Logic WebRTC Client, Context API,<br />
Responsive Mobile-First, Framer Motion
</td>
</tr>
</table>

---

## 📄 Giấy phép

Dự án được phân phối theo giấy phép **MIT**. Xem file `LICENSE` để biết thêm chi tiết.

---

<div align="center">

**Repository:** [github.com/woqzxje/chat-app-with-python](https://github.com/woqzxje/chat-app-with-python)

Made with ❤️ by **Mạnh Quỳnh** & **Duy Khánh**

</div>
