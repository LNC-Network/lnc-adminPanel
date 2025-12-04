import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LNC Admin Panel - Network Management Dashboard";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0f0f0f",
                    backgroundImage:
                        "linear-gradient(to bottom right, #0f0f0f, #1a1a2e)",
                }}
            >
                {/* Accent line at top */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                    }}
                />

                {/* Logo circle */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        marginBottom: 30,
                    }}
                >
                    <span
                        style={{
                            fontSize: 48,
                            fontWeight: "bold",
                            color: "white",
                        }}
                    >
                        LNC
                    </span>
                </div>

                {/* Title */}
                <div
                    style={{
                        display: "flex",
                        fontSize: 64,
                        fontWeight: "bold",
                        color: "white",
                        marginBottom: 15,
                    }}
                >
                    Admin Panel
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        display: "flex",
                        fontSize: 28,
                        color: "#a1a1aa",
                        marginBottom: 50,
                    }}
                >
                    Network Management Dashboard
                </div>

                {/* Features row */}
                <div
                    style={{
                        display: "flex",
                        gap: 60,
                        color: "#71717a",
                        fontSize: 20,
                    }}
                >
                    <span>👥 User Management</span>
                    <span>📊 Analytics</span>
                    <span>📧 Mailing</span>
                    <span>📅 Calendar</span>
                </div>

                {/* URL at bottom */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 40,
                        fontSize: 22,
                        color: "#3b82f6",
                    }}
                >
                    lnc-admin-panel.vercel.app
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
