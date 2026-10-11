import { Suspense, lazy, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import SetsProvider from "./SetsProvider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Workout from "./pages/Workout";
const ExercisePicker = lazy(() => import("./pages/ExercisePicker"));
const History = lazy(() => import("./pages/History"));
const HistoryDay = lazy(() => import("./pages/HistoryDay"));
const HistoryExercise = lazy(() => import("./pages/HistoryExercise"));
const Progress = lazy(() => import("./pages/Progress"));
const Routines = lazy(() => import("./pages/Routines"));
const Settings = lazy(() => import("./pages/Settings"));
const Seed = lazy(() => import("./pages/Seed"));

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
    <SetsProvider uid={user.uid}>
    <BrowserRouter>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/workout" element={<Workout user={user} />} />
        <Route path="/exercises" element={<ExercisePicker user={user} />} />
        <Route path="/history" element={<History user={user} />} />
        <Route path="/history/day/:key" element={<HistoryDay user={user} />} />
        <Route path="/history/exercise/:exerciseId" element={<HistoryExercise user={user} />} />
        <Route path="/progress" element={<Progress user={user} />} />
        <Route path="/routines" element={<Routines user={user} />} />
        <Route path="/settings" element={<Settings user={user} />} />
        <Route path="/seed" element={<Seed />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </SetsProvider>
  );
}

export default App;