import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export default function ExerciseSetCard({ user, sessionId, sessionExercise }) {
  const [sets, setSets] = useState([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [loading, setLoading] = useState(true);

  const setsRef = collection(db, "users", user.uid, "sets");

  const fetchSets = async () => {
    const q = query(
      setsRef,
      where("sessionExerciseId", "==", sessionExercise.id),
      orderBy("setNumber")
    );
    const snapshot = await getDocs(q);
    setSets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchSets();
  }, [sessionExercise.id]);

  const addSet = async (e) => {
    e.preventDefault();
    if (!weight || !reps) return;
    await addDoc(setsRef, {
      sessionId,
      sessionExerciseId: sessionExercise.id,
      exerciseId: sessionExercise.exerciseId,
      exerciseName: sessionExercise.exerciseName,
      setNumber: sets.length + 1,
      weight: Number(weight),
      reps: Number(reps),
      completedAt: serverTimestamp(),
    });
    setWeight("");
    setReps("");
    fetchSets();
  };

  return (
    <div style={{ border: "1px solid #DADADA", borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{sessionExercise.exerciseName}</div>

      {!loading && sets.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginBottom: 10 }}>
          {sets.map((s) => (
            <li key={s.id} style={{ fontSize: 13, color: "#565B66", padding: "4px 0" }}>
              {s.setNumber}セット目: {s.weight}kg × {s.reps}回
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addSet} style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          placeholder="重量(kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          style={{ flex: 1, padding: 8, border: "1px solid #DADADA", borderRadius: 8 }}
        />
        <input
          type="number"
          placeholder="回数"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          style={{ flex: 1, padding: 8, border: "1px solid #DADADA", borderRadius: 8 }}
        />
        <button
          type="submit"
          style={{ background: "#4C5B75", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px" }}
        >
          記録
        </button>
      </form>
    </div>
  );
}