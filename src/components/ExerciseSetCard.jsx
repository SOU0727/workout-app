import { useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const inputStyle = {
  flex: "1 1 0",
  minWidth: 0,
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-control)",
  background: "var(--surface-2)",
  color: "var(--text)",
};

const smallButton = (background, color, border = "none") => ({
  flexShrink: 0,
  background,
  color,
  border,
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
});

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_PX = 8;
const SWIPE_START_PX = 10;
const DELETE_WIDTH = 88;

export default function ExerciseSetCard({
  user,
  sessionId,
  sessionExercise,
  sets,
  onLongPress,
  swipeOpen = false,
  onSwipeChange,
  onDelete,
}) {
  const pressRef = useRef(null);
  const swipeRef = useRef(null);
  const [dragX, setDragX] = useState(null);
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

  // カードを長押し(入力欄やボタン以外)すると編集モードに入る
  const cancelPress = () => {
    if (pressRef.current) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
  };

  const startPress = (e) => {
    if (!onLongPress || e.target.closest("input, button, a, select")) return;
    cancelPress();
    const timer = setTimeout(() => {
      pressRef.current = null;
      if (navigator.vibrate) navigator.vibrate(15);
      onLongPress();
    }, LONG_PRESS_MS);
    pressRef.current = { timer, x: e.clientX, y: e.clientY };
  };

  const movePress = (e) => {
    const p = pressRef.current;
    if (!p) return;
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > LONG_PRESS_MOVE_PX) cancelPress();
  };

  // 横にスワイプすると右端に「削除」が現れる(LINEのトーク一覧のイメージ)
  const startSwipe = (e) => {
    if (!onSwipeChange) return;
    swipeRef.current = { x: e.clientX, y: e.clientY, base: swipeOpen ? DELETE_WIDTH : 0, last: swipeOpen ? DELETE_WIDTH : 0, active: false };
  };

  const moveSwipe = (e) => {
    const s = swipeRef.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.active) {
      if (Math.abs(dx) < SWIPE_START_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      s.active = true;
      cancelPress();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // キャプチャできなくてもスワイプ自体は動く
      }
    }
    s.last = Math.min(Math.max(s.base - dx, 0), DELETE_WIDTH + 24);
    setDragX(s.last);
  };

  const endSwipe = (e) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s) return;
    if (s.active) {
      onSwipeChange(e.type !== "pointercancel" && s.last > DELETE_WIDTH / 2);
      setDragX(null);
    } else if (swipeOpen && e.type === "pointerup") {
      onSwipeChange(false);
    }
  };

  const offset = dragX ?? (swipeOpen ? DELETE_WIDTH : 0);

  return (
    <div
      data-exercise-id={sessionExercise.exerciseId}
      style={{
        position: "relative",
        marginBottom: 14,
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {offset > 0 && (
        <button
          onClick={onDelete}
          aria-label={`${sessionExercise.exerciseName}を削除`}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: DELETE_WIDTH,
            border: "none",
            background: "var(--danger-fill)",
            color: "var(--on-primary)",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          削除
        </button>
      )}
      <div
        onPointerDown={(e) => {
          startPress(e);
          startSwipe(e);
        }}
        onPointerMove={(e) => {
          movePress(e);
          moveSwipe(e);
        }}
        onPointerUp={(e) => {
          cancelPress();
          endSwipe(e);
        }}
        onPointerCancel={(e) => {
          cancelPress();
          endSwipe(e);
        }}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => {
          if (onLongPress && !e.target.closest("input")) e.preventDefault();
        }}
        style={{
          position: "relative",
          padding: 18,
          background: "var(--surface)",
          touchAction: "pan-y",
          transform: `translateX(${-offset}px)`,
          transition: dragX === null ? "transform 0.2s ease" : "none",
        }}
      >
      <div
        style={{
          fontWeight: 700,
          fontSize: 17,
          marginBottom: 10,
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        {sessionExercise.exerciseName}
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
                  <button onClick={() => saveEdit(s)} style={smallButton("var(--primary)", "#fff")}>
                    保存
                  </button>
                  <button
                    onClick={() => deleteSet(s)}
                    style={smallButton("none", "var(--danger)", "1px solid var(--danger)")}
                  >
                    削除
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    aria-label="編集をやめる"
                    style={smallButton("var(--surface-2)", "var(--text-sub)")}
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
                    color: "var(--text-sub)",
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
                      color: "var(--primary)",
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
          className="press"
          style={{
            flexShrink: 0,
            background: "var(--primary)",
            color: "var(--on-primary)",
            border: "none",
            borderRadius: 999,
            padding: "10px 20px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          記録
        </button>
      </form>
      </div>
    </div>
  );
}
