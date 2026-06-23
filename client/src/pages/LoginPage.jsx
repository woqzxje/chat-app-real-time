import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'
import { EtheralShadow } from '../components/ui/etheral-shadow'

const LoginPage = () => {

  const [currState, setCurrState] = useState("Sign up")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return;
    }

    const success = await login(currState === "Sign up" ? 'signup' : 'login', { fullName, email, password, bio })

    if (success && currState === "Sign up") {
      setCurrState("Login")
      setIsDataSubmitted(false)
      setFullName("")
      setPassword("")
      setBio("")
    }
  }

  return (
    <div className='min-h-screen relative flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col overflow-hidden'>

      {/* ── Background animated shadow (thay thế bg-cover bg-center backdrop-blur-2xl) ── */}
      <EtheralShadow
        color="rgba(99, 102, 241, 0.75)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 1, scale: 1.2 }}
        sizing="fill"
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />

      {/* ── Mọi nội dung nằm trên background, cần relative z-10 ── */}

      {/* Logo lớn bên trái */}
      <img
        src={assets.logo_big}
        alt="QuickChat Logo"
        className='w-[min(30vw,250px)] relative z-10'
      />

      {/* Form đăng nhập / đăng ký */}
      <form
        onSubmit={onSubmitHandler}
        className='relative z-10 border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'
      >
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currState === "Sign up" ? "Đăng ký" : "Đăng nhập"}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt="Quay lại"
              className='w-5 cursor-pointer'
            />
          )}
        </h2>

        {currState === "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            className='p-2 border border-gray-500 rounded-md focus:outline-none'
            placeholder='Họ và tên của bạn'
            required
          />
        )}

        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder='Địa chỉ Email'
              required
              className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder='Mật khẩu'
              required
              className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </>
        )}

        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500'
            placeholder='Giới thiệu ngắn về bản thân...'
            required
          />
        )}

        <button
          type='submit'
          className='py-3 bg-linear-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'
        >
          {currState === "Sign up" ? (isDataSubmitted ? "Tạo tài khoản" : "Tiếp tục") : "Đăng nhập ngay"}
        </button>

        <div className='flex items-center gap-2 text-sm text-gray-500'>
          <input type="checkbox" required />
          <p>Tôi đồng ý với các điều khoản sử dụng & chính sách bảo mật.</p>
        </div>

        <div className='flex flex-col gap-2'>
          {currState === "Sign up" ? (
            <p className='text-sm text-gray-600'>
              Bạn đã có tài khoản?{' '}
              <span
                onClick={() => { setCurrState("Login"); setIsDataSubmitted(false) }}
                className='font-medium text-violet-500 cursor-pointer'
              >
                Đăng nhập tại đây
              </span>
            </p>
          ) : (
            <p className='text-sm text-gray-600'>
              Chưa có tài khoản?{' '}
              <span
                onClick={() => setCurrState("Sign up")}
                className='font-medium text-violet-500 cursor-pointer'
              >
                Nhấn vào đây để tạo
              </span>
            </p>
          )}
        </div>
      </form>

    </div>
  )
}

export default LoginPage