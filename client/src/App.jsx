import { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Toaster } from "react-hot-toast"
import { AuthContext } from '../context/AuthContext'
import { DarkGradientBg } from './components/ui/elegant-dark-pattern'

const App = () => {
  // Lấy thông tin người dùng đã đăng nhập từ AuthContext
  const { authUser } = useContext(AuthContext)

  return (
    // Đặt background cho toàn bộ ứng dụng
    <DarkGradientBg className="h-[100dvh] w-full overflow-hidden">
      {/* Component hiển thị các thông báo (toast) */}
      <Toaster />

      <Routes>
        {/* Nếu đã đăng nhập thì vào Trang chủ, nếu chưa thì chuyển hướng sang Đăng nhập */}
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />

        {/* Nếu chưa đăng nhập thì hiện Trang đăng nhập, nếu rồi thì chuyển về Trang chủ */}
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />

        {/* Trang cá nhân chỉ dành cho người đã đăng nhập */}
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
    </DarkGradientBg>
  )
}

export default App
