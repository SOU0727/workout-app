import { useEffect, useState } from "react";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { getDocsCacheFirst } from "./firestoreHelpers";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function dayKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function parseDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDay(key) {
  const date = parseDayKey(key);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const base = `${date.getMonth() + 1}月${date.getDate()}日`;
  return `${sameYear ? "" : `${date.getFullYear()}年`}${base}(${WEEKDAYS[date.getDay()]})`;
}

// 全セットを1度だけ読み込む(キャッシュ優先)。completedAt の古い順。
export function useAllSets(uid) {
  const [state, setState] = useState({ sets: [], loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    const q = query(collection(db, "users", uid, "sets"), orderBy("completedAt"));
    getDocsCacheFirst(q, (snapshot) => {
      if (cancelled) return;
      const sets = [];
      snapshot.docs.forEach((d) => {
        const data = d.data({ serverTimestamps: "estimate" });
        if (!data.completedAt) return;
        const date = data.completedAt.toDate();
        sets.push({ id: d.id, ...data, date, key: dayKey(date) });
      });
      setState({ sets, loading: false, error: false });
    }).catch((err) => {
      console.error(err);
      if (!cancelled) setState((prev) => ({ ...prev, loading: false, error: true }));
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return state;
}
