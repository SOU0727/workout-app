import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import BottomNav from "../components/BottomNav";

export default function Home({ user }) {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #ddd" }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          こんにちは、{user.email.split("@")[0]}さん
        </div>
        <button onClick={() => signOut(auth)} style={{ marginTop: 8, fontSize: 12 }}>
          ログアウト
        </button>
      </div>
      <div style={{ padding: 20 }}>
        <p>ここに今後、連続日数やワークアウト開始ボタンなどを追加していきます。</p>
      </div>
      <BottomNav />
    </div>
  );
}