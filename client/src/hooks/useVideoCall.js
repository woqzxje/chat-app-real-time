import { useRef, useState, useEffect, useCallback } from "react";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        // TURN servers miễn phí (backup khi P2P qua NAT thất bại)
        {
            urls: "turn:relay1.expressturn.com:443",
            username: "efFKTGOVKNYNJVYHLI",
            credential: "KmkiISaT8K89Jgrp",
        },
    ],
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
    const pendingCandidatesRef = useRef([]);
    const pendingOfferRef = useRef(null);

    useEffect(() => { remoteUserRef.current = remoteUser; }, [remoteUser]);

    // Gắn remote stream vào video element khi ref sẵn sàng
    useEffect(() => {
        if (remoteVideoRef.current && remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
    });

    const flushPendingCandidates = async (peer) => {
        const candidates = [...pendingCandidatesRef.current];
        pendingCandidatesRef.current = [];
        for (const c of candidates) {
            try { await peer.addIceCandidate(new RTCIceCandidate(c)); }
            catch (e) { console.error("ICE flush error:", e); }
        }
    };

    const createPeer = useCallback((targetUserId) => {
        const peer = new RTCPeerConnection(ICE_SERVERS);

        peer.onicecandidate = (e) => {
            if (e.candidate && socket) {
                socket.emit("video:ice-candidate", {
                    to_user_id: targetUserId,
                    candidate: e.candidate,
                });
            }
        };

        peer.ontrack = (e) => {
            console.log("[WebRTC] ontrack fired, streams:", e.streams.length);
            const stream = e.streams?.[0];
            if (stream) {
                remoteStreamRef.current = stream;
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log("[WebRTC] ICE state:", peer.iceConnectionState);
            // Tự động kết thúc cuộc gọi khi kết nối bị mất
            if (peer.iceConnectionState === "failed" || peer.iceConnectionState === "disconnected") {
                console.warn("[WebRTC] Connection lost, state:", peer.iceConnectionState);
            }
        };

        return peer;
    }, [socket]);

    // Hàm lấy userId từ remoteUser (hỗ trợ cả _id và id)
    const getRemoteUserId = useCallback(() => {
        const u = remoteUserRef.current;
        return u?._id || u?.id || null;
    }, []);

    const startCall = async (targetUser) => {
        setRemoteUser(targetUser);
        remoteUserRef.current = targetUser;
        setCallState("calling");
        pendingCandidatesRef.current = [];
        pendingOfferRef.current = null;
        remoteStreamRef.current = null;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const targetId = targetUser._id || targetUser.id;
            const peer = createPeer(targetId);
            peerRef.current = peer;
            stream.getTracks().forEach((t) => peer.addTrack(t, stream));

            // Bước 1: Thông báo cho người nhận rằng có cuộc gọi đến
            socket.emit("video:initiate", {
                to_user_id: targetId,
                from_user_id: currentUserId,
                caller_name: currentUserName || "Người dùng",
            });

            // Bước 2: Tạo và gửi SDP Offer
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit("video:offer", {
                to_user_id: targetId,
                from_user_id: currentUserId,
                offer,
            });
        } catch (err) {
            console.error("[VideoCall] startCall error:", err);
            setCallState("idle");
            setRemoteUser(null);
        }
    };

    const answerCall = async () => {
        setCallState("active");
        remoteStreamRef.current = null;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            // Sử dụng helper để lấy userId đúng (hỗ trợ cả _id và id)
            const targetId = getRemoteUserId();
            if (!targetId) {
                console.error("[VideoCall] answerCall: no remote user ID found");
                return;
            }

            const peer = createPeer(targetId);
            peerRef.current = peer;
            stream.getTracks().forEach((t) => peer.addTrack(t, stream));

            const offer = pendingOfferRef.current;
            if (offer) {
                await peer.setRemoteDescription(new RTCSessionDescription(offer));
                pendingOfferRef.current = null;
                await flushPendingCandidates(peer);

                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit("video:answer", { to_user_id: targetId, answer });
            } else {
                console.warn("[VideoCall] answerCall: no pending offer found, waiting...");
            }
        } catch (err) {
            console.error("[VideoCall] answerCall error:", err);
            setCallState("idle");
            setRemoteUser(null);
        }
    };

    const endCall = useCallback(() => {
        peerRef.current?.close();
        peerRef.current = null;
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        remoteStreamRef.current = null;
        pendingCandidatesRef.current = [];
        pendingOfferRef.current = null;
        if (socket && remoteUserRef.current) {
            const targetId = remoteUserRef.current._id || remoteUserRef.current.id;
            socket.emit("video:end", { to_user_id: targetId });
        }
        setCallState("idle");
        setRemoteUser(null);
    }, [socket]);

    const rejectCall = useCallback(() => {
        if (socket && remoteUserRef.current) {
            const targetId = remoteUserRef.current._id || remoteUserRef.current.id;
            socket.emit("video:reject", { to_user_id: targetId });
        }
        pendingCandidatesRef.current = [];
        pendingOfferRef.current = null;
        setCallState("idle");
        setRemoteUser(null);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const onIncoming = ({ from_user_id, caller_name }) => {
            console.log("[VideoCall] Incoming call from:", from_user_id, caller_name);
            // Lưu cả _id và id để đảm bảo tương thích
            setRemoteUser({ _id: from_user_id, id: from_user_id, name: caller_name });
            setCallState("incoming");
            pendingCandidatesRef.current = [];
            pendingOfferRef.current = null;
        };

        const onOffer = ({ offer, from_user_id }) => {
            console.log("[VideoCall] Received offer from:", from_user_id);
            pendingOfferRef.current = offer;

            // Nếu đã có peer (đã answer trước khi offer đến - race condition)
            // thì xử lý offer ngay lập tức
            if (peerRef.current && !peerRef.current.remoteDescription) {
                (async () => {
                    try {
                        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                        pendingOfferRef.current = null;
                        await flushPendingCandidates(peerRef.current);

                        const answer = await peerRef.current.createAnswer();
                        await peerRef.current.setLocalDescription(answer);
                        const targetId = from_user_id || remoteUserRef.current?._id || remoteUserRef.current?.id;
                        socket.emit("video:answer", { to_user_id: targetId, answer });
                    } catch (err) {
                        console.error("[VideoCall] Late offer processing error:", err);
                    }
                })();
            }
        };

        const onAnswer = async ({ answer }) => {
            console.log("[VideoCall] Received answer");
            if (peerRef.current) {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                await flushPendingCandidates(peerRef.current);
                setCallState("active");
            }
        };

        const onIceCandidate = async ({ candidate }) => {
            if (peerRef.current && peerRef.current.remoteDescription) {
                try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
                catch (e) { console.error("ICE error:", e); }
            } else {
                pendingCandidatesRef.current.push(candidate);
            }
        };

        const onEnd = () => {
            console.log("[VideoCall] Remote ended call");
            peerRef.current?.close(); peerRef.current = null;
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null; remoteStreamRef.current = null;
            pendingCandidatesRef.current = []; pendingOfferRef.current = null;
            setCallState("idle"); setRemoteUser(null);
        };

        const onReject = () => {
            console.log("[VideoCall] Call rejected");
            peerRef.current?.close(); peerRef.current = null;
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null; remoteStreamRef.current = null;
            pendingCandidatesRef.current = []; pendingOfferRef.current = null;
            setCallState("idle"); setRemoteUser(null);
        };

        socket.on("video:incoming", onIncoming);
        socket.on("video:offer", onOffer);
        socket.on("video:answer", onAnswer);
        socket.on("video:ice-candidate", onIceCandidate);
        socket.on("video:end", onEnd);
        socket.on("video:reject", onReject);

        return () => {
            socket.off("video:incoming", onIncoming);
            socket.off("video:offer", onOffer);
            socket.off("video:answer", onAnswer);
            socket.off("video:ice-candidate", onIceCandidate);
            socket.off("video:end", onEnd);
            socket.off("video:reject", onReject);
        };
    }, [socket]);

    return { callState, remoteUser, localVideoRef, remoteVideoRef, startCall, answerCall, endCall, rejectCall };
}