import { useRef, useState, useEffect, useCallback } from "react";

// -- Cau hinh ICE servers ------------------------------------------------
// Co the ghi de HOAN TOAN qua bien moi truong VITE_ICE_SERVERS (chuoi JSON),
// hoac cau hinh mot TURN server rieng qua VITE_TURN_URL / VITE_TURN_USERNAME /
// VITE_TURN_CREDENTIAL. Neu khong cau hinh, dung STUN cua Google + TURN cong
// khai (OpenRelay) lam mac dinh "best-effort" cho ket noi khac mang (NAT).
//
// LUU Y QUAN TRONG: TURN cong khai mien phi thuong KHONG on dinh. De goi on
// dinh giua cac mang khac nhau (4G <-> Wi-Fi, sau NAT/tuong lua), hay cau hinh
// TURN rieng (vd: Metered.ca goi mien phi 50GB/thang, Twilio, hoac coturn tu host)
// qua cac bien moi truong VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL.

const DEFAULT_STUN = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
];

// OpenRelay da doi endpoint xac thuc tinh sang "staticauth.openrelay.metered.ca".
// (Endpoint cu "openrelay.metered.ca" da ngung hoat dong -> nguyen nhan goi khac
//  mang bi den/khong co tieng: bat tay SDP xong nhung media path khong ket noi duoc.)
const DEFAULT_TURN = [
    {
        urls: "turn:staticauth.openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
    {
        urls: "turn:staticauth.openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
    {
        urls: "turn:staticauth.openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
    {
        urls: "turns:staticauth.openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
];

function buildIceServers() {
    const env = import.meta.env || {};

    // 1) Ghi de hoan toan bang JSON neu co VITE_ICE_SERVERS
    const rawJson = env.VITE_ICE_SERVERS;
    if (rawJson) {
        try {
            const parsed = JSON.parse(rawJson);
            if (Array.isArray(parsed) && parsed.length) return parsed;
        } catch (e) {
            console.warn("[WebRTC] VITE_ICE_SERVERS khong phai JSON hop le, bo qua:", e);
        }
    }

    const servers = [...DEFAULT_STUN];

    // 2) TURN rieng qua bien moi truong (khuyen nghi cho production)
    const turnUrl = env.VITE_TURN_URL;
    if (turnUrl) {
        const urls = turnUrl.split(",").map((u) => u.trim()).filter(Boolean);
        servers.push({
            urls,
            username: env.VITE_TURN_USERNAME || "",
            credential: env.VITE_TURN_CREDENTIAL || "",
        });
        return servers;
    }

    // 3) Mac dinh: kem TURN cong khai (best-effort, co the khong on dinh)
    return [...servers, ...DEFAULT_TURN];
}

const ICE_SERVERS = {
    iceServers: buildIceServers(),
    iceCandidatePoolSize: 10,
};

export function useVideoCall(socket, currentUserId, currentUserName) {
    const [callState, setCallState] = useState("idle");
    const [remoteUser, setRemoteUser] = useState(null);
    const [isVideoCall, setIsVideoCall] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteUserRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const pendingOfferRef = useRef(null);
    const disconnectTimerRef = useRef(null); // dem an han khi ICE 'disconnected'

    // ── Theo dõi thời gian cuộc gọi ─────────────────────────────
    const callStartTimeRef = useRef(null);   // Thời điểm cuộc gọi bắt đầu (active)
    const callerIdRef = useRef(null);        // ID người gọi
    const receiverIdRef = useRef(null);      // ID người nhận

    useEffect(() => { remoteUserRef.current = remoteUser; }, [remoteUser]);

    // Gắn remote/local stream vào video element khi ref sẵn sàng
    useEffect(() => {
        if (remoteVideoRef.current && remoteStreamRef.current) {
            if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current;
                remoteVideoRef.current.play().catch(e => console.error("Remote play error:", e));
            }
        }
        if (localVideoRef.current && localStreamRef.current) {
            if (localVideoRef.current.srcObject !== localStreamRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
                localVideoRef.current.play().catch(e => console.error("Local play error:", e));
            }
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
            const stream = e.streams?.[0] || new MediaStream([e.track]);
            if (stream) {
                remoteStreamRef.current = stream;
                if (remoteVideoRef.current) {
                    if (remoteVideoRef.current.srcObject !== stream) {
                        remoteVideoRef.current.srcObject = stream;
                        remoteVideoRef.current.play().catch(err => console.error("Play error:", err));
                    }
                }
            }
        };

        // Don tai nguyen khi ket noi bi mat that su (dung chung).
        const teardownFromLoss = () => {
            if (disconnectTimerRef.current) {
                clearTimeout(disconnectTimerRef.current);
                disconnectTimerRef.current = null;
            }
            if (peerRef.current) {
                peerRef.current.oniceconnectionstatechange = null; // Tranh goi lai
                peerRef.current.close();
                peerRef.current = null;
            }
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            remoteStreamRef.current = null;
            pendingCandidatesRef.current = [];
            pendingOfferRef.current = null;
            callStartTimeRef.current = null;
            callerIdRef.current = null;
            receiverIdRef.current = null;
            setCallState("idle");
            setRemoteUser(null);
        };

        peer.oniceconnectionstatechange = () => {
            const state = peer.iceConnectionState;
            console.log("[WebRTC] ICE state:", state);

            // Da/ dang phuc hoi -> huy dem an han neu co
            if (state === "connected" || state === "completed") {
                if (disconnectTimerRef.current) {
                    clearTimeout(disconnectTimerRef.current);
                    disconnectTimerRef.current = null;
                }
                return;
            }

            // "disconnected" thuong chi la gian doan tam thoi (doi mang / doi
            // candidate moi). Cho mot khoang an han de ICE tu phuc hoi truoc khi
            // ket thuc cuoc goi -- quan trong cho cuoc goi khac mang (4G <-> Wi-Fi).
            if (state === "disconnected") {
                if (disconnectTimerRef.current) return;
                console.warn("[WebRTC] ICE disconnected -> cho phuc hoi (8s)...");
                disconnectTimerRef.current = setTimeout(() => {
                    disconnectTimerRef.current = null;
                    const cur = peerRef.current;
                    if (cur && (cur.iceConnectionState === "disconnected" || cur.iceConnectionState === "failed")) {
                        console.warn("[WebRTC] Khong phuc hoi duoc -> ket thuc cuoc goi");
                        teardownFromLoss();
                    }
                }, 8000);
                return;
            }

            // Mat ket noi that su
            if (state === "failed" || state === "closed") {
                console.warn("[WebRTC] Connection lost -> auto-ending call, state:", state);
                teardownFromLoss();
            }
        };

        return peer;
    }, [socket]);

    // Hàm lấy userId từ remoteUser (hỗ trợ cả _id và id)
    const getRemoteUserId = useCallback(() => {
        const u = remoteUserRef.current;
        return u?._id || u?.id || null;
    }, []);

    // ── Hàm dọn dẹp tài nguyên WebRTC (dùng chung) ─────────────
    const cleanupCall = useCallback(() => {
        if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
        }
        peerRef.current?.close();
        peerRef.current = null;
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        remoteStreamRef.current = null;
        pendingCandidatesRef.current = [];
        pendingOfferRef.current = null;
    }, []);

    // ── Tính thời lượng cuộc gọi (giây) ─────────────────────────
    const getCallDuration = useCallback(() => {
        if (!callStartTimeRef.current) return 0;
        return Math.round((Date.now() - callStartTimeRef.current) / 1000);
    }, []);

    const startCall = async (targetUser, isVideo = true) => {
        setIsVideoCall(isVideo);
        setRemoteUser(targetUser);
        remoteUserRef.current = targetUser;
        setCallState("calling");
        pendingCandidatesRef.current = [];
        pendingOfferRef.current = null;
        remoteStreamRef.current = null;
        callStartTimeRef.current = null;

        // Lưu caller/receiver cho lịch sử cuộc gọi
        callerIdRef.current = currentUserId;
        receiverIdRef.current = targetUser._id || targetUser.id;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
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
                isVideo,
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

        // Ghi nhận thời điểm cuộc gọi bắt đầu
        callStartTimeRef.current = Date.now();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true });
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
        const duration = getCallDuration();
        const callType = callStartTimeRef.current ? "completed" : "missed";

        cleanupCall();

        if (socket && remoteUserRef.current) {
            const targetId = remoteUserRef.current._id || remoteUserRef.current.id;
            socket.emit("video:end", {
                to_user_id: targetId,
                caller_id: callerIdRef.current || currentUserId,
                receiver_id: receiverIdRef.current || targetId,
                call_type: callType,
                duration,
                is_video: isVideoCall,
            });
        }

        callStartTimeRef.current = null;
        callerIdRef.current = null;
        receiverIdRef.current = null;
        setCallState("idle");
        setRemoteUser(null);
    }, [socket, currentUserId, cleanupCall, getCallDuration]);

    const rejectCall = useCallback(() => {
        if (socket && remoteUserRef.current) {
            const targetId = remoteUserRef.current._id || remoteUserRef.current.id;
            socket.emit("video:reject", {
                to_user_id: targetId,
                caller_id: targetId,                   // Người gọi = remote user
                receiver_id: currentUserId,             // Người nhận = mình (đang từ chối)
                is_video: isVideoCall,
            });
        }

        cleanupCall();
        callerIdRef.current = null;
        receiverIdRef.current = null;
        setCallState("idle");
        setRemoteUser(null);
    }, [socket, currentUserId, cleanupCall]);

    useEffect(() => {
        if (!socket) return;

        const onIncoming = ({ from_user_id, caller_name, isVideo }) => {
            console.log("[VideoCall] Incoming call from:", from_user_id, caller_name, "isVideo:", isVideo);
            setIsVideoCall(isVideo !== false); // default true
            // Lưu cả _id và id để đảm bảo tương thích
            setRemoteUser({ _id: from_user_id, id: from_user_id, name: caller_name });
            setCallState("incoming");
            pendingCandidatesRef.current = [];
            pendingOfferRef.current = null;

            // Lưu caller/receiver cho lịch sử
            callerIdRef.current = from_user_id;
            receiverIdRef.current = currentUserId;
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
                // Ghi nhận thời điểm cuộc gọi bắt đầu cho phía người gọi
                callStartTimeRef.current = Date.now();
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
            cleanupCall();
            callStartTimeRef.current = null;
            callerIdRef.current = null;
            receiverIdRef.current = null;
            setCallState("idle"); setRemoteUser(null);
        };

        const onReject = () => {
            console.log("[VideoCall] Call rejected");
            cleanupCall();
            callStartTimeRef.current = null;
            callerIdRef.current = null;
            receiverIdRef.current = null;
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
    }, [socket, currentUserId]);

    // Bat/tat microphone tren local stream
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const enabledNow = stream.getAudioTracks().some((t) => t.enabled);
        stream.getAudioTracks().forEach((t) => { t.enabled = !enabledNow; });
        setIsMuted(enabledNow); // neu dang bat -> se thanh tat (muted)
    }, []);

    // Bat/tat camera tren local stream
    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const enabledNow = stream.getVideoTracks().some((t) => t.enabled);
        stream.getVideoTracks().forEach((t) => { t.enabled = !enabledNow; });
        setIsCameraOff(enabledNow);
    }, []);

    // Reset trang thai mute/camera moi khi cuoc goi ket thuc (callState ve idle)
    useEffect(() => {
        if (callState === "idle") {
            setIsMuted(false);
            setIsCameraOff(false);
        }
    }, [callState]);

    return { callState, remoteUser, localVideoRef, remoteVideoRef, startCall, answerCall, endCall, rejectCall, isVideoCall, isMuted, isCameraOff, toggleMute, toggleCamera };
}