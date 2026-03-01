export interface Session {
  session_id: string;
}

export interface Problem {
  id: string;
  topic: string;
  source_label: string;
  problem_text: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface Rating {
  problem_id: string;
  confidence: 1 | 2 | 3 | 4 | 5;
}

export interface GapItem {
  topic: string;
  score: number;
  frequency: number;
  avg_confidence: number;
  problem_ids: string[];
}

export interface SprintContent {
  explanation: string;
  practice_problems: { text: string; solution: string }[];
}
