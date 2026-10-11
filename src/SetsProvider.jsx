import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { dayKey } from "./historyUtils";
import { SetsContext } from "./setsContext";

// sets コレクションを onSnapshot で1本だけ購読する。
// 永続キャッシュがあるので、2回目以降の起動は差分だけ通信すれば済む。
export default function SetsProvider({ uid, children }) {
  const [state, setState] = useState({ sets: [], loading: true, error: false });

  useEffect(() => {
    const q = query(collection(db, "users", uid, "sets"), orderBy("completedAt"));
    return onSnapshot(
      q,
      (snapshot) => {
        // キャッシュが空のときはサーバーの結果を待つ(0件と誤表示しない)
        if (snapshot.metadata.fromCache && snapshot.empty) return;
        const sets = [];
        snapshot.docs.forEach((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          if (!data.completedAt) return;
          const date = data.completedAt.toDate();
          sets.push({ id: d.id, ...data, date, key: dayKey(date) });
        });
        setState({ sets, loading: false, error: false });
      },
      (err) => {
        console.error(err);
        setState((prev) => ({ ...prev, loading: false, error: true }));
      }
    );
  }, [uid]);

  return <SetsContext.Provider value={state}>{children}</SetsContext.Provider>;
}
