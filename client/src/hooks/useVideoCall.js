import { useRef, useState, useEffect, useCallback } from "react";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
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
            catch (e) { console.error("ICE error:", e); }
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
        };

        return peer;
    }, [socket]);

    const startCall = async (targetUser) => {
        setRemoteUser(targetUser);
        remoteUserRef.current = targetUser;
        setCallState("calling");
        pendingCandidatesRef.current = [];
        remoteStreamRef.current = null;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = createPeer(targetUser._id);
        peerRef.current = peer;
        stream.getTracks().forEach((t) => peer.addTrack(t, stream));

        socket.emit("video:initiate", {
            to_user_id: targetUser._id,
            from_user_id: currentUserId,
            caller_name: currentUserName || "Người dùng",
        });

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("video:offer", { to_user_id: targetUser._id, offer });
    };

    const answerCall = async () => {
        setCallState("active");
        remoteStreamRef.current = null;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const targetId = remoteUserRef.current?.id;
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
            socket.emit("video:end", { to_user_id: remoteUserRef.current._id || remoteUserRef.current.id });
        }
        setCallState("idle");
        setRemoteUser(null);
    }, [socket]);

    const rejectCall = useCallback(() => {
        if (socket && remoteUserRef.current) {
            socket.emit("video:reject", { to_user_id: remoteUserRef.current.id });
        }
        pendingCandidatesRef.current = [];
        pendingOfferRef.current = null;
        setCallState("idle");
        setRemoteUser(null);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on("video:incoming", ({ from_user_id, caller_name }) => {
            setRemoteUser({ id: from_user_id, name: caller_name });
            setCallState("incoming");
            pendingCandidatesRef.current = [];
            pendingOfferRef.current = null;
        });

        socket.on("video:offer", ({ offer }) => {
            pendingOfferRef.current = offer;
        });

        socket.on("video:answer", async ({ answer }) => {
            if (peerRef.current) {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                await flushPendingCandidates(peerRef.current);
                setCallState("active");
            }
        });

        socket.on("video:ice-candidate", async ({ candidate }) => {
            if (peerRef.current && peerRef.current.remoteDescription) {
                try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
                catch (e) { console.error("ICE error:", e); }
            } else {
                pendingCandidatesRef.current.push(candidate);
            }
        });

        socket.on("video:end", () => {
            peerRef.current?.close(); peerRef.current = null;
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null; remoteStreamRef.current = null;
            pendingCandidatesRef.current = []; pendingOfferRef.current = null;
            setCallState("idle"); setRemoteUser(null);
        });

        socket.on("video:reject", () => {
            pendingCandidatesRef.current = []; pendingOfferRef.current = null;
            setCallState("idle"); setRemoteUser(null);
        });

        return () => {
            ["video:incoming","video:offer","video:answer","video:ice-candidate","video:end","video:reject"]
                .forEach((e) => socket.off(e));
        };
    }, [socket]);

    return { callState, remoteUser, localVideoRef, remoteVideoRef, startCall, answerCall, endCall, rejectCall };
}