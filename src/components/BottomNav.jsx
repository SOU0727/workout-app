import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "ホーム" },
  { to: "/workout", label: "記録" },
  { to: "/progress", label: "進捗" },
  { to: "/routines", label: "ルーティン" },
];

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "#fff",
        borderTop: "1px solid #ddd",
        display: "flex",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          style={({ isActive }) => ({
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: isActive ? "#4C5B75" : "#999",
            fontWeight: isActive ? 700 : 400,
            fontSize: 13,
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}