import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Contexts
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';

// Assets & UI Components
import assets from '../assets/assets';
import FlickerSpinner from './ui/FlickerSpinner';

/**
 * SideBar Component
 * 
 * Chức năng: Hiển thị thanh bên trái của giao diện chat.
 * Bao gồm: 
 * - Logo ứng dụng và Menu tùy chọn (Edit Profile, Logout).
 * - Thanh tìm kiếm người dùng (có hiệu ứng viền phát sáng mượt mà).
 * - Danh sách người dùng để bắt đầu trò chuyện (có hiển thị trạng thái online/offline và số tin nhắn chưa đọc).
 * 
 * Liên kết:
 * - Render trong `HomePage.jsx`.
 * - Tương tác dữ liệu từ `AuthContext` (để logout, check online) và `ChatContext` (để lấy danh sách user, set người đang chat).
 */
const SideBar = () => {
  // 1. --- Hooks & Contexts ---
  
  // Lấy dữ liệu và các hàm quản lý trạng thái chat từ ChatContext
  const { 
    users,              // Danh sách toàn bộ người dùng từ server
    selectedUser,       // Đối tượng người dùng đang được chọn để chat
    setSelectedUser,    // Hàm cập nhật người dùng đang chat
    unseenMessages,     // Object lưu trữ số tin nhắn chưa đọc { userId: count }
    setUnseenMessages   // Hàm cập nhật số tin nhắn chưa đọc
  } = useContext(ChatContext);

  // Lấy dữ liệu xác thực từ AuthContext
  const { 
    logout,             // Hàm đăng xuất tài khoản
    onlineUser          // Mảng chứa ID của các người dùng đang online (realtime từ Socket)
  } = useContext(AuthContext);

  // Hook điều hướng trang của react-router-dom
  const navigate = useNavigate();

  // 2. --- Local State ---
  
  // Lưu trữ giá trị văn bản người dùng nhập vào thanh tìm kiếm
  const [input, setInput] = useState('');

  // 3. --- Lọc dữ liệu (Derived State) ---
  
  // Lọc danh sách người dùng dựa theo giá trị tìm kiếm (không phân biệt hoa/thường)
  const filteredUsers = input 
    ? users.filter((u) => u.fullName.toLowerCase().includes(input.toLowerCase())) 
    : users;

  // 4. --- Giao diện (Render) ---
  return (
    <div className={`bg-[#8185B2]/10 h-full p-6 overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ''}`}>
      
      {/* KHU VỰC HEADER: Logo và Menu */}
      <div className='pb-6'>
        <div className='flex justify-between items-center gap-4'>
          
          {/* Logo & Tên ứng dụng */}
          <div className="flex items-center gap-3 font-extrabold text-xl tracking-wider text-white">
            <FlickerSpinner size={32} />
            <span>ChatITC</span>
          </div>

          {/* Menu Dropdown */}
          <div className="relative py-2 group">
            <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
            <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#0e2230] border border-gray-600 text-gray-100 hidden group-hover:block shadow-xl'>
              <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm hover:text-cyan-400 transition-colors'>Edit Profile</p>
              <hr className="my-2 border-t border-gray-500" />
              <p onClick={() => logout()} className='cursor-pointer text-sm hover:text-cyan-400 transition-colors'>Logout</p>
            </div>
          </div>
        </div>

        {/* KHU VỰC TÌM KIẾM: Thanh Search với hiệu ứng Glassmorphism & Animated Border */}
        <div className='relative mt-6 rounded-full overflow-hidden p-[1px] group shadow-[0_0_15px_rgba(0,207,255,0.1)] hover:shadow-[0_0_20px_rgba(0,207,255,0.2)] focus-within:shadow-[0_0_25px_rgba(0,207,255,0.3)] transition-all duration-300'>
          
          {/* Các tia sáng chạy dọc viền (Framer Motion) */}
          <div className="absolute inset-0 z-0 opacity-50 group-focus-within:opacity-100 transition-opacity duration-300">
            {/* Tia trên chạy từ trái sang phải */}
            <motion.div className="absolute top-0 left-0 h-[2px] w-[50%]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,207,255,1), transparent)', filter: 'blur(1px)' }}
              animate={{ left: ["-50%", "100%"] }} transition={{ duration: 2.5, ease: "linear", repeat: Infinity }} />
            {/* Tia dưới chạy từ phải sang trái */}
            <motion.div className="absolute bottom-0 right-0 h-[2px] w-[50%]"
              style={{ background: 'linear-gradient(270deg, transparent, rgba(0,207,255,1), transparent)', filter: 'blur(1px)' }}
              animate={{ right: ["-50%", "100%"] }} transition={{ duration: 2.5, ease: "linear", repeat: Infinity }} />
          </div>

          {/* Ô nhập liệu nền kính mờ */}
          <div className='relative z-10 bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-full flex items-center gap-3 py-3 px-5'>
            <img src={assets.search_icon} alt="Search" className='w-4 opacity-70 group-focus-within:opacity-100 transition-opacity' />
            <input 
              onChange={(e) => setInput(e.target.value)} 
              value={input} 
              type="text" 
              className='bg-transparent border-none outline-none text-white text-base placeholder-gray-400 flex-1' 
              placeholder='Search User...' 
            />
          </div>
        </div>
      </div>

      {/* KHU VỰC DANH SÁCH NGƯỜI DÙNG */}
      <div className='flex flex-col gap-3'>
        {filteredUsers.map((user) => (
          <div 
            key={user._id}
            onClick={() => { 
              // Khi bấm vào 1 user: Đặt user đó làm mục tiêu chat và reset số tin nhắn chưa đọc về 0
              setSelectedUser(user); 
              setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
            }}
            className={`relative flex items-center gap-3 p-4 pl-5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${selectedUser?._id === user._id && 'bg-[#00cfff]/15 hover:bg-[#00cfff]/20'}`}
          >
            {/* Ảnh đại diện */}
            <img src={user?.profilePic || assets.avatar_icon} alt="Avatar" className='w-12 aspect-square rounded-full object-cover' />
            
            {/* Thông tin tên và trạng thái */}
            <div className='flex flex-col leading-6'>
              <p className='text-base font-medium'>{user.fullName}</p>
              {
                onlineUser.includes(user._id)
                  ? <span className='text-green-400 text-sm'>Online</span>
                  : <span className='text-neutral-400 text-sm'>Offline</span>
              }
            </div>
            
            {/* Badge thông báo số lượng tin nhắn chưa đọc */}
            {unseenMessages && unseenMessages[user._id] > 0 && (
              <p className='absolute top-4 right-4 bg-cyan-500 text-sm rounded-full w-6 h-6 flex items-center justify-center text-white shadow-[0_0_10px_rgba(0,207,255,0.5)]'>
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SideBar;
