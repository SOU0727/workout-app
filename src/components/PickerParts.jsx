import { ROUND_BUTTON } from "../layout";

export function BackButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="戻る" className="press" style={ROUND_BUTTON}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6"></path>
      </svg>
    </button>
  );
}

export function ExerciseRow({ exercise, used, onSelect }) {
  return (
    <li
      onClick={() => onSelect(exercise)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 16px",
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        borderRadius: 18,
        marginBottom: 10,
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{exercise.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{exercise.muscleGroups?.join("・")}</div>
      </div>
      {used && (
        <span
          style={{
            fontSize: 11,
            color: "var(--primary)",
            background: "var(--primary-soft)",
            padding: "4px 10px",
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          使用済み
        </span>
      )}
    </li>
  );
}
