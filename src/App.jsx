import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Workout from "./pages/Workout";
import ExercisePicker from "./pages/ExercisePicker";
import Progress from "./pages/Progress";
import Routines from "./pages/Routines";

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/workout" element={<Workout user={user} />} />
        <Route path="/exercises" element={<ExercisePicker user={user} />} />
        <Route path="/progress" element={<Progress user={user} />} />
        <Route path="/routines" element={<Routines user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;