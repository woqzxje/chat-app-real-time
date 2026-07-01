import React, { useContext } from 'react'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import Sidebar from '../components/SideBar'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { useVideoCall } from '../hooks/useVideoCall'
import { VideoCallModal } from '../components/VideoCallModal'

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
    <div className='w-full h-screen overflow-hidden bg-transparent'>
      <div className={`bg-black/10 overflow-hidden h-full grid grid-cols-1 relative ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-2'}`}>
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