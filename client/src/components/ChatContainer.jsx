import React, { useContext, useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChatContainer = () => {

  // Lấy dữ liệu tin nhắn, người dùng đang chọn và các hàm xử lý từ ChatContext
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext)

  // Lấy thông tin người dùng hiện tại và danh sách online từ AuthContext
  const { authUser, onlineUser } = useContext(AuthContext)

  // Tham chiếu đến phần tử cuối cùng của danh sách tin nhắn để tự động cuộn xuống
  const scrollEnd = useRef();

  // Trạng thái lưu trữ văn bản tin nhắn đang nhập
  const [input, setInput] = useState('');

  // Hàm xử lý gửi tin nhắn văn bản
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return null; // Không gửi tin nhắn trống
    await sendMessage({ text: input.trim() });
    setInput("") // Xóa nội dung ô nhập sau khi gửi
  }

  // Hàm xử lý gửi tin nhắn hình ảnh
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một file hình ảnh hợp lệ")
      return;
    }
    
    // Đọc file ảnh dưới dạng base64 để gửi lên server
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "" // Reset input file
    }
    reader.readAsDataURL(file);
  }

  // Tải lịch sử tin nhắn mỗi khi người dùng đang chat cùng (selectedUser) thay đổi
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id)
    }
  }, [selectedUser])

  // Tự động cuộn xuống cuối danh sách mỗi khi có tin nhắn mới
  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Nếu đã chọn người dùng để chat, hiển thị khung chat
  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      
      {/* ------------ Phần tiêu đề Chat (Header) ------------- */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="Avatar" className='w-8 rounded-full' />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {/* Hiển thị chấm xanh nếu người dùng này đang online */}
          {onlineUser.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </p>
        {/* Nút đóng khung chat trên thiết bị di động */}
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="Đóng" className='md:hidden max-w-7' />
        <img src={assets.help_icon} alt="Trợ giúp" className='max-md:hidden max-w-5' />
      </div>

      {/* ------------ Khu vực hiển thị tin nhắn (Chat Area) ------------- */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            {/* Hiển thị ảnh nếu tin nhắn có ảnh */}
            {msg.image ? (
              <img src={msg.image} alt="Sent content" className='max-w[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
            ) : (
              /* Hiển thị văn bản tin nhắn */
              <p className={`p-2 max-w-50 md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>
            )}
            
            {/* Hiển thị ảnh đại diện nhỏ và thời gian gửi */}
            <div className="text-center text-xs">
              <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="User" className='rounded-full w-7' />
              <p className='text-gray-500'>{formatMessageTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        {/* Điểm neo để tự động cuộn xuống */}
        <div ref={scrollEnd}></div>
      </div>

      {/* ----------- Khu vực nhập tin nhắn ở dưới cùng (Bottom Area) ------------ */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder="Nhập tin nhắn..." className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
          
          {/* Nút chọn và gửi ảnh */}
          <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="Gửi ảnh" className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        {/* Nút gửi tin nhắn */}
        <img onClick={handleSendMessage} src={assets.send_button} alt="Gửi" className='w-7 cursor-pointer' />
      </div>

    </div>
  ) : (
    /* Hiển thị màn hình chờ khi chưa chọn ai để chat */
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} className='max-w-16' alt="Logo" />
      <p className='text-lg font-medium text-white'>Chat mọi lúc, mọi nơi</p>
    </div>
  )
}

export default ChatContainer
