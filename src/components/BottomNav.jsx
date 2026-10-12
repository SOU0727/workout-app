import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const ACCENT = "var(--primary)";

const iconPaths = {
  home: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  record: <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />,
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  progress: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  routines: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
};

const navItems = [
  { to: "/", label: "ホーム", icon: "home" },
  { to: "/workout", label: "記録", icon: "record" },
  { to: "/history", label: "履歴", icon: "history" },
  { to: "/progress", label: "進捗", icon: "progress" },
  { to: "/routines", label: "ルーティン", icon: "routines" },
];

const isField = (el) =>
  el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT");

export default function BottomNav() {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const onIn = (e) => {
      if (isField(e.target)) setTyping(true);
    };
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  if (typing) return null;

  return (
    // 画面下に浮かぶ、すりガラス風のタブバー
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        display: "flex",
        justifyContent: "center",
        padding: "0 16px",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <nav
        style={{
          pointerEvents: "auto",
          display: "flex",
          width: "100%",
          maxWidth: 388,
          padding: 5,
          borderRadius: 32,
          background: "var(--glass)",
          backdropFilter: "blur(22px) saturate(180%)",
          WebkitBackdropFilter: "blur(22px) saturate(180%)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-float)",
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={({ isActive }) => ({
              flex: 1,
              minWidth: 0,
              height: 56,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              borderRadius: 26,
              textDecoration: "none",
              background: isActive ? "var(--primary-soft)" : "transparent",
              color: isActive ? ACCENT : "var(--text-sub)",
              fontWeight: isActive ? 700 : 500,
              fontSize: 10.5,
              transition: "background 0.2s ease, color 0.2s ease",
            })}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {iconPaths[item.icon]}
            </svg>
            <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
