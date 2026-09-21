import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const muscleGroupOrder = ["胸", "背中", "脚", "肩", "腕", "体幹"];

export default function ExercisePicker({ user }) {
  const [exercises, setExercises] = useState([]);
  const [lastUsedMap, setLastUsedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const customExercisesRef = collection(db, "users", user.uid, "exercises");

  const fetchExercises = async () => {
    const presetsSnapshot = await getDocs(collection(db, "exercisePresets"));
    const customSnapshot = await getDocs(customExercisesRef);
    const presets = presetsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const custom = customSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setExercises([...presets, ...custom]);
  };

  const fetchLastUsed = async () => {
    const setsRef = collection(db, "users", user.uid, "sets");
    const snapshot = await getDocs(setsRef);
    const map = {};
    snapshot.docs.forEach((d) => {
      const data = d.data();
      if (!data.exerciseId || !data.completedAt) return;
      const time = data.completedAt.toMillis();
      if (!map[data.exerciseId] || time > map[data.exerciseId]) {
        map[data.exerciseId] = time;
      }
    });
    setLastUsedMap(map);
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchExercises(), fetchLastUsed()]);
      setLoading(false);
    };
    load();
  }, []);

  const groupedExercises = useMemo(() => {
    const groups = {};
    muscleGroupOrder.forEach((g) => (groups[g] = []));
    groups["その他"] = [];

    exercises.forEach((ex) => {
      const tags = ex.muscleGroups?.length ? ex.muscleGroups : [];
      const matched = tags.filter((t) => muscleGroupOrder.includes(t));
      if (matched.length === 0) {
        groups["その他"].push(ex);
      } else {
        matched.forEach((t) => groups[t].push(ex));
      }
    });

    Object.keys(groups).forEach((g) => {
      groups[g].sort((a, b) => (lastUsedMap[b.id] || 0) - (lastUsedMap[a.id] || 0));
    });

    return groups;
  }, [exercises, lastUsedMap]);

  const availableGroups = [...muscleGroupOrder, "その他"].filter(
    (g) => groupedExercises[g]?.length > 0
  );

  const addExercise = async (exercise) => {
    const parentCollection = type === "routine" ? "routines" : "sessions";
    const exercisesRef = collection(db, "users", user.uid, parentCollection, id, "exercises");
    await addDoc(exercisesRef, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sortOrder: Date.now(),
    });
    if (type === "routine") {
      navigate("/routines");
    } else {
      navigate(`/workout?sessionId=${id}`);
    }
  };

  const createCustomExercise = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addDoc(customExercisesRef, {
      name: newName.trim(),
      muscleGroups: newMuscle.trim() ? [newMuscle.trim()] : [],
      isArchived: false,
    });
    setNewName("");
    setNewMuscle("");
    await fetchExercises();
  };

  if (loading) return <p style={{ padding: 20 }}>読み込み中...</p>;

  if (!selectedGroup) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
        <h1 style={{ fontSize: 20 }}>部位を選択</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          {availableGroups.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              style={{
                padding: "20px 10px",
                border: "1px solid #DADADA",
                borderRadius: 14,
                background: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {g}
              <div style={{ fontSize: 11, color: "#74747A", fontWeight: 400, marginTop: 4 }}>
                {groupedExercises[g].length}種目
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const list = groupedExercises[selectedGroup] || [];

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setSelectedGroup(null)}
          style={{ background: "none", border: "none", padding: 0, display: "flex", cursor: "pointer" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18181A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>
        <h1 style={{ fontSize: 20, margin: 0 }}>{selectedGroup}</h1>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {list.map((ex) => (
          <li
            key={ex.id}
            onClick={() => addExercise(ex)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 12,
              border: "1px solid #DADADA",
              borderRadius: 12,
              marginBottom: 8,
              cursor: "pointer",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{ex.name}</div>
              <div style={{ fontSize: 12, color: "#74747A" }}>{ex.muscleGroups?.join("・")}</div>
            </div>
            {lastUsedMap[ex.id] && (
              <span
                style={{
                  fontSize: 11,
                  color: "#4C5B75",
                  background: "#E9EDF3",
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                使用済み
              </span>
            )}
          </li>
        ))}
      </ul>

      <div style={{ border: "1.5px dashed #B3B3B3", borderRadius: 12, padding: 14, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#4C5B75" }}>
          種目を新規作成
        </div>
        <form onSubmit={createCustomExercise} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            placeholder="種目名(例: ケーブルフライ)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ padding: 10, border: "1px solid #DADADA", borderRadius: 8 }}
          />
          <input
            type="text"
            placeholder="部位(例: 胸)"
            value={newMuscle}
            onChange={(e) => setNewMuscle(e.target.value)}
            style={{ padding: 10, border: "1px solid #DADADA", borderRadius: 8 }}
          />
          <button
            type="submit"
            style={{ background: "#4C5B75", color: "#fff", border: "none", borderRadius: 8, padding: 10 }}
          >
            この種目を追加する
          </button>
        </form>
      </div>
    </div>
  );
}