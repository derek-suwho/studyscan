import { useState } from "react";
import type { SprintContent } from "../types";

const LABELS = ["No idea", "Shaky", "So-so", "Solid", "Totally got it"] as const;

interface Props {
  topic: string;
  content: SprintContent;
  loading: boolean;
  onRerate: (confidence: 1 | 2 | 3 | 4 | 5) => void;
  onBack: () => void;
}

function PracticeProblem({
  index,
  text,
  solution,
}: {
  index: number;
  text: string;
  solution: string;
}) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-navy-600/40">
        Practice {index + 1}
      </span>
      <p className="mt-2 text-sm leading-relaxed text-navy-900 whitespace-pre-wrap">
        {text}
      </p>
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
          text-navy-600/60 transition-colors duration-200
          hover:bg-surface-100 hover:text-navy-800
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent/40"
      >
        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 16 16"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-transform duration-200 ${showSolution ? "rotate-90" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5L10.5 8 6 12.5" />
        </svg>
        {showSolution ? "Hide solution" : "Show solution"}
      </button>
      {showSolution && (
        <div className="fade-in mt-3 rounded-lg bg-surface-50 border border-surface-200 p-4 text-sm leading-relaxed text-navy-800 whitespace-pre-wrap">
          {solution}
        </div>
      )}
    </div>
  );
}

export default function SprintScreen({ topic, content, loading, onRerate, onBack }: Props) {
  return (
    <div className="fade-in-up mx-auto max-w-xl px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium
            text-navy-600/50 transition-colors duration-200
            hover:bg-surface-100 hover:text-navy-800
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent/40"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5L5.5 8 10 12.5" />
          </svg>
          Gap Map
        </button>
        <h2 className="font-display text-3xl tracking-tight text-navy-900">
          {topic}
        </h2>
        <span className="mt-1 inline-block text-xs font-medium uppercase tracking-wide text-amber-accent">
          Sprint
        </span>
      </div>

      {/* Explanation */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-card">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-600/40">
          Explanation
        </h3>
        <div className="text-sm leading-[1.7] text-navy-800 whitespace-pre-wrap">
          {content.explanation}
        </div>
      </div>

      {/* Practice problems */}
      <div className="mb-8 space-y-3">
        {content.practice_problems.map((pp, i) => (
          <PracticeProblem
            key={i}
            index={i}
            text={pp.text}
            solution={pp.solution}
          />
        ))}
      </div>

      {/* Re-rate */}
      <div className="rounded-xl bg-navy-900 p-6">
        <p className="mb-4 text-center text-sm font-medium text-white/70">
          How confident are you now?
        </p>
        <div className="grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <button
              key={level}
              disabled={loading}
              onClick={() => onRerate(level)}
              className="group flex flex-col items-center gap-1 rounded-lg bg-white/10 px-2 py-3
                transition-all duration-200
                hover:bg-white/20 active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent/60
                disabled:opacity-40"
            >
              <span className="text-lg font-semibold text-white group-hover:text-amber-light">
                {level}
              </span>
              <span className="text-[9px] leading-tight text-white/40 group-hover:text-white/60">
                {LABELS[level - 1]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
