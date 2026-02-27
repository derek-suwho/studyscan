import type { GapItem } from "../types";

interface Props {
  gaps: GapItem[];
  courseName: string;
  onSelectTopic: (topic: string) => void;
}

function priorityBadge(score: number) {
  if (score >= 0.7)
    return {
      label: "High",
      bg: "bg-red-50",
      text: "text-red-600",
      ring: "ring-red-100",
    };
  if (score >= 0.4)
    return {
      label: "Medium",
      bg: "bg-orange-50",
      text: "text-orange-600",
      ring: "ring-orange-100",
    };
  return {
    label: "Low",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    ring: "ring-emerald-100",
  };
}

function confidenceBar(avg: number) {
  const pct = (avg / 5) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-200">
        <div
          className="h-full rounded-full bg-amber-accent/70 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-navy-600/50 w-6 text-right">
        {avg.toFixed(1)}
      </span>
    </div>
  );
}

export default function GapMapScreen({ gaps, courseName, onSelectTopic }: Props) {
  const sorted = [...gaps].sort((a, b) => b.score - a.score);

  return (
    <div className="fade-in-up mx-auto max-w-xl px-4">
      <div className="mb-8">
        <h2 className="font-display text-3xl tracking-tight text-navy-900">
          Your Gap Map
        </h2>
        {courseName && (
          <p className="mt-1 text-sm text-navy-600/50">{courseName}</p>
        )}
      </div>

      <div className="space-y-3">
        {sorted.map((gap, i) => {
          const badge = priorityBadge(gap.score);
          return (
            <button
              key={gap.topic}
              onClick={() => onSelectTopic(gap.topic)}
              className="group w-full rounded-xl bg-white p-5 text-left shadow-card
                transition-all duration-200
                hover:shadow-card-hover
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent/40 focus-visible:ring-offset-2
                active:scale-[0.99]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-navy-900 group-hover:text-navy-800">
                      {gap.topic}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${badge.bg} ${badge.text} ${badge.ring}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-3">{confidenceBar(gap.avg_confidence)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs text-navy-600/40">
                    {gap.frequency} problem{gap.frequency !== 1 && "s"}
                  </span>
                </div>
              </div>

              {/* Arrow hint */}
              <div className="mt-3 flex items-center gap-1 text-xs text-navy-600/30 transition-colors duration-200 group-hover:text-amber-accent/70">
                <span>Start sprint</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5L10.5 8 6 12.5" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
