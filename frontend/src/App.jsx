import { Outlet } from "react-router-dom";
import Navigation from "./components/Navigation";

export default function App() {
  return (
    <div>
      <Navigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
