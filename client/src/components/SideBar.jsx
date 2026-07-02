import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import FlickerSpinner from './ui/FlickerSpinner';
import { motion } from 'framer-motion';

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
          <div className="flex items-center gap-3 font-extrabold text-xl tracking-wider text-white">
            <FlickerSpinner size={32} />
            <span>ChatITC</span>
          </div>
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

        <div className='relative mt-6 rounded-full overflow-hidden p-[1px] group shadow-[0_0_15px_rgba(0,207,255,0.1)] hover:shadow-[0_0_20px_rgba(0,207,255,0.2)] focus-within:shadow-[0_0_25px_rgba(0,207,255,0.3)] transition-all duration-300'>
          
          {/* Animated border beams */}
          <div className="absolute inset-0 z-0 opacity-50 group-focus-within:opacity-100 transition-opacity duration-300">
            <motion.div className="absolute top-0 left-0 h-[2px] w-[50%]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,207,255,1), transparent)', filter: 'blur(1px)' }}
              animate={{ left: ["-50%", "100%"] }} transition={{ duration: 2.5, ease: "linear", repeat: Infinity }} />
            <motion.div className="absolute bottom-0 right-0 h-[2px] w-[50%]"
              style={{ background: 'linear-gradient(270deg, transparent, rgba(0,207,255,1), transparent)', filter: 'blur(1px)' }}
              animate={{ right: ["-50%", "100%"] }} transition={{ duration: 2.5, ease: "linear", repeat: Infinity }} />
          </div>

          <div className='relative z-10 bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-full flex items-center gap-3 py-3 px-5'>
            <img src={assets.search_icon} alt="Search" className='w-4 opacity-70 group-focus-within:opacity-100 transition-opacity' />
            <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='bg-transparent border-none outline-none text-white text-base placeholder-gray-400 flex-1' placeholder='Search User...' />
          </div>
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
