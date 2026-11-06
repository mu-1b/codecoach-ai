import { Link, NavLink } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { useSession } from "../lib/session.jsx";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${isActive ? "bg-ink-800 text-slate-100" : "text-slate-400 hover:text-slate-100"}`;

export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-slate-100">
      <span className="grid size-7 place-items-center rounded-lg bg-brand-500 font-mono text-xs font-bold text-white">{"</>"}</span>
      <span className="hidden sm:inline">CodeCoach <span className="text-brand-400">AI</span></span>
    </Link>
  );
}

export default function NavBar({ children }) {
  const { user, signOut, setSignInOpen } = useSession();
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-ink-700/70 bg-ink-950/80 px-4 backdrop-blur sm:px-6">
      <Logo />
      <nav className={`items-center gap-1 ${children ? "hidden lg:flex" : "flex"}`}>
        <NavLink to="/challenges" end className={linkClass}>Challenges</NavLink>
        <NavLink to="/dashboard" className={linkClass}>Progress</NavLink>
        {user?.role === "instructor" && <NavLink to="/instructor" className={linkClass}>Instructor</NavLink>}
      </nav>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}</div>
      {user ? (
        <div className="flex items-center gap-1">
          <span className="hidden items-center gap-2 rounded-full bg-ink-800 py-1 pl-1 pr-3 text-sm text-slate-300 md:flex">
            <span className="grid size-6 place-items-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-400">
              {user.name[0].toUpperCase()}
            </span>
            {user.name}
            {user.role === "instructor" && <span className="text-xs text-slate-500">· instructor</span>}
          </span>
          <button onClick={signOut} title="Sign out" className="rounded-md p-2 text-slate-500 hover:bg-ink-800 hover:text-slate-200">
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <button onClick={() => setSignInOpen(true)} className="flex shrink-0 items-center gap-2 rounded-lg bg-ink-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-ink-700">
          <UserRound size={15} /> Sign in
        </button>
      )}
    </header>
  );
}
