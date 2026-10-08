import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  getDocsFromCache,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";
import ExerciseSetCard from "../components/ExerciseSetCard";

const LOAD_ERROR = "読み込みに失敗しました。通信環境を確認してもう一度お試しください。";
const CURRENT_KEY = "currentSession";

function readCurrentSession(uid) {
  try {
    const saved = JSON.parse(localStorage.getItem(CURRENT_KEY));
    if (saved && saved.uid === uid && saved.date === new Date().toDateString()) {
      return saved.id;
    }
  } catch {
    // 読めなければFirestoreで探す
  }
  return null;
}

function saveCurrentSession(uid, id) {
  try {
    localStorage.setItem(
      CURRENT_KEY,
      JSON.stringify({ uid, id, date: new Date().toDateString() })
    );
  } catch {
    // 保存できなくても動作には影響しない
  }
}

function clearCurrentSession() {
  try {
    localStorage.removeItem(CURRENT_KEY);
  } catch {
    // 保存できなくても動作には影響しない
  }
}

function findOpenToday(snapshot) {
  const todayKey = new Date().toDateString();
  return snapshot.docs.find((d) => {
    const s = d.data({ serverTimestamps: "estimate" });
    return s.startedAt && !s.endedAt && s.startedAt.toDate().toDateString() === todayKey;
  });
}

export default function Workout({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState(null);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [sessionSets, setSessionSets] = useState([]);
  const [exercisesLoaded, setExercisesLoaded] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState([]);
  const initializedRef = useRef(false);
  const debugRef = useRef(false);
  const startRef = useRef(0);
  const navigate = useNavigate();
  const showDebug = searchParams.has("debug");

  const mark = useCallback((label) => {
    if (!debugRef.current) return;
    setLog((prev) => [...prev, `${label} +${Math.round(performance.now() - startRef.current)}ms`]);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    debugRef.current = searchParams.has("debug");
    startRef.current = performance.now();

    const ensureSession = async () => {
      try {
        let id = searchParams.get("sessionId");
        let source = "url";
        if (!id) {
          id = readCurrentSession(user.uid);
          source = "local";
        }
        if (!id) {
          const sessionsRef = collection(db, "users", user.uid, "sessions");
          const sessionsQuery = query(sessionsRef, orderBy("startedAt", "desc"), limit(20));

          let cached = null;
          try {
            cached = await getDocsFromCache(sessionsQuery);
          } catch {
            // キャッシュが使えない場合はサーバーで確認する
          }
          let found = cached ? findOpenToday(cached) : undefined;
          source = "cache";
          if (!found && (!cached || cached.empty)) {
            found = findOpenToday(await getDocs(sessionsQuery));
            source = "server";
          }

          if (found) {
            id = found.id;
          } else {
            const newRef = doc(sessionsRef);
            setDoc(newRef, {
              startedAt: serverTimestamp(),
              endedAt: null,
              routineId: null,
            }).catch((err) => console.error(err));
            id = newRef.id;
            source = "new";
            setExercisesLoaded(true);
          }
        }
        saveCurrentSession(user.uid, id);
        if (source !== "url") {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("sessionId", id);
              return next;
            },
            { replace: true }
          );
        }
        mark(`session(${source})`);
        setSessionId(id);
      } catch (err) {
        console.error(err);
        setError(LOAD_ERROR);
      }
    };
    ensureSession();
  }, [user.uid, searchParams, setSearchParams, mark]);

  useEffect(() => {
    if (!sessionId) return;
    const q = query(
      collection(db, "users", user.uid, "sessions", sessionId, "exercises"),
      orderBy("sortOrder")
    );
    return onSnapshot(
      q,
      (snapshot) => {
        mark(`exercises(${snapshot.metadata.fromCache ? "cache" : "server"},${snapshot.size})`);
        if (snapshot.metadata.fromCache && snapshot.empty) return;
        setSessionExercises(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setExercisesLoaded(true);
      },
      (err) => {
        console.error(err);
        setError(LOAD_ERROR);
      }
    );
  }, [sessionId, user.uid, mark]);

  useEffect(() => {
    if (!sessionId) return;
    const q = query(
      collection(db, "users", user.uid, "sets"),
      where("sessionId", "==", sessionId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        mark(`sets(${snapshot.metadata.fromCache ? "cache" : "server"},${snapshot.size})`);
        setSessionSets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error(err)
    );
  }, [sessionId, user.uid, mark]);

  const finishSession = () => {
    clearCurrentSession();
    updateDoc(doc(db, "users", user.uid, "sessions", sessionId), {
      endedAt: serverTimestamp(),
    }).catch((err) => console.error(err));
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

  const setsFor = (exerciseId) =>
    sessionSets
      .filter((s) => s.sessionExerciseId === exerciseId)
      .sort((a, b) => a.setNumber - b.setNumber);

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

      {sessionId && (
        <>
          {sessionExercises.length === 0 && (
            <p style={{ color: "#74747A", marginTop: 20 }}>
              {exercisesLoaded ? "まだ種目が追加されていません。" : "読み込み中..."}
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            {sessionExercises.map((ex) => (
              <ExerciseSetCard
                key={ex.id}
                user={user}
                sessionId={sessionId}
                sessionExercise={ex}
                sets={setsFor(ex.id)}
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

      {showDebug && (
        <pre style={{ marginTop: 20, fontSize: 11, color: "#74747A", whiteSpace: "pre-wrap" }}>
          {["mounted +0ms", ...log].join("\n")}
        </pre>
      )}

      <BottomNav />
    </div>
  );
}
