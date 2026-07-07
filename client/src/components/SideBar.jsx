import { useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';

// Assets & UI Components
import assets from '../assets/assets';
import { SparklesText } from './ui/SparklesText';
import { WaveText } from './ui/wave-text';
import { User, LogOut, UserPlus, ChevronDown, ChevronRight, MessageSquareWarning, Check, X, Bell, Archive, ArchiveRestore } from 'lucide-react';
import { ExpandableTabs } from './ui/ExpandableTabs';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ProfileEditModal } from './ProfileEditModal';
import { AdminReportModal } from './AdminReportModal';

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
    setUnseenMessages,  // Hàm cập nhật số tin nhắn chưa đọc
    getUsers            // Hàm load lại danh sách users
  } = useContext(ChatContext);

  // Lấy dữ liệu xác thực từ AuthContext
  const {
    logout,             // Hàm đăng xuất tài khoản
    onlineUser,         // Mảng chứa ID của các người dùng đang online (realtime từ Socket)
    authUser,           // Dữ liệu người dùng hiện tại
    socket,             // Đối tượng socket
    setAuthUser
  } = useContext(AuthContext);

  // Hook điều hướng trang của react-router-dom
  const navigate = useNavigate();

  // 2. --- Local State ---

  const [input, setInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showStrangers, setShowStrangers] = useState(false);
  const [hoveredStranger, setHoveredStranger] = useState(null);
  
  // State cho tính năng tạo nhóm
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // State cho tính năng lưu trữ
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // State cho admin report
  const [isAdminReportModalOpen, setIsAdminReportModalOpen] = useState(false);
  const [adminHasNewReport, setAdminHasNewReport] = useState(false);

  useEffect(() => {
    if (!socket || !authUser) return;
    
    if (authUser.email === 'quynh0369505599@gmail.com') {
      const handleNewReport = (report) => {
        setAdminHasNewReport(true);
      };
      socket.on('newReport', handleNewReport);
      return () => socket.off('newReport', handleNewReport);
    } else {
      const handleReportResolved = (data) => {
        setAdminHasNewReport(true); // Re-using state for notification
      };
      socket.on('reportResolved', handleReportResolved);
      return () => socket.off('reportResolved', handleReportResolved);
    }
  }, [socket, authUser]);

  // 3. --- Lọc dữ liệu & Tìm kiếm ---

  // Danh sách lưu trữ
  const archivedIds = authUser?.archivedChats || [];

  // Tách bạn bè và người lạ từ danh sách users (bỏ qua những người đã lưu trữ)
  const friendsList = users.filter(u => u.isFriend && !archivedIds.includes(u._id));
  const strangersList = users.filter(u => !u.isFriend && !archivedIds.includes(u._id));
  
  // Danh sách đã lưu trữ
  const archivedUsersList = users.filter(u => archivedIds.includes(u._id));
  
  // Tính tổng số tin nhắn chưa đọc từ người lạ
  const totalUnseenStrangers = strangersList.reduce((acc, user) => acc + (unseenMessages[user._id] || 0), 0);

  // Hàm gọi API tìm kiếm
  useEffect(() => {
    const fetchSearch = async () => {
      if (!input.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await axios.get(`/api/auth/search?q=${input}`);
        if (data.success) {
          setSearchResults(data.users);
        }
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [input]);

  const [friendRequests, setFriendRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(true);

  // Gọi API lấy danh sách lời mời kết bạn
  const fetchRequests = async () => {
    try {
      const { data } = await axios.get('/api/auth/friend-requests');
      if (data.success) {
        setFriendRequests(data.requests);
      }
    } catch (error) {
      console.error("Lỗi lấy lời mời kết bạn:", error);
    }
  };

  useEffect(() => {
    if (authUser) fetchRequests();
  }, [authUser]);

  // Lắng nghe Socket realtime cho kết bạn
  useEffect(() => {
    if (!socket) return;

    socket.on("newFriendRequest", (data) => {
      // Nhận lời mời mới từ ai đó
      setFriendRequests(prev => {
        if (prev.some(req => req._id === data.from._id)) return prev;
        return [...prev, data.from];
      });
      // Tự động mở mục Lời mời nếu đang đóng
      setShowRequests(true);
    });

    socket.on("friendRequestAccepted", (data) => {
      // Đối phương đã chấp nhận -> load lại danh sách chat
      getUsers();
      // Cập nhật selectedUser nếu người được chọn trùng khớp
      if (selectedUser && data?.newFriend?._id === selectedUser._id) {
          setSelectedUser(prev => ({ ...prev, isFriend: true }));
      }
    });

    socket.on("unfriended", (data) => {
      // Bị đối phương hủy kết bạn -> load lại
      getUsers();
      // Cập nhật selectedUser nếu người được chọn trùng khớp
      if (selectedUser && data?.by === selectedUser._id) {
          setSelectedUser(prev => ({ ...prev, isFriend: false }));
      }
    });

    return () => {
      socket.off("newFriendRequest");
      socket.off("friendRequestAccepted");
      socket.off("unfriended");
    };
  }, [socket, getUsers, selectedUser, setSelectedUser]);

  const handleAddFriend = async (friendId) => {
    try {
      const { data } = await axios.post('/api/auth/send-friend-request', { friendId });
      if (data.success) {
        toast.success(data.message);
        // Có thể update danh sách local để ẩn nút thêm bạn nếu muốn, 
        // nhưng đơn giản nhất là xóa text tìm kiếm để xem sidebar
        setInput('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      const { data } = await axios.post('/api/auth/accept-friend-request', { friendId });
      if (data.success) {
        toast.success(data.message);
        setFriendRequests(prev => prev.filter(req => req._id !== friendId));
        // Chấp nhận xong thì reload danh sách user để họ hiện vào Bạn bè
        getUsers(); 
        // Ẩn nút Kết bạn trong ChatContainer ngay lập tức
        if (selectedUser && selectedUser._id === friendId) {
             setSelectedUser(prev => ({ ...prev, isFriend: true }));
        }
      } else {
        toast.error(data.message);
      }
    } catch(err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleRejectRequest = async (friendId) => {
    try {
      const { data } = await axios.post('/api/auth/reject-friend-request', { friendId });
      if (data.success) {
        toast.success(data.message);
        setFriendRequests(prev => prev.filter(req => req._id !== friendId));
      } else {
        toast.error(data.message);
      }
    } catch(err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedFriends.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    setIsCreatingGroup(true);
    try {
      const { data } = await axios.post('/api/messages/groups/create', {
        name: groupName,
        members: selectedFriends
      });
      
      if (data.success) {
        toast.success('Tạo nhóm thành công!');
        setShowCreateGroupModal(false);
        setGroupName('');
        setSelectedFriends([]);
        getUsers(); // Load lại sidebar
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleToggleArchive = async (targetId, archive) => {
    try {
      const { data } = await axios.post('/api/auth/toggle-archive', { targetId, archive });
      if (data.success) {
        toast.success(archive ? 'Đã thêm vào lưu trữ' : 'Đã bỏ lưu trữ');
        // Cập nhật state cục bộ ngay lập tức để giao diện realtime không cần chờ socket
        if (setAuthUser) {
          setAuthUser(prev => ({ ...prev, archivedChats: data.archivedChats }));
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // 4. --- Giao diện (Render) ---
  return (
    <div className='bg-white/40 dark:bg-[#8185B2]/10 backdrop-blur-lg flex-1 p-6 overflow-y-scroll text-slate-900 dark:text-white'>

      {/* KHU VỰC HEADER: Logo và Menu */}
      <div className='pb-6'>
        <div className='flex justify-between items-center gap-4'>

          {/* Logo & Tên ứng dụng */}
          <div className="flex items-center gap-3 font-extrabold text-xl tracking-wider text-slate-900 dark:text-white">
            <SparklesText text={<>
              <span className="transition-all duration-700 ease-in-out bg-clip-text text-transparent bg-gradient-to-b from-slate-700 to-slate-900 dark:from-white dark:to-gray-300 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">Chat</span>
              <span className="transition-all duration-700 ease-in-out bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 dark:from-cyan-400 dark:to-blue-500 drop-shadow-sm dark:drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">ITC</span>
            </>} className="text-2xl tracking-wider" sparklesCount={5} />
          </div>

          {/* Menu Expandable Tabs */}
          <ExpandableTabs
            tabs={[
              { title: "Edit Profile", icon: User, onClick: () => setIsProfileModalOpen(true) },
              {
                title: "Báo cáo",
                icon: Bell,
                badge: adminHasNewReport,
                onClick: () => {
                  setAdminHasNewReport(false);
                  setIsAdminReportModalOpen(true);
                }
              },
              { type: "separator" },
              { title: "Logout", icon: LogOut, onClick: () => logout() }
            ]}
          />
        </div>

        {/* KHU VỰC TÌM KIẾM: Thanh Search với hiệu ứng Glassmorphism & Animated Border */}
        <div className='relative mt-6 rounded-full overflow-hidden p-[1px] group shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] focus-within:shadow-[0_0_25px_rgba(249,115,22,0.3)] dark:shadow-[0_0_15px_rgba(0,207,255,0.1)] dark:hover:shadow-[0_0_20px_rgba(0,207,255,0.2)] dark:focus-within:shadow-[0_0_25px_rgba(0,207,255,0.3)] transition-all duration-300'>

          {/* Các tia sáng chạy dọc viền (Framer Motion) */}
          <div className="absolute inset-0 z-0 opacity-50 group-focus-within:opacity-100 transition-opacity duration-300">
            {/* Tia trên chạy từ trái sang phải */}
            <motion.div className="absolute top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-orange-500 dark:via-cyan-400 to-transparent blur-[1px]"
              animate={{ left: ["-50%", "100%"] }} transition={{ duration: 2.5, ease: "linear", repeat: Infinity }} />
            {/* Tia dưới chạy từ phải sang trái */}
            <motion.div className="absolute bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-l from-transparent via-orange-500 dark:via-cyan-400 to-transparent blur-[1px]"
              animate={{ right: ["-50%", "100%"] }} transition={{ duration: 2.5, ease: "linear", repeat: Infinity }} />
          </div>

          {/* Ô nhập liệu nền kính mờ */}
          <div className='relative z-10 bg-white/60 dark:bg-[#0e2230]/30 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-full flex items-center gap-3 py-3 px-5'>
            <img src={assets.search_icon} alt="Search" className='w-4 opacity-70 dark:invert-0 invert group-focus-within:opacity-100 transition-opacity' />
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              className='bg-transparent border-none outline-none text-slate-900 dark:text-white text-base placeholder-slate-500 dark:placeholder-gray-400 flex-1'
              placeholder='Search User...'
            />
          </div>
        </div>
      </div>

      {/* KHU VỰC DANH SÁCH NGƯỜI DÙNG */}
      <div className='flex flex-col gap-3'>
        {input.trim() !== '' ? (
          /* TRẠNG THÁI TÌM KIẾM */
          <div className="flex flex-col gap-3">
             <p className="text-sm text-orange-500 dark:text-cyan-400 font-semibold mb-2">Kết quả tìm kiếm</p>
             {isSearching ? (
               <p className="text-gray-400 text-sm">Đang tìm...</p>
             ) : searchResults.length > 0 ? (
                searchResults.map(user => {
                  const isAlreadyFriend = user.friends?.includes(authUser?._id) || authUser?.friends?.includes(user._id);
                  return (
                    <div 
                      key={user._id} 
                      onClick={() => {
                        setSelectedUser({ ...user, isFriend: isAlreadyFriend });
                        setInput('');
                      }}
                      className="relative flex items-center justify-between p-4 pl-5 rounded-xl bg-white/40 dark:bg-white/5 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                          <img src={user?.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className='w-12 aspect-square rounded-full object-cover' />
                          <div className='flex flex-col leading-6'>
                            <p className='text-base font-medium text-slate-900 dark:text-white'>{user.fullName}</p>
                            <span className='text-slate-500 dark:text-neutral-400 text-sm'>Tìm thấy từ hệ thống</span>
                          </div>
                        </div>
                        {!isAlreadyFriend && (
                          <button onClick={(e) => { e.stopPropagation(); handleAddFriend(user._id); }} className="text-orange-500 dark:text-cyan-400 hover:text-white p-2 bg-orange-500/10 dark:bg-cyan-400/10 hover:bg-orange-500 dark:hover:bg-cyan-500 rounded-full transition-colors" title="Thêm bạn">
                             <UserPlus className="w-5 h-5" />
                          </button>
                        )}
                    </div>
                  )
                })
             ) : (
               <p className="text-gray-400 text-sm">Không tìm thấy người dùng nào</p>
             )}
          </div>
        ) : (
          /* TRẠNG THÁI BÌNH THƯỜNG (Danh sách Bạn bè + Người lạ + Lời mời kết bạn) */
          <>
            {friendRequests.length > 0 && (
              <div className="mb-4">
                 <div onClick={() => setShowRequests(!showRequests)} className="flex items-center gap-2 cursor-pointer hover:text-orange-600 dark:hover:text-cyan-400 transition-colors text-orange-500 dark:text-cyan-400 font-semibold text-sm mb-2">
                    {showRequests ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <Bell className="w-4 h-4" />
                    Lời mời kết bạn ({friendRequests.length})
                 </div>
                 
                 {showRequests && friendRequests.map((req) => (
                    <div key={req._id} className="relative flex items-center justify-between p-3 pl-4 mt-2 rounded-xl bg-orange-500/10 dark:bg-cyan-900/20 border border-orange-300 dark:border-cyan-500/20">
                      <div className="flex items-center gap-3">
                        <img src={req?.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className='w-10 aspect-square rounded-full object-cover' />
                        <div className='flex flex-col leading-5'>
                          <p className='text-sm font-medium text-slate-900 dark:text-white'>{req.fullName}</p>
                          <span className='text-orange-700 dark:text-cyan-300/70 text-xs'>Muốn kết bạn</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptRequest(req._id)} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-full transition-colors" title="Chấp nhận">
                           <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRejectRequest(req._id)} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors" title="Từ chối">
                           <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                 ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-900 dark:text-white font-semibold w-max">
                <WaveText text="Bạn bè" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowArchiveModal(true)} 
                  title="Kho lưu trữ" 
                  className="text-slate-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-cyan-400 p-1.5 hover:bg-orange-500/10 dark:hover:bg-cyan-400/10 rounded-full transition-colors cursor-pointer"
                >
                   <Archive className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowCreateGroupModal(true)} 
                  title="Tạo nhóm" 
                  className="text-slate-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-cyan-400 p-1.5 hover:bg-orange-500/10 dark:hover:bg-cyan-400/10 rounded-full transition-colors cursor-pointer"
                >
                   <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {friendsList.length === 0 && <p className="text-slate-500 dark:text-gray-400 text-sm italic">Chưa có bạn bè nào.</p>}
            {friendsList.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  if (selectedUser?._id === user._id) setSelectedUser(null);
                  else {
                    setSelectedUser(user);
                    setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
                  }
                }}
                className={`relative flex items-center gap-3 p-4 pl-5 rounded-xl cursor-pointer hover:bg-white/60 dark:hover:bg-white/5 transition-colors group ${selectedUser?._id === user._id ? 'bg-orange-500/15 hover:bg-orange-500/20 dark:bg-[#00cfff]/15 dark:hover:bg-[#00cfff]/20' : ''}`}
              >
                <img src={user?.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className='w-12 aspect-square rounded-full object-cover' />
                <div className='flex flex-col leading-6 flex-1'>
                  <p className='text-base font-medium text-slate-900 dark:text-white'>{user.fullName}</p>
                  {user.isGroup ? (
                    <span className='text-slate-500 dark:text-neutral-400 text-sm'>{user.bio}</span>
                  ) : (
                    onlineUser.includes(user._id) ? <span className='text-green-500 dark:text-green-400 text-sm'>Online</span> : <span className='text-slate-500 dark:text-neutral-400 text-sm'>Offline</span>
                  )}
                </div>
                {unseenMessages && unseenMessages[user._id] > 0 && (
                  <p className='absolute top-4 right-12 bg-orange-500 dark:bg-cyan-500 text-sm rounded-full w-6 h-6 flex items-center justify-center text-white shadow-[0_0_10px_rgba(249,115,22,0.5)] dark:shadow-[0_0_10px_rgba(0,207,255,0.5)]'>{unseenMessages[user._id]}</p>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleArchive(user._id, true); }}
                  className="p-2 text-slate-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all absolute right-2"
                  title="Lưu trữ"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            ))}

            {strangersList.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-4">
                 <div onClick={() => setShowStrangers(!showStrangers)} className="relative flex items-center gap-2 cursor-pointer hover:text-orange-500 dark:hover:text-cyan-400 transition-colors text-slate-700 dark:text-gray-300 font-semibold text-sm mb-2 w-max">
                    <motion.div
                        animate={{ rotate: showStrangers ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center w-4 h-4"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                    <MessageSquareWarning className="w-4 h-4" />
                    <WaveText text={`Tin nhắn từ người lạ (${strangersList.length})`} />
                    
                    {/* Hiển thị chấm đỏ cảnh báo nếu đang đóng và có tin nhắn chưa đọc */}
                    {!showStrangers && totalUnseenStrangers > 0 && (
                      <span className="ml-1 bg-red-500 text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-white font-bold shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                        {totalUnseenStrangers}
                      </span>
                    )}
                 </div>
                 
                 <AnimatePresence>
                   {showStrangers && (
                     <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ 
                         opacity: 1, 
                         height: "auto",
                         transition: { type: "spring", stiffness: 400, damping: 30, mass: 1, staggerChildren: 0.05, delayChildren: 0.1 }
                       }}
                       exit={{ 
                         opacity: 0, 
                         height: 0,
                         transition: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
                       }}
                       className="overflow-hidden relative"
                     >
                        <div className="py-2 flex flex-col gap-1 relative">
                          {strangersList.map((user) => (
                              <motion.div
                                key={user._id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                onMouseEnter={() => setHoveredStranger(user._id)}
                                onMouseLeave={() => setHoveredStranger(null)}
                                onClick={() => {
                                  if (selectedUser?._id === user._id) setSelectedUser(null);
                                  else {
                                    setSelectedUser(user);
                                    setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
                                  }
                                }}
                                className={`relative flex items-center gap-3 p-3 pl-4 rounded-xl cursor-pointer transition-colors z-10 group ${selectedUser?._id === user._id ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                              >
                                {/* Framer Motion LayoutId Highlight (Fluid Hover) */}
                                {hoveredStranger === user._id && (
                                    <motion.div
                                        layoutId="stranger-hover"
                                        className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                                {/* Nền khi đang chọn */}
                                {selectedUser?._id === user._id && (
                                    <div className="absolute inset-0 bg-orange-500/15 dark:bg-[#00cfff]/15 rounded-xl -z-10" />
                                )}
                                
                                <img src={user?.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className='w-10 aspect-square rounded-full object-cover opacity-80' />
                                <div className='flex flex-col leading-5 flex-1'>
                                  <p className='text-sm font-medium'>{user.fullName}</p>
                                  <span className='text-neutral-500 text-xs'>Người lạ</span>
                                </div>
                                {unseenMessages && unseenMessages[user._id] > 0 && (
                                  <p className='absolute top-3 right-10 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center text-white'>{unseenMessages[user._id]}</p>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleToggleArchive(user._id, true); }}
                                  className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all absolute right-2"
                                  title="Lưu trữ"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                          ))}
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
      {/* MODAL TẠO NHÓM */}
      {showCreateGroupModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 m-4 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tạo nhóm chat mới</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Tên nhóm</label>
              <input 
                type="text" 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nhập tên nhóm..." 
                className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-cyan-500 transition-colors"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Chọn thành viên</label>
              <div className="bg-transparent dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl overflow-y-auto flex-1 max-h-60 p-2 space-y-1">
                {friendsList.filter(f => !f.isGroup).length === 0 ? (
                  <p className="text-slate-500 dark:text-gray-500 text-sm p-2 italic text-center">Bạn chưa có bạn bè nào.</p>
                ) : (
                  friendsList.filter(f => !f.isGroup).map(friend => (
                    <div 
                      key={friend._id}
                      onClick={() => {
                        if (selectedFriends.includes(friend._id)) {
                          setSelectedFriends(selectedFriends.filter(id => id !== friend._id));
                        } else {
                          setSelectedFriends([...selectedFriends, friend._id]);
                        }
                      }}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedFriends.includes(friend._id) ? 'bg-orange-500/20 dark:bg-cyan-500/20' : 'hover:bg-slate-200 dark:hover:bg-white/5'}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selectedFriends.includes(friend._id) ? 'bg-orange-500 border-orange-500 dark:bg-cyan-500 dark:border-cyan-500' : 'border-slate-300 dark:border-gray-500'}`}>
                        {selectedFriends.includes(friend._id) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <img src={friend.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                      <p className="text-sm font-medium flex-1 text-slate-900 dark:text-white">{friend.fullName}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
              <button 
                onClick={() => setShowCreateGroupModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleCreateGroup}
                disabled={isCreatingGroup}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white rounded-xl font-medium shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] dark:shadow-[0_0_15px_rgba(6,182,212,0.4)] dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isCreatingGroup && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Tạo nhóm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL KHO LƯU TRỮ */}
      {showArchiveModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 m-4 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-500 dark:text-cyan-400" />
                Kho lưu trữ
              </h3>
              <button onClick={() => setShowArchiveModal(false)} className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-2">
              <div className="bg-transparent dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl overflow-y-auto flex-1 max-h-80 p-2 space-y-1">
                {archivedUsersList.length === 0 ? (
                  <p className="text-slate-500 dark:text-gray-500 text-sm p-4 italic text-center">Chưa có đoạn chat nào được lưu trữ.</p>
                ) : (
                  archivedUsersList.map(user => (
                    <div 
                      key={user._id}
                      onClick={() => {
                        setSelectedUser(user);
                        setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
                        setShowArchiveModal(false);
                      }}
                      className="flex items-center gap-3 p-2 pl-3 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-white/5 transition-colors group"
                    >
                      <img src={user.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 flex flex-col">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user.fullName}</p>
                        <span className="text-xs text-slate-500 dark:text-gray-400">{user.isGroup ? 'Nhóm chat' : 'Người dùng'}</span>
                      </div>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleToggleArchive(user._id, false); 
                          if (selectedUser?._id === user._id) {
                            setSelectedUser(null);
                          }
                        }}
                        className="p-3 text-orange-500 dark:text-cyan-400 hover:bg-orange-500/20 dark:hover:bg-cyan-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        title="Bỏ lưu trữ"
                      >
                        <ArchiveRestore className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />

      {/* Admin Report Modal */}
      <AdminReportModal open={isAdminReportModalOpen} onOpenChange={setIsAdminReportModalOpen} />

    </div>
  );
};

export default SideBar;
