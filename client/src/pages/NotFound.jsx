import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="font-mono text-sm text-brand-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-100">This page doesn't exist</h1>
      <Link to="/challenges" className="mt-6 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
        Browse challenges
      </Link>
    </div>
  );
}
