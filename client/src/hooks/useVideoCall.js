/**
 * useVideoCall — Hook quản lý cuộc gọi Video (WebRTC)
 * 
 * Signaling được xử lý bởi server Python (socket_manager.py)
 * Sử dụng các sự kiện "video:*" để giao tiếp với server
 */
import { useRef, useState, useEffect, useCallback } from "react";

// Cấu hình ICE Server — dùng STUN server của Google để tìm địa chỉ IP public
const ICE_SERVERS = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useVideoCall(socket, currentUserId, currentUserName) {
    const [callState, setCallState] = useState("idle");
    const [remoteUser, setRemoteUser] = useState(null);

    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteUserRef = useRef(null);

    // Đồng bộ remoteUser vào ref (tránh stale closure)
    useEffect(() => {
        remoteUserRef.current = remoteUser;
    }, [remoteUser]);

    // Tạo RTCPeerConnection và gắn các event handler
    const createPeer = useCallback((targetUserId) => {
        const peer = new RTCPeerConnection(ICE_SERVERS);

        // Khi có ICE candidate → gửi đến server Python để chuyển tiếp
        peer.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("video:ice-candidate", {
                    to_user_id: targetUserId,
                    candidate: e.candidate,
                });
            }
        };

        // Khi nhận được track video/audio từ đối phương → hiển thị
        peer.ontrack = (e) => {
            remoteStreamRef.current = e.streams[0];
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = e.streams[0];
            }
        };

        return peer;
    }, [socket]);

    // ── NGƯỜI GỌI: Bắt đầu cuộc gọi ─────────────────────────────────────
    const startCall = async (targetUser) => {
        setRemoteUser(targetUser);
        remoteUserRef.current = targetUser;
        setCallState("calling");

        // Lấy camera + microphone
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = createPeer(targetUser._id);
        peerRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        // Gửi yêu cầu gọi đến server Python
        socket.emit("video:initiate", {
            to_user_id: targetUser._id,
            from_user_id: currentUserId,
            caller_name: currentUserName || "Người dùng",
        });

        // Tạo SDP Offer và gửi đến server Python
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("video:offer", {
            to_user_id: targetUser._id,
            offer,
        });
    };

    // ── NGƯỜI NHẬN: Trả lời cuộc gọi ─────────────────────────────────────
    const answerCall = async () => {
        setCallState("active");

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = createPeer(remoteUserRef.current?.id);
        peerRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        // Set SDP Offer đã nhận từ server Python → tạo Answer → gửi lại
        const pendingOffer = peerRef._pendingOffer;
        if (pendingOffer) {
            await peer.setRemoteDescription(new RTCSessionDescription(pendingOffer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("video:answer", {
                to_user_id: remoteUserRef.current?.id,
                answer,
            });
        }
    };

    // ── Kết thúc cuộc gọi ─────────────────────────────────────────────────
    const endCall = useCallback(() => {
        peerRef.current?.close();
        peerRef.current = null;
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        if (socket && remoteUserRef.current) {
            socket.emit("video:end", { to_user_id: remoteUserRef.current._id || remoteUserRef.current.id });
        }
        setCallState("idle");
        setRemoteUser(null);
    }, [socket]);

    // ── Từ chối cuộc gọi ─────────────────────────────────────────────────
    const rejectCall = useCallback(() => {
        if (remoteUserRef.current) {
            socket.emit("video:reject", { to_user_id: remoteUserRef.current.id });
        }
        setCallState("idle");
        setRemoteUser(null);
    }, [socket]);

    // ── Lắng nghe các sự kiện từ server Python ────────────────────────────
    useEffect(() => {
        if (!socket) return;

        // Nhận thông báo cuộc gọi đến
        socket.on("video:incoming", ({ from_user_id, caller_name }) => {
            setRemoteUser({ id: from_user_id, name: caller_name });
            setCallState("incoming");
        });

        // Nhận SDP Offer từ người gọi (qua server Python)
        socket.on("video:offer", ({ offer }) => {
            peerRef._pendingOffer = offer;
        });

        // Nhận SDP Answer từ người nhận (qua server Python) → kết nối hoàn tất
        socket.on("video:answer", async ({ answer }) => {
            if (peerRef.current) {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setCallState("active");
            }
        });

        // Nhận ICE Candidate (qua server Python)
        socket.on("video:ice-candidate", async ({ candidate }) => {
            if (peerRef.current) {
                try {
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("ICE candidate error:", e);
                }
            }
        });

        // Cuộc gọi bị kết thúc bởi đối phương
        socket.on("video:end", () => {
            peerRef.current?.close();
            peerRef.current = null;
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            setCallState("idle");
            setRemoteUser(null);
        });

        // Cuộc gọi bị từ chối
        socket.on("video:reject", () => {
            setCallState("idle");
            setRemoteUser(null);
        });

        return () => {
            socket.off("video:incoming");
            socket.off("video:offer");
            socket.off("video:answer");
            socket.off("video:ice-candidate");
            socket.off("video:end");
            socket.off("video:reject");
        };
    }, [socket]);

    return {
        callState, remoteUser,
        localVideoRef, remoteVideoRef,
        startCall, answerCall, endCall, rejectCall,
    };
}