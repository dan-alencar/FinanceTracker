import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./components/Navigation";
import { useGameStore } from "./store/useGameStore";

export default function App() {
  const { settings } = useGameStore();

  useEffect(() => {
    document.body.classList.toggle("discrete-mode", settings.discreteMode);
  }, [settings.discreteMode]);

  return (
    <div>
      <Navigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
