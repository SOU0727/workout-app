import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function ExercisePicker({ user }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
  };

  useEffect(() => {
    fetchExercises();
  }, []);

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
    fetchExercises();
  };

  if (loading) return <p style={{ padding: 20 }}>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
      <h1>種目を選択</h1>
      {exercises.length === 0 && <p>種目がまだ登録されていません。</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {exercises.map((ex) => (
          <li
            key={ex.id}
            onClick={() => addExercise(ex)}
            style={{
              padding: 12,
              border: "1px solid #DADADA",
              borderRadius: 12,
              marginBottom: 8,
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 600 }}>{ex.name}</div>
            <div style={{ fontSize: 12, color: "#74747A" }}>
              {ex.muscleGroups?.join("・")}
            </div>
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