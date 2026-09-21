import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import BottomNav from "../components/BottomNav";
import "./Home.css";

const weekDays = [
  { label: "月", done: true },
  { label: "火", done: true },
  { label: "水", done: false },
  { label: "木", done: true },
  { label: "金", done: true },
  { label: "土", done: false },
  { label: "日", done: false },
];

export default function Home({ user }) {
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
            <div className="streak-title">7日連続トレーニング中</div>
            <div className="streak-sub">自己ベスト更新中です</div>
          </div>
        </div>

        <Link to="/workout" className="start-button">
          ワークアウトを開始
        </Link>

        <div>
          <div className="section-title">今週の記録</div>
          <div className="week-strip">
            {weekDays.map((day) => (
              <div className="week-day" key={day.label}>
                <span className="week-day-label">{day.label}</span>
                <span className={`week-dot ${day.done ? "done" : ""}`}></span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">最近のルーティン</div>
          <div className="routine-list">
            <Link to="/routines" className="routine-chip">
              <div className="routine-chip-title">胸の日</div>
              <div className="routine-chip-sub">5種目</div>
            </Link>
            <Link to="/routines" className="routine-chip">
              <div className="routine-chip-title">背中の日</div>
              <div className="routine-chip-sub">4種目</div>
            </Link>
            <Link to="/routines" className="routine-chip">
              <div className="routine-chip-title">脚の日</div>
              <div className="routine-chip-sub">6種目</div>
            </Link>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}