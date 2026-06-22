import { useRef, useState, useEffect, useCallback } from "react";

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
    const remoteUserRef = useRef(null); // ✅ ref để dùng trong closure

    // Đồng bộ remoteUser vào ref (tránh stale closure)
    useEffect(() => {
        remoteUserRef.current = remoteUser;
    }, [remoteUser]);

    const createPeer = useCallback((targetUserId) => {
        const peer = new RTCPeerConnection(ICE_SERVERS);

        peer.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("call:ice-candidate", {
                    to_user_id: targetUserId,
                    candidate: e.candidate,
                });
            }
        };

        peer.ontrack = (e) => {
            remoteStreamRef.current = e.streams[0];
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = e.streams[0];
            }
        };

        return peer;
    }, [socket]);

    // ✅ Người GỌI: tạo peer → lấy stream → tạo offer → gửi offer
    const startCall = async (targetUser) => {
        setRemoteUser(targetUser);
        remoteUserRef.current = targetUser;
        setCallState("calling");

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = createPeer(targetUser._id);
        peerRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        // Báo cho bên nhận biết có cuộc gọi đến
        socket.emit("call:initiate", {
            to_user_id: targetUser._id,
            from_user_id: currentUserId,
            caller_name: currentUserName || "Người dùng",
        });

        // ✅ Tạo offer và gửi ngay
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("call:offer", {
            to_user_id: targetUser._id,
            offer,
        });
    };

    // ✅ Người NHẬN: lấy stream → tạo peer → set offer → tạo answer → gửi answer
    const answerCall = async () => {
        setCallState("active");

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = createPeer(remoteUserRef.current?.id);
        peerRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        // ✅ Set offer đã lưu tạm trước đó
        const pendingOffer = peerRef._pendingOffer;
        if (pendingOffer) {
            await peer.setRemoteDescription(new RTCSessionDescription(pendingOffer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("call:answer", {
                to_user_id: remoteUserRef.current?.id,
                answer,
            });
        }
    };

    const endCall = useCallback(() => {
        peerRef.current?.close();
        peerRef.current = null;
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        if (socket && remoteUserRef.current) {  // ✅ check socket trước
            socket.emit("call:end", { to_user_id: remoteUserRef.current.id });
        }
        setCallState("idle");
        setRemoteUser(null);
    }, [socket]);

    const rejectCall = useCallback(() => {
        if (remoteUserRef.current) {
            socket.emit("call:reject", { to_user_id: remoteUserRef.current.id });
        }
        setCallState("idle");
        setRemoteUser(null);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        // ✅ Bên nhận: lưu thông tin người gọi và chuyển state sang "incoming"
        socket.on("call:incoming", ({ from_user_id, caller_name }) => {
            setRemoteUser({ id: from_user_id, name: caller_name });
            setCallState("incoming");
        });

        // ✅ Bên nhận: lưu offer vào ref để dùng khi answerCall
        socket.on("call:offer", ({ offer }) => {
            peerRef._pendingOffer = offer;
        });

        // ✅ Bên gọi: nhận answer → kết nối hoàn tất
        socket.on("call:answer", async ({ answer }) => {
            if (peerRef.current) {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setCallState("active");
            }
        });

        socket.on("call:ice-candidate", async ({ candidate }) => {
            if (peerRef.current) {
                try {
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("ICE candidate error:", e);
                }
            }
        });

        socket.on("call:end", () => {
            peerRef.current?.close();
            peerRef.current = null;
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            setCallState("idle");
            setRemoteUser(null);
        });

        socket.on("call:reject", () => {
            setCallState("idle");
            setRemoteUser(null);
        });

        return () => {
            socket.off("call:incoming");
            socket.off("call:offer");
            socket.off("call:answer");
            socket.off("call:ice-candidate");
            socket.off("call:end");
            socket.off("call:reject");
        };
    }, [socket]);

    return {
        callState, remoteUser,
        localVideoRef, remoteVideoRef,
        startCall, answerCall, endCall, rejectCall,
    };
}