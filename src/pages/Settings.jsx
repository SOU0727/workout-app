import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Settings({ user }) {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link to="/" style={{ display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </Link>
        <h1 style={{ fontSize: 20, margin: 0 }}>設定</h1>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ログイン中のアカウント</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{user.email}</div>
      </div>

      <button
        onClick={() => signOut(auth)}
        style={{
          width: "100%",
          background: "none",
          border: "1px solid var(--danger)",
          color: "var(--danger)",
          borderRadius: 10,
          padding: 14,
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        ログアウト
      </button>

      <div style={{ marginTop: 24, fontSize: 11.5, color: "var(--text-muted)" }}>
        アプリの版: {new Date(import.meta.env.VITE_BUILD_TIME).toLocaleString("ja-JP")}
      </div>

      <div style={{ marginTop: 20, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.8 }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>クレジット</div>
        3D人体モデル:{" "}
        <a href="https://lluisv.itch.io/z-anatomy" target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
          Z-Anatomy
        </a>
        (BodyParts3D 由来)。{" "}
        <a href="https://github.com/jeremyspm/flesh-and-bone" target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
          flesh-and-bone
        </a>{" "}
        で整理されたデータを使用し、色分け・一部非表示などの加工をしています。ライセンス:{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
          CC BY-SA 4.0
        </a>
      </div>
    </div>
  );
}