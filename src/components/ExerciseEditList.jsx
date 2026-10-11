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

function Row({ item, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 12px",
        background: "#fff",
        border: isDragging ? "1px solid #4C5B75" : "1px solid #DADADA",
        borderRadius: 12,
        boxShadow: isDragging ? "0 8px 20px rgba(0,0,0,0.18)" : "none",
        transform: transform ? CSS.Transform.toString({ ...transform, x: 0 }) : undefined,
        transition,
        position: "relative",
        zIndex: isDragging ? 5 : 0,
        touchAction: "manipulation",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "grab",
      }}
    >
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{item.name}</div>
        <div style={{ fontSize: 12, color: "#74747A", marginTop: 2 }}>
          {item.setCount > 0 ? `${item.setCount}セット記録済み` : "記録なし"}
        </div>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          flexShrink: 0,
          background: "none",
          border: "1px solid #9A3B33",
          color: "#9A3B33",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        削除
      </button>
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
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
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
      <p style={{ fontSize: 12.5, color: "#74747A", margin: "4px 0 12px" }}>
        行を長押ししてドラッグすると並べ替えできます。
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
            {ordered.map((item) => (
              <Row key={item.id} item={item} onDelete={onDelete} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
