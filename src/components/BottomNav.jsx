import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "ホーム" },
  { to: "/workout", label: "記録" },
  { to: "/history", label: "履歴" },
  { to: "/progress", label: "進捗" },
  { to: "/routines", label: "ルーティン" },
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
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #ddd",
        display: "flex",
        maxWidth: 420,
        margin: "0 auto",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        zIndex: 20,
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
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: isActive ? "#4C5B75" : "#999",
            fontWeight: isActive ? 700 : 400,
            fontSize: 12.5,
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
