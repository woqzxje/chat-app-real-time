/**
 * VideoCallModal — Giao diện cuộc gọi Video
 * Signaling được xử lý bởi server Python (socket_manager.py)
 */
export function VideoCallModal({ callState, remoteUser, localVideoRef, remoteVideoRef, onAnswer, onEnd, onReject }) {
    if (callState === "idle") return null;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 50 }}>

            {/* Trạng thái cuộc gọi */}
            {callState === "calling" && (
                <p style={{ color: "white", fontSize: 18, marginBottom: 16, animation: "pulse 1.5s infinite" }}>
                    📞 Đang gọi {remoteUser?.fullName || remoteUser?.name}...
                </p>
            )}
            {callState === "incoming" && (
                <p style={{ color: "#1D9E75", fontSize: 18, marginBottom: 16, animation: "pulse 1.5s infinite" }}>
                    📲 {remoteUser?.name || "Ai đó"} đang gọi cho bạn...
                </p>
            )}

            {/* Video người kia */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                    width: "80%",
                    maxWidth: 640,
                    borderRadius: 12,
                    background: "#111",
                    minHeight: 300,
                }}
            />

            {/* Video bản thân (góc nhỏ) */}
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                    position: "absolute",
                    bottom: 100,
                    right: 24,
                    width: 160,
                    borderRadius: 8,
                    border: "2px solid white",
                    background: "#222",
                }}
            />

            {/* Controls */}
            <div style={{ position: "absolute", bottom: 32, display: "flex", gap: 16 }}>
                {callState === "incoming" && (
                    <>
                        <button onClick={onAnswer} style={{ background: "#1D9E75", color: "white", padding: "12px 28px", borderRadius: 24, border: "none", cursor: "pointer", fontSize: 16, fontWeight: "bold" }}>
                            ✅ Trả lời
                        </button>
                        <button onClick={onReject} style={{ background: "#666", color: "white", padding: "12px 28px", borderRadius: 24, border: "none", cursor: "pointer", fontSize: 16 }}>
                            ❌ Từ chối
                        </button>
                    </>
                )}
                <button onClick={onEnd} style={{ background: "#E24B4A", color: "white", padding: "12px 28px", borderRadius: 24, border: "none", cursor: "pointer", fontSize: 16, fontWeight: "bold" }}>
                    📕 Kết thúc
                </button>
            </div>

            {/* CSS animation cho pulse */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}