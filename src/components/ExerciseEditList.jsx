import { useState } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function Row({ item, index, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? CSS.Transform.toString({ ...transform, x: 0 }) : undefined,
        transition,
        position: "relative",
        zIndex: isDragging ? 5 : 0,
        touchAction: "manipulation",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        cursor: "grab",
      }}
    >
      {/* ぷるぷる揺れるのは内側。外側は並べ替えの移動に使うため分けている */}
      <div
        className={isDragging ? undefined : "jiggle"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px 12px 12px",
          background: "var(--surface)",
          border: isDragging ? "1px solid var(--primary)" : "1px solid transparent",
          borderRadius: 20,
          boxShadow: isDragging ? "var(--shadow-float)" : "var(--shadow-card)",
          transform: isDragging ? "scale(1.03)" : undefined,
          animationDelay: `${-(index % 4) * 0.09}s`,
        }}
      >
        <button
          onClick={() => onDelete(item.id)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label={`${item.name}を削除`}
          style={{
            flexShrink: 0,
            width: 30,
            height: 30,
            borderRadius: 15,
            border: "none",
            background: "var(--danger-fill)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <path d="M5 12h14"></path>
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {item.setCount > 0 ? `${item.setCount}セット記録済み` : "記録なし"}
          </div>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A3A3AA"
          strokeWidth="2"
          strokeLinecap="round"
          aria-label="並べ替え"
          style={{ flexShrink: 0 }}
        >
          <path d="M4 7h16"></path>
          <path d="M4 12h16"></path>
          <path d="M4 17h16"></path>
        </svg>
      </div>
    </li>
  );
}

export default function ExerciseEditList({ items, onReorder, onDelete }) {
  const [prevItems, setPrevItems] = useState(items);
  const [override, setOverride] = useState(null);
  if (items !== prevItems) {
    setPrevItems(items);
    setOverride(null);
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  const ordered = override
    ? override.map((id) => items.find((i) => i.id === id)).filter(Boolean)
    : items;

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = ordered.map((i) => i.id);
    const next = arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id));
    setOverride(next);
    onReorder(next);
  };

  return (
    <div>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 12px" }}>
        行を触ったままドラッグで並べ替え、左の「−」で削除できます。終わったら「完了」を押してください。
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => {
          if (navigator.vibrate) navigator.vibrate(12);
        }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ordered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {ordered.map((item, index) => (
              <Row key={item.id} item={item} index={index} onDelete={onDelete} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
