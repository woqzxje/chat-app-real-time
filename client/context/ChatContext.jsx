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

    const { socket, authUser, setAuthUser } = useContext(AuthContext)

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
                
                // Cập nhật lại sidebar nếu đây là người mới chưa có trong list
                setUsers(prev => {
                    if (!prev.find(u => u._id === selectedUser._id)) {
                        setTimeout(() => getUsers(), 100);
                    }
                    return prev;
                });
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    // Hàm chỉnh sửa tin nhắn
    const editMessage = async (msgId, newText) => {
        try {
            const { data } = await axios.put(`/api/messages/edit/${msgId}`, { text: newText })
            if (data.success) {
                setMessages((prev) => prev.map(m => m._id === msgId ? data.message : m))
                toast.success('Chỉnh sửa tin nhắn thành công')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    // Hàm thu hồi tin nhắn
    const revokeMessage = async (msgId) => {
        try {
            const { data } = await axios.put(`/api/messages/revoke/${msgId}`)
            if (data.success) {
                setMessages((prev) => prev.map(m => m._id === msgId ? data.message : m))
                toast.success('Đã thu hồi tin nhắn')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    // Hàm chuyển tiếp tin nhắn
    const forwardMessage = async (messageData, receiverIds) => {
        try {
            const promises = receiverIds.map(id => axios.post(`/api/messages/send/${id}`, messageData));
            const results = await Promise.all(promises);
            
            const failed = results.filter(r => !r.data.success);
            if (failed.length > 0) {
                toast.error(`Chuyển tiếp thất bại đến ${failed.length} liên hệ`);
            } else {
                toast.success('Chuyển tiếp tin nhắn thành công');
            }
            
            setTimeout(() => getUsers(), 100);
            
            if (selectedUser && receiverIds.includes(selectedUser._id)) {
                getMessages(selectedUser._id);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    // Hàm thả cảm xúc
    const reactMessage = async (msgId, emoji) => {
        try {
            const { data } = await axios.post(`/api/messages/react/${msgId}`, { emoji })
            if (data.success) {
                setMessages((prev) => prev.map(m => m._id === msgId ? data.message : m))
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    // Lắng nghe tin nhắn mới từ Socket.IO
    const subscribeToMessages = () => {
        if (!socket) return;

        // Khi nhận được sự kiện "receiveMessage" từ server
        socket.on("receiveMessage", (newMessage) => {
            // Lấy ID của cuộc trò chuyện (User ID hoặc Group ID)
            const conversationId = newMessage.receiverId === authUser?._id ? newMessage.senderId : newMessage.receiverId;
            const isForSelected = conversationId === selectedUser?._id;

            if (isForSelected) {
                setMessages((prev) => {
                    // Tránh trùng lặp (khi server emit cho cả 2 bên)
                    if (prev.some((m) => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
                
                // Nếu tin nhắn là từ người khác, báo cho server là mình đã xem ngay
                if (newMessage.senderId !== authUser?._id) {
                    socket.emit("markMessagesSeen", { 
                        senderId: newMessage.senderId, 
                        receiverId: selectedUser?.isGroup ? selectedUser._id : authUser._id,
                        isGroup: !!selectedUser?.isGroup
                    });
                }
            } else if (newMessage.senderId !== authUser?._id) {
                // Tăng số tin nhắn chưa đọc cho đúng Group hoặc User
                setUnseenMessages(prev => ({
                    ...prev,
                    [conversationId]: (prev[conversationId] || 0) + 1
                }))
            }

            // Nếu Group hoặc User chưa có trong Sidebar, load lại danh sách
            setUsers(prevUsers => {
                if (!prevUsers.find(u => u._id === conversationId)) {
                    setTimeout(() => getUsers(), 100);
                }
                return prevUsers;
            });
        });

        // Lắng nghe sự kiện tin nhắn bị chỉnh sửa
        socket.on("messageEdited", ({ msgId, text }) => {
            setMessages((prev) => prev.map(m => 
                m._id === msgId 
                ? { ...m, text, isEdited: true, editedAt: new Date().toISOString() } 
                : m
            ));
        });

        // Lắng nghe sự kiện tin nhắn bị thu hồi
        socket.on("messageDeleted", ({ msgId }) => {
            setMessages((prev) => prev.map(m => 
                m._id === msgId 
                ? { ...m, isDeleted: true, text: null, image: null, attachment: null } 
                : m
            ));
        });

        // Lắng nghe sự kiện thả cảm xúc
        socket.on("messageReacted", ({ msgId, reactions }) => {
            setMessages((prev) => prev.map(m => 
                m._id === msgId 
                ? { ...m, reactions } 
                : m
            ));
        });

        // Lắng nghe sự kiện báo tin nhắn đã được xem
        socket.on("messagesSeen", ({ receiverId }) => {
            setMessages((prev) => prev.map(m => 
                m.receiverId === receiverId 
                ? { ...m, seen: true } 
                : m
            ));
        });

        // Lắng nghe sự kiện báo tin nhắn nhóm đã được xem
        socket.on("groupMessagesSeen", ({ groupId, userId, userInfo }) => {
            setMessages((prev) => prev.map(m => {
                if (m.receiverId === groupId && m.senderId !== userId) {
                    const seenBy = m.seenBy || [];
                    const seenByUsers = m.seenByUsers || [];
                    if (!seenBy.includes(userId)) {
                        return {
                            ...m,
                            seenBy: [...seenBy, userId],
                            seenByUsers: userInfo ? [...seenByUsers, userInfo] : seenByUsers
                        };
                    }
                }
                return m;
            }));
        });
    }

    // Ngừng lắng nghe tin nhắn (dọn dẹp bộ nhớ)
    const unSubscribeToMessages = () => {
        if (socket) {
            socket.off("receiveMessage");
            socket.off("messageEdited");
            socket.off("messageDeleted");
            socket.off("messageReacted");
            socket.off("messagesSeen");
            socket.off("groupMessagesSeen");
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

        // Server emit khi có tài khoản mới
        socket.on("newUserRegistered", (newUser) => {
            if (!authUser || newUser._id === authUser._id) return;
            // Chỉ hiển thị thông báo thay vì tự động thêm vào sidebar làm rác danh sách người lạ
            toast.success(`Thành viên mới gia nhập: ${newUser.fullName}`, {
                icon: '👋',
                style: { background: '#f97316', color: '#fff' }
            });
        });

        // Server emit khi user đổi avatar/tên/bio hoặc nhóm thay đổi -> cập nhật ngay
        socket.on("userUpdated", (updatedUser) => {
            // Không thêm chính mình vào danh sách chat
            if (authUser && updatedUser._id === authUser._id) {
                return;
            }
            
            // Cập nhật trong danh sách sidebar
            setUsers((prev) => {
                const exists = prev.some((u) => u._id === updatedUser._id);
                if (exists) {
                    return prev.map((u) => (u._id === updatedUser._id ? { ...u, ...updatedUser } : u));
                }
                
                // Nếu chưa tồn tại trong danh sách: 
                // Chỉ thêm vào nếu đây là một Nhóm (Group) vừa được tạo hoặc mình vừa được thêm vào
                // Tránh tình trạng thêm User lạ vào sidebar khi họ đổi ảnh đại diện
                if (updatedUser.isGroup) {
                    return [...prev, updatedUser];
                }
                
                return prev;
            });
            // Nếu người đang chat cũng vừa thay đổi -> cập nhật luôn header/right panel
            setSelectedUser((prev) =>
                prev && prev._id === updatedUser._id ? { ...prev, ...updatedUser } : prev
            );
        });

        // Lắng nghe sự kiện rời/giải tán nhóm
        socket.on("groupRemoved", ({ groupId }) => {
            setUsers((prev) => prev.filter(u => u._id !== groupId));
            setSelectedUser((prev) => prev && prev._id === groupId ? null : prev);
        });

        // Nhận thông báo khi ai đó âm thầm rời nhóm
        socket.on("memberLeftSilently", ({ groupName, userName }) => {
            toast(`${userName} đã âm thầm rời khỏi nhóm ${groupName}`, {
                icon: '🤫',
                style: {
                    background: '#333',
                    color: '#fff',
                }
            });
        });

        // Xử lý sự kiện cấm chat realtime
        socket.on("userBanned", ({ banned_until, reason }) => {
            if (!banned_until) {
                toast.success(`TIN VUI: Bạn đã được gỡ cấm chat!`);
            } else {
                toast.error(`CẢNH BÁO: Bạn đã bị cấm chat đến ${new Date(banned_until).toLocaleString()} do: ${reason}`, { duration: 10000 });
            }
            if (setAuthUser) {
                setAuthUser((prev) => ({ ...prev, banned_until }));
            }
        });

        return () => {
            socket.off("newUserRegistered");
            socket.off("userUpdated");
            socket.off("groupRemoved");
            socket.off("memberLeftSilently");
            socket.off("userBanned");
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
        editMessage,
        revokeMessage,
        forwardMessage,
        reactMessage,
        showRightSidebar,
        setShowRightSidebar,
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}
