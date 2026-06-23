import React, { useContext } from 'react'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import Sidebar from '../components/SideBar'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { useVideoCall } from '../hooks/useVideoCall'
import { VideoCallModal } from '../components/VideoCallModal'
import { StarsBackground } from '../components/ui/stars'

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext)
  const { authUser, socket } = useContext(AuthContext)

  const {
    callState, remoteUser,
    localVideoRef, remoteVideoRef,
    startCall, answerCall, endCall, rejectCall,
  } = useVideoCall(socket, authUser?._id, authUser?.fullName)

  return (
    <StarsBackground
      className="w-full h-screen"
      starColor="rgba(180,160,255,0.7)"
      speed={80}
      factor={0.02}
    >
      {/* Subtle dark overlay so chat panels are easier to read */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(5,0,15,0.55)', zIndex: 1 }}
      />

      {/* Chat UI */}
      <div
        className={`relative overflow-hidden h-full grid grid-cols-1 ${
          selectedUser
            ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]'
            : 'md:grid-cols-2'
        }`}
        style={{ zIndex: 2 }}
      >
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
    </StarsBackground>
  )
}

export default HomePage