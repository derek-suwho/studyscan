"""StudyScan AI — Gemini prompt functions for CS 70 study material."""

import json
import logging
import os

logger = logging.getLogger(__name__)

_use_real_api = False
_genai = None

try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        _genai = genai
        _use_real_api = True
except Exception:
    _use_real_api = False


def _model():
    return _genai.GenerativeModel("gemini-2.5-flash")


# ─── Mock data ─────────────────────────────────────────────────────────────

_MOCK_PROBLEMS = [
    {"id": "1", "topic": "Modular Arithmetic", "problem_text": "(a) Compute 7^{142} mod 11.\n(b) Find all x in {0,1,...,12} satisfying 5x ≡ 3 (mod 13).", "source_label": "Problem 1", "difficulty": "easy"},
    {"id": "2", "topic": "Proof by Induction", "problem_text": "Prove by strong induction that every integer n ≥ 2 can be written as a product of primes.", "source_label": "Problem 2", "difficulty": "medium"},
    {"id": "3", "topic": "Graph Theory", "problem_text": "(a) Prove that if G is a tree, then |E| = n - 1.\n(b) Prove G with n edges contains a cycle.", "source_label": "Problem 3", "difficulty": "medium"},
    {"id": "4", "topic": "Discrete Probability", "problem_text": "(a) P(all same color)?\n(b) P(one of each color)?\n(c) Compute E[X] and Var(X).", "source_label": "Problem 4", "difficulty": "easy"},
    {"id": "5", "topic": "RSA Encryption", "problem_text": "(a) Compute N and φ(N).\n(b) Find d.\n(c) Compute ciphertext.\n(d) Decrypt.", "source_label": "Problem 5", "difficulty": "medium"},
    {"id": "6", "topic": "Counting and Combinatorics", "problem_text": "(a) Arrangements of MISSISSIPPI.\n(b) Committee with at least 2 women.\n(c) Bit strings with no consecutive ones.", "source_label": "Problem 6", "difficulty": "medium"},
]

_MOCK_SPRINT = {
    "explanation": (
        "This topic is fundamental to understanding the material. "
        "The core idea revolves around how quantities change and relate to each other. "
        "Mastering the foundational rules and recognizing common patterns will let you "
        "solve problems faster and more accurately.\n\n"
        "Pay special attention to when and why each technique applies. "
        "Many errors come from misidentifying which rule to use, not from algebraic mistakes."
    ),
    "practice_problems": [
        {"text": "Solve a basic problem applying the core definition.", "solution": "Apply the definition directly and simplify step by step."},
        {"text": "Apply the relevant rule to a composite expression.", "solution": "Identify inner and outer components, apply the rule, then simplify."},
        {"text": "Solve a word problem requiring this concept.", "solution": "Translate to math, apply the technique, interpret the result in context."},
    ],
}


# ─── 4. Calibration note ────────────────────────────────────────────────────

def calibration_note() -> str:
    """System-level note prepended to all prompts."""
    return (
        "CALIBRATION: Students typically overestimate their understanding by one level. "
        "A self-rated 3/5 usually performs like a 2/5 on exams. Adjust your explanations "
        "and problem selection to be slightly more foundational than the stated confidence."
    )


# ─── 1. Parse corpus ────────────────────────────────────────────────────────

_PARSE_FEW_SHOT = """
Example input:
\"\"\"
Problem 3: Graphs (20 points)
Consider a connected undirected graph G = (V, E) with |V| = n vertices.
(a) Prove that if G is a tree, then |E| = n - 1.
(b) Suppose G has exactly n edges. Prove that G contains at least one cycle.
\"\"\"

Example output:
[
  {
    "id": "3",
    "topic": "Graph Theory",
    "problem_text": "Consider a connected undirected graph G = (V, E) with |V| = n vertices.\\n(a) Prove that if G is a tree, then |E| = n - 1.\\n(b) Suppose G has exactly n edges. Prove that G contains at least one cycle.",
    "source_label": "Problem 3",
    "difficulty": "medium"
  }
]

Example input:
\"\"\"
Problem 1: Modular Arithmetic (15 points)
(a) Compute 7^{142} mod 11.
(b) Find all x in {0,1,...,12} satisfying 5x ≡ 3 (mod 13).
\"\"\"

Example output:
[
  {
    "id": "1",
    "topic": "Modular Arithmetic",
    "problem_text": "(a) Compute 7^{142} mod 11.\\n(b) Find all x in {0,1,...,12} satisfying 5x ≡ 3 (mod 13).",
    "source_label": "Problem 1",
    "difficulty": "easy"
  }
]
"""


