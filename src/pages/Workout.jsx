import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
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
  const [exercisesLoaded, setExercisesLoaded] = useState(false);
  const [error, setError] = useState("");
  const initializedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const ensureSession = async () => {
      try {
        let id = searchParams.get("sessionId");
        if (!id) {
          const sessionsRef = collection(db, "users", user.uid, "sessions");
          const snapshot = await getDocs(
            query(sessionsRef, orderBy("startedAt", "desc"), limit(20))
          );
          const todayKey = new Date().toDateString();
          const openToday = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter(
              (s) =>
                s.startedAt &&
                !s.endedAt &&
                s.startedAt.toDate().toDateString() === todayKey
            );

          if (openToday.length > 0) {
            id = openToday[0].id;
          } else {
            const newSession = await addDoc(sessionsRef, {
              startedAt: serverTimestamp(),
              endedAt: null,
              routineId: null,
            });
            id = newSession.id;
          }
          setSearchParams({ sessionId: id }, { replace: true });
        }
        setSessionId(id);
      } catch (err) {
        console.error(err);
        setError("読み込みに失敗しました。通信環境を確認してもう一度お試しください。");
      }
    };
    ensureSession();
  }, [user.uid]);

  useEffect(() => {
    if (!sessionId) return;
    const fetchSessionExercises = async () => {
      try {
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
        setExercisesLoaded(true);
      } catch (err) {
        console.error(err);
        setError("読み込みに失敗しました。通信環境を確認してもう一度お試しください。");
      }
    };
    fetchSessionExercises();
  }, [sessionId, user.uid]);

  const finishSession = async () => {
    const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
    await updateDoc(sessionRef, { endedAt: serverTimestamp() });
    navigate("/");
  };

  if (error) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px 20px 80px" }}>
        <p style={{ color: "#9A3B33", fontSize: 13 }}>
          {error}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginLeft: 8,
              background: "none",
              border: "1px solid #9A3B33",
              borderRadius: 6,
              padding: "4px 10px",
              color: "#9A3B33",
            }}
          >
            再読み込み
          </button>
        </p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>今日のワークアウト</h1>
        <button
          onClick={finishSession}
          disabled={!sessionId}
          style={{
            background: "#4C5B75",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "8px 16px",
            opacity: sessionId ? 1 : 0.5,
          }}
        >
          終了
        </button>
      </div>

      {!exercisesLoaded ? (
        <p style={{ color: "#74747A", marginTop: 20 }}>読み込み中...</p>
      ) : (
        <>
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
        </>
      )}

      <BottomNav />
    </div>
  );
}
