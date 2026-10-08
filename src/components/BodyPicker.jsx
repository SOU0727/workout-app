import { Component, Suspense, lazy } from "react";
import { BackButton, ExerciseRow } from "./PickerParts";

const BodyViewer = lazy(() => import("./BodyViewer"));

class ViewerBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.failed) {
      return (
        <p style={{ padding: 20, color: "#74747A", fontSize: 13 }}>
          この端末では3D表示を読み込めませんでした。右上の「リスト」に切り替えてください。
        </p>
      );
    }
    return this.props.children;
  }
}

export default function BodyPicker({
  title,
  onBack,
  toggle,
  bodyGroup,
  onBodyGroupChange,
  dataGroup,
  list,
  usedMap,
  onSelectExercise,
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid #EDEDEE",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton onClick={onBack} />
          <h1 style={{ fontSize: 20, margin: 0 }}>{title}</h1>
        </div>
        {toggle}
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <ViewerBoundary>
          <Suspense
            fallback={<p style={{ padding: 20, color: "#74747A", fontSize: 13 }}>読み込み中...</p>}
          >
            <BodyViewer selectedGroup={bodyGroup} onSelect={onBodyGroupChange} />
          </Suspense>
        </ViewerBoundary>

        {!bodyGroup && (
          <p
            style={{
              position: "absolute",
              left: "50%",
              bottom: 12,
              transform: "translateX(-50%)",
              margin: 0,
              padding: "5px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.88)",
              whiteSpace: "nowrap",
              fontSize: 12.5,
              color: "#74747A",
              pointerEvents: "none",
            }}
          >
            部位をタップして種目を表示(ドラッグで回転)
          </p>
        )}

        {bodyGroup && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "42%",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "18px 18px 0 0",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
              padding: "14px 16px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {bodyGroup}
                {dataGroup && dataGroup !== bodyGroup && (
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#74747A" }}>
                    {" "}
                    ({dataGroup}の種目)
                  </span>
                )}
              </div>
              <button
                onClick={() => onBodyGroupChange(null)}
                aria-label="閉じる"
                style={{ background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A3A3AA" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>

            {list.length === 0 ? (
              <p style={{ fontSize: 13, color: "#74747A", margin: 0 }}>
                この部位の種目はまだ登録されていません。
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {list.map((ex) => (
                  <ExerciseRow
                    key={ex.id}
                    exercise={ex}
                    used={Boolean(usedMap[ex.id])}
                    onSelect={onSelectExercise}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
