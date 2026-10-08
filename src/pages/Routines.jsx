import { useEffect, useState } from "react";
import { addDoc, collection, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getDocsCacheFirst } from "../firestoreHelpers";
import BottomNav from "../components/BottomNav";
import RoutineCard from "../components/RoutineCard";

export default function Routines({ user }) {
  const [routines, setRoutines] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const routinesRef = collection(db, "users", user.uid, "routines");

  const fetchRoutines = () =>
    getDocsCacheFirst(query(routinesRef, orderBy("createdAt")), (snapshot) => {
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
    fetchRoutines().catch((err) => console.error(err));
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px 20px 80px" }}>
      <h1 style={{ fontSize: 20 }}>ルーティン</h1>

      <form onSubmit={createRoutine} style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <input
          type="text"
          placeholder="例: 胸の日"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            flex: "1 1 0",
            minWidth: 0,
            padding: 10,
            border: "1px solid #DADADA",
            borderRadius: 8,
          }}
        />
        <button
          type="submit"
          style={{
            flexShrink: 0,
            background: "#4C5B75",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0 16px",
          }}
        >
          作成
        </button>
      </form>

      {loading && <p style={{ color: "#74747A" }}>読み込み中...</p>}

      {error && (
        <p style={{ color: "#9A3B33", fontSize: 13 }}>
          {error}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginLeft: 8,
              background: "none",
              border: "1px solid #9A3B33",
              borderRadius: 6,
              padding: "4px 10px",
              color: "#9A3B33",
            }}
          >
            再読み込み
          </button>
        </p>
      )}

      {!loading && !error && routines.length === 0 && (
        <p style={{ color: "#74747A" }}>まだルーティンがありません。</p>
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
