import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { getDocsCacheFirst } from "../firestoreHelpers";

export default function RoutineCard({ user, routine, onDeleted }) {
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

  const removeExercise = (ex) => {
    deleteDoc(
      doc(db, "users", user.uid, "routines", routine.id, "exercises", ex.id)
    ).catch((err) => console.error(err));
    setExercises((prev) => prev.filter((e) => e.id !== ex.id));
  };

  const deleteRoutine = () => {
    if (!window.confirm(`ルーティン「${routine.name}」を削除しますか?`)) return;
    const batch = writeBatch(db);
    exercises.forEach((ex) =>
      batch.delete(doc(db, "users", user.uid, "routines", routine.id, "exercises", ex.id))
    );
    batch.delete(doc(db, "users", user.uid, "routines", routine.id));
    batch.commit().catch((err) => console.error(err));
    onDeleted(routine.id);
  };

  return (
    <div style={{ border: "1px solid #DADADA", borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{routine.name}</div>
        <button
          onClick={startWorkout}
          disabled={loading || starting}
          style={{
            flexShrink: 0,
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

      {!loading &&
        (exercises.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#74747A", marginTop: 8 }}>種目未設定</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {exercises.map((ex) => (
              <span
                key={ex.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "#EDEEF0",
                  borderRadius: 999,
                  padding: "4px 6px 4px 10px",
                  fontSize: 12.5,
                  color: "#3C3F47",
                }}
              >
                {ex.exerciseName}
                <button
                  onClick={() => removeExercise(ex)}
                  aria-label={`${ex.exerciseName}を外す`}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0 4px",
                    fontSize: 14,
                    lineHeight: 1,
                    color: "#74747A",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ))}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Link
          to={`/exercises?type=routine&id=${routine.id}`}
          style={{ fontSize: 12.5, color: "#4C5B75", fontWeight: 700 }}
        >
          + 種目を追加
        </Link>
        <button
          onClick={deleteRoutine}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            padding: 4,
            fontSize: 12,
            color: "#9A3B33",
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          ルーティンを削除
        </button>
      </div>
    </div>
  );
}
