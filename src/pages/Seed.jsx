import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

const presetExercises = [
  { name: "ベンチプレス", muscleGroups: ["胸"] },
  { name: "インクラインベンチプレス", muscleGroups: ["胸"] },
  { name: "ダンベルフライ", muscleGroups: ["胸"] },
  { name: "ケーブルクロスオーバー", muscleGroups: ["胸"] },
  { name: "プッシュアップ", muscleGroups: ["胸"] },
  { name: "ディップス", muscleGroups: ["胸", "腕"] },
  { name: "デッドリフト", muscleGroups: ["背中"] },
  { name: "ラットプルダウン", muscleGroups: ["背中"] },
  { name: "ベントオーバーロウ", muscleGroups: ["背中"] },
  { name: "懸垂", muscleGroups: ["背中"] },
  { name: "シーテッドロウ", muscleGroups: ["背中"] },
  { name: "スクワット", muscleGroups: ["脚"] },
  { name: "レッグプレス", muscleGroups: ["脚"] },
  { name: "レッグエクステンション", muscleGroups: ["脚"] },
  { name: "レッグカール", muscleGroups: ["脚"] },
  { name: "カーフレイズ", muscleGroups: ["脚"] },
  { name: "ランジ", muscleGroups: ["脚"] },
  { name: "ショルダープレス", muscleGroups: ["肩"] },
  { name: "サイドレイズ", muscleGroups: ["肩"] },
  { name: "フロントレイズ", muscleGroups: ["肩"] },
  { name: "リアレイズ", muscleGroups: ["肩"] },
  { name: "アームカール", muscleGroups: ["腕"] },
  { name: "トライセプスエクステンション", muscleGroups: ["腕"] },
  { name: "ハンマーカール", muscleGroups: ["腕"] },
  { name: "バーベルカール", muscleGroups: ["腕"] },
  { name: "プランク", muscleGroups: ["体幹"] },
  { name: "クランチ", muscleGroups: ["体幹"] },
  { name: "レッグレイズ", muscleGroups: ["体幹"] },
];

export default function Seed() {
  const [status, setStatus] = useState("");

  const runSeed = async () => {
    setStatus("追加中...");
    const presetsRef = collection(db, "exercisePresets");
    for (const ex of presetExercises) {
      await addDoc(presetsRef, {
        name: ex.name,
        muscleGroups: ex.muscleGroups,
        isArchived: false,
      });
    }
    setStatus(`完了しました(${presetExercises.length}件追加)`);
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 20 }}>種目プリセットの一括追加(一時的なページ)</h1>
      <p style={{ color: "#74747A", fontSize: 13 }}>
        このボタンは1回だけ押してください。何度も押すと同じ種目が重複して追加されます。
      </p>
      <button
        onClick={runSeed}
        style={{
          background: "#4C5B75",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: 14,
          fontSize: 15,
          fontWeight: 700,
          width: "100%",
        }}
      >
        プリセットを追加する
      </button>
      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </div>
  );
}