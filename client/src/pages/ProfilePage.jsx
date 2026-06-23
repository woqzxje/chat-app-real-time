import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'
import { StarsBackground } from '../components/ui/stars'

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext)
  const [selectedImage, setSelectedImage] = useState(null)
  const navigate = useNavigate()
  const [name, setName] = useState(authUser.fullName)
  const [bio, setBio] = useState(authUser.bio)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedImage) {
      await updateProfile({ fullName: name, bio })
      navigate('/')
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(selectedImage)
    reader.onload = async () => {
      const base64Image = reader.result
      await updateProfile({ profilePic: base64Image, fullName: name, bio })
      navigate('/')
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all duration-200'
  const inputStyle = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }
  const focusHandlers = {
    onFocus: (e) => { e.target.style.border = '1px solid rgba(139,92,246,0.7)'; e.target.style.boxShadow = '0 0 18px rgba(139,92,246,0.2)' },
    onBlur: (e) => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' },
  }

  return (
    <StarsBackground
      className="min-h-screen flex items-center justify-center"
      starColor="rgba(200,180,255,0.9)"
      speed={60}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 40% 50%, rgba(80,0,120,0.2) 0%, rgba(0,0,0,0.45) 100%)' }}
      />

      <div
        className="relative z-10 w-5/6 max-w-2xl rounded-2xl flex items-center justify-between max-sm:flex-col-reverse gap-0"
        style={{
          background: 'rgba(15,5,30,0.75)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Form bên trái */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1 text-gray-300">
          <h3 className="text-xl font-bold text-white tracking-tight">Chi tiết hồ sơ</h3>

          {/* Chọn ảnh đại diện */}
          <label htmlFor="avatar" className="flex items-center gap-3 cursor-pointer group">
            <input onChange={(e) => setSelectedImage(e.target.files[0])} type="file"
              id="avatar" accept=".png,.jpg,.jpeg" hidden />
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-violet-500/40 group-hover:border-violet-400 transition-all">
              <img
                src={selectedImage ? URL.createObjectURL(selectedImage) : assets.avatar_icon}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs">✏️</span>
              </div>
            </div>
            <span className="text-sm text-violet-400 group-hover:text-violet-300 transition-colors">Tải ảnh đại diện lên</span>
          </label>

          {/* Họ tên */}
          <input onChange={(e) => setName(e.target.value)} value={name}
            type="text" required placeholder="Tên của bạn"
            className={inputCls} style={inputStyle} {...focusHandlers} />

          {/* Bio */}
          <textarea onChange={(e) => setBio(e.target.value)} value={bio}
            placeholder="Viết giới thiệu về bạn" required rows={4}
            className={inputCls + ' resize-none'} style={inputStyle} {...focusHandlers} />

          {/* Nút lưu */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 6px 24px rgba(124,58,237,0.45)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(124,58,237,0.6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.45)' }}
          >
            Lưu hồ sơ
          </button>

          {/* Nút quay về */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-all duration-200 hover:bg-white/5"
          >
            ← Quay lại
          </button>
        </form>

        {/* Ảnh preview bên phải */}
        <div className="flex flex-col items-center gap-3 px-10 max-sm:pt-10">
          <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-violet-500/40 shadow-lg shadow-violet-900/40">
            <img
              src={selectedImage ? URL.createObjectURL(selectedImage) : (authUser?.profilePic || assets.logo_icon)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-gray-500">Ảnh hiện tại</p>
        </div>
      </div>
    </StarsBackground>
  )
}

export default ProfilePage
