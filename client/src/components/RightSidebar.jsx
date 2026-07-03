import { useContext } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { UserMinus } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const RightSidebar = () => {

  const { selectedUser, messages } = useContext(ChatContext)
  const { onlineUser } = useContext(AuthContext)
  const msgImages = messages.filter(msg => msg.image).map(msg => msg.image)

  const isFriend = selectedUser?.isFriend;

  const handleUnfriend = async () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy kết bạn?")) {
      try {
        const { data } = await axios.post('/api/auth/unfriend', { friendId: selectedUser._id });
        if (data.success) {
          toast.success(data.message);
          window.location.reload();
        } else {
          toast.error(data.message);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      }
    }
  }



  return selectedUser && (
    <div className="bg-[#8185B2]/10 h-full text-white w-full flex flex-col">
      
      {/* Phần nội dung có thể cuộn */}
      <div className="flex-1 overflow-y-scroll pb-6">
        <div className='pt-16 flex flex-col items-center gap-3 text-sm font-light mx-auto'>
          <img src={selectedUser?.profilePic || assets.avatar_icon} alt="Avatar" className='w-24 aspect-square rounded-full' />
          <h1 className='px-10 text-3xl font-semibold mx-auto flex items-center gap-3 text-center'>
            {onlineUser.includes(selectedUser._id) && <p className='w-3 h-3 rounded-full bg-green-500 shrink-0'></p>}
            {selectedUser?.fullName}
          </h1>
          <p className='px-10 mx-auto text-center text-base opacity-80'>{selectedUser.bio}</p>
        </div>

        <hr className="border-[#ffffff50] my-4" />

        <div className="px-5 text-sm">
          <p className='mb-3 font-semibold opacity-70'>HÌNH ẢNH ĐÃ GỬI</p>
          <div className='mt-3 max-h-96 overflow-y-scroll grid grid-cols-2 gap-4 opacity-90'>
            {msgImages.length > 0 ? msgImages.map((url, index) => (
              <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded overflow-hidden hover:scale-105 transition-transform'>
                <img src={url} alt="Media content" className='h-full w-full object-cover rounded-md' />
              </div>
            )) : <p className='col-span-2 text-center opacity-40'>Chưa có hình ảnh nào</p>}
          </div>
        </div>
      </div>

      {/* Footer chứa nút Hủy Kết Bạn */}
      {isFriend && (
        <div className="p-4 border-t border-[#ffffff20]">
          <button 
            onClick={handleUnfriend} 
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors text-sm font-medium shadow-sm"
          >
             <UserMinus className="w-4 h-4" />
             Hủy kết bạn
          </button>
        </div>
      )}

    </div>
  )
}

export default RightSidebar
