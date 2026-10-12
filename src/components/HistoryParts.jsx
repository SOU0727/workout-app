import { Link } from "react-router-dom";

export function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-block",
        color: "var(--primary)",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        padding: "6px 0",
      }}
    >
      ‹ {children}
    </Link>
  );
}

export function StatusMessage({ loading, error }) {
  if (loading) return <p style={{ color: "var(--text-muted)", marginTop: 20 }}>読み込み中...</p>;
  if (error) {
    return (
      <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 20 }}>
        読み込みに失敗しました。通信環境を確認してもう一度お試しください。
        <button
          onClick={() => window.location.reload()}
          style={{
            marginLeft: 8,
            background: "none",
            border: "1px solid var(--danger)",
            borderRadius: 6,
            padding: "4px 10px",
            color: "var(--danger)",
          }}
        >
          再読み込み
        </button>
      </p>
    );
  }
  return null;
}
