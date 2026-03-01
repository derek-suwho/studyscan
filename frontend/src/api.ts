import type { Session, Problem, Rating, GapItem, SprintContent } from "./types";

const BASE = "/api";

// ── Mock data ──────────────────────────────────────────────

const MOCK_SESSION: Session = { session_id: "mock-session-001" };

const MOCK_PROBLEMS: Problem[] = [
  {
    id: "p1",
    topic: "Derivatives",
    source_label: "Midterm 1, Q3",
    problem_text:
      "Find the derivative of f(x) = 3x⁴ − 2x² + 7x − 5 using the power rule.",
  },
  {
    id: "p2",
    topic: "Integrals",
    source_label: "Midterm 1, Q5",
    problem_text:
      "Evaluate the integral ∫(2x³ + 4x − 1) dx and verify your result by differentiation.",
  },
  {
    id: "p3",
    topic: "Limits",
    source_label: "Midterm 2, Q1",
    problem_text:
      "Compute lim(x→0) [sin(3x) / x] without L'Hôpital's rule. Show all steps.",
  },
  {
    id: "p4",
    topic: "Derivatives",
    source_label: "Midterm 2, Q4",
    problem_text:
      "Use the chain rule to differentiate g(x) = (2x² + 1)⁵. Simplify your answer.",
  },
  {
    id: "p5",
    topic: "Series",
    source_label: "Final, Q2",
    problem_text:
      "Determine whether the series Σ(n=1 to ∞) 1/n² converges or diverges. Justify.",
  },
  {
    id: "p6",
    topic: "Integrals",
    source_label: "Final, Q6",
    problem_text:
      "Use integration by parts to evaluate ∫ x·eˣ dx. Show each step clearly.",
  },
  {
    id: "p7",
    topic: "Limits",
    source_label: "Quiz 3, Q1",
    problem_text:
      "Find lim(x→∞) (3x² + 2x) / (x² − 1). Explain your reasoning.",
  },
  {
    id: "p8",
    topic: "Series",
    source_label: "Final, Q8",
    problem_text:
      "Find the radius of convergence for the power series Σ(n=0 to ∞) xⁿ/n!.",
  },
];

const MOCK_GAPS: GapItem[] = [
  {
    topic: "Integrals",
    score: 0.85,
    frequency: 2,
    avg_confidence: 1.5,
    problem_ids: ["p2", "p6"],
  },
  {
    topic: "Limits",
    score: 0.6,
    frequency: 2,
    avg_confidence: 2.5,
    problem_ids: ["p3", "p7"],
  },
  {
    topic: "Series",
    score: 0.45,
    frequency: 2,
    avg_confidence: 3.0,
    problem_ids: ["p5", "p8"],
  },
  {
    topic: "Derivatives",
    score: 0.2,
    frequency: 2,
    avg_confidence: 4.0,
    problem_ids: ["p1", "p4"],
  },
];

const MOCK_SPRINT: SprintContent = {
  explanation:
    "Integration is the reverse process of differentiation. When we integrate a function, we're finding the antiderivative — a function whose derivative gives us the original function.\n\n**Key techniques:**\n• **Power Rule (reverse):** ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C\n• **Integration by Parts:** ∫ u dv = uv − ∫ v du (use LIATE to pick u)\n• **Substitution:** Replace a composite expression with a single variable\n\nAlways add the constant of integration C for indefinite integrals. Verify your answers by differentiating the result.",
  practice_problems: [
    {
      text: "Evaluate ∫(5x⁴ − 3x² + 2) dx.",
      solution:
        "Apply the power rule term by term:\n∫5x⁴ dx = x⁵\n∫−3x² dx = −x³\n∫2 dx = 2x\n\nAnswer: x⁵ − x³ + 2x + C",
    },
    {
      text: "Use integration by parts to find ∫ x·cos(x) dx.",
      solution:
        "Let u = x, dv = cos(x) dx\nThen du = dx, v = sin(x)\n\n∫ x·cos(x) dx = x·sin(x) − ∫ sin(x) dx\n= x·sin(x) + cos(x) + C",
    },
    {
      text: "Find ∫ (2x+1)³ dx using substitution.",
      solution:
        "Let u = 2x + 1, then du = 2dx → dx = du/2\n\n∫ u³ · (du/2) = (1/2) · u⁴/4 = u⁴/8\n= (2x+1)⁴/8 + C",
    },
  ],
};

// ── API helpers ────────────────────────────────────────────

async function request<T>(
  path: string,
  options?: RequestInit,
  fallback?: T
): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error(`API request failed: ${path}`);
  }
}

// ── Public API ─────────────────────────────────────────────

export async function createSession(
  courseName: string,
  examDate: string
): Promise<Session> {
  return request<Session>(
    "/sessions",
    {
      method: "POST",
      body: JSON.stringify({ course_name: courseName, exam_date: examDate }),
    },
    MOCK_SESSION
  );
}

export async function uploadFiles(
  sessionId: string,
  files: File[]
): Promise<void> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  try {
    const res = await fetch(`${BASE}/sessions/${sessionId}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`${res.status}`);
  } catch {
    // silently fall through to mock flow
  }
}

export async function getDiagnostic(
  sessionId: string
): Promise<Problem[]> {
  return request<Problem[]>(
    `/sessions/${sessionId}/diagnostic`,
    undefined,
    MOCK_PROBLEMS
  );
}

export async function submitRatings(
  sessionId: string,
  ratings: Rating[]
): Promise<GapItem[]> {
  return request<GapItem[]>(
    `/sessions/${sessionId}/ratings`,
    {
      method: "POST",
      body: JSON.stringify({ ratings }),
    },
    MOCK_GAPS
  );
}

export async function getSprint(
  sessionId: string,
  topic: string
): Promise<SprintContent> {
  return request<SprintContent>(
    `/sessions/${sessionId}/sprint?topic=${encodeURIComponent(topic)}`,
    undefined,
    MOCK_SPRINT
  );
}

export async function rerateTopicSprint(
  sessionId: string,
  topic: string,
  confidence: 1 | 2 | 3 | 4 | 5
): Promise<GapItem[]> {
  return request<GapItem[]>(
    `/sessions/${sessionId}/sprint/rerate`,
    {
      method: "POST",
      body: JSON.stringify({ topic, confidence }),
    },
    MOCK_GAPS.map((g) =>
      g.topic === topic ? { ...g, avg_confidence: confidence, score: Math.max(0, g.score - 0.2) } : g
    )
  );
}
