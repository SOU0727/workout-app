import { useEffect, useState } from "react";
import { addDoc, collection, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getDocsCacheFirst } from "../firestoreHelpers";
import BottomNav from "../components/BottomNav";
import { FIELD, PAGE_PADDING, PILL_PRIMARY } from "../layout";
import RoutineCard from "../components/RoutineCard";

export default function Routines({ user }) {
  const [routines, setRoutines] = useState([]);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const routinesRef = collection(db, "users", user.uid, "routines");

  const fetchRoutines = () =>
    getDocsCacheFirst(query(routinesRef, orderBy("createdAt", "desc")), (snapshot) => {
      setRoutines(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

  useEffect(() => {
    fetchRoutines().catch((err) => {
      console.error(err);
      setError("読み込みに失敗しました。通信環境を確認してもう一度お試しください。");
      setLoading(false);
    });
  }, []);

  const createRoutine = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addDoc(routinesRef, {
      name: name.trim(),
      weekday: null,
      createdAt: serverTimestamp(),
    }).catch((err) => console.error(err));
    setName("");
    setAdding(false);
    fetchRoutines().catch((err) => console.error(err));
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: PAGE_PADDING }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>ルーティン</h1>

      {adding ? (
        <form
          onSubmit={createRoutine}
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
            padding: 16,
            margin: "16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <input
            type="text"
            placeholder="ルーティン名(例: 胸の日)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={FIELD}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setName("");
                setAdding(false);
              }}
              className="press"
              style={{
                flex: 1,
                background: "var(--surface-2)",
                color: "var(--text-sub)",
                border: "none",
                borderRadius: 999,
                padding: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="press"
              style={{ ...PILL_PRIMARY, flex: 1, padding: 12, opacity: name.trim() ? 1 : 0.5 }}
            >
              作成
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="press"
          style={{
            display: "block",
            width: "100%",
            margin: "16px 0",
            textAlign: "center",
            background: "none",
            border: "1.5px dashed var(--border-strong)",
            borderRadius: "var(--radius-card)",
            padding: 16,
            color: "var(--primary)",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          + ルーティンを追加
        </button>
      )}

      {loading && <p style={{ color: "var(--text-muted)" }}>読み込み中...</p>}

      {error && (
        <p style={{ color: "var(--danger)", fontSize: 13 }}>
          {error}
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
      )}

      {!loading && !error && routines.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>まだルーティンがありません。</p>
      )}

      <div>
        {routines.map((r) => (
          <RoutineCard
            key={r.id}
            user={user}
            routine={r}
            onDeleted={(id) => setRoutines((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
