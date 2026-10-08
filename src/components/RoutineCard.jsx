import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { getDocsCacheFirst } from "../firestoreHelpers";

export default function RoutineCard({ user, routine }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "users", user.uid, "routines", routine.id, "exercises"),
      orderBy("sortOrder")
    );
    getDocsCacheFirst(q, (snapshot) => {
      setExercises(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user.uid, routine.id]);

  const startWorkout = () => {
    setStarting(true);
    const sessionRef = doc(collection(db, "users", user.uid, "sessions"));
    const batch = writeBatch(db);
    batch.set(sessionRef, {
      startedAt: serverTimestamp(),
      endedAt: null,
      routineId: routine.id,
    });
    exercises.forEach((ex) => {
      batch.set(doc(collection(sessionRef, "exercises")), {
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sortOrder: ex.sortOrder,
      });
    });
    batch.commit().catch((err) => console.error(err));
    navigate(`/workout?sessionId=${sessionRef.id}`);
  };

  return (
    <div style={{ border: "1px solid #DADADA", borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>{routine.name}</div>
        <button
          onClick={startWorkout}
          disabled={loading || starting}
          style={{
            background: "#4C5B75",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 12.5,
            cursor: loading || starting ? "default" : "pointer",
            opacity: loading || starting ? 0.6 : 1,
          }}
        >
          {starting ? "準備中..." : "開始"}
        </button>
      </div>

      {!loading && (
        <div style={{ fontSize: 12.5, color: "#74747A", marginTop: 6 }}>
          {exercises.length === 0
            ? "種目未設定"
            : exercises.map((ex) => ex.exerciseName).join("・")}
        </div>
      )}

      <Link
        to={`/exercises?type=routine&id=${routine.id}`}
        style={{ fontSize: 12.5, color: "#4C5B75", fontWeight: 700, display: "inline-block", marginTop: 8 }}
      >
        + 種目を追加
      </Link>
    </div>
  );
}
