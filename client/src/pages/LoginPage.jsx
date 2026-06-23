import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'
import { StarsBackground } from '../components/ui/stars'

const LoginPage = () => {
  const [currState, setCurrState] = useState('Sign up')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)

  const { login } = useContext(AuthContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if (currState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return
    }
    const success = await login(
      currState === 'Sign up' ? 'signup' : 'login',
      { fullName, email, password, bio }
    )
    if (success && currState === 'Sign up') {
      setCurrState('Login')
      setIsDataSubmitted(false)
      setFullName('')
      setPassword('')
      setBio('')
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
      className="min-h-screen flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col"
      starColor="rgba(200,180,255,0.9)"
      speed={60}
    >
      {/* Dark radial overlay so form is readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(80,0,120,0.25) 0%, rgba(0,0,0,0.4) 100%)' }}
      />

      {/* Logo */}
      <img
        src={assets.logo_big}
        alt="QuickChat Logo"
        className="w-[min(30vw,250px)] relative z-10 drop-shadow-2xl"
      />

      {/* Form */}
      <form
        onSubmit={onSubmitHandler}
        className="relative z-10 flex flex-col gap-5 p-8 rounded-2xl w-full max-w-sm"
        style={{
          background: 'rgba(15,5,30,0.7)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-2xl tracking-tight">
            {currState === 'Sign up' ? 'Đăng ký' : 'Đăng nhập'}
          </h2>
          {isDataSubmitted && (
            <button
              type="button"
              onClick={() => setIsDataSubmitted(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <img src={assets.arrow_icon} alt="Quay lại" className="w-4 invert opacity-60" />
            </button>
          )}
        </div>

        {currState === 'Sign up' && !isDataSubmitted && (
          <input type="text" placeholder="Họ và tên của bạn" value={fullName}
            onChange={(e) => setFullName(e.target.value)} required
            className={inputCls} style={inputStyle} {...focusHandlers} />
        )}

        {!isDataSubmitted && (
          <>
            <input type="email" placeholder="Địa chỉ Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className={inputCls} style={inputStyle} {...focusHandlers} />
            <input type="password" placeholder="Mật khẩu" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              className={inputCls} style={inputStyle} {...focusHandlers} />
          </>
        )}

        {currState === 'Sign up' && isDataSubmitted && (
          <textarea rows={4} placeholder="Giới thiệu ngắn về bản thân..." value={bio}
            onChange={(e) => setBio(e.target.value)} required
            className={inputCls + ' resize-none'} style={inputStyle} {...focusHandlers} />
        )}

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 6px 24px rgba(124,58,237,0.45)' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(124,58,237,0.6)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.45)' }}
        >
          {currState === 'Sign up' ? (isDataSubmitted ? 'Tạo tài khoản' : 'Tiếp tục') : 'Đăng nhập ngay'}
        </button>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" required className="mt-0.5 accent-violet-500 cursor-pointer" />
          <span className="text-xs text-gray-400 leading-relaxed">
            Tôi đồng ý với các{' '}
            <span className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">điều khoản sử dụng</span>
            {' '}&amp;{' '}
            <span className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">chính sách bảo mật</span>.
          </span>
        </label>

        <p className="text-xs text-gray-500 text-center">
          {currState === 'Sign up' ? (
            <>Bạn đã có tài khoản?{' '}
              <span onClick={() => { setCurrState('Login'); setIsDataSubmitted(false) }}
                className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer transition-colors">
                Đăng nhập tại đây
              </span>
            </>
          ) : (
            <>Chưa có tài khoản?{' '}
              <span onClick={() => setCurrState('Sign up')}
                className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer transition-colors">
                Nhấn vào đây để tạo
              </span>
            </>
          )}
        </p>
      </form>
    </StarsBackground>
  )
}

export default LoginPage