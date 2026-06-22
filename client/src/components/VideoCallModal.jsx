export function VideoCallModal({ callState, remoteUser, localVideoRef, remoteVideoRef, onAnswer, onEnd, onReject }) {
    if (callState === "idle") return null;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            {/* Video người kia */}
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "80%", maxWidth: 640, borderRadius: 12 }} />

            {/* Video bản thân (góc nhỏ) */}
            <video ref={localVideoRef} autoPlay playsInline muted style={{ position: "absolute", bottom: 100, right: 24, width: 120, borderRadius: 8, border: "2px solid white" }} />

            {/* Controls */}
            <div style={{ position: "absolute", bottom: 32, display: "flex", gap: 16 }}>
                {callState === "incoming" && (
                    <>
                        <button onClick={onAnswer} style={{ background: "#1D9E75", color: "white", padding: "12px 28px", borderRadius: 24, border: "none", cursor: "pointer" }}>
                            Trả lời
                        </button>
                        <button onClick={onReject} style={{ background: "#666", color: "white", padding: "12px 28px", borderRadius: 24, border: "none", cursor: "pointer" }}>
                            Từ chối
                        </button>
                    </>
                )}
                <button onClick={onEnd} style={{ background: "#E24B4A", color: "white", padding: "12px 28px", borderRadius: 24, border: "none", cursor: "pointer" }}>
                    Kết thúc
                </button>
            </div>

            {callState === "calling" && (
                <p style={{ color: "white", marginTop: 16 }}>Đang gọi {remoteUser?.name}...</p>
            )}
        </div>
    );
}