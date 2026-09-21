import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Settings({ user }) {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link to="/" style={{ display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18181A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </Link>
        <h1 style={{ fontSize: 20, margin: 0 }}>設定</h1>
      </div>

      <div style={{ background: "#fff", border: "1px solid #DADADA", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#74747A" }}>ログイン中のアカウント</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{user.email}</div>
      </div>

      <button
        onClick={() => signOut(auth)}
        style={{
          width: "100%",
          background: "none",
          border: "1px solid #9A3B33",
          color: "#9A3B33",
          borderRadius: 10,
          padding: 14,
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        ログアウト
      </button>
    </div>
  );
}