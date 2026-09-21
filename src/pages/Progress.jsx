import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";

export default function Progress({ user }) {
  const [allSets, setAllSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  useEffect(() => {
    const fetchSets = async () => {
      const setsRef = collection(db, "users", user.uid, "sets");
      const q = query(setsRef, orderBy("completedAt"));
      const snapshot = await getDocs(q);
      setAllSets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchSets();
  }, [user.uid]);

  const exerciseOptions = useMemo(() => {
    const map = new Map();
    allSets.forEach((s) => {
      if (!map.has(s.exerciseId)) {
        map.set(s.exerciseId, s.exerciseName);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [allSets]);

  useEffect(() => {
    if (!selectedExerciseId && exerciseOptions.length > 0) {
      setSelectedExerciseId(exerciseOptions[0].id);
    }
  }, [exerciseOptions, selectedExerciseId]);

  const exerciseSets = useMemo(
    () => allSets.filter((s) => s.exerciseId === selectedExerciseId),
    [allSets, selectedExerciseId]
  );

  const maxWeight = exerciseSets.reduce((max, s) => Math.max(max, s.weight), 0);
  const maxReps = exerciseSets.reduce((max, s) => Math.max(max, s.reps), 0);

  if (loading) return <p style={{ padding: 20 }}>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", paddingBottom: 80, padding: 20 }}>
      <h1 style={{ fontSize: 20 }}>進捗</h1>

      {exerciseOptions.length === 0 ? (
        <p style={{ color: "#74747A", marginTop: 20 }}>
          まだ記録がありません。ワークアウトを記録すると、ここに進捗が表示されます。
        </p>
      ) : (
        <>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            style={{ padding: 10, border: "1px solid #DADADA", borderRadius: 8, marginTop: 16, marginBottom: 20, width: "100%" }}
          >
            {exerciseOptions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, background: "#fff", border: "1px solid #DADADA", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#74747A" }}>自己ベスト(重量)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#4C5B75" }}>{maxWeight}kg</div>
            </div>
            <div style={{ flex: 1, background: "#fff", border: "1px solid #DADADA", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#74747A" }}>自己ベスト(回数)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#4C5B75" }}>{maxReps}回</div>
            </div>
          </div>

          <WeightChart sets={exerciseSets} />
        </>
      )}

      <BottomNav />
    </div>
  );
}

function WeightChart({ sets }) {
  if (sets.length === 0) {
    return <p style={{ color: "#74747A" }}>この種目の記録がまだありません。</p>;
  }

  const weights = sets.map((s) => s.weight);
  const maxW = Math.max(...weights);
  const minW = Math.min(...weights);
  const range = maxW - minW || 1;

  const width = 320;
  const height = 140;
  const padding = 10;

  const points = sets.map((s, i) => {
    const x = sets.length === 1 ? width / 2 : (i / (sets.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((s.weight - minW) / range) * (height - padding * 2);
    return { x, y };
  });

  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ background: "#fff", border: "1px solid #DADADA", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>重量の推移(kg)</div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <polyline
          points={pointsAttr}
          fill="none"
          stroke="#4C5B75"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#4C5B75" />
        ))}
      </svg>
    </div>
  );
}