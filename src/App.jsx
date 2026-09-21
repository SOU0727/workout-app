import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <p>読み込み中...</p>;

  if (!user) return <Auth />;

  return (
    <div style={{ maxWidth: 320, margin: "80px auto", padding: 24 }}>
      <p>ようこそ、{user.email} さん</p>
      <button onClick={() => signOut(auth)}>ログアウト</button>
    </div>
  );
}

export default App;