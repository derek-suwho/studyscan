import type { Problem, Rating, GapItem, SprintContent } from "../types";

export type Screen = "UPLOAD" | "DIAGNOSTIC" | "GAP_MAP" | "SPRINT";

export interface SessionState {
  screen: Screen;
  sessionId: string | null;
  courseName: string;
  examDate: string;
  problems: Problem[];
  ratings: Rating[];
  gaps: GapItem[];
  activeTopic: string | null;
  sprintContent: SprintContent | null;
  loading: boolean;
}

export const initialState: SessionState = {
  screen: "UPLOAD",
  sessionId: null,
  courseName: "",
  examDate: "",
  problems: [],
  ratings: [],
  gaps: [],
  activeTopic: null,
  sprintContent: null,
  loading: false,
};

// Dev-mode: initialize with mock data based on URL hash
// Usage: http://localhost:5173/#diagnostic, #gapmap, #sprint
const MOCK_PROBLEMS: Problem[] = [
  { id: "p1", topic: "Derivatives", source_label: "Midterm 1, Q3", problem_text: "Find the derivative of f(x) = 3x\u2074 \u2212 2x\u00b2 + 7x \u2212 5 using the power rule." },
  { id: "p2", topic: "Integrals", source_label: "Midterm 1, Q5", problem_text: "Evaluate the integral \u222b(2x\u00b3 + 4x \u2212 1) dx and verify your result by differentiation." },
  { id: "p3", topic: "Limits", source_label: "Midterm 2, Q1", problem_text: "Compute lim(x\u21920) [sin(3x) / x] without L\u2019H\u00f4pital\u2019s rule. Show all steps." },
  { id: "p4", topic: "Derivatives", source_label: "Midterm 2, Q4", problem_text: "Use the chain rule to differentiate g(x) = (2x\u00b2 + 1)\u2075. Simplify your answer." },
  { id: "p5", topic: "Series", source_label: "Final, Q2", problem_text: "Determine whether the series \u03a3(n=1 to \u221e) 1/n\u00b2 converges or diverges. Justify." },
  { id: "p6", topic: "Integrals", source_label: "Final, Q6", problem_text: "Use integration by parts to evaluate \u222b x\u00b7e\u02e3 dx. Show each step clearly." },
];

const MOCK_GAPS: GapItem[] = [
  { topic: "Integrals", score: 0.85, frequency: 2, avg_confidence: 1.5, problem_ids: ["p2", "p6"] },
  { topic: "Limits", score: 0.6, frequency: 2, avg_confidence: 2.5, problem_ids: ["p3", "p7"] },
  { topic: "Series", score: 0.45, frequency: 2, avg_confidence: 3.0, problem_ids: ["p5", "p8"] },
  { topic: "Derivatives", score: 0.2, frequency: 2, avg_confidence: 4.0, problem_ids: ["p1", "p4"] },
];

const MOCK_SPRINT: SprintContent = {
  explanation: "Integration is the reverse process of differentiation. When we integrate a function, we\u2019re finding the antiderivative \u2014 a function whose derivative gives us the original function.\n\nKey techniques:\n\u2022 Power Rule (reverse): \u222b x\u207f dx = x\u207f\u207a\u00b9/(n+1) + C\n\u2022 Integration by Parts: \u222b u dv = uv \u2212 \u222b v du (use LIATE to pick u)\n\u2022 Substitution: Replace a composite expression with a single variable\n\nAlways add the constant of integration C for indefinite integrals.",
  practice_problems: [
    { text: "Evaluate \u222b(5x\u2074 \u2212 3x\u00b2 + 2) dx.", solution: "Apply the power rule term by term:\n\u222b5x\u2074 dx = x\u2075\n\u222b\u22123x\u00b2 dx = \u2212x\u00b3\n\u222b2 dx = 2x\n\nAnswer: x\u2075 \u2212 x\u00b3 + 2x + C" },
    { text: "Use integration by parts to find \u222b x\u00b7cos(x) dx.", solution: "Let u = x, dv = cos(x) dx\nThen du = dx, v = sin(x)\n\n\u222b x\u00b7cos(x) dx = x\u00b7sin(x) \u2212 \u222b sin(x) dx\n= x\u00b7sin(x) + cos(x) + C" },
    { text: "Find \u222b (2x+1)\u00b3 dx using substitution.", solution: "Let u = 2x + 1, then du = 2dx \u2192 dx = du/2\n\n\u222b u\u00b3 \u00b7 (du/2) = (1/2) \u00b7 u\u2074/4 = u\u2074/8\n= (2x+1)\u2074/8 + C" },
  ],
};

export function getDevInitialState(): SessionState {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const hash = params?.get("screen") || (typeof window !== "undefined" ? window.location.hash.replace("#", "") : "");
  const base = { ...initialState, sessionId: "dev-session", courseName: "Calculus II", examDate: "2026-03-15" };

  switch (hash) {
    case "diagnostic":
      return { ...base, screen: "DIAGNOSTIC", problems: MOCK_PROBLEMS };
    case "gapmap":
      return { ...base, screen: "GAP_MAP", gaps: MOCK_GAPS };
    case "sprint":
      return { ...base, screen: "SPRINT", gaps: MOCK_GAPS, activeTopic: "Integrals", sprintContent: MOCK_SPRINT };
    default:
      return initialState;
  }
}

export type Action =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_SESSION"; sessionId: string; courseName: string; examDate: string }
  | { type: "SET_PROBLEMS"; problems: Problem[] }
  | { type: "ADD_RATING"; rating: Rating }
  | { type: "SET_GAPS"; gaps: GapItem[] }
  | { type: "START_SPRINT"; topic: string; content: SprintContent }
  | { type: "RETURN_TO_GAPS"; gaps: GapItem[] }
  | { type: "GO_TO"; screen: Screen };

export function sessionReducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_SESSION":
      return {
        ...state,
        sessionId: action.sessionId,
        courseName: action.courseName,
        examDate: action.examDate,
      };
    case "SET_PROBLEMS":
      return { ...state, problems: action.problems, ratings: [], screen: "DIAGNOSTIC" };
    case "ADD_RATING":
      return { ...state, ratings: [...state.ratings, action.rating] };
    case "SET_GAPS":
      return { ...state, gaps: action.gaps, screen: "GAP_MAP" };
    case "START_SPRINT":
      return {
        ...state,
        activeTopic: action.topic,
        sprintContent: action.content,
        screen: "SPRINT",
      };
    case "RETURN_TO_GAPS":
      return {
        ...state,
        gaps: action.gaps,
        activeTopic: null,
        sprintContent: null,
        screen: "GAP_MAP",
      };
    case "GO_TO":
      return { ...state, screen: action.screen };
    default:
      return state;
  }
}
