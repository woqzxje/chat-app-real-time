import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const ProfilePage = () => {

  // Lấy dữ liệu người dùng và hàm cập nhật từ AuthContext
  const { authUser, updateProfile } = useContext(AuthContext)

  // Lưu trữ ảnh đã chọn từ máy tính
  const [selectedImage, setSelectedImage] = useState(null)
  const navigate = useNavigate()
  
  // Khởi tạo các biến với dữ liệu hiện tại của người dùng
  const [name, setName] = useState(authUser.fullName)
  const [bio, setBio] = useState(authUser.bio)

  // Xử lý khi nhấn nút Lưu (Gửi form)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Nếu không có ảnh mới được chọn, chỉ cập nhật tên và bio
    if(!selectedImage){
      await updateProfile({fullName: name, bio});
      navigate('/');
      return;
    }

    // Nếu có ảnh mới, chuyển đổi ảnh sang dạng base64 rồi mới gửi lên server
    const reader = new FileReader();
    reader.readAsDataURL(selectedImage);
    reader.onload = async () =>{
      const base64Image = reader.result;
      await updateProfile({profilePic: base64Image, fullName: name, bio})
      navigate('/');
    }

  }

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      {/* Khung nội dung hồ sơ với hiệu ứng làm mờ kính */}
      <div className='w-5/6 max-w-2xl bg-white/5 text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1 relative'>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-white/10 hover:text-cyan-400 transition-all cursor-pointer" title="Quay lại">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-medium">Chi tiết hồ sơ</h3>
          </div>
          
          {/* Khu vực chọn ảnh đại diện */}
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input onChange={(e)=>setSelectedImage(e.target.files[0])} type="file" id='avatar' accept='.png, .jpg, .jpeg' hidden />
            <img src={selectedImage ? URL.createObjectURL(selectedImage) : assets.avatar_icon} alt="Avatar" className={`w-12 h-12 ${selectedImage && 'rounded-full'}`}/>
            <span className='text-sm opacity-70'>Tải ảnh đại diện lên</span>
          </label>

          {/* Nhập Họ và tên */}
          <input onChange={(e)=>setName(e.target.value)} value={name}
          type="text" required placeholder='Tên của bạn' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500' />
          
          {/* Nhập Lời giới thiệu */}
          <textarea onChange={(e)=>setBio(e.target.value)} value={bio} placeholder="Viết giới thiệu về bạn" required className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" rows={4}></textarea>

          {/* Nút lưu thay đổi */}
          <button type="submit" className="bg-linear-to-r from-cyan-500 to-teal-600 text-white p-2 rounded-full text-lg cursor-pointer">Lưu hồ sơ</button>
        </form>

        {/* Hiển thị ảnh đại diện hiện tại bên cạnh form */}
        <img className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImage && 'rounded-full'}`} src={selectedImage ? URL.createObjectURL(selectedImage) : (authUser?.profilePic || "/logo.jpg")} alt="Preview" />
      </div>

    </div>
  )
}

export default ProfilePage
