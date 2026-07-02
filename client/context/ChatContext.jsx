import { createContext, useState, useEffect, useContext } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [users, setUsers] = useState([]); // Danh sách người dùng trong sidebar
    const [messages, setMessages] = useState([]); // Danh sách tin nhắn trong khung chat
    const [selectedUser, setSelectedUser] = useState(null); // Người dùng đang được chọn để chat
    const [unseenMessages, setUnseenMessages] = useState({}); // Số tin nhắn chưa đọc
    const [isUserLoading, setIsUserLoading] = useState(false);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false); // Trạng thái mở/đóng RightSidebar

    const { socket, authUser } = useContext(AuthContext)

    // Lấy danh sách người dùng từ backend
    const getUsers = async () => {
        setIsUserLoading(true)
        try {
            const { data } = await axios.get("/api/messages/users")
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages || {})
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsUserLoading(false)
        }
    }

    // Lấy lịch sử tin nhắn với một người dùng cụ thể
    const getMessages = async (userId) => {
        setIsMessagesLoading(true)
        try {
            const { data } = await axios.get(`/api/messages/${userId}`)
            if (data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsMessagesLoading(false)
        }
    }

    // Hàm gửi tin nhắn
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData)
            if (data.success) {
                // Cập nhật tin nhắn mới vào danh sách hiện tại
                setMessages((prev) => [...prev, data.newMessage])
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Lắng nghe tin nhắn mới từ Socket.IO
    const subscribeToMessages = () => {
        if (!socket) return;

        // Khi nhận được sự kiện "receiveMessage" từ server
        socket.on("receiveMessage", (newMessage) => {
            // Kiểm tra xem tin nhắn có thuộc cuộc trò chuyện hiện tại không
            // (từ người đang chat HOẶC từ mình gửi cho người đang chat — ví dụ: lịch sử cuộc gọi)
            const isFromSelected = newMessage.senderId === selectedUser?._id;
            const isMineToSelected = newMessage.senderId === authUser?._id
                                   && newMessage.receiverId === selectedUser?._id;

            if (isFromSelected || isMineToSelected) {
                setMessages((prev) => {
                    // Tránh trùng lặp (khi server emit cho cả 2 bên)
                    if (prev.some((m) => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
            } else if (newMessage.senderId !== authUser?._id) {
                // Tăng số tin nhắn chưa đọc từ người gửi khác
                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }))
            }
        });
    }

    // Ngừng lắng nghe tin nhắn (dọn dẹp bộ nhớ)
    const unSubscribeToMessages = () => {
        if (socket) {
            socket.off("receiveMessage");
        }
    }

    // Mỗi khi người dùng đang chat cùng (selectedUser) thay đổi, thiết lập lại lắng nghe socket
    useEffect(() => {
        subscribeToMessages();
        return () => unSubscribeToMessages();
    }, [socket, selectedUser]);

    // Lắng nghe real-time: user mới đăng ký hoặc user cập nhật avatar/tên
    useEffect(() => {
        if (!socket) return;

        // Server emit khi có tài khoản mới -> thêm ngay vào sidebar
        socket.on("newUserRegistered", (newUser) => {
            if (!authUser || newUser._id === authUser._id) return;
            setUsers((prev) => {
                const exists = prev.some((u) => u._id === newUser._id);
                return exists ? prev : [...prev, newUser];
            });
        });

        // Server emit khi user đổi avatar/tên/bio -> cập nhật ngay, không cần reload
        socket.on("userUpdated", (updatedUser) => {
            // Cập nhật trong danh sách sidebar
            setUsers((prev) =>
                prev.map((u) => (u._id === updatedUser._id ? { ...u, ...updatedUser } : u))
            );
            // Nếu người đang chat cũng vừa thay đổi -> cập nhật luôn header/right panel
            setSelectedUser((prev) =>
                prev && prev._id === updatedUser._id ? { ...prev, ...updatedUser } : prev
            );
        });

        return () => {
            socket.off("newUserRegistered");
            socket.off("userUpdated");
        };
    }, [socket, authUser]);

    // Khi ứng dụng khởi chạy hoặc authUser thay đổi, tải danh sách người dùng
    useEffect(() => {
        if (authUser) {
            getUsers()
        }
    }, [authUser])

    const value = {
        users,
        messages,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        isUserLoading,
        isMessagesLoading,
        getUsers,
        getMessages,
        sendMessage,
        showRightSidebar,
        setShowRightSidebar,
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}
