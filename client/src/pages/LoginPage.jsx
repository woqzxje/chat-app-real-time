import React, {useContext, useState} from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {

  // Các trạng thái của form: "Sign up" (Đăng ký) hoặc "Login" (Đăng nhập)
  const [currState, setCurrState] = useState("Sign up")
  
  // Các biến lưu trữ giá trị nhập từ người dùng
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  
  // Trạng thái kiểm soát việc chuyển sang bước nhập Bio khi đăng ký
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  // Lấy hàm login từ AuthContext
  const {login} = useContext(AuthContext)

  // Xử lý khi nhấn nút Submit (Gửi form)
  const onSubmitHandler = async (event) => {
    event.preventDefault();
   
    // Nếu đang ở chế độ Đăng ký và chưa nhập Bio, chuyển sang màn hình nhập Bio
    if(currState === "Sign up" && !isDataSubmitted){
      setIsDataSubmitted(true)
      return;
    }

    // Gọi API đăng nhập hoặc đăng ký thông qua hàm login từ context
    const success = await login(currState === "Sign up" ? 'signup' : 'login', {fullName, email, password, bio})

    // Sau khi đăng ký thành công, tự động chuyển về màn hình Đăng nhập để người dùng nhập lại thông tin
    if(success && currState === "Sign up"){
      setCurrState("Login")
      setIsDataSubmitted(false)
      setFullName("")
      setPassword("")
      setBio("")
    }
  }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col'>
      {/* ----------- Phần bên trái: Logo lớn ----------- */}
      <img src={assets.logo_big} alt="QuickChat Logo" className='w-[min(30vw,250px)]' />

      {/* ----------- Phần bên phải: Form nhập liệu ----------- */}
      <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currState === "Sign up" ? "Đăng ký" : "Đăng nhập"}
          {/* Nút quay lại nếu đang ở bước nhập Bio */}
          {isDataSubmitted && <img onClick={()=> setIsDataSubmitted(false)} src={assets.arrow_icon} alt="Quay lại" className='w-5 cursor-pointer' />
          }
        </h2>
          
        {/* Nhập Họ và tên (chỉ hiện khi Đăng ký và chưa nhấn tiếp tục) */}
        {currState === "Sign up" && !isDataSubmitted && (
          <input onChange={(e)=> setFullName(e.target.value)} value={fullName}
          type="text" className='p-2 border border-gray-500 rounded-md focus:outline-none' placeholder='Họ và tên của bạn' required />
        )}

        {/* Nhập Email và Mật khẩu */}
        {!isDataSubmitted && (
          <>
          <input onChange={(e)=> setEmail(e.target.value)} value={email}
          type="email" placeholder='Địa chỉ Email' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' />
          <input onChange={(e)=> setPassword(e.target.value)} value={password}
          type="password" placeholder='Mật khẩu' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' />
          </>
        )}

        {/* Nhập Bio (Lời giới thiệu bản thân) - hiện ở bước 2 của Đăng ký */}
        {
          currState === "Sign up" && isDataSubmitted && (
            <textarea onChange={(e)=>setBio(e.target.value)} value={bio}
            rows={4} className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500' placeholder='Giới thiệu ngắn về bản thân...' required></textarea>
          )
        }

        {/* Nút gửi form */}
        <button type='submit' className='py-3 bg-linear-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
          {currState === "Sign up" ? (isDataSubmitted ? "Tạo tài khoản" : "Tiếp tục") : "Đăng nhập ngay"}
        </button>

        {/* Các điều khoản sử dụng */}
        <div className='flex items-center gap-2 text-sm text-gray-500'>
          <input type="checkbox" required />
          <p>Tôi đồng ý với các điều khoản sử dụng & chính sách bảo mật.</p>
        </div>

        {/* Chuyển đổi giữa Đăng ký và Đăng nhập */}
        <div className='flex flex-col gap-2'>
          {currState === "Sign up" ? (
            <p className='text-sm text-gray-600'>Bạn đã có tài khoản? <span onClick={()=>{setCurrState("Login"); setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer'>Đăng nhập tại đây</span></p>
          ) : (
            <p className='text-sm text-gray-600'>Chưa có tài khoản? <span onClick={()=>setCurrState("Sign up")} className='font-medium text-violet-500 cursor-pointer'>Nhấn vào đây để tạo</span></p>
          )}
        </div>

      </form>
    </div>
  )
}

export default LoginPage
