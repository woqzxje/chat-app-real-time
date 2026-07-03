import { useContext, useState, useEffect, useRef } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { UserMinus, UserPlus, X, Check, LogOut, Trash2, Edit2, Camera, Save, Crown } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const RightSidebar = () => {

  const { selectedUser, messages, setSelectedUser, getUsers, users } = useContext(ChatContext)
  const { onlineUser, authUser } = useContext(AuthContext)
  const msgImages = messages.filter(msg => msg.image).map(msg => msg.image)

  const isFriend = selectedUser?.isFriend;
  const isGroup = selectedUser?.isGroup;
  
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isGroup && selectedUser) {
      setNewGroupName(selectedUser.fullName);
      fetchGroupMembers();
    }
  }, [selectedUser]);

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
    if (window.confirm("Bạn có chắc chắn muốn hủy kết bạn?")) {
      try {
        const { data } = await axios.post('/api/auth/unfriend', { friendId: selectedUser._id });
        if (data.success) {
          toast.success(data.message);
          // Cập nhật ngay lập tức vào state, không reload lại web
          if (setSelectedUser) setSelectedUser(prev => ({ ...prev, isFriend: false }));
          if (getUsers) getUsers();
        } else {
          toast.error(data.message);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      }
    }
  }

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
    if (window.confirm(`Bạn có chắc muốn mời ${userName} ra khỏi nhóm?`)) {
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
    const msg = silent ? "Bạn có chắc chắn muốn rời nhóm trong im lặng (Chỉ Admin nhận được thông báo)?" : "Bạn có chắc chắn muốn rời nhóm và thông báo cho mọi người?";
    if (window.confirm(msg)) {
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
  }

  const handleDisbandGroup = async () => {
    if (window.confirm("Bạn có chắc chắn muốn giải tán nhóm này? Hành động này không thể hoàn tác.")) {
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
  }

  // Lọc bạn bè chưa có trong nhóm
  const friendsList = users.filter(u => u.isFriend && !u.isGroup && !(selectedUser?.members || []).includes(u._id));

  return selectedUser && (
    <div className="bg-[#8185B2]/10 h-full text-white w-full flex flex-col relative">
      
      {/* Phần nội dung có thể cuộn */}
      <div className="flex-1 overflow-y-scroll pb-6">
        <div className='pt-16 flex flex-col items-center gap-3 text-sm font-light mx-auto'>
          
          <div className="relative group">
            <img src={selectedUser?.profilePic || assets.avatar_icon} alt="Avatar" className='w-24 h-24 object-cover rounded-full shadow-lg border-2 border-white/10' />
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
                  className="bg-black/30 border border-white/20 rounded-md px-2 py-1 text-xl font-semibold outline-none focus:border-cyan-500 w-48 text-center"
                  autoFocus
                />
                <button onClick={() => handleUpdateGroup({ name: newGroupName })} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-md transition-colors">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsEditingName(false); setNewGroupName(selectedUser.fullName); }} className="p-1.5 bg-gray-500/20 text-gray-400 hover:bg-gray-500 hover:text-white rounded-md transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h1 className='text-3xl font-semibold flex items-center gap-3'>
                {selectedUser?.fullName}
                {!isGroup && onlineUser.includes(selectedUser._id) && <span className='w-3 h-3 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]'></span>}
                {isGroup && (
                  <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-cyan-400 transition-colors p-1">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </h1>
            )}
          </div>
          
          <p className='px-10 mx-auto text-center text-base opacity-80'>{selectedUser.bio}</p>
        </div>

        <hr className="border-[#ffffff50] my-4" />

        {isGroup && (
          <div className="px-5 text-sm mb-4">
            <p className='mb-3 font-semibold opacity-70'>THÀNH VIÊN ({groupMembers.length})</p>
            <div className='flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar'>
              {groupMembers.map(member => (
                <div key={member._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <img src={member.profilePic || assets.avatar_icon} className="w-8 h-8 rounded-full object-cover" />
                    <span className="font-medium text-sm">{member.fullName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Nút Kết bạn (Nếu chưa là bạn và không phải chính mình) */}
                    {!member.isFriend && member._id !== authUser._id && (
                      <button onClick={() => handleAddFriend(member._id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-cyan-400 hover:text-cyan-300 transition-all rounded-full hover:bg-white/10" title="Kết bạn">
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Nút Mời ra khỏi nhóm (Chỉ hiển thị nếu mình là Admin và người kia không phải mình) */}
                    {authUser._id === selectedUser.admin && member._id !== authUser._id && (
                      <button onClick={() => handleKickMember(member._id, member.fullName)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-300 transition-all rounded-full hover:bg-white/10" title="Mời ra khỏi nhóm">
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {member.isAdmin && <Crown className="w-4 h-4 text-yellow-500" title="Trưởng nhóm" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 text-sm">
          <p className='mb-3 font-semibold opacity-70'>HÌNH ẢNH ĐÃ GỬI</p>
          <div className='mt-3 max-h-48 overflow-y-scroll grid grid-cols-2 gap-4 opacity-90 custom-scrollbar'>
            {msgImages.length > 0 ? msgImages.map((url, index) => (
              <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded overflow-hidden hover:scale-105 transition-transform'>
                <img src={url} alt="Media content" className='h-full w-full object-cover rounded-md' />
              </div>
            )) : <p className='col-span-2 text-center opacity-40'>Chưa có hình ảnh nào</p>}
          </div>
        </div>
      </div>

      {/* Footer chứa các nút chức năng */}
      {isGroup ? (
        <div className="p-4 border-t border-[#ffffff20] flex flex-col gap-2">
          <button 
            onClick={() => setShowAddMemberModal(true)} 
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
             <UserPlus className="w-4 h-4" />
             Thêm thành viên
          </button>
          
          <button 
            onClick={() => handleLeaveGroup(false)} 
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
             <LogOut className="w-4 h-4" />
             Rời nhóm
          </button>

          <button 
            onClick={() => handleLeaveGroup(true)} 
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gray-500/10 text-gray-400 hover:bg-gray-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
             <LogOut className="w-4 h-4" />
             Rời đi trong im lặng
          </button>

          {selectedUser.admin === authUser?._id && (
            <button 
              onClick={handleDisbandGroup} 
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
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
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
             <UserMinus className="w-4 h-4" />
             Hủy kết bạn
          </button>
        </div>
      ) : null}

      {/* MODAL THÊM THÀNH VIÊN */}
      {showAddMemberModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] w-full max-w-xs p-5 rounded-2xl shadow-2xl border border-white/10 m-4 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Thêm thành viên</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Chọn bạn bè</label>
              <div className="bg-black/20 border border-white/5 rounded-xl overflow-y-auto flex-1 max-h-48 p-2 space-y-1">
                {friendsList.length === 0 ? (
                  <p className="text-gray-500 text-sm p-2 italic text-center">Không có bạn bè nào có thể thêm.</p>
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
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedFriends.includes(friend._id) ? 'bg-cyan-500/20' : 'hover:bg-white/5'}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selectedFriends.includes(friend._id) ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500'}`}>
                        {selectedFriends.includes(friend._id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <img src={friend.profilePic || assets.avatar_icon} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                      <p className="text-sm font-medium flex-1 truncate">{friend.fullName}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-2">
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/5 font-medium transition-colors text-sm cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddMember}
                disabled={isAddingMember}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-medium shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 flex items-center gap-2 text-sm cursor-pointer"
              >
                {isAddingMember && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default RightSidebar
