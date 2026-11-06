const styles = {
  beginner: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  hard: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
};

export default function Difficulty({ level }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${styles[level]}`}>
      {level}
    </span>
  );
}
