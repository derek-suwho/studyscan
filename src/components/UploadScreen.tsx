import { useState, useCallback, useRef } from "react";

interface Props {
  loading: boolean;
  onSubmit: (files: File[], courseName: string, examDate: string) => void;
}

export default function UploadScreen({ loading, onSubmit }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === "application/pdf"
    );
    setFiles((prev) => [...prev, ...pdfs]);
  }, []);

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit = files.length > 0 && courseName.trim() && !loading;

  return (
    <div className="fade-in-up mx-auto max-w-xl px-4">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-5xl tracking-tight text-navy-900">
          StudyScan
        </h1>
        <p className="mt-3 text-base text-navy-600/70">
          Upload your past exams. We'll find your gaps.
        </p>
      </div>

      {/* Course info */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700">
            Course name
          </label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. Calculus II"
            className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm
              text-navy-900 placeholder:text-navy-600/40 outline-none
              transition-shadow duration-200
              focus:border-amber-accent focus:ring-2 focus:ring-amber-accent/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700">
            Exam date
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm
              text-navy-900 outline-none
              transition-shadow duration-200
              focus:border-amber-accent focus:ring-2 focus:ring-amber-accent/20"
          />
        </div>
      </div>

      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`group relative w-full rounded-xl border-2 border-dashed p-10
          transition-colors duration-200 cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent/40 focus-visible:ring-offset-2
          ${
            dragOver
              ? "border-amber-accent bg-amber-accent/5"
              : "border-surface-200 bg-white hover:border-navy-600/30 hover:bg-surface-100/50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
              dragOver
                ? "bg-amber-accent/20 text-amber-accent"
                : "bg-surface-100 text-navy-600/50 group-hover:bg-navy-900/5 group-hover:text-navy-600/70"
            }`}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0L8 8m4-4l4 4M4 18h16"
              />
            </svg>
          </div>
          <div className="text-center">
            <span className="text-sm font-medium text-navy-700">
              Drop PDFs here
            </span>
            <span className="block text-xs text-navy-600/50 mt-1">
              or click to browse
            </span>
          </div>
        </div>
      </button>

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="fade-in flex items-center justify-between rounded-lg bg-white px-4 py-2.5 shadow-card"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-navy-900/5 text-[10px] font-bold uppercase text-navy-700">
                  pdf
                </span>
                <span className="truncate text-sm text-navy-800">
                  {f.name}
                </span>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="ml-3 shrink-0 rounded p-1 text-navy-600/40 transition-colors duration-150
                  hover:bg-red-50 hover:text-red-500
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                aria-label={`Remove ${f.name}`}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 16 16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    d="M4.5 4.5l7 7M11.5 4.5l-7 7"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Submit */}
      <button
        disabled={!canSubmit}
        onClick={() => onSubmit(files, courseName, examDate)}
        className="mt-8 w-full rounded-xl bg-navy-900 py-3.5 text-sm font-medium text-white
          transition-all duration-200
          hover:bg-navy-800 active:scale-[0.98]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900/40 focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Analyzing…
          </span>
        ) : (
          "Start Diagnostic"
        )}
      </button>
    </div>
  );
}
