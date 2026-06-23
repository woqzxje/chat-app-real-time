import React, { useContext } from 'react'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import Sidebar from '../components/SideBar'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { useVideoCall } from '../hooks/useVideoCall'
import { VideoCallModal } from '../components/VideoCallModal'
import { EtheralShadow } from '../components/ui/etheral-shadow'

const HomePage = () => {

  const { selectedUser } = useContext(ChatContext)
  const { authUser, socket } = useContext(AuthContext)

  // ✅ DÒNG NÀY ĐANG BỊ THIẾU — đây là nguyên nhân white screen
  const {
    callState, remoteUser,
    localVideoRef, remoteVideoRef,
    startCall, answerCall, endCall, rejectCall,
  } = useVideoCall(socket, authUser?._id, authUser?.fullName)

  return (
    <div className='w-full h-screen overflow-hidden relative'>
      {/* ── Background animated shadow giống LoginPage ── */}
      <EtheralShadow
        color="rgba(99, 102, 241, 0.75)"
        animation={{ scale: 100, speed: 90 }}
        sizing="fill"
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />

      {/* ── Nội dung chat nằm trên background ── */}
      <div className={`relative z-10 backdrop-blur-xl overflow-hidden h-full grid grid-cols-1 ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-2'}`}>
        <Sidebar />
        <ChatContainer startCall={startCall} />
        <RightSidebar />
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