def parse_corpus(raw_text: str) -> list[dict]:
    """Parse raw PDF/text into structured problem list via Gemini."""
    if not _use_real_api:
        logger.info("No API key — returning mock problems")
        return _MOCK_PROBLEMS

    try:
        prompt = f"""{calibration_note()}

You are a CS 70 course assistant. Parse the following exam/worksheet text into a JSON array of problems.

Rules:
- Each problem gets one entry. Sub-parts (a), (b), (c) stay together in one problem.
- Skip headers, instructions, page numbers, and any non-problem text.
- Assign a short topic label (e.g. "Modular Arithmetic", "Proof by Induction", "Graph Theory", "Discrete Probability", "RSA Encryption", "Counting and Combinatorics", "Conditional Probability", "Graph Coloring").
- Assign difficulty: "easy" for computation/direct application, "medium" for proofs and multi-step, "hard" for novel/tricky.
- The "id" should be the problem number as a string.
- The "source_label" should be like "Problem 1" or "Problem 3".

{_PARSE_FEW_SHOT}

Now parse this text:
\"\"\"
{raw_text}
\"\"\"

Return ONLY a JSON array of objects with keys: id, topic, problem_text, source_label, difficulty."""

        resp = _model().generate_content(
            prompt,
            generation_config=_genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        problems = json.loads(resp.text)
        valid = []
        required_keys = {"id", "topic", "problem_text", "source_label", "difficulty"}
        for p in problems:
            if isinstance(p, dict) and required_keys.issubset(p.keys()):
                if p["difficulty"] not in ("easy", "medium", "hard"):
                    p["difficulty"] = "medium"
                valid.append(p)
        return valid
    except Exception as e:
        logger.warning("parse_corpus API call failed: %s — returning mocks", e)
        return _MOCK_PROBLEMS


# ─── 2. Select diagnostic ───────────────────────────────────────────────────

def select_diagnostic(problems: list[dict], n: int = 12) -> list[dict]:
    """Select n problems maximizing topic coverage, good ordering."""
    if not _use_real_api:
        logger.info("No API key — returning first %d problems as diagnostic", n)
        return problems[:n]

    try:
        problems_json = json.dumps(problems, indent=2)
        prompt = f"""{calibration_note()}

You are a CS 70 course assistant selecting a diagnostic quiz.

Given the problem bank below, select exactly {n} problems (or all if fewer than {n} exist).

Selection criteria:
1. Maximize topic coverage — pick from as many distinct topics as possible.
2. Prefer representative problems over the hardest ones.
3. Mix difficulties: aim for ~40% easy, ~40% medium, ~20% hard.
4. Order the output to interleave topics (don't cluster same-topic problems).

Problem bank:
{problems_json}

Return a JSON array of the selected problem objects (same schema as input). Keep all original fields unchanged."""

        resp = _model().generate_content(
            prompt,
            generation_config=_genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        selected = json.loads(resp.text)
        valid = []
        required_keys = {"id", "topic", "problem_text", "source_label", "difficulty"}
        for p in selected:
            if isinstance(p, dict) and required_keys.issubset(p.keys()):
                valid.append(p)
        return valid[:n]
    except Exception as e:
        logger.warning("select_diagnostic API call failed: %s — returning first %d", e, n)
        return problems[:n]


# ─── 3. Generate sprint ─────────────────────────────────────────────────────

def generate_sprint(topic: str, problems: list[dict], confidence: int) -> dict:
    """Generate a Study Sprint for a topic at a given confidence level."""
    if not _use_real_api:
        logger.info("No API key — returning mock sprint")
        return _MOCK_SPRINT

    try:
        if confidence <= 2:
            depth = "Start from scratch. Assume the student has forgotten the basics. Define key terms, state core theorems, and build up from fundamentals."
        elif confidence == 3:
            depth = "Reinforce fundamentals. The student has seen this before but is shaky. Focus on the most common exam patterns and where students typically make mistakes."
        else:
            depth = "Focus on tricky edge cases and advanced applications. The student knows the basics — drill the subtle gotchas that cost points on exams."

        problems_json = json.dumps(problems, indent=2)
        prompt = f"""{calibration_note()}

You are a Berkeley TA with 10 minutes. Be concise, exam-focused, no fluff.

Topic: {topic}
Student confidence: {confidence}/5

Depth instruction: {depth}

Available problems from their course materials:
{problems_json}

Generate a Study Sprint as a JSON object:
{{
  "explanation": "<concise conceptual review tailored to the confidence level, with key formulas and exam tips>",
  "practice_problems": [
    {{
      "text": "<problem statement — pick 2-3 from the provided list or adapt them>",
      "solution": "<clean, step-by-step worked solution>"
    }}
  ]
}}

The explanation should be 150-300 words. Solutions should be thorough but not verbose."""

        resp = _model().generate_content(
            prompt,
            generation_config=_genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        sprint = json.loads(resp.text)
        if "explanation" not in sprint:
            sprint["explanation"] = ""
        if "practice_problems" not in sprint:
            sprint["practice_problems"] = []
        for pp in sprint["practice_problems"]:
            if "text" not in pp:
                pp["text"] = ""
            if "solution" not in pp:
                pp["solution"] = ""
        return sprint
    except Exception as e:
        logger.warning("generate_sprint API call failed: %s — returning mock", e)
        return _MOCK_SPRINT
