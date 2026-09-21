import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
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

export default function Home({ user }) {
  const [weekDoneDates, setWeekDoneDates] = useState(new Set());
  const [routines, setRoutines] = useState([]);

  const monday = getMonday(new Date());
  const weekDates = dayLabels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, date: d };
  });

  useEffect(() => {
    const fetchThisWeekSessions = async () => {
      const sessionsRef = collection(db, "users", user.uid, "sessions");
      const q = query(sessionsRef, where("startedAt", ">=", Timestamp.fromDate(monday)));
      const snapshot = await getDocs(q);
      const dates = new Set();
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.startedAt) {
          dates.add(data.startedAt.toDate().toDateString());
        }
      });
      setWeekDoneDates(dates);
    };
    fetchThisWeekSessions();
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
          <button className="home-logout" onClick={() => signOut(auth)}>
            ログアウト
          </button>
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
            <div className="streak-title">今週 {weekDoneDates.size}日トレーニング</div>
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
                  className={`week-dot ${weekDoneDates.has(day.date.toDateString()) ? "done" : ""}`}
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