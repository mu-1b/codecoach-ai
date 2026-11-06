import { Outlet } from "react-router-dom";
import NavBar from "./NavBar.jsx";

export default function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-ink-800 px-6 py-6 text-center text-xs text-slate-500">
        CodeCoach AI · Built at BigRed//Hacks, September 2025
      </footer>
    </div>
  );
}
