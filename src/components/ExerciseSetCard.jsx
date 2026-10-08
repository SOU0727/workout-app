import { useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

const inputStyle = {
  flex: "1 1 0",
  minWidth: 0,
  padding: 8,
  border: "1px solid #DADADA",
  borderRadius: 8,
};

const smallButton = (background, color, border = "none") => ({
  flexShrink: 0,
  background,
  color,
  border,
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
});

export default function ExerciseSetCard({ user, sessionId, sessionExercise, sets }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");

  const nextSetNumber = Math.max(0, ...sets.map((s) => s.setNumber || 0)) + 1;

  const addSet = (e) => {
    e.preventDefault();
    if (!weight || !reps) return;
    addDoc(collection(db, "users", user.uid, "sets"), {
      sessionId,
      sessionExerciseId: sessionExercise.id,
      exerciseId: sessionExercise.exerciseId,
      exerciseName: sessionExercise.exerciseName,
      setNumber: nextSetNumber,
      weight: Number(weight),
      reps: Number(reps),
      completedAt: serverTimestamp(),
    }).catch((err) => console.error(err));
    setWeight("");
    setReps("");
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditWeight(String(s.weight));
    setEditReps(String(s.reps));
  };

  const saveEdit = (s) => {
    if (!editWeight || !editReps) return;
    updateDoc(doc(db, "users", user.uid, "sets", s.id), {
      weight: Number(editWeight),
      reps: Number(editReps),
    }).catch((err) => console.error(err));
    setEditingId(null);
  };

  const deleteSet = (s) => {
    if (!window.confirm(`${s.weight}kg × ${s.reps}回 を削除しますか?`)) return;
    deleteDoc(doc(db, "users", user.uid, "sets", s.id)).catch((err) => console.error(err));
    setEditingId(null);
  };

  const removeExercise = () => {
    const note = sets.length > 0 ? `と、記録した${sets.length}セット` : "";
    if (!window.confirm(`「${sessionExercise.exerciseName}」${note}を削除しますか?`)) return;
    const batch = writeBatch(db);
    batch.delete(
      doc(db, "users", user.uid, "sessions", sessionId, "exercises", sessionExercise.id)
    );
    sets.forEach((s) => batch.delete(doc(db, "users", user.uid, "sets", s.id)));
    batch.commit().catch((err) => console.error(err));
  };

  return (
    <div style={{ border: "1px solid #DADADA", borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>{sessionExercise.exerciseName}</div>
        <button
          onClick={removeExercise}
          style={{
            flexShrink: 0,
            background: "none",
            border: "none",
            padding: 4,
            fontSize: 12,
            color: "#9A3B33",
            cursor: "pointer",
          }}
        >
          種目を削除
        </button>
      </div>

      {sets.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px" }}>
          {sets.map((s, i) => (
            <li key={s.id} style={{ padding: "4px 0" }}>
              {editingId === s.id ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="number"
                    aria-label="重量(kg)"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    aria-label="回数"
                    value={editReps}
                    onChange={(e) => setEditReps(e.target.value)}
                    style={inputStyle}
                  />
                  <button onClick={() => saveEdit(s)} style={smallButton("#4C5B75", "#fff")}>
                    保存
                  </button>
                  <button
                    onClick={() => deleteSet(s)}
                    style={smallButton("none", "#9A3B33", "1px solid #9A3B33")}
                  >
                    削除
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    aria-label="編集をやめる"
                    style={smallButton("#EDEEF0", "#565B66")}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                    color: "#565B66",
                  }}
                >
                  <span>
                    {i + 1}セット目: {s.weight}kg × {s.reps}回
                  </span>
                  <button
                    onClick={() => startEdit(s)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 4,
                      fontSize: 12,
                      color: "#4C5B75",
                      cursor: "pointer",
                    }}
                  >
                    編集
                  </button>
                </div>
              )}
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
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="回数"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          style={inputStyle}
        />
        <button
          type="submit"
          style={{
            flexShrink: 0,
            background: "#4C5B75",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
          }}
        >
          記録
        </button>
      </form>
    </div>
  );
}
