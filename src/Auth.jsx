import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: 24 }}>
        {isSignup ? "新規登録" : "ログイン"}
      </h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 14, border: "1px solid #DADADA", borderRadius: 10, fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 14, border: "1px solid #DADADA", borderRadius: 10, fontSize: 16 }}
        />
        {error && <p style={{ color: "#9A3B33", fontSize: 13 }}>{error}</p>}
        <button
          type="submit"
          style={{
            background: "#4C5B75",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: 14,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {isSignup ? "登録する" : "ログイン"}
        </button>
      </form>
      <button
        onClick={() => setIsSignup(!isSignup)}
        style={{ marginTop: 16, background: "none", border: "none", color: "#4C5B75", fontSize: 14 }}
      >
        {isSignup ? "ログインはこちら" : "アカウントを作る"}
      </button>
    </div>
  );
}