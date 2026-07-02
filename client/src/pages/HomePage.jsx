import React, { useContext } from 'react'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import Sidebar from '../components/SideBar'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { useVideoCall } from '../hooks/useVideoCall'
import { VideoCallModal } from '../components/VideoCallModal'

const HomePage = () => {

  const { selectedUser, showRightSidebar } = useContext(ChatContext)
  const { authUser, socket } = useContext(AuthContext)

  // ✅ DÒNG NÀY ĐANG BỊ THIẾU — đây là nguyên nhân white screen
  const {
    callState, remoteUser,
    localVideoRef, remoteVideoRef,
    startCall, answerCall, endCall, rejectCall,
  } = useVideoCall(socket, authUser?._id, authUser?.fullName)

  return (
    <div className='w-full h-[100dvh] overflow-hidden bg-black/10 flex relative'>

      {/* Cột 1: Left Sidebar */}
      <div
        className={`h-full flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${selectedUser ? "w-0 md:w-[30%] xl:w-[25%]" : "w-full md:w-1/2"}`}
      >
        <div className="w-[100vw] md:w-full h-full">
          <Sidebar />
        </div>
      </div>

      {/* Cột 2: Chat Container */}
      <div className='h-full flex-1 min-w-0 transition-all duration-500 ease-in-out relative'>
        <ChatContainer startCall={startCall} />
      </div>

      {/* Cột 3: Right Sidebar (Push effect - Animated Width) */}
      <div
        className={`h-full flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out border-white/5 ${selectedUser && showRightSidebar ? "w-full md:w-[300px] xl:w-[350px] border-l" : "w-0 border-l-0"}`}
      >
        <div className="w-[100vw] md:w-[300px] xl:w-[350px] h-full">
          {/* Luôn render component để giữ trạng thái, nhưng bị ẩn đi bởi width 0 của cha */}
          <RightSidebar />
        </div>
      </div>

      <VideoCallModal
        callState={callState}
        remoteUser={remoteUser}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        onAnswer={answerCall}
        onEnd={endCall}
        onReject={rejectCall}
      />
    </div>
  )
}

export default HomePage