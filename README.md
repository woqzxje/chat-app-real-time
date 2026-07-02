<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/Socket.io-010101?&style=for-the-badge&logo=Socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</div>

<br />
<div align="center">
  <a href="#">
    <!-- Thay đổi URL ảnh bên dưới thành link logo thực tế của bạn nếu có -->
    <img src="client/public/logo.jpg" alt="Logo" width="120" height="120" style="border-radius: 20px;">
  </a>

  <h1 align="center">ChatITC (Realtime MERN Chat App)</h1>

  <p align="center">
    Một ứng dụng trò chuyện thời gian thực hiện đại, thiết kế theo phong cách Glassmorphism tuyệt đẹp, tích hợp cuộc gọi Video ngang hàng (P2P) và truyền tệp đa phương tiện.
    <br />
    <br />
    <a href="#usage"><strong>Khám phá tài liệu »</strong></a>
    <br />
    <br />
    <a href="#">Xem Demo (Sắp tới)</a>
    ·
    <a href="#">Báo cáo Lỗi</a>
    ·
    <a href="#">Yêu cầu Tính năng</a>
  </p>
</div>

---

<details>
  <summary><h2>📖 Mục lục (Table of Contents)</h2></summary>
  <ol>
    <li><a href="#about-the-project">Về Dự Án</a></li>
    <li><a href="#built-with">Công Nghệ Sử Dụng</a></li>
    <li><a href="#key-features">Các Tính Năng Chính</a></li>
    <li>
      <a href="#getting-started">Hướng Dẫn Cài Đặt</a>
      <ul>
        <li><a href="#prerequisites">Điều Kiện Kiên Quyết</a></li>
        <li><a href="#installation">Cài Đặt</a></li>
      </ul>
    </li>
    <li><a href="#usage">Cách Sử Dụng</a></li>
    <li><a href="#roadmap">Định Hướng Phát Triển (Roadmap)</a></li>
    <li><a href="#contributing">Đóng Góp</a></li>
    <li><a href="#license">Giấy Phép</a></li>
    <li><a href="#contact">Liên Hệ</a></li>
  </ol>
</details>

---

## 🚀 About The Project (Về Dự Án)

**ChatITC** không chỉ là một ứng dụng nhắn tin thông thường, mà còn là một nền tảng giao tiếp toàn diện được xây dựng từ đầu (from scratch) nhằm cung cấp trải nghiệm mượt mà, bảo mật và thân thiện với người dùng. Điểm nhấn lớn nhất của dự án nằm ở **giao diện UI/UX được chau chuốt cực kỳ kĩ lưỡng** với tông màu Đen - Xanh Cyan chủ đạo, kết hợp hiệu ứng kính mờ (Glassmorphism) và các Animation linh hoạt mang lại cảm giác cao cấp.

Dự án giải quyết nhu cầu có một hệ thống giao tiếp đa kênh (Text, Ảnh, Video, Tập tin, Gọi Video) mà vẫn duy trì được tốc độ nhanh chóng thông qua việc kết hợp Socket.IO và WebRTC.

---

## 🛠 Built With (Công Nghệ Sử Dụng)

Ứng dụng được xây dựng trên nền tảng **MERN Stack** cùng hàng loạt công nghệ hiện đại ở phía Client để tối ưu hóa hiệu suất và trải nghiệm đồ họa.

* ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB) **React 18**
* ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white) **Vite** (Build Tool)
* ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white) **Tailwind CSS** (UI Styling)
* ![Framer](https://img.shields.io/badge/Framer_Motion-black?style=flat&logo=framer&logoColor=blue) **Framer Motion** (Animations)
* ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white) **Node.js & Express**
* ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat&logo=mongodb&logoColor=white) **MongoDB** & Mongoose
* ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&badgeColor=010101) **Socket.IO** (Real-time Messaging)
* ![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=flat&logo=webrtc&logoColor=white) **WebRTC** (P2P Video Call)

---

## ✨ Key Features (Tính Năng Chính)

