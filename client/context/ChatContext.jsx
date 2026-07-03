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
    const [typingUsers, setTypingUsers] = useState({}); // { userId: true } dang go
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

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
            const { data } = await axios.get(`/api/messages/${userId}`, { params: { limit: 50 } })
            if (data.success) {
                setMessages(data.messages)
                setHasMoreMessages(!!data.hasMore)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsMessagesLoading(false)
        }
    }

    // Tai them tin nhan cu hon (infinite scroll khi cuon len dau)
    const loadMoreMessages = async (userId) => {
        if (isLoadingMore || !hasMoreMessages) return
        const oldest = messages[0]
        if (!oldest) return
        setIsLoadingMore(true)
        try {
            const { data } = await axios.get(`/api/messages/${userId}`, { params: { limit: 50, before: oldest.createdAt } })
            if (data.success) {
                setMessages((prev) => {
                    const existing = new Set(prev.map((m) => m._id))
                    const older = data.messages.filter((m) => !existing.has(m._id))
                    return [...older, ...prev]
                })
                setHasMoreMessages(!!data.hasMore)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsLoadingMore(false)
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
            }
        } catch (error) {
            toast.error(error.message)
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
    // Gui trang thai 'dang go' cho nguoi dang chat
    const sendTyping = (isTyping) => {
        if (socket && selectedUser) {
            socket.emit('typing', { to_user_id: selectedUser._id, is_typing: isTyping });
        }
    };

    // Hien thong bao trinh duyet khi tab khong duoc focus
    const notifyNewMessage = (msg, fromName) => {
        try {
            if (typeof Notification === 'undefined') return;
            if (document.visibilityState === 'visible') return;
            if (Notification.permission !== 'granted') return;
            const body = msg.text || (msg.image ? '[Hinh anh]' : (msg.attachment ? '[Tep dinh kem]' : 'Tin nhan moi'));
            const n = new Notification(fromName || 'Tin nhan moi', { body });
            n.onclick = () => { window.focus(); n.close(); };
        } catch { /* ignore */ }
    };

    const subscribeToMessages = () => {
        if (!socket) return;

        // Khi nhận được sự kiện "receiveMessage" từ server
        socket.on("receiveMessage", (newMessage) => {
            // Tin nhan den -> khong con "dang go" nua
            setTypingUsers((prev) => { const n = { ...prev }; delete n[newMessage.senderId]; return n; });
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
                
                // Nếu tin nhắn là từ người mình đang mở chat, báo cho server là mình đã xem ngay
                if (isFromSelected) {
                    socket.emit("markMessagesSeen", { senderId: newMessage.senderId, receiverId: authUser._id })
                }
            } else if (newMessage.senderId !== authUser?._id) {
                // Tăng số tin nhắn chưa đọc từ người gửi khác
                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }))
            }

            // Thong bao trinh duyet neu tab khong focus
            if (newMessage.senderId !== authUser?._id) {
                const senderUser = users.find(u => u._id === newMessage.senderId);
                notifyNewMessage(newMessage, senderUser?.fullName);
            }

            // Nếu người nhắn tin đến chưa có trong Sidebar, load lại danh sách
            const otherId = newMessage.senderId === authUser?._id ? newMessage.receiverId : newMessage.senderId;
            setUsers(prevUsers => {
                if (!prevUsers.find(u => u._id === otherId)) {
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
        // Lang nghe trang thai "dang go" tu nguoi kia
        socket.on("typing", ({ from_user_id, is_typing }) => {
            setTypingUsers((prev) => {
                const next = { ...prev };
                if (is_typing) next[from_user_id] = true;
                else delete next[from_user_id];
                return next;
            });
        });

        socket.on("messagesSeen", ({ receiverId }) => {
            setMessages((prev) => prev.map(m => 
                m.receiverId === receiverId 
                ? { ...m, seen: true } 
                : m
            ));
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
            socket.off("typing");
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
        editMessage,
        revokeMessage,
        reactMessage,
        showRightSidebar,
        setShowRightSidebar,
        typingUsers,
        sendTyping,
        hasMoreMessages,
        isLoadingMore,
        loadMoreMessages,
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}
