import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function ExercisePicker() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      const snapshot = await getDocs(collection(db, "exercisePresets"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExercises(list);
      setLoading(false);
    };
    fetchExercises();
  }, []);

  if (loading) return <p style={{ padding: 20 }}>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
      <h1>種目を選択</h1>
      {exercises.length === 0 && <p>種目がまだ登録されていません。</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {exercises.map((ex) => (
          <li
            key={ex.id}
            style={{
              padding: 12,
              border: "1px solid #DADADA",
              borderRadius: 12,
              marginBottom: 8,
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