- **Nhắn tin Thời gian thực**: Gửi và nhận tin nhắn không độ trễ nhờ Socket.IO.
- **Gọi Video Trực Tuyến**: WebRTC (Peer-to-Peer) cho phép đàm thoại video sắc nét, đi kèm Modal từ chối/nhận cuộc gọi.
- **Gửi Tệp Tin & Thư Mục**: Hỗ trợ gửi ảnh, video, tài liệu, đính kèm và tự động nén thư mục (zip) trước khi gửi.
- **Glassmorphism UI**: Thiết kế giao diện trong suốt, viền sáng (glowing borders) và hiệu ứng chuyển cảnh mượt mà.
- **Xác thực An toàn**: Đăng ký, Đăng nhập (với JWT) và Quản lý Hồ sơ (Đổi Avatar/Bio).

---

## ⚙️ Getting Started (Hướng Dẫn Cài Đặt)

Làm theo các bước dưới đây để sao chép (clone) dự án và chạy trên máy tính (local) của bạn.

### Prerequisites
Hãy đảm bảo bạn đã cài đặt các công cụ sau:
* Node.js (phiên bản >= 18.x)
* pnpm (Trình quản lý package được khuyên dùng cho Frontend)
  ```sh
  npm install -g pnpm
  ```

### Installation

1. **Clone kho lưu trữ này**
   ```sh
   git clone https://github.com/woqzxje/chat-app.git
   cd chat-app
   ```

2. **Cài đặt thư viện phía Server (Backend)**
   ```sh
   cd server
   npm install
   ```

3. **Cấu hình Biến môi trường (Server)**
   Tạo file `.env` trong thư mục `server` và thêm các thông số:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/
   JWT_SECRET=your_super_secret_key
   CLOUDINARY_URL=cloudinary://...
   ```

4. **Cài đặt thư viện phía Client (Frontend)**
   Mở một Terminal mới:
   ```sh
   cd client
   pnpm install
   ```

5. **Cấu hình Biến môi trường (Client)**
   Tạo file `.env` trong thư mục `client`:
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```

---

## 💻 Usage (Cách Sử Dụng)

Để khởi chạy dự án, bạn cần khởi chạy cùng lúc cả Server và Client.

**Khởi chạy Server (Terminal 1):**
```sh
cd server
npm run dev
# Hoặc nếu dùng script Python có sẵn:
py run.py
```

**Khởi chạy Client (Terminal 2):**
```sh
cd client
pnpm run dev
```

> [!NOTE] 
> Sau khi khởi chạy thành công, truy cập ứng dụng thông qua trình duyệt tại địa chỉ: `http://localhost:5173`

---

## 🗺 Roadmap (Định Hướng)

- [x] Thiết kế lại giao diện Dark/Cyan Glassmorphism
- [x] Tích hợp Custom Animations (FlickerSpinner)
- [x] WebRTC Video Call cơ bản
- [ ] Tính năng Chat Nhóm (Group Chat)
- [ ] Phản hồi tin nhắn (Reactions) bằng Emojis
- [ ] Ghi âm (Voice Messages)
- [ ] Triển khai lên Vercel / Render

---

## 🤝 Contributing (Đóng Góp)

Những đóng góp của cộng đồng chính là điều làm cho Open Source trở thành một nơi tuyệt vời để học hỏi, truyền cảm hứng và sáng tạo. Bất kỳ sự đóng góp nào của bạn cũng được **đánh giá cao**.

Nếu bạn có gợi ý muốn cải thiện ứng dụng này, vui lòng fork repo và tạo pull request. Bạn cũng có thể mở issue với tag "enhancement". Đừng quên cho dự án 1 ⭐️ nhé! Cảm ơn bạn!

1. Fork Dự Án
2. Tạo Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Thay Đổi (`git commit -m 'Thêm một tính năng tuyệt vời'`)
4. Push lên Branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📜 License (Giấy Phép)

Phân phối theo giấy phép MIT. Xem thêm `LICENSE` để biết thông tin chi tiết.

---

## 📬 Contact (Liên Hệ)

**Tác giả:** [woqzxje](https://github.com/woqzxje)

**Repository Link:** [https://github.com/woqzxje/chat-app](https://github.com/woqzxje/chat-app)

---
<p align="center">Made with ❤️ by woqzxje</p>
