import { useAuth } from "../auth/AuthContext";

export default function SessionTimer() {
  const { timeLeft, sessionExpired, user } = useAuth();

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

  //  Don't show anything for admin
  if (user?.email === ADMIN_EMAIL) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  // show after 5 seconds inactivity
  const showWarning = timeLeft <= (5 * 60 * 1000 - 5000);

  if (sessionExpired) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backdropFilter: "blur(6px)",
          background: "rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            borderRadius: "14px",
            padding: "25px 40px",
            color: "white",
            fontSize: "18px",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          }}
        >
          ⚠️ Session expired. Redirecting to login...
        </div>
      </div>
    );
  }

  if (!showWarning) return null;

  return (
    <div
        style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backdropFilter: "blur(12px)",
        background: "rgba(0,0,0,0.65)", // darker glass background
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "12px",
        padding: "10px 16px",
        fontSize: "14px",
        color: "#ffffff",
        fontWeight: "500",
        zIndex: 50,
        boxShadow: "0 8px 25px rgba(0,0,0,0.35)",
        }}
    >
        ⏳ Session: {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
 );
}