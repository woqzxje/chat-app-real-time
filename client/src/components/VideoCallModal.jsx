/**
 * VideoCallModal — Giao diện cuộc gọi Video
 * Signaling được xử lý bởi server Python (socket_manager.py)
 *
 * Trạng thái nút:
 *   - "calling"  → chỉ hiện nút "Huỷ" (hủy cuộc gọi đi)
 *   - "incoming" → chỉ hiện nút "Trả lời" + "Từ chối"
 *   - "active"   → chỉ hiện nút "Kết thúc"
 */
import { useState, useEffect } from "react";

// ── Hàm format thời gian mm:ss ──────────────────────────────────────────────
const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

export function VideoCallModal({ callState, remoteUser, localVideoRef, remoteVideoRef, onAnswer, onEnd, onReject }) {
    const [elapsed, setElapsed] = useState(0);

    // ── Đếm thời gian cuộc gọi khi đang active ─────────────────
    useEffect(() => {
        if (callState !== "active") {
            setElapsed(0);
            return;
        }
        const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [callState]);

    if (callState === "idle") return null;

    return (
        <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            zIndex: 50,
        }}>

            {/* ── Trạng thái cuộc gọi ────────────────────────────────── */}
            {callState === "calling" && (
                <p style={{
                    color: "white", fontSize: 18, marginBottom: 16,
                    animation: "vcPulse 1.5s infinite",
                }}>
                    📞 Đang gọi {remoteUser?.fullName || remoteUser?.name}...
                </p>
            )}
            {callState === "incoming" && (
                <p style={{
                    color: "#1D9E75", fontSize: 18, marginBottom: 16,
                    animation: "vcPulse 1.5s infinite",
                }}>
                    📲 {remoteUser?.name || "Ai đó"} đang gọi cho bạn...
                </p>
            )}
            {callState === "active" && (
                <p style={{
                    color: "#00cfff", fontSize: 16, marginBottom: 12,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: 1,
                }}>
                    🔴 {formatDuration(elapsed)}
                </p>
            )}

            {/* ── Video người kia ────────────────────────────────────── */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                    width: "80%", maxWidth: 640,
                    borderRadius: 12, background: "#111",
                    minHeight: 300,
                }}
            />

            {/* ── Video bản thân (góc nhỏ) ───────────────────────────── */}
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                    position: "absolute",
                    bottom: 100, right: 24,
                    width: 160, borderRadius: 8,
                    border: "2px solid white",
                    background: "#222",
                }}
            />

            {/* ── Controls — thay đổi theo trạng thái ────────────────── */}
            <div style={{ position: "absolute", bottom: 32, display: "flex", gap: 16 }}>

                {/* ── INCOMING: Trả lời + Từ chối ────────────────────── */}
                {callState === "incoming" && (
                    <>
                        <button
                            onClick={onAnswer}
                            style={{
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                color: "white", padding: "14px 32px",
                                borderRadius: 28, border: "none",
                                cursor: "pointer", fontSize: 16, fontWeight: "bold",
                                boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
                                transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                            onMouseEnter={(e) => { e.target.style.transform = "scale(1.05)"; }}
                            onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
                        >
                            ✅ Trả lời
                        </button>
                        <button
                            onClick={onReject}
                            style={{
                                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                color: "white", padding: "14px 32px",
                                borderRadius: 28, border: "none",
                                cursor: "pointer", fontSize: 16, fontWeight: "bold",
                                boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
                                transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                            onMouseEnter={(e) => { e.target.style.transform = "scale(1.05)"; }}
                            onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
                        >
                            ❌ Từ chối
                        </button>
                    </>
                )}

                {/* ── CALLING: Huỷ cuộc gọi ─────────────────────────── */}
                {callState === "calling" && (
                    <button
                        onClick={onEnd}
                        style={{
                            background: "linear-gradient(135deg, #6b7280, #4b5563)",
                            color: "white", padding: "14px 32px",
                            borderRadius: 28, border: "none",
                            cursor: "pointer", fontSize: 16, fontWeight: "bold",
                            boxShadow: "0 4px 20px rgba(107,114,128,0.4)",
                            transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => { e.target.style.transform = "scale(1.05)"; }}
                        onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
                    >
                        📞 Huỷ cuộc gọi
                    </button>
                )}

                {/* ── ACTIVE: Kết thúc cuộc gọi ─────────────────────── */}
                {callState === "active" && (
                    <button
                        onClick={onEnd}
                        style={{
                            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                            color: "white", padding: "14px 36px",
                            borderRadius: 28, border: "none",
                            cursor: "pointer", fontSize: 16, fontWeight: "bold",
                            boxShadow: "0 4px 24px rgba(239,68,68,0.5)",
                            transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => { e.target.style.transform = "scale(1.05)"; }}
                        onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
                    >
                        📕 Kết thúc
                    </button>
                )}
            </div>

            {/* CSS animation cho pulse */}
            <style>{`
                @keyframes vcPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}