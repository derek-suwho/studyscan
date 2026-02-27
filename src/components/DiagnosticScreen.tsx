import type { Problem, Rating } from "../types";

const LABELS = ["No idea", "Shaky", "So-so", "Solid", "Totally got it"] as const;

interface Props {
  problems: Problem[];
  ratings: Rating[];
  onRate: (problemId: string, confidence: 1 | 2 | 3 | 4 | 5) => void;
}

export default function DiagnosticScreen({ problems, ratings, onRate }: Props) {
  const currentIdx = ratings.length;
  const total = problems.length;
  const done = currentIdx >= total;
  const problem = done ? null : problems[currentIdx];
  const progress = total > 0 ? (currentIdx / total) * 100 : 0;

  if (done) {
    return (
      <div className="fade-in mx-auto max-w-lg px-4 text-center">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-amber-accent/15 text-amber-accent">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 font-display text-2xl text-navy-900">All rated</h2>
        <p className="mt-2 text-sm text-navy-600/60">Building your gap map…</p>
        <div className="mt-6 flex justify-center">
          <svg className="h-6 w-6 animate-spin text-navy-600/40" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-navy-600/50 uppercase tracking-wide">
            Diagnostic
          </span>
          <span className="text-xs tabular-nums text-navy-600/50">
            {currentIdx + 1} / {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200">
          <div
            className="h-full rounded-full bg-navy-900 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Problem card */}
      <div key={problem!.id} className="fade-in-up rounded-xl bg-white p-6 shadow-card">
        <span className="inline-block rounded-md bg-surface-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-navy-600/60">
          {problem!.source_label}
        </span>
        <p className="mt-4 text-base leading-relaxed text-navy-900 whitespace-pre-wrap">
          {problem!.problem_text}
        </p>
      </div>

      {/* Confidence buttons */}
      <div className="mt-6">
        <p className="mb-3 text-center text-xs font-medium text-navy-600/50 uppercase tracking-wide">
          How confident are you?
        </p>
        <div className="grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <button
              key={level}
              onClick={() => onRate(problem!.id, level)}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-surface-200
                bg-white px-2 py-3 transition-all duration-200
                hover:border-navy-900/20 hover:shadow-card
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent/40 focus-visible:ring-offset-2
                active:scale-95"
            >
              <span className="text-lg font-semibold text-navy-900 transition-colors duration-200 group-hover:text-amber-accent">
                {level}
              </span>
              <span className="text-[10px] leading-tight text-navy-600/40 group-hover:text-navy-600/60">
                {LABELS[level - 1]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
