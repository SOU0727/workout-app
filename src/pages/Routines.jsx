import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";
import RoutineCard from "../components/RoutineCard";

export default function Routines({ user }) {
  const [routines, setRoutines] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const routinesRef = collection(db, "users", user.uid, "routines");

  const fetchRoutines = async () => {
    const q = query(routinesRef, orderBy("createdAt"));
    const snapshot = await getDocs(q);
    setRoutines(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const createRoutine = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(routinesRef, {
      name: name.trim(),
      weekday: null,
      createdAt: serverTimestamp(),
    });
    setName("");
    fetchRoutines();
  };

  if (loading) return <p style={{ padding: 20 }}>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", paddingBottom: 80, padding: 20 }}>
      <h1 style={{ fontSize: 20 }}>ルーティン</h1>

      <form onSubmit={createRoutine} style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <input
          type="text"
          placeholder="例: 胸の日"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, padding: 10, border: "1px solid #DADADA", borderRadius: 8 }}
        />
        <button
          type="submit"
          style={{ background: "#4C5B75", color: "#fff", border: "none", borderRadius: 8, padding: "0 16px" }}
        >
          作成
        </button>
      </form>

      {routines.length === 0 && <p style={{ color: "#74747A" }}>まだルーティンがありません。</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
      <div>
        {routines.map((r) => (
          <RoutineCard key={r.id} user={user} routine={r} />
        ))}
      </div>        
      </ul>

      <BottomNav />
    </div>
  );
}