import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function ExercisePicker({ user }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExercises = async () => {
      const snapshot = await getDocs(collection(db, "exercisePresets"));
      setExercises(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchExercises();
  }, []);

  const addExercise = async (exercise) => {
    const exercisesRef = collection(
      db,
      "users",
      user.uid,
      "sessions",
      sessionId,
      "exercises"
    );
    await addDoc(exercisesRef, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sortOrder: Date.now(),
    });
    navigate(`/workout?sessionId=${sessionId}`);
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
    </div>
  );
}
