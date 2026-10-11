import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { BackLink, StatusMessage } from "../components/HistoryParts";
import { PAGE_PADDING, card } from "../layout";
import { dayKey, formatDay, useAllSets } from "../historyUtils";

function summary(list) {
  return list.map((s) => `${s.weight}kg × ${s.reps}回`).join("、");
}

export default function HistoryExercise({ user }) {
  const { exerciseId } = useParams();
  const { sets, loading, error } = useAllSets(user.uid);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [exerciseId]);

  const { name, days, best, previous } = useMemo(() => {
    const mine = sets.filter((s) => s.exerciseId === exerciseId);
    const map = new Map();
    mine.forEach((s) => {
      if (!map.has(s.key)) map.set(s.key, []);
      map.get(s.key).push(s);
    });
    const list = Array.from(map, ([key, daySets]) => ({
      key,
      sets: daySets.sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0)),
    })).sort((a, b) => (a.key < b.key ? 1 : -1));

    let top = null;
    mine.forEach((s) => {
      if (!top || s.weight > top.weight || (s.weight === top.weight && s.reps > top.reps)) top = s;
    });
    const today = dayKey(new Date());
    return {
      name: mine.length > 0 ? mine[mine.length - 1].exerciseName : "",
      days: list,
      best: top,
      previous: list.find((d) => d.key < today) || null,
    };
  }, [sets, exerciseId]);

  const empty = !loading && !error && days.length === 0;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: PAGE_PADDING }}>
      <BackLink to="/history">履歴</BackLink>
      <h1 style={{ fontSize: 20, marginTop: 4 }}>{name}</h1>

      <StatusMessage loading={loading} error={error} />
      {empty && <p style={{ color: "#74747A", marginTop: 20 }}>まだ記録がありません</p>}

      {best && (
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <div style={{ ...card, flex: 1 }}>
            <div style={{ fontSize: 11.5, color: "#74747A" }}>自己ベスト</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#4C5B75", marginTop: 4 }}>
              {best.weight}kg × {best.reps}回
            </div>
            <div style={{ fontSize: 11.5, color: "#74747A", marginTop: 2 }}>{formatDay(best.key)}</div>
          </div>
          {previous && (
            <div style={{ ...card, flex: 1 }}>
              <div style={{ fontSize: 11.5, color: "#74747A" }}>前回の記録</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                {summary(previous.sets)}
              </div>
              <div style={{ fontSize: 11.5, color: "#74747A", marginTop: 2 }}>
                {formatDay(previous.key)}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {days.map((d) => (
          <div key={d.key} style={card}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{formatDay(d.key)}</div>
            {d.sets.map((s, i) => (
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
