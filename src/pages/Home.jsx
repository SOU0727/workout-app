import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { getDocsCacheFirst } from "../firestoreHelpers";
import BottomNav from "../components/BottomNav";
import { dayKey, formatDay } from "../historyUtils";
import { useSets } from "../setsContext";
import "./Home.css";

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];
const MAX_WEEKS = 156;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateStreak(dateSet) {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dateSet.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dateSet.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// セットを種目ごとにまとめる(最初に記録した順)
function groupByExercise(sets) {
  const groups = [];
  sets.forEach((s) => {
    let g = groups.find((x) => x.exerciseId === s.exerciseId);
    if (!g) {
      g = { exerciseId: s.exerciseId, name: s.exerciseName, sessionId: s.sessionId, sets: [] };
      groups.push(g);
    }
    g.sessionId = s.sessionId;
    g.sets.push(s);
  });
  return groups;
}

const shortDate = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

export default function Home({ user }) {
  const { sets: allSets } = useSets();
  const [routines, setRoutines] = useState([]);
  const todayKey = dayKey(new Date());
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [weeksBack, setWeeksBack] = useState(0);
  const pagerRef = useRef(null);
  const scrollTimer = useRef(null);

  // 記録がある日の一覧と、一番古い記録の日(全セットは App 全体で共有している購読から取る)
  const { recordedDates, oldestKey } = useMemo(() => {
    const dates = new Set();
    let oldest = null;
    allSets.forEach((s) => {
      dates.add(s.key);
      if (oldest === null || s.key < oldest) oldest = s.key;
    });
    return { recordedDates: dates, oldestKey: oldest };
  }, [allSets]);

  const todayGroups = useMemo(
    () => groupByExercise(allSets.filter((s) => s.key === todayKey)),
    [allSets, todayKey]
  );
  const selectedGroups = useMemo(
    () => (selectedKey === todayKey ? todayGroups : groupByExercise(allSets.filter((s) => s.key === selectedKey))),
    [allSets, selectedKey, todayKey, todayGroups]
  );

  const todaySetCount = todayGroups.reduce((n, g) => n + g.sets.length, 0);
  const todaySessionId =
    todayGroups.length > 0 ? todayGroups[todayGroups.length - 1].sessionId : null;

  // 週のページ数: 一番古い記録の週まで(最低1、最大 MAX_WEEKS)
  const currentMonday = getMonday(new Date());
  let weekCount = 1;
  if (oldestKey) {
    const [y, m, d] = oldestKey.split("-").map(Number);
    const oldestMonday = getMonday(new Date(y, m - 1, d));
    const diff = Math.round((currentMonday.getTime() - oldestMonday.getTime()) / WEEK_MS);
    weekCount = Math.min(MAX_WEEKS, Math.max(1, diff + 1));
  }

  const weeks = [];
  for (let w = 0; w < weekCount; w++) {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() - (weekCount - 1 - w) * 7);
    const days = DAY_LABELS.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return { label, date, key: dayKey(date) };
    });
    weeks.push(days);
  }

  const visibleWeek = weeks[Math.max(0, weekCount - 1 - weeksBack)];

  // 読み込み完了で週の数が増えたとき、今週(右端)へ合わせる
  useLayoutEffect(() => {
    const el = pagerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weekCount]);

  useEffect(() => () => clearTimeout(scrollTimer.current), []);

  const onPagerScroll = () => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = pagerRef.current;
      if (!el || !el.clientWidth) return;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      setWeeksBack(Math.max(0, weekCount - 1 - index));
    }, 60);
  };

  const goToWeek = (back, smooth = true) => {
    const el = pagerRef.current;
    if (!el) return;
    const clamped = Math.min(Math.max(back, 0), weekCount - 1);
    el.scrollTo({ left: (weekCount - 1 - clamped) * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
    setWeeksBack(clamped);
  };

  const backToToday = () => {
    setSelectedKey(todayKey);
    goToWeek(0);
  };

  useEffect(() => {
    const q = query(collection(db, "users", user.uid, "routines"), orderBy("createdAt"));
    getDocsCacheFirst(q, (snapshot) => {
      setRoutines(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 6));
    }).catch((err) => console.error(err));
  }, [user.uid]);

  const streak = calculateStreak(recordedDates);
  const todayLabel = formatDay(todayKey);
  const isToday = selectedKey === todayKey;
  const showJump = weeksBack > 0 || !isToday;

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-date">{todayLabel}</div>
        <Link
          to="/settings"
          aria-label="設定"
          style={{ display: "flex", flexShrink: 0, color: "var(--text-muted)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </Link>
      </header>

      <div className="home-content">
        <section className="hero">
          <div className="hero-label">今日のワークアウト</div>
          <div className="hero-title">
            {todayGroups.length > 0
              ? `${todayGroups.length}種目・${todaySetCount}セット`
              : "まだ記録がありません"}
          </div>
          <div className="hero-sub">
            {streak > 0 ? `${streak}日連続トレーニング中` : "今日から始めましょう"}
          </div>
          <Link to="/workout" className="hero-button press">
            {todayGroups.length > 0 ? "再開する" : "開始する"}
          </Link>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="week-nav">
              <button
                className="week-arrow"
                aria-label="前の週"
                onClick={() => goToWeek(weeksBack + 1)}
                style={{ visibility: weeksBack >= weekCount - 1 ? "hidden" : "visible" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6"></path></svg>
              </button>
              <div>
                <div className="panel-title">
                  {weeksBack === 0 ? "今週の記録" : `${weeksBack}週前`}
                </div>
                <div className="panel-range">
                  {shortDate(visibleWeek[0].date)} 〜 {shortDate(visibleWeek[6].date)}
                </div>
              </div>
              <button
                className="week-arrow"
                aria-label="次の週"
                onClick={() => goToWeek(weeksBack - 1)}
                style={{ visibility: weeksBack === 0 ? "hidden" : "visible" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"></path></svg>
              </button>
            </div>
            <button
              className="jump-chip"
              onClick={backToToday}
              style={{ visibility: showJump ? "visible" : "hidden" }}
            >
              今週へ
            </button>
          </div>

          <div className="week-pager" ref={pagerRef} onScroll={onPagerScroll}>
            {weeks.map((days) => (
              <div className="week-page" key={days[0].key}>
                {days.map((day) => {
                  const future = day.key > todayKey;
                  const classes = [
                    "week-day",
                    recordedDates.has(day.key) ? "done" : "",
                    day.key === todayKey ? "today" : "",
                    day.key === selectedKey ? "selected" : "",
                  ].join(" ");
                  return (
                    <button
                      key={day.key}
                      className={classes}
                      disabled={future}
                      aria-pressed={day.key === selectedKey}
                      aria-label={formatDay(day.key)}
                      onClick={() => setSelectedKey(day.key)}
                    >
                      <span className="week-day-label">{day.label}</span>
                      <span className="week-dot"></span>
                      <span className="week-day-num">{day.date.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="day-record">
            <div className="day-record-head">
              <div className="day-record-title">
                {formatDay(selectedKey)}{isToday ? " ・ 今日" : ""}の記録
              </div>
              {isToday && selectedGroups.length > 0 && (
                <Link
                  to={`/workout?sessionId=${todaySessionId}`}
                  style={{ fontSize: 12.5, color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
                >
                  続きを入力 ›
                </Link>
              )}
            </div>
            {selectedGroups.length === 0 ? (
              <p className="day-record-empty">
                {isToday ? "今日はまだ記録がありません。" : "この日の記録はありません。"}
              </p>
            ) : (
              <div>
                {selectedGroups.map((g, i) => (
                  <Link
                    key={g.exerciseId}
                    to={
                      isToday
                        ? `/workout?sessionId=${g.sessionId}&focus=${g.exerciseId}`
                        : `/history/day/${selectedKey}`
                    }
                    className="record-row"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--divider)" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>
                        {g.sets.map((s) => `${s.weight}kg × ${s.reps}回`).join("  ・  ")}
                      </div>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#A3A3AA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="m9 6 6 6-6 6"></path>
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="section-title">ルーティン</div>
          {routines.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>まだルーティンがありません。</p>
          ) : (
            <div className="routine-list">
              {routines.map((r) => (
                <Link to="/routines" className="routine-chip press" key={r.id}>
                  <div className="routine-chip-title">{r.name}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
