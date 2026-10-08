export function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="戻る"
      style={{ background: "none", border: "none", padding: 0, display: "flex", cursor: "pointer" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18181A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        padding: 12,
        border: "1px solid #DADADA",
        borderRadius: 12,
        marginBottom: 8,
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{exercise.name}</div>
        <div style={{ fontSize: 12, color: "#74747A" }}>{exercise.muscleGroups?.join("・")}</div>
      </div>
      {used && (
        <span
          style={{
            fontSize: 11,
            color: "#4C5B75",
            background: "#E9EDF3",
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          使用済み
        </span>
      )}
    </li>
  );
}
