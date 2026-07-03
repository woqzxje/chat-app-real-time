import { useContext, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, Lock, Eye, EyeClosed, ArrowRight, User, FileText, ArrowLeft, Check } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { SparklesText } from '../components/ui/SparklesText'
import { GradientButton } from '../components/ui/GradientButton'

const LoginPage = () => {

  // Các trạng thái của form: "Sign up" (Đăng ký) hoặc "Login" (Đăng nhập)
  const [currState, setCurrState] = useState("Sign up")

  // Các biến lưu trữ giá trị nhập từ người dùng
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)

  // Trạng thái kiểm soát việc chuyển sang bước nhập Bio khi đăng ký
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  // Lấy hàm login từ AuthContext
  const { login } = useContext(AuthContext)

  // 3D card tilt effect (CSS state-based to avoid hook conflicts)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setTilt({
      rotateX: (y / 300) * -8,
      rotateY: (x / 300) * 8
    })
  }

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 })
  }

  // Xử lý khi nhấn nút Submit (Gửi form)
  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Nếu đang ở chế độ Đăng ký và chưa nhập Bio, chuyển sang màn hình nhập Bio
    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return;
    }

    setIsLoading(true)

    // Gọi API đăng nhập hoặc đăng ký thông qua hàm login từ context
    const success = await login(currState === "Sign up" ? 'signup' : 'login', { fullName, email, password, bio })

    setIsLoading(false)

    // Sau khi đăng ký thành công, tự động chuyển về màn hình Đăng nhập để người dùng nhập lại thông tin
    if (success && currState === "Sign up") {
      setCurrState("Login")
      setIsDataSubmitted(false)
      setFullName("")
      setPassword("")
      setBio("")
    }
  }

  // Xử lý khi đăng nhập Google thành công
  const onGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true)
    await login('google-login', { credential: credentialResponse.credential })
    setIsLoading(false)
  }

  // Xử lý khi đăng nhập Google thất bại
  const onGoogleError = () => {
    toast.error('Đăng nhập Google thất bại')
  }

  return (
    <div className='min-h-screen flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col px-4'>
      {/* ----------- Phần bên trái: Logo lớn ----------- */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center gap-4 text-white"
      >
        <SparklesText text={<>
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">Chat</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">ITC</span>
        </>} className="text-5xl md:text-6xl lg:text-7xl" sparklesCount={10} />
      </motion.div>

      {/* ----------- Phần bên phải: Card đăng nhập ----------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10"
        style={{ perspective: 1500 }}
      >
        <div
          className="relative transition-transform duration-150 ease-out"
          style={{ transform: `perspective(1500px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative group">
            {/* Card glow effect */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(0,207,255,0.05)",
                  "0 0 20px 5px rgba(0,207,255,0.1)",
                  "0 0 10px 2px rgba(0,207,255,0.05)"
                ],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
            />

            {/* Traveling light beam effect */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
              {/* Top beam */}
              <motion.div
                className="absolute top-0 left-0 h-[3px] w-[60%]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,207,255,0.9), transparent)', filter: 'blur(1px)' }}
                animate={{ left: ["-60%", "100%"] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }}
              />
              {/* Right beam */}
              <motion.div
                className="absolute top-0 right-0 h-[60%] w-[3px]"
                style={{ background: 'linear-gradient(180deg, transparent, rgba(0,207,255,0.9), transparent)', filter: 'blur(1px)' }}
                animate={{ top: ["-60%", "100%"] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5, delay: 0.75 }}
              />
              {/* Bottom beam */}
              <motion.div
                className="absolute bottom-0 right-0 h-[3px] w-[60%]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,207,255,0.9), transparent)', filter: 'blur(1px)' }}
                animate={{ right: ["-60%", "100%"] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5, delay: 1.5 }}
              />
              {/* Left beam */}
              <motion.div
                className="absolute bottom-0 left-0 h-[60%] w-[3px]"
                style={{ background: 'linear-gradient(180deg, transparent, rgba(0,207,255,0.9), transparent)', filter: 'blur(1px)' }}
                animate={{ bottom: ["-60%", "100%"] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5, delay: 2.25 }}
              />

              {/* Corner glow spots */}
              <motion.div className="absolute top-0 left-0 h-[6px] w-[6px] rounded-full bg-cyan-400/60 blur-[2px]"
                animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }} />
              <motion.div className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-cyan-400/70 blur-[3px]"
                animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.4, repeat: Infinity, repeatType: "mirror", delay: 0.5 }} />
              <motion.div className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-cyan-400/70 blur-[3px]"
                animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.2, repeat: Infinity, repeatType: "mirror", delay: 1 }} />
              <motion.div className="absolute bottom-0 left-0 h-[6px] w-[6px] rounded-full bg-cyan-400/60 blur-[2px]"
                animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.3, repeat: Infinity, repeatType: "mirror", delay: 1.5 }} />
            </div>

            {/* Card border glow on hover */}
            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-cyan-500/5 via-cyan-400/10 to-cyan-500/5 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />

            {/* ═══════════ Glass card background ═══════════ */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.08] shadow-2xl overflow-hidden">
              {/* Subtle card inner pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)',
                  backgroundSize: '30px 30px'
                }}
              />

              {/* ─── Form content ─── */}
              <form onSubmit={onSubmitHandler} className="relative space-y-4">

                {/* Header */}
                <div className="text-center space-y-1 mb-5">

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80 flex items-center justify-center gap-2"
                  >
                    {currState === "Sign up" ? "Tạo tài khoản" : "Chào mừng trở lại"}
                    {/* Nút quay lại nếu đang ở bước nhập Bio */}
                    {isDataSubmitted && (
                      <button type="button" onClick={() => setIsDataSubmitted(false)} className="text-white/50 hover:text-white transition-colors cursor-pointer">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/50 text-xs"
                  >
                    {currState === "Sign up"
                      ? (isDataSubmitted ? "Hãy cho mọi người biết về bạn" : "Đăng ký để bắt đầu trò chuyện")
                      : "Đăng nhập để tiếp tục với QuickChat"}
                  </motion.p>
                </div>

                <AnimatePresence mode="wait">
                  {!isDataSubmitted ? (
                    <motion.div
                      key="main-fields"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {/* Nhập Họ và tên (chỉ hiện khi Đăng ký) */}
                      {currState === "Sign up" && (
                        <motion.div
                          className="relative"
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="relative flex items-center overflow-hidden rounded-lg">
                            <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "name" ? 'text-cyan-400' : 'text-white/40'}`} />
                            <input
                              onChange={(e) => setFullName(e.target.value)}
                              value={fullName}
                              onFocus={() => setFocusedInput("name")}
                              onBlur={() => setFocusedInput(null)}
                              type="text"
                              placeholder="Họ và tên của bạn"
                              required
                              className="w-full bg-white/5 border border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 rounded-lg transition-all duration-300 pl-10 pr-3 focus:bg-white/10 outline-none text-sm"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Email input */}
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "email" ? 'text-cyan-400' : 'text-white/40'}`} />
                          <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            onFocus={() => setFocusedInput("email")}
                            onBlur={() => setFocusedInput(null)}
                            type="email"
                            placeholder="Địa chỉ Email"
                            required
                            className="w-full bg-white/5 border border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 rounded-lg transition-all duration-300 pl-10 pr-3 focus:bg-white/10 outline-none text-sm"
                          />
                        </div>
                      </motion.div>

                      {/* Password input */}
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "password" ? 'text-cyan-400' : 'text-white/40'}`} />
                          <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            onFocus={() => setFocusedInput("password")}
                            onBlur={() => setFocusedInput(null)}
                            type={showPassword ? "text" : "password"}
                            placeholder="Mật khẩu"
                            required
                            className="w-full bg-white/5 border border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 rounded-lg transition-all duration-300 pl-10 pr-10 focus:bg-white/10 outline-none text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 cursor-pointer"
                          >
                            {showPassword ? (
                              <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                            ) : (
                              <EyeClosed className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* Bio textarea — bước 2 khi đăng ký */
                    <motion.div
                      key="bio-field"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <div className="relative flex items-start overflow-hidden rounded-lg">
                          <FileText className={`absolute left-3 top-3 w-4 h-4 transition-all duration-300 ${focusedInput === "bio" ? 'text-cyan-400' : 'text-white/40'}`} />
                          <textarea
                            onChange={(e) => setBio(e.target.value)}
                            value={bio}
                            onFocus={() => setFocusedInput("bio")}
                            onBlur={() => setFocusedInput(null)}
                            rows={4}
                            placeholder="Giới thiệu ngắn về bản thân..."
                            required
                            className="w-full bg-white/5 border border-transparent focus:border-white/20 text-white placeholder:text-white/30 rounded-lg transition-all duration-300 pl-10 pr-3 py-3 focus:bg-white/10 outline-none text-sm resize-none"
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Điều khoản sử dụng */}
                <div className="flex items-center gap-2 text-xs text-white/50 pt-1">
                  <div className="relative flex items-center justify-center">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="peer appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all duration-200 cursor-pointer relative z-10"
                    />
                    {/* Check icon khi được chọn */}
                    <Check className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200 z-20" strokeWidth={4} />
                    
                    {/* Hiệu ứng luồng sáng phát ra (burst/ripple) */}
                    <AnimatePresence>
                      {isAgreed && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 1 }}
                          animate={{ scale: 3.5, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full bg-cyan-400 blur-sm pointer-events-none z-0"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <label htmlFor="terms" className="cursor-pointer hover:text-white/70 transition-colors">
                    Tôi đồng ý với các điều khoản sử dụng & chính sách bảo mật.
                  </label>
                </div>

                {/* Nút gửi form */}
                <div className="mt-2 space-y-3">
                  <GradientButton
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 group/button"
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-1.5 text-sm font-medium">
                          {currState === "Sign up" ? (isDataSubmitted ? "Tạo tài khoản" : "Tiếp tục") : "Đăng nhập ngay"}
                          <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-1 transition-transform duration-300" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </GradientButton>

                  <div className="flex items-center gap-2 py-1">
                    <div className="h-[1px] bg-white/10 flex-1" />
                    <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Hoặc</span>
                    <div className="h-[1px] bg-white/10 flex-1" />
                  </div>
                  
                  <div className="flex justify-center w-full overflow-hidden transition-all duration-300 hover:scale-[1.02]">
                    <GoogleLogin
                      onSuccess={onGoogleSuccess}
                      onError={onGoogleError}
                      theme="filled_black"
                      shape="pill"
                      width="300"
                    />
                  </div>
                </div>

                {/* Chuyển đổi giữa Đăng ký và Đăng nhập */}
                <motion.p
                  className="text-center text-xs text-white/50 mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {currState === "Sign up" ? (
                    <>Bạn đã có tài khoản?{' '}
                      <span
                        onClick={() => { setCurrState("Login"); setIsDataSubmitted(false) }}
                        className="relative inline-block group/link cursor-pointer"
                      >
                        <span className="relative z-10 text-cyan-400 group-hover/link:text-cyan-300 transition-colors duration-300 font-medium">
                          Đăng nhập tại đây
                        </span>
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-cyan-400 group-hover/link:w-full transition-all duration-300" />
                      </span>
                    </>
                  ) : (
                    <>Chưa có tài khoản?{' '}
                      <span
                        onClick={() => setCurrState("Sign up")}
                        className="relative inline-block group/link cursor-pointer"
                      >
                        <span className="relative z-10 text-cyan-400 group-hover/link:text-cyan-300 transition-colors duration-300 font-medium">
                          Nhấn vào đây để tạo
                        </span>
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-cyan-400 group-hover/link:w-full transition-all duration-300" />
                      </span>
                    </>
                  )}
                </motion.p>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
