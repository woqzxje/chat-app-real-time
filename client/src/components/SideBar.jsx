import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';

const SideBar = () => {

  const { getUsers, users, selectedUser, setSelectedUser,
    unseenMessages, setUnseenMessages } = useContext(ChatContext);

  const { logout, onlineUser } = useContext(AuthContext)

  const [input, setInput] = useState("")

  const navigate = useNavigate();

  const filteredUsers = input ? users.filter((u) => u.fullName.toLowerCase().includes(input.toLowerCase())) : users;

  return (
    <div className={`bg-[#8185B2]/10 h-full p-6 overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ''}`}>
      <div className='pb-6'>
        {/* Logo và Menu */}
        <div className='flex justify-between items-center gap-4'>
          <img src={assets.logo} alt="logo" className='max-w-52' />
          <div className="relative py-2 group">
            <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
            {/* Menu dropdown */}
            <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#0e2230] border border-gray-600 text-gray-100 hidden group-hover:block'>
              <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm'>Edit Profile</p>
              <hr className="my-2 border-t border-gray-500" />
              <p onClick={() => logout()} className='cursor-pointer text-sm'>Logout</p>
            </div>
          </div>
        </div>

        <div className='bg-[#0e2230] rounded-full flex items-center gap-3 py-4 px-5 mt-6'>
          <img src={assets.search_icon} alt="Search" className='w-4' />
          <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='bg-transparent border-none outline-none text-white text-base placeholder-[#c8c8c8] flex-1' placeholder='Search User...' />
        </div>

      </div>

      {/* Thanh trạng thái offline/online */}
      <div className='flex flex-col gap-3'>
        {filteredUsers.map((user) => (
          <div onClick={() => { setSelectedUser(user); setUnseenMessages(prev => ({ ...prev, [user._id]: 0 })) }}
            key={user._id} className={`relative flex items-center gap-3 p-4 pl-5 rounded-xl cursor-pointer ${selectedUser?._id === user._id && 'bg-[#00cfff]/15'}`}>
            <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-12 aspect-square rounded-full' />
            <div className='flex flex-col leading-6'>
              <p className='text-base font-medium'>{user.fullName}</p>
              {
                onlineUser.includes(user._id)
                  ? <span className='text-green-400 text-sm'>Online</span>
                  : <span className='text-neutral-400 text-sm'>Offline</span>
              }
            </div>
            {unseenMessages && unseenMessages[user._id] > 0 && <p className='absolute top-4 right-4 bg-cyan-500 text-sm rounded-full w-6 h-6 flex items-center justify-center'>{unseenMessages[user._id]}</p>}
          </div>
        ))}
      </div>

    </div >
  )
}

export default SideBar
