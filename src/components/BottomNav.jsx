import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const ACCENT = "var(--primary)";

const iconPaths = {
  home: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  record: <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />,
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  progress: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  routines: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
};

const navItems = [
  { to: "/", label: "ホーム", icon: "home" },
  { to: "/workout", label: "記録", icon: "record" },
  { to: "/history", label: "履歴", icon: "history" },
  { to: "/progress", label: "進捗", icon: "progress" },
  { to: "/routines", label: "ルーティン", icon: "routines" },
];

// 今のURLがどのタブに当たるか(タブ以外の画面なら -1)
const tabIndex = (pathname) =>
  navItems.findIndex((it) => (it.to === "/" ? pathname === "/" : pathname.startsWith(it.to)));

const isField = (el) =>
  el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT");

/**
 * 画面下に浮かぶ、すりガラス風のタブバー。
 *
 * 選択中のタブの下には「レンズ」が1つだけあり(iOS風)、タブを切り替えると
 * ふくらんでガラスのようになり、ばねのように滑って移動し、少し揺れて落ち着く。
 * レンズの中にはタブ一列ぶんの青いコピーが入っていて、レンズと逆向きに同じだけ
 * ずらしてあるので、本物のタブと位置がぴったり重なる(通ったところが青く、少し拡大して見える)。
 * 見た目は index.css の .tab-lens を参照。
 */
export default function BottomNav() {
  const [typing, setTyping] = useState(false);
  const { pathname } = useLocation();
  const index = tabIndex(pathname);
  // レンズの位置: 今のタブ。タブ以外の画面(設定など)では最後にいたタブのまま隠す
  const [shown, setShown] = useState(index < 0 ? 0 : index);
  const [moving, setMoving] = useState(false);

  // タブが変わったら、描画中にレンズの行き先を更新して「移動中」にする
  // (Reactの「propsの変化に合わせてstateを調整する」書き方。effectを使わない)
  if (index >= 0 && index !== shown) {
    setShown(index);
    setMoving(true);
  }

  // 少ししたら元の大きさへ。shown が変わるたびにタイマーを掛け直す
  useEffect(() => {
    if (!moving) return;
    const t = window.setTimeout(() => setMoving(false), 300);
    return () => window.clearTimeout(t);
  }, [moving, shown]);

  useEffect(() => {
    const onIn = (e) => {
      if (isField(e.target)) setTyping(true);
    };
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  if (typing) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        display: "flex",
        justifyContent: "center",
        padding: "0 16px",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <nav
        style={{
          position: "relative",
          pointerEvents: "auto",
          display: "flex",
          width: "100%",
          maxWidth: 388,
          padding: 5,
          borderRadius: 32,
          background: "var(--glass)",
          backdropFilter: "blur(22px) saturate(180%)",
          WebkitBackdropFilter: "blur(22px) saturate(180%)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-float)",
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={{ ...itemStyle, color: "var(--text-sub)", fontWeight: 500 }}
          >
            <TabIcon icon={item.icon} strokeWidth={1.8} />
            <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
          </NavLink>
        ))}

        <div
          aria-hidden="true"
          className="tab-lens"
          data-moving={moving}
          data-hidden={index < 0}
          style={{ "--i": shown }}
        >
          <div className="tab-lens-body">
            <div className="tab-lens-row">
              {navItems.map((item) => (
                <span key={item.to} style={{ ...itemStyle, color: ACCENT, fontWeight: 700 }}>
                  <TabIcon icon={item.icon} strokeWidth={2} />
                  <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

const itemStyle = {
  flex: 1,
  minWidth: 0,
  height: 56,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  textDecoration: "none",
  fontSize: 10.5,
};

function TabIcon({ icon, strokeWidth }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[icon]}
    </svg>
  );
}
