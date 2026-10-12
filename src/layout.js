export const PAGE_PADDING = "20px 20px calc(100px + env(safe-area-inset-bottom, 0px))";

export const card = {
  display: "block",
  background: "var(--surface)",
  borderRadius: "var(--radius-card)",
  boxShadow: "var(--shadow-card)",
  padding: "16px 18px",
  color: "inherit",
  textDecoration: "none",
};

// 入力欄の共通スタイル(大きな角丸+薄い面)
export const FIELD = {
  padding: "12px 14px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-control)",
  background: "var(--surface-2)",
  color: "var(--text)",
};

// 主役の丸いボタン
export const PILL_PRIMARY = {
  background: "var(--primary)",
  color: "var(--on-primary)",
  border: "none",
  borderRadius: 999,
  fontWeight: 700,
  cursor: "pointer",
};

// 戻るボタン(丸い面)
export const ROUND_BUTTON = {
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: 20,
  border: "none",
  background: "var(--surface)",
  boxShadow: "var(--shadow-card)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
};
