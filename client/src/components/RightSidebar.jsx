import { useContext, useState, useEffect, useRef } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { UserMinus, UserPlus, X, Check, LogOut, Trash2, Edit2, Camera, Save, Crown, Download, ChevronDown, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import ConfirmModal from './ConfirmModal'

const RightSidebar = () => {

  const { selectedUser, messages, setSelectedUser, getUsers, users } = useContext(ChatContext)
  const { onlineUser, authUser } = useContext(AuthContext)
  const msgImages = messages.filter(msg => msg.image).map(msg => msg.image)
  const msgFiles = messages.filter(msg => msg.attachment).map(msg => msg.attachment)

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const FacebookIcon = ({className}) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6c1.05 0 2.05.2 2.05.2v2.25h-1.16c-1.14 0-1.39.71-1.39 1.35V12h2.5l-.4 3h-2.1v6.8C18.56 20.87 22 16.84 22 12z"/>
    </svg>
  );

  const InstagramIcon = ({className}) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );

  const LinkedinIcon = ({className}) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
      <rect x="2" y="9" width="4" height="12"></rect>
      <circle cx="4" cy="4" r="2"></circle>
    </svg>
  );

  const TwitterIcon = ({className}) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const getSocialIcon = (url) => {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.includes('facebook.com')) return <FacebookIcon className="w-5 h-5" />;
    if (lower.includes('instagram.com')) return <InstagramIcon className="w-5 h-5" />;
    if (lower.includes('linkedin.com')) return <LinkedinIcon className="w-5 h-5" />;
    if (lower.includes('twitter.com') || lower.includes('x.com')) return <TwitterIcon className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  const getFileIcon = (type) => {
    const icons = {
      image: '🖼️',
      video: '🎬',
      document: '📄',
      archive: '🗜️',
      folder: '📁',
      audio: '🎤',
      other: '📎',
    };
    return icons[type] || icons.other;
  };

  const isFriend = selectedUser?.isFriend;
  const isGroup = selectedUser?.isGroup;
  
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [showMembers, setShowMembers] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const fileInputRef = useRef(null);

  // State chung cho ConfirmModal
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', confirmText: '', variant: 'danger', onConfirm: null });

  const fetchGroupMembers = async () => {
    try {
      const { data } = await axios.get(`/api/messages/groups/${selectedUser._id}/members`);
      if (data.success) {
        setGroupMembers(data.members);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isGroup && selectedUser) {
      setNewGroupName(selectedUser.fullName);
      fetchGroupMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  const handleUpdateGroup = async (updateData) => {
    try {
      const { data } = await axios.put(`/api/messages/groups/${selectedUser._id}/update`, updateData);
      if (data.success) {
        toast.success(data.message);
        setSelectedUser({ ...selectedUser, ...data.group });
        getUsers();
        setIsEditingName(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result;
        await handleUpdateGroup({ avatar: base64Image });
      };
      reader.readAsDataURL(file);
    }
  };
  const handleUnfriend = async () => {
    setConfirmDialog({
      open: true,
      title: 'Hủy kết bạn',
      message: `Bạn có chắc chắn muốn hủy kết bạn với ${selectedUser.fullName}? Bạn sẽ không còn thấy người này trong danh sách bạn bè.`,
      confirmText: 'Hủy kết bạn',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const { data } = await axios.post('/api/auth/unfriend', { friendId: selectedUser._id });
          if (data.success) {
            toast.success(data.message);
            if (setSelectedUser) setSelectedUser(prev => ({ ...prev, isFriend: false }));
            if (getUsers) getUsers();
          } else {
            toast.error(data.message);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || err.message);
        }
      }
    });
  }

  const handleUnban = async () => {
    setConfirmDialog({
      open: true,
      title: 'Gỡ cấm chat',
      message: `Bạn có chắc chắn muốn gỡ cấm chat cho ${selectedUser.fullName}? Người này sẽ có thể gửi tin nhắn lại.`,
      confirmText: 'Gỡ cấm',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const { data } = await axios.post(`/api/auth/unban/${selectedUser._id}`);
          if (data.success) {
            toast.success(data.message);
            setSelectedUser(prev => ({ ...prev, banned_until: null }));
            getUsers();
          } else {
            toast.error(data.message);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || err.message);
        }
      }
    });
  };

  const handleAddFriend = async (userId) => {
    try {
      const { data } = await axios.post('/api/auth/send-friend-request', { friendId: userId });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleKickMember = async (userId, userName) => {
    setConfirmDialog({
      open: true,
      title: 'Mời ra khỏi nhóm',
      message: `Bạn có chắc muốn mời ${userName} ra khỏi nhóm? Người này sẽ không còn xem được tin nhắn trong nhóm nữa.`,
      confirmText: 'Mời ra',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const { data } = await axios.put(`/api/messages/groups/${selectedUser._id}/kick`, { userId });
          if (data.success) {
            toast.success(data.message);
            setSelectedUser({ ...selectedUser, ...data.group });
            getUsers();
            setGroupMembers(prev => prev.filter(m => m._id !== userId));
          } else {
            toast.error(data.message);
          }
        } catch (error) {
          toast.error(error.response?.data?.message || error.message);
        }
      }
    });
  };

  const handleAddMember = async () => {
    if (selectedFriends.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    setIsAddingMember(true);
    try {
      const { data } = await axios.post(`/api/messages/groups/${selectedUser._id}/add-members`, {
        members: selectedFriends
      });
      
      if (data.success) {
        toast.success('Thêm thành viên thành công!');
        setShowAddMemberModal(false);
        setSelectedFriends([]);
        setSelectedUser({ ...selectedUser, ...data.group }); // Update current chat
        getUsers(); // Reload sidebar
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleLeaveGroup = async (silent) => {
    const msg = silent 
      ? 'Bạn có chắc chắn muốn rời nhóm trong im lặng? Chỉ Admin sẽ nhận được thông báo.' 
      : 'Bạn có chắc chắn muốn rời nhóm? Mọi người sẽ nhận được thông báo về việc này.';
    setConfirmDialog({
      open: true,
      title: silent ? 'Rời nhóm im lặng' : 'Rời nhóm',
      message: msg,
      confirmText: 'Rời nhóm',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const { data } = await axios.put(`/api/messages/groups/${selectedUser._id}/leave?silent=${silent}`);
          if (data.success) {
            toast.success(data.message);
            setSelectedUser(null);
            getUsers();
          } else {
            toast.error(data.message);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || err.message);
        }
      }
    });
  }

  const handleDisbandGroup = async () => {
    setConfirmDialog({
      open: true,
      title: 'Giải tán nhóm',
      message: 'Bạn có chắc chắn muốn giải tán nhóm này? Tất cả tin nhắn và dữ liệu nhóm sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      confirmText: 'Giải tán',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const { data } = await axios.delete(`/api/messages/groups/${selectedUser._id}`);
          if (data.success) {
            toast.success(data.message);
            setSelectedUser(null);
            getUsers();
          } else {
            toast.error(data.message);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || err.message);
        }
      }
    });
  }

  // Lọc bạn bè chưa có trong nhóm
  const friendsList = users.filter(u => u.isFriend && !u.isGroup && !(selectedUser?.members || []).includes(u._id));

  return selectedUser && (
    <>
    <div className="bg-white/40 dark:bg-[#8185B2]/10 backdrop-blur-lg flex-1 text-slate-900 dark:text-white w-full flex flex-col relative">
      
      {/* Phần nội dung có thể cuộn */}
      <div className="flex-1 overflow-y-scroll pb-6">
        <div className='pt-16 flex flex-col items-center gap-3 text-sm font-light mx-auto'>
          
          <div className="relative group">
            <img src={selectedUser?.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className='w-24 h-24 object-cover rounded-full shadow-lg border-2 border-slate-200 dark:border-white/10' />
            {isGroup && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                <Camera className="w-6 h-6" />
                <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className='px-4 mx-auto flex items-center justify-center gap-3 text-center'>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newGroupName} 
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-white/20 rounded-md px-2 py-1 text-xl font-semibold outline-none focus:border-orange-500 dark:focus:border-cyan-500 w-48 text-center text-slate-900 dark:text-white"
                  autoFocus
                />
                <button onClick={() => handleUpdateGroup({ name: newGroupName })} className="p-1.5 bg-green-500/20 text-green-500 dark:text-green-400 hover:bg-green-500 hover:text-white rounded-md transition-colors">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsEditingName(false); setNewGroupName(selectedUser.fullName); }} className="p-1.5 bg-gray-200 dark:bg-gray-500/20 text-slate-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h1 className='text-3xl font-semibold flex items-center gap-3'>
                {selectedUser?.fullName}
                {!isGroup && onlineUser.includes(selectedUser._id) && <span className='w-3 h-3 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]'></span>}
                {isGroup && (
                  <button onClick={() => setIsEditingName(true)} className="text-slate-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors p-1">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </h1>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {(selectedUser.socialLinks || []).map((link, idx) => {
              if(!link) return null;
              return (
                <a 
                  key={idx}
                  href={link.startsWith('http') ? link : `https://${link}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-orange-600 hover:text-orange-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors shadow-sm"
                  title="Truy cập trang cá nhân"
                >
                  {getSocialIcon(link)}
                </a>
              );
            })}
          </div>

          <p className='px-10 mx-auto text-center text-base opacity-80 mt-1'>{selectedUser.bio}</p>
        </div>

        <hr className="border-slate-300 dark:border-[#ffffff50] my-4" />

        {isGroup && (
          <div className="px-5 text-sm mb-4">
             <div onClick={() => setShowMembers(!showMembers)} className="flex items-center gap-2 cursor-pointer hover:text-orange-500 dark:hover:text-cyan-400 transition-colors text-slate-700 dark:text-gray-300 font-semibold text-sm mb-2 w-max">
                <motion.div
                    animate={{ rotate: showMembers ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center w-4 h-4"
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
                <p className='font-semibold text-slate-500 dark:text-gray-300 dark:opacity-70 uppercase m-0'>THÀNH VIÊN ({groupMembers.length})</p>
             </div>
            
            <AnimatePresence>
              {showMembers && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ 
                    opacity: 1, 
                    height: "auto",
                    transition: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    height: 0,
                    transition: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
                  }}
                  className="overflow-hidden relative"
                >
                  <div className='flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar mt-3'>
                    {groupMembers.map(member => (
                      <div key={member._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                          <img src={member.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} className="w-8 h-8 rounded-full object-cover" />
                          <span className="font-medium text-sm text-slate-900 dark:text-white">{member.fullName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Nút Kết bạn (Nếu chưa là bạn và không phải chính mình) */}
                          {!(users.find(u => u._id === member._id)?.isFriend ?? member.isFriend) && member._id !== authUser._id && (
                            <button onClick={() => handleAddFriend(member._id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-orange-600 hover:text-orange-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-all rounded-full hover:bg-slate-300 dark:hover:bg-white/10" title="Kết bạn">
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Nút Mời ra khỏi nhóm (Chỉ hiển thị nếu mình là Admin và người kia không phải mình) */}
                          {authUser._id === selectedUser.admin && member._id !== authUser._id && (
                            <button onClick={() => handleKickMember(member._id, member.fullName)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-all rounded-full hover:bg-slate-300 dark:hover:bg-white/10" title="Mời ra khỏi nhóm">
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {member.isAdmin && <Crown className="w-4 h-4 text-yellow-500" title="Trưởng nhóm" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="px-5 text-sm">
           <div onClick={() => setShowImages(!showImages)} className="flex items-center gap-2 cursor-pointer hover:text-orange-600 transition-colors text-slate-700 dark:hover:text-cyan-400 dark:text-gray-300 font-semibold text-sm mb-2 w-max">
              <motion.div
                  animate={{ rotate: showImages ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center w-4 h-4"
              >
                  <ChevronDown className="w-4 h-4" />
              </motion.div>
              <p className='font-semibold text-slate-500 dark:text-white dark:opacity-70 uppercase m-0'>HÌNH ẢNH ĐÃ GỬI</p>
           </div>
          
          <AnimatePresence>
            {showImages && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: 1, 
                  height: "auto",
                  transition: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
                }}
                exit={{ 
                  opacity: 0, 
                  height: 0,
                  transition: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
                }}
                className="overflow-hidden relative"
              >
                <div className='mt-3 max-h-48 overflow-y-scroll grid grid-cols-2 gap-4 opacity-90 custom-scrollbar'>
                  {msgImages.length > 0 ? msgImages.map((url, index) => (
                    <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded overflow-hidden hover:scale-105 transition-transform'>
                      <img src={url} alt="Media content" className='h-full w-full object-cover rounded-md' />
                    </div>
                  )) : <p className='col-span-2 text-center text-slate-400 dark:text-white dark:opacity-40'>Chưa có hình ảnh nào</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-5 text-sm mt-4">
           <div onClick={() => setShowFiles(!showFiles)} className="flex items-center gap-2 cursor-pointer hover:text-orange-600 transition-colors text-slate-700 dark:hover:text-cyan-400 dark:text-gray-300 font-semibold text-sm mb-2 w-max">
              <motion.div
                  animate={{ rotate: showFiles ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center w-4 h-4"
              >
                  <ChevronDown className="w-4 h-4" />
              </motion.div>
              <p className='font-semibold text-slate-500 dark:text-white dark:opacity-70 uppercase m-0'>FILE ĐÃ GỬI</p>
           </div>

          <AnimatePresence>
            {showFiles && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: 1, 
                  height: "auto",
                  transition: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
                }}
                exit={{ 
                  opacity: 0, 
                  height: 0,
                  transition: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
                }}
                className="overflow-hidden relative"
              >
                <div className='mt-3 max-h-48 overflow-y-scroll flex flex-col gap-2 opacity-90 custom-scrollbar'>
                  {msgFiles.length > 0 ? msgFiles.map((file, index) => (
                    <div key={index} onClick={() => window.open(file.url)} className='flex items-center gap-3 p-2 rounded-lg bg-black/20 hover:bg-black/40 cursor-pointer transition-colors'>
                      <span className="text-2xl shrink-0 leading-none">{getFileIcon(file.file_type)}</span>
                      <div className='flex-1 min-w-0'>
                        <p className='truncate text-sm font-medium'>{file.file_name || 'Tài liệu'}</p>
                        <p className='text-xs opacity-50'>{formatFileSize(file.file_size)}</p>
                      </div>
                      <Download className='w-4 h-4 text-gray-400 hover:text-white shrink-0' />
                    </div>
                  )) : <p className='text-center opacity-40'>Chưa có file nào</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer chứa các nút chức năng */}
      <div className="flex flex-col">
        {selectedUser?.banned_until && new Date(selectedUser.banned_until) > new Date() && (
          <div className="p-4 border-t border-[#ffffff20] bg-red-500/5">
            <button 
              onClick={handleUnban} 
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
            >
               <Check className="w-4 h-4" />
               Gỡ cấm chat
            </button>
          </div>
        )}
      {isGroup ? (
        <div className="p-4 border-t border-[#ffffff20] flex flex-col gap-2">
          <button 
            onClick={() => setShowAddMemberModal(true)} 
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-orange-500/10 dark:bg-cyan-500/10 text-orange-600 dark:text-cyan-400 hover:bg-orange-500 dark:hover:bg-cyan-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
             <UserPlus className="w-4 h-4" />
             Thêm thành viên
          </button>
          
          <button 
            onClick={() => handleLeaveGroup(false)} 
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
             <LogOut className="w-4 h-4" />
             Rời nhóm
          </button>

          <button 
            onClick={() => handleLeaveGroup(true)} 
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gray-500/10 text-gray-600 dark:text-gray-400 hover:bg-gray-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
             <LogOut className="w-4 h-4" />
             Rời đi trong im lặng
          </button>

          {selectedUser.admin === authUser?._id && (
            <button 
              onClick={handleDisbandGroup} 
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
            >
               <Trash2 className="w-4 h-4" />
               Giải tán nhóm
            </button>
          )}
        </div>
      ) : isFriend ? (
        <div className="p-4 border-t border-[#ffffff20]">
          <button 
            onClick={handleUnfriend} 
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
             <UserMinus className="w-4 h-4" />
             Hủy kết bạn
          </button>
        </div>
      ) : null}
      </div>
    </div>

      {/* MODAL THÊM THÀNH VIÊN */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#1e293b] w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-white/10 relative"
            >
              <button 
                onClick={() => setShowAddMemberModal(false)} 
                className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors cursor-pointer p-1.5 bg-white/5 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Thêm thành viên</h3>
                <p className="text-sm text-white/50">Chọn bạn bè để thêm vào nhóm <span className="font-semibold text-orange-400 dark:text-cyan-400">{selectedUser?.fullName}</span></p>
              </div>
              
              <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col mb-6">
                <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar space-y-1">
                  {friendsList.length === 0 ? (
                    <div className="py-10 px-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <UserPlus className="w-5 h-5 text-white/30" />
                      </div>
                      <p className="text-white/70 text-sm font-medium">Không có bạn bè nào để thêm</p>
                      <p className="text-white/40 text-xs mt-1">Hãy kết bạn thêm để trò chuyện nhóm nhé.</p>
                    </div>
                  ) : (
                    friendsList.map(friend => (
                      <div 
                        key={friend._id}
                        onClick={() => {
                          if (selectedFriends.includes(friend._id)) {
                            setSelectedFriends(selectedFriends.filter(id => id !== friend._id));
                          } else {
                            setSelectedFriends([...selectedFriends, friend._id]);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedFriends.includes(friend._id) ? 'bg-orange-500/10 dark:bg-cyan-500/10 border-orange-500/20 dark:border-cyan-500/20' : 'hover:bg-white/5 border-transparent'} border`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${selectedFriends.includes(friend._id) ? 'bg-orange-500 border-orange-500 dark:bg-cyan-500 dark:border-cyan-500' : 'border-white/20'}`}>
                          {selectedFriends.includes(friend._id) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </div>
                        <img src={friend.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{friend.fullName}</p>
                          <p className="text-xs text-white/40 truncate">{friend.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-5 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 font-medium transition-colors text-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleAddMember}
                  disabled={isAddingMember || selectedFriends.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 dark:from-cyan-400 dark:to-blue-500 text-white rounded-xl font-medium shadow-[0_4px_15px_rgba(249,115,22,0.3)] dark:shadow-[0_4px_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm cursor-pointer"
                >
                  {isAddingMember && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                  Thêm thành viên
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </>
  )
}

export default RightSidebar
