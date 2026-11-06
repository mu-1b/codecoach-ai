import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Lightbulb, MessagesSquare, Play, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: MessagesSquare,
    title: "A tutor that asks, not tells",
    text: "The AI coach reads your code and answers with guiding questions, so you find the bug yourself.",
  },
  {
    icon: Lightbulb,
    title: "Progressive hints",
    text: "Stuck? Unlock hints one at a time, from a gentle nudge to a clear plan. They work offline, too.",
  },
  {
    icon: Play,
    title: "Run code instantly",
    text: "Python and JavaScript run in a sandboxed worker with real test cases and readable feedback.",
  },
  {
    icon: BarChart3,
    title: "Progress you can see",
    text: "Track solved challenges, acceptance rate and streaks. Instructors see where the class gets stuck.",
  },
];

const chat = [
  { from: "student", text: "my two_sum returns [0, 0] for [3, 3]" },
  { from: "coach", text: "Good catch testing duplicates! On line 4 you store `seen[n] = i` *before* checking for the complement. What does `seen` contain when you reach the second 3?" },
  { from: "student", text: "oh, it finds itself… I should check first" },
  { from: "coach", text: "Exactly. Try swapping those two lines and run the tests again." },
];

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(240,72,72,0.18),transparent_60%)]" />

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-3 py-1 text-xs text-slate-400">
            <Sparkles size={13} className="text-brand-400" /> Built at BigRed//Hacks 2025
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-50 sm:text-5xl">
            Learn to code by <span className="text-brand-400">thinking it through</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-400">
            CodeCoach pairs hands-on coding challenges with an AI tutor that uses Socratic questioning. It doesn't hand you answers. It helps you reason your way to them.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/challenges" className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600">
              Start a challenge <ArrowRight size={16} />
            </Link>
            <Link to="/challenges/two-sum" className="inline-flex items-center gap-2 rounded-lg border border-ink-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-ink-800">
              Open the workspace
            </Link>
          </div>
          <div className="mt-10 flex gap-8 text-sm text-slate-500">
            <div><span className="block text-2xl font-semibold text-slate-100">8</span>curated challenges</div>
            <div><span className="block text-2xl font-semibold text-slate-100">2</span>languages</div>
            <div><span className="block text-2xl font-semibold text-slate-100">24</span>progressive hints</div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-700 bg-ink-900/80 p-1 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-1.5 border-b border-ink-700 px-4 py-3">
            <span className="size-2.5 rounded-full bg-ink-700" />
            <span className="size-2.5 rounded-full bg-ink-700" />
            <span className="size-2.5 rounded-full bg-ink-700" />
            <span className="ml-3 text-xs text-slate-500">CodeCoach tutor · Two Sum</span>
          </div>
          <div className="space-y-3 p-5">
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.from === "student" ? "justify-end" : ""}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.from === "student" ? "rounded-br-sm bg-brand-500 text-white" : "rounded-bl-sm bg-ink-800 text-slate-300"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: m.text
                      .replace(/`([^`]+)`/g, '<code class="font-mono text-brand-400">$1</code>')
                      .replace(/\*([^*]+)\*/g, "<em>$1</em>"),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-5">
              <Icon size={20} className="text-brand-400" />
              <h3 className="mt-4 font-semibold text-slate-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-ink-700/70 bg-gradient-to-r from-ink-900 to-ink-850 p-8 sm:flex-row">
          <div className="flex items-center gap-4">
            <ShieldCheck size={28} className="text-emerald-400" />
            <div>
              <h3 className="font-semibold text-slate-100">Teaching, not cheating</h3>
              <p className="text-sm text-slate-400">The tutor is instructed never to write the full solution, even when asked.</p>
            </div>
          </div>
          <Link to="/challenges" className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-white">
            Browse challenges
          </Link>
        </div>
      </section>
    </div>
  );
}
