import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export default function RoutineCard({ user, routine }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      const exercisesRef = collection(
        db,
        "users",
        user.uid,
        "routines",
        routine.id,
        "exercises"
      );
      const q = query(exercisesRef, orderBy("sortOrder"));
      const snapshot = await getDocs(q);
      setExercises(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchExercises();
  }, [routine.id]);

  return (
    <div style={{ border: "1px solid #DADADA", borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>{routine.name}</div>
        <Link
          to="/workout"
          style={{
            background: "#4C5B75",
            color: "#fff",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 12.5,
            textDecoration: "none",
          }}
        >
          開始
        </Link>
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