import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { getDocsCacheFirst } from "../firestoreHelpers";
import BottomNav from "../components/BottomNav";
import { BackLink, StatusMessage } from "../components/HistoryParts";
import { PAGE_PADDING, card } from "../layout";
import { formatDay, useAllSets } from "../historyUtils";

export default function HistoryDay({ user }) {
  const { key } = useParams();
  const { sets, loading, error } = useAllSets(user.uid);
  // sessionExerciseId → 並び順(その日に保存された順序)
  const [orderMap, setOrderMap] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);

  const daySets = useMemo(() => sets.filter((s) => s.key === key), [sets, key]);

  const sessionIdsKey = useMemo(
    () => [...new Set(daySets.map((s) => s.sessionId).filter(Boolean))].sort().join(","),
    [daySets]
  );

  useEffect(() => {
    if (!sessionIdsKey) return;
    let cancelled = false;
    sessionIdsKey.split(",").forEach((sessionId, sessionIndex) => {
      const q = query(
        collection(db, "users", user.uid, "sessions", sessionId, "exercises"),
        orderBy("sortOrder")
      );
      getDocsCacheFirst(q, (snapshot) => {
        if (cancelled) return;
        setOrderMap((prev) => {
          const next = { ...prev };
          snapshot.docs.forEach((d) => {
            next[d.id] = sessionIndex * 1000 + (d.data().sortOrder ?? 0);
          });
          return next;
        });
      }).catch((err) => console.error(err));
    });
    return () => {
      cancelled = true;
    };
  }, [sessionIdsKey, user.uid]);

  const groups = useMemo(() => {
    const map = new Map();
    daySets.forEach((s) => {
      const gid = s.sessionExerciseId || s.exerciseId;
      if (!map.has(gid)) {
        map.set(gid, { id: gid, exerciseId: s.exerciseId, name: s.exerciseName, sets: [] });
      }
      map.get(gid).sets.push(s);
    });
    const list = Array.from(map.values());
    list.forEach((g) => g.sets.sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0)));
    const rank = (g) => orderMap[g.id] ?? Number.MAX_SAFE_INTEGER;
    return list.sort((a, b) => rank(a) - rank(b));
  }, [daySets, orderMap]);

  const empty = !loading && !error && groups.length === 0;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: PAGE_PADDING }}>
      <BackLink to="/history">履歴</BackLink>
      <h1 style={{ fontSize: 20, marginTop: 4 }}>{formatDay(key)}</h1>

      <StatusMessage loading={loading} error={error} />
      {empty && <p style={{ color: "#74747A", marginTop: 20 }}>この日の記録はありません</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {groups.map((g) => (
          <div key={g.id} style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{g.name}</div>
            {g.sets.map((s, i) => (
              <div key={s.id} style={{ fontSize: 13.5, color: "#565B66", padding: "3px 0" }}>
                {i + 1}セット目: {s.weight}kg × {s.reps}回
              </div>
            ))}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
