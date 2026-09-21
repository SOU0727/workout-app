import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";
import "./Home.css";

const dayLabels = ["月", "火", "水", "木", "金", "土", "日"];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateStreak(dateSet) {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dateSet.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dateSet.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function Home({ user }) {
  const [sessionDates, setSessionDates] = useState(new Set());
  const [routines, setRoutines] = useState([]);

  const monday = getMonday(new Date());
  const weekDates = dayLabels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, date: d };
  });

  useEffect(() => {
    const fetchSets = async () => {
      const setsRef = collection(db, "users", user.uid, "sets");
      const snapshot = await getDocs(setsRef);
      const dates = new Set();
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.completedAt) {
          dates.add(data.completedAt.toDate().toDateString());
        }
      });
      setSessionDates(dates);
    };
    fetchSets();
  }, [user.uid]);

  useEffect(() => {
    const fetchRoutines = async () => {
      const routinesRef = collection(db, "users", user.uid, "routines");
      const q = query(routinesRef, orderBy("createdAt"));
      const snapshot = await getDocs(q);
      setRoutines(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 3));
    };
    fetchRoutines();
  }, [user.uid]);

  const streak = calculateStreak(sessionDates);

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-date">{today}</div>
        <div className="home-greeting-row">
          <div className="home-greeting">
            こんにちは、{user.email.split("@")[0]}さん
          </div>
          <Link to="/settings" style={{ display: "flex", flexShrink: 0, color: "#74747A" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Link>
        </div>
      </header>

      <div className="home-content">
        <div className="streak-card">
          <div className="streak-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4622D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-2 2 1 3 3 3 5a5 5 0 0 1-10 0c0-5 4-6 5-11Z"></path>
            </svg>
          </div>
          <div>
            <div className="streak-title">
              {streak > 0 ? `${streak}日連続トレーニング中` : "今日から始めましょう"}
            </div>
            <div className="streak-sub">この調子で続けましょう</div>
          </div>
        </div>

        <Link to="/workout" className="start-button">
          ワークアウトを開始
        </Link>

        <div>
          <div className="section-title">今週の記録</div>
          <div className="week-strip">
            {weekDates.map((day) => (
              <div className="week-day" key={day.label}>
                <span className="week-day-label">{day.label}</span>
                <span
                  className={`week-dot ${sessionDates.has(day.date.toDateString()) ? "done" : ""}`}
                ></span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">最近のルーティン</div>
          {routines.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "#74747A" }}>まだルーティンがありません。</p>
          ) : (
            <div className="routine-list">
              {routines.map((r) => (
                <Link to="/routines" className="routine-chip" key={r.id}>
                  <div className="routine-chip-title">{r.name}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}