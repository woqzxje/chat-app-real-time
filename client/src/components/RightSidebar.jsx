import React, { useContext, useEffect, useState } from 'react'
import assets, { imagesDummyData } from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

const RightSidebar = () => {

  // Lấy dữ liệu người dùng đang chat và danh sách tin nhắn từ ChatContext
  const { selectedUser, messages } = useContext(ChatContext)

  // Lấy hàm đăng xuất và danh sách người dùng online từ AuthContext
  const { logout, onlineUser } = useContext(AuthContext)

  // Trạng thái lưu trữ danh sách các URL ảnh trích xuất từ tin nhắn
  const [msgImages, setMsgImages] = useState([])

  // Tự động lọc ra tất cả các tin nhắn có chứa hình ảnh mỗi khi danh sách tin nhắn thay đổi
  useEffect(() => {
    setMsgImages(
      messages.filter(msg => msg.image).map(msg => msg.image)
    )
  }, [messages])

  // Chỉ hiển thị sidebar phải khi có người dùng đang được chọn để chat
  return selectedUser && (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden" : ""}`}>

      {/* ----------- Thông tin người dùng đang chat ----------- */}
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
        <img src={selectedUser?.profilePic || assets.avatar_icon} alt="Avatar" className='w-20 aspect-square rounded-full' />
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
          {/* Chấm xanh hiển thị trạng thái online */}
          {onlineUser.includes(selectedUser._id) && <p className='w-2 h-2 rounded-full bg-green-500'></p>}
          {selectedUser?.fullName}
        </h1>
        <p className='px-10 mx-auto text-center opacity-80'>{selectedUser.bio}</p>
      </div>

      <hr className="border-[#ffffff50] my-4" />

      {/* ----------- Phần Media (Các hình ảnh đã gửi trong cuộc trò chuyện) ----------- */}
      <div className="px-5 text-xs">
        <p className='mb-2 font-medium opacity-60'>HÌNH ẢNH ĐÃ GỬI</p>
        <div className='mt-2 max-h-80 overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>
          {msgImages.length > 0 ? msgImages.map((url, index) => (
            <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded overflow-hidden hover:scale-105 transition-transform'>
              <img src={url} alt="Media content" className='h-full w-full object-cover rounded-md' />
            </div>
          )) : <p className='col-span-2 text-center opacity-40'>Chưa có hình ảnh nào</p>}
        </div>
      </div>

      {/* Nút đăng xuất cố định ở dưới cùng */}
      <button onClick={() => logout()} className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer'>
        Logout
      </button>

    </div>
  )
}

export default RightSidebar
