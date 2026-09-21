import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";
import ExerciseSetCard from "../components/ExerciseSetCard";

export default function Workout({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState(null);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const ensureSession = async () => {
      let id = searchParams.get("sessionId");
      if (!id) {
        const sessionsRef = collection(db, "users", user.uid, "sessions");
        const newSession = await addDoc(sessionsRef, {
          startedAt: serverTimestamp(),
          endedAt: null,
          routineId: null,
        });
        id = newSession.id;
        setSearchParams({ sessionId: id }, { replace: true });
      }
      setSessionId(id);
      setLoading(false);
    };
    ensureSession();
  }, [user.uid]);

  useEffect(() => {
    if (!sessionId) return;
    const fetchSessionExercises = async () => {
      const exercisesRef = collection(
        db,
        "users",
        user.uid,
        "sessions",
        sessionId,
        "exercises"
      );
      const q = query(exercisesRef, orderBy("sortOrder"));
      const snapshot = await getDocs(q);
      setSessionExercises(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchSessionExercises();
  }, [sessionId, user.uid]);

  const finishSession = async () => {
    const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
    await updateDoc(sessionRef, { endedAt: serverTimestamp() });
    navigate("/");
  };

  if (loading) return <p style={{ padding: 20 }}>セッションを開始しています...</p>;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", paddingBottom: 80, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>今日のワークアウト</h1>
        <button
          onClick={finishSession}
          style={{ background: "#4C5B75", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px" }}
        >
          終了
        </button>
      </div>

      {sessionExercises.length === 0 && (
        <p style={{ color: "#74747A", marginTop: 20 }}>まだ種目が追加されていません。</p>
      )}

      <div style={{ marginTop: 16 }}>
        {sessionExercises.map((ex) => (
          <ExerciseSetCard
            key={ex.id}
            user={user}
            sessionId={sessionId}
            sessionExercise={ex}
          />
        ))}
      </div>

      <Link
        to={`/exercises?type=session&id=${sessionId}`}
        style={{
          display: "block",
          textAlign: "center",
          border: "1.5px dashed #B3B3B3",
          borderRadius: 14,
          padding: 15,
          color: "#4C5B75",
          fontWeight: 700,
          marginTop: 12,
          textDecoration: "none",
        }}
      >
        + 種目を追加
      </Link>

      <BottomNav />
    </div>
  );
}