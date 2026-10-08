import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Timestamp, addDoc, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { getDocsCacheFirst } from "../firestoreHelpers";
import { dataGroupMap } from "../bodyGroups";
import BodyPicker from "../components/BodyPicker";
import { BackButton, ExerciseRow } from "../components/PickerParts";

const muscleGroupOrder = ["胸", "背中", "脚", "肩", "腕", "体幹"];
const MODE_KEY = "pickerModeV2";

const toList = (snapshot) => snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

function ModeToggle({ mode, onChange }) {
  const tab = (value, label) => (
    <button
      onClick={() => onChange(value)}
      style={{
        border: "none",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        background: mode === value ? "#4C5B75" : "transparent",
        color: mode === value ? "#fff" : "#74747A",
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", background: "#EDEEF0", borderRadius: 999, padding: 3 }}>
      {tab("list", "リスト")}
      {tab("body", "人体")}
    </div>
  );
}

export default function ExercisePicker({ user }) {
  const [presets, setPresets] = useState([]);
  const [customs, setCustoms] = useState([]);
  const loadedRef = useRef(false);
  const [lastUsedMap, setLastUsedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [bodyGroup, setBodyGroup] = useState(null);
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(MODE_KEY) === "list" ? "list" : "body";
    } catch {
      return "body";
    }
  });
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const customExercisesRef = collection(db, "users", user.uid, "exercises");

  const changeMode = (next) => {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // 保存できなくても動作には影響しない
    }
  };

  const fetchExercises = () =>
    Promise.all([
      getDocsCacheFirst(collection(db, "exercisePresets"), (snapshot) => {
        setPresets(toList(snapshot));
        loadedRef.current = true;
        setLoading(false);
      }),
      getDocsCacheFirst(customExercisesRef, (snapshot) => setCustoms(toList(snapshot))),
    ]);

  const fetchLastUsed = async () => {
    const setsRef = collection(db, "users", user.uid, "sets");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 120);
    await getDocsCacheFirst(
      query(setsRef, where("completedAt", ">=", Timestamp.fromDate(cutoff))),
      (snapshot) => {
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
      }
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchExercises(), fetchLastUsed()]);
      } catch (err) {
        console.error(err);
        if (!loadedRef.current) {
          setLoadError("読み込みに失敗しました。通信環境を確認してもう一度お試しください。");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exercises = useMemo(() => [...presets, ...customs], [presets, customs]);

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

  const addExercise = (exercise) => {
    const parentCollection = type === "routine" ? "routines" : "sessions";
    const exercisesRef = collection(db, "users", user.uid, parentCollection, id, "exercises");
    addDoc(exercisesRef, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sortOrder: Date.now(),
    }).catch((err) => console.error(err));
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

  if (loading || loadError) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton onClick={() => navigate(-1)} />
          <h1 style={{ fontSize: 20, margin: 0 }}>種目を選択</h1>
        </div>
        {loadError ? (
          <p style={{ color: "#9A3B33", fontSize: 13, marginTop: 20 }}>
            {loadError}
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
        ) : (
          <p style={{ color: "#74747A", marginTop: 20 }}>読み込み中...</p>
        )}
      </div>
    );
  }

  if (mode === "body") {
    const dataGroup = bodyGroup ? dataGroupMap[bodyGroup] : null;

    return (
      <BodyPicker
        title="種目を選択"
        onBack={() => navigate(-1)}
        toggle={<ModeToggle mode={mode} onChange={changeMode} />}
        bodyGroup={bodyGroup}
        onBodyGroupChange={setBodyGroup}
        dataGroup={dataGroup}
        list={dataGroup ? groupedExercises[dataGroup] || [] : []}
        usedMap={lastUsedMap}
        onSelectExercise={addExercise}
      />
    );
  }

  if (!selectedGroup) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BackButton onClick={() => navigate(-1)} />
            <h1 style={{ fontSize: 20, margin: 0 }}>部位を選択</h1>
          </div>
          <ModeToggle mode={mode} onChange={changeMode} />
        </div>
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
        <BackButton onClick={() => setSelectedGroup(null)} />
        <h1 style={{ fontSize: 20, margin: 0 }}>{selectedGroup}</h1>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {list.map((ex) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            used={Boolean(lastUsedMap[ex.id])}
            onSelect={addExercise}
          />
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
