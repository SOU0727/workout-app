import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";
import ExerciseSetCard from "../components/ExerciseSetCard";
const ExerciseEditList = lazy(() => import("../components/ExerciseEditList"));
import { PAGE_PADDING } from "../layout";

const LOAD_ERROR = "読み込みに失敗しました。通信環境を確認してもう一度お試しください。";
const CURRENT_KEY = "currentSession";
const UNDO_MS = 5000;

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
  const [editMode, setEditMode] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState(null);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [undoName, setUndoName] = useState(null);
  const initializedRef = useRef(false);
  const focusedRef = useRef(false);
  const debugRef = useRef(false);
  const startRef = useRef(0);
  const pendingRef = useRef(null);
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

  const visibleExercises = useMemo(
    () => sessionExercises.filter((e) => !hiddenIds.includes(e.id)),
    [sessionExercises, hiddenIds]
  );

  const setsFor = (exerciseDocId) =>
    sessionSets
      .filter((s) => s.sessionExerciseId === exerciseDocId)
      .sort((a, b) => a.setNumber - b.setNumber);

  const editItems = useMemo(
    () =>
      visibleExercises.map((e) => ({
        id: e.id,
        name: e.exerciseName,
        setCount: sessionSets.filter((s) => s.sessionExerciseId === e.id).length,
      })),
    [visibleExercises, sessionSets]
  );

  const commitDelete = useCallback(
    (pending) => {
      const batch = writeBatch(db);
      batch.delete(
        doc(db, "users", user.uid, "sessions", pending.sessionId, "exercises", pending.exerciseDocId)
      );
      pending.setIds.forEach((id) => batch.delete(doc(db, "users", user.uid, "sets", id)));
      batch.commit().catch((err) => console.error(err));
    },
    [user.uid]
  );

  const flushPending = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    commitDelete(pending);
    setUndoName(null);
  }, [commitDelete]);

  const flushRef = useRef(flushPending);
  useEffect(() => {
    flushRef.current = flushPending;
  });
  useEffect(() => {
    const flush = () => flushRef.current();
    return flush;
  }, []);

  const deleteExercise = (exerciseDocId) => {
    const target = sessionExercises.find((e) => e.id === exerciseDocId);
    if (!target) return;
    flushPending();
    const pending = {
      sessionId,
      exerciseDocId,
      name: target.exerciseName,
      setIds: sessionSets.filter((s) => s.sessionExerciseId === exerciseDocId).map((s) => s.id),
    };
    pending.timer = setTimeout(() => flushRef.current(), UNDO_MS);
    pendingRef.current = pending;
    setHiddenIds((prev) => [...prev, exerciseDocId]);
    setUndoName(target.exerciseName);
  };

  const undoDelete = () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    setHiddenIds((prev) => prev.filter((id) => id !== pending.exerciseDocId));
    setUndoName(null);
  };

  const reorderExercises = (orderedIds) => {
    const batch = writeBatch(db);
    orderedIds.forEach((exerciseDocId, index) => {
      batch.update(
        doc(db, "users", user.uid, "sessions", sessionId, "exercises", exerciseDocId),
        { sortOrder: index }
      );
    });
    batch.commit().catch((err) => console.error(err));
  };

  const startEditMode = () => {
    document.activeElement?.blur?.();
    setOpenSwipeId(null);
    setEditMode(true);
  };

  const focusId = searchParams.get("focus");
  useEffect(() => {
    if (!focusId || sessionExercises.length === 0 || focusedRef.current) return;
    const card = document.querySelector(`[data-exercise-id="${CSS.escape(focusId)}"]`);
    if (!card) return;
    focusedRef.current = true;
    card.scrollIntoView({ block: "center", behavior: "smooth" });
    card.querySelector('input[type="number"]')?.focus({ preventScroll: true });
  }, [focusId, sessionExercises]);

  const finishSession = () => {
    flushPending();
    clearCurrentSession();
    updateDoc(doc(db, "users", user.uid, "sessions", sessionId), {
      endedAt: serverTimestamp(),
    }).catch((err) => console.error(err));
    navigate("/");
  };

  if (error) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: PAGE_PADDING }}>
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

  // 開いている「削除」の外側を触ったら閉じる
  const closeSwipeOnOutsidePress = (e) => {
    if (!openSwipeId) return;
    const open = sessionExercises.find((x) => x.id === openSwipeId);
    const card = e.target.closest("[data-exercise-id]");
    if (!open || !card || card.dataset.exerciseId !== open.exerciseId) setOpenSwipeId(null);
  };

  return (
    <div
      onPointerDownCapture={closeSwipeOnOutsidePress}
      style={{ maxWidth: 420, margin: "0 auto", padding: PAGE_PADDING }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h1 style={{ fontSize: 20 }}>今日のワークアウト</h1>
        {editMode ? (
          <button
            onClick={() => setEditMode(false)}
            style={{
              flexShrink: 0,
              background: "#4C5B75",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 18px",
              fontWeight: 700,
            }}
          >
            完了
          </button>
        ) : (
          <button
            onClick={finishSession}
            disabled={!sessionId}
            style={{
              flexShrink: 0,
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
        )}
      </div>

      {sessionId && (
        <>
          {visibleExercises.length === 0 && (
            <p style={{ color: "#74747A", marginTop: 20 }}>
              {exercisesLoaded ? "まだ種目が追加されていません。" : "読み込み中..."}
            </p>
          )}

          {editMode ? (
            <div style={{ marginTop: 12 }}>
              <Suspense fallback={null}>
                <ExerciseEditList
                  items={editItems}
                  onReorder={reorderExercises}
                  onDelete={deleteExercise}
                />
              </Suspense>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 16 }}>
                {visibleExercises.map((ex) => (
                  <ExerciseSetCard
                    key={ex.id}
                    user={user}
                    sessionId={sessionId}
                    sessionExercise={ex}
                    sets={setsFor(ex.id)}
                    onLongPress={startEditMode}
                    swipeOpen={openSwipeId === ex.id}
                    onSwipeChange={(open) => setOpenSwipeId(open ? ex.id : null)}
                    onDelete={() => {
                      setOpenSwipeId(null);
                      deleteExercise(ex.id);
                    }}
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

              {visibleExercises.length > 0 && (
                <p style={{ textAlign: "center", fontSize: 12, color: "#8A8A90", marginTop: 14 }}>
                  左にスワイプで削除、長押しで並べ替えができます
                </p>
              )}
            </>
          )}
        </>
      )}

      {showDebug && (
        <pre style={{ marginTop: 20, fontSize: 11, color: "#74747A", whiteSpace: "pre-wrap" }}>
          {["mounted +0ms", ...log].join("\n")}
        </pre>
      )}

      {undoName && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "calc(104px + env(safe-area-inset-bottom, 0px))",
            maxWidth: "calc(100% - 32px)",
            background: "#2B2F38",
            color: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 13,
            zIndex: 30,
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          }}
        >
          <span>「{undoName}」を削除しました</span>
          <button
            onClick={undoDelete}
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              padding: 0,
              color: "#FFB454",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            元に戻す
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
