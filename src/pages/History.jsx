import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { StatusMessage } from "../components/HistoryParts";
import { PAGE_PADDING, card } from "../layout";
import { formatDay } from "../historyUtils";
import { useSets } from "../setsContext";

const MODE_KEY = "historyMode";
const SCROLL_KEY = "historyScroll";
const PREVIEW_COUNT = 3;

function readStore(key, fallback) {
  try {
    return sessionStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // 保存できなくても動作には影響しない
  }
}

function uniqueNames(sets) {
  const names = [];
  sets.forEach((s) => {
    if (!names.includes(s.exerciseName)) names.push(s.exerciseName);
  });
  return names;
}

export default function History() {
  const { sets, loading, error } = useSets();
  const [mode, setMode] = useState(() => readStore(MODE_KEY, "date"));

  const changeMode = (next) => {
    setMode(next);
    writeStore(MODE_KEY, next);
    writeStore(SCROLL_KEY, 0);
    window.scrollTo(0, 0);
  };

  const days = useMemo(() => {
    const map = new Map();
    sets.forEach((s) => {
      if (!map.has(s.key)) map.set(s.key, []);
      map.get(s.key).push(s);
    });
    return Array.from(map, ([key, list]) => ({ key, names: uniqueNames(list) })).sort((a, b) =>
      a.key < b.key ? 1 : -1
    );
  }, [sets]);

  const exercises = useMemo(() => {
    const map = new Map();
    sets.forEach((s) => {
      const cur = map.get(s.exerciseId) || { id: s.exerciseId, name: s.exerciseName, keys: new Set() };
      cur.name = s.exerciseName;
      cur.keys.add(s.key);
      map.set(s.exerciseId, cur);
    });
    return Array.from(map.values())
      .map((e) => ({
        id: e.id,
        name: e.name,
        dayCount: e.keys.size,
        last: [...e.keys].sort().pop(),
      }))
      .sort((a, b) => (a.last < b.last ? 1 : -1));
  }, [sets]);

  // 詳細から戻ったときに、元のスクロール位置へ戻す
  useEffect(() => {
    const onScroll = () => writeStore(SCROLL_KEY, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    if (loading) return;
    window.scrollTo(0, Number(readStore(SCROLL_KEY, "0")));
  }, [loading]);

  const empty = !loading && !error && sets.length === 0;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: PAGE_PADDING }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, }}>履歴</h1>

      <div
        style={{
          display: "flex",
          background: "var(--surface-2)",
          borderRadius: 999,
          padding: 4,
          margin: "14px 0 18px",
        }}
      >
        {[
          ["date", "日付別"],
          ["exercise", "種目別"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => changeMode(value)}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 999,
              padding: "10px 0",
              fontWeight: 700,
              fontSize: 14,
              background: mode === value ? "var(--surface)" : "transparent",
              color: mode === value ? "var(--primary)" : "var(--text-muted)",
              boxShadow: mode === value ? "var(--shadow-card)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <StatusMessage loading={loading} error={error} />
      {empty && <p style={{ color: "var(--text-muted)", marginTop: 20 }}>まだ記録がありません</p>}

      {mode === "date" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {days.map((d) => {
            const shown = d.names.slice(0, PREVIEW_COUNT).join("、");
            const rest = d.names.length - PREVIEW_COUNT;
            return (
              <Link key={d.key} to={`/history/day/${d.key}`} style={card}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{formatDay(d.key)}</div>
                <div style={{ fontSize: 13, color: "var(--text-sub)", marginTop: 4 }}>
                  {shown}
                  {rest > 0 ? ` 他${rest}種目` : ""}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {mode === "exercise" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {exercises.map((e) => (
            <Link key={e.id} to={`/history/exercise/${e.id}`} style={card}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{e.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                {e.dayCount}日記録 ・ 最終 {formatDay(e.last)}
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
