import { createContext, useState, useEffect } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import { io } from "socket.io-client"

// Lấy URL của backend từ biến môi trường (VITE_BACKEND_URL)
// Nếu không có biến môi trường, mặc định sử dụng localhost:5000 cho phát triển cục bộ.
// Xoá dấu / ở cuối URL (nếu có) để tránh lỗi double-slash khi ghép đường dẫn API.
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, '');
// Cấu hình axios để luôn gửi yêu cầu đến backend này
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);
    const [socket, setSocket] = useState(null);

    // Kiểm tra xem người dùng đã đăng nhập chưa khi load trang
    const checkAuth = async () => {
        try {
            const {data} = await axios.get("/api/auth/check")
            if(data.success){
                setAuthUser(data.user)
                connectSocket(data.user) // Kết nối socket nếu đã đăng nhập
            }
        } catch {
            // Nếu không đăng nhập hoặc token hết hạn, xóa dữ liệu
            setAuthUser(null);
        }
    }

    // Hàm xử lý đăng nhập hoặc đăng ký
    const login = async (state, credentials)=>{
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if(data.success){
                if(state === 'login' || state === 'signup' || state === 'google-login'){
                    // Lưu token TRƯỚC khi connect socket (handshake đọc token từ localStorage)
                    axios.defaults.headers.common["token"] = data.token;
                    setToken(data.token);
                    localStorage.setItem("token", data.token)

                    setAuthUser(data.userData);
                    connectSocket(data.userData); // Kết nối socket ngay lập tức
                }
                toast.success(data.message)
                return true;
            } else{
                toast.error(data.message)
                return false;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            return false;
        }
    }

    // Hàm đăng xuất
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Đã đăng xuất")
        if (socket) socket.disconnect(); // Ngắt kết nối socket
    }

    // Cập nhật thông tin cá nhân
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("Cập nhật hồ sơ thành công")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Khởi tạo kết nối Socket.IO
    const connectSocket = (userData)=>{
        if(!userData || socket?.connected) return;

        // BAO MAT: gui JWT qua `auth` trong handshake de server xac thuc va suy ra userId.
        // Khong con truyen userId qua query string (server khong con tin query nua).
        const jwt = localStorage.getItem("token");
        const newSocket = io(backendUrl, {
            auth: {
                token: jwt,
            },
        });
        newSocket.connect();
        setSocket(newSocket);

        // Lắng nghe sự kiện cập nhật danh sách người dùng đang online từ server
        newSocket.on("getOnlineUsers", (userIds)=>{
            setOnlineUser(userIds);
        })
    }

    useEffect(()=>{
        // Nếu có token sẵn trong localStorage, gán vào axios header
        if(token){
            axios.defaults.headers.common["token"] = token;
        }
        checkAuth()
    },[])

    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
