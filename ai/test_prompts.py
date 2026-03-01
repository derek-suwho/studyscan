"""End-to-end test for StudyScan AI prompts.

Run from project root: PYTHONPATH=. python ai/test_prompts.py
Skips live Gemini calls if GEMINI_API_KEY is not set.
"""

import json
import os
import sys
from pathlib import Path
from collections import Counter

SAMPLE_DIR = Path(__file__).parent / "sample_data"

# ─── Mock data for offline testing ───────────────────────────────────────────

MOCK_PARSED_EXAM = [
    {"id": "1", "topic": "Modular Arithmetic", "problem_text": "(a) Compute 7^{142} mod 11.\n(b) Find all x in {0,1,...,12} satisfying 5x ≡ 3 (mod 13).\n(c) Prove Fermat's Little Theorem.", "source_label": "Problem 1", "difficulty": "easy"},
    {"id": "2", "topic": "Proof by Induction", "problem_text": "Prove by strong induction that every integer n ≥ 2 can be written as a product of primes.", "source_label": "Problem 2", "difficulty": "medium"},
    {"id": "3", "topic": "Graph Theory", "problem_text": "(a) Prove that if G is a tree, then |E| = n - 1.\n(b) Prove G with n edges contains a cycle.\n(c) Prove Eulerian path condition.", "source_label": "Problem 3", "difficulty": "medium"},
    {"id": "4", "topic": "Discrete Probability", "problem_text": "(a) P(all same color)?\n(b) P(one of each color)?\n(c) Compute E[X] and Var(X).", "source_label": "Problem 4", "difficulty": "easy"},
    {"id": "5", "topic": "RSA Encryption", "problem_text": "(a) Compute N and φ(N).\n(b) Find d.\n(c) Compute ciphertext.\n(d) Decrypt.", "source_label": "Problem 5", "difficulty": "medium"},
    {"id": "6", "topic": "Counting and Combinatorics", "problem_text": "(a) Arrangements of MISSISSIPPI.\n(b) Committee with at least 2 women.\n(c) Bit strings with no consecutive ones.", "source_label": "Problem 6", "difficulty": "medium"},
]

MOCK_PARSED_DISCUSSION = [
    {"id": "1", "topic": "Modular Arithmetic", "problem_text": "(a) Find inverse of 7 mod 15.\n(b) Solve CRT system.\n(c) List solutions in {0,...,104}.", "source_label": "Problem 1", "difficulty": "easy"},
    {"id": "2", "topic": "Graph Coloring", "problem_text": "(a) Chromatic number of K_{3,3}.\n(b) Is K_{3,3} planar?\n(c) Can G with 8 vertices, 13 edges be planar?", "source_label": "Problem 2", "difficulty": "medium"},
    {"id": "3", "topic": "Conditional Probability", "problem_text": "(a) Bayes' theorem calculation.\n(b) Two positive tests.\n(c) Intuitive explanation.", "source_label": "Problem 3", "difficulty": "medium"},
    {"id": "4", "topic": "Counting and Combinatorics", "problem_text": "(a) 8 books, A and B adjacent.\n(b) Surjective functions via inclusion-exclusion.\n(c) Stars and bars.", "source_label": "Problem 4", "difficulty": "easy"},
]

MOCK_SPRINT = {
    "explanation": "Modular arithmetic is about computing remainders. Key tools: (1) Fermat's Little Theorem: a^{p-1} ≡ 1 mod p for prime p, gcd(a,p)=1. (2) Extended Euclidean Algorithm for inverses. (3) CRT: if gcd(m,n)=1, system x≡a(mod m), x≡b(mod n) has unique solution mod mn. Exam tips: reduce exponents using FLT before computing. Always check gcd before claiming an inverse exists.",
    "practice_problems": [
        {
            "text": "Compute 7^{142} mod 11.",
            "solution": "By FLT, 7^{10} ≡ 1 (mod 11). 142 = 14·10 + 2, so 7^{142} = (7^{10})^{14} · 7^2 ≡ 1^{14} · 49 ≡ 49 mod 11 = 5."
        },
        {
            "text": "Find the inverse of 7 modulo 15 using the extended Euclidean algorithm.",
            "solution": "15 = 2·7 + 1, so 1 = 15 - 2·7. Thus 7^{-1} ≡ -2 ≡ 13 (mod 15). Check: 7·13 = 91 = 6·15 + 1 ✓."
        },
    ],
}


# ─── Validation helpers ──────────────────────────────────────────────────────

PROBLEM_KEYS = {"id", "topic", "problem_text", "source_label", "difficulty"}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}


def validate_problems(problems: list[dict], label: str):
    assert isinstance(problems, list), f"{label}: expected list, got {type(problems)}"
    assert len(problems) > 0, f"{label}: empty list"
    for i, p in enumerate(problems):
        assert isinstance(p, dict), f"{label}[{i}]: expected dict"
        missing = PROBLEM_KEYS - p.keys()
        assert not missing, f"{label}[{i}]: missing keys {missing}"
        assert isinstance(p["id"], str), f"{label}[{i}]: id should be str"
        assert isinstance(p["topic"], str), f"{label}[{i}]: topic should be str"
        assert isinstance(p["problem_text"], str), f"{label}[{i}]: problem_text should be str"
        assert p["difficulty"] in VALID_DIFFICULTIES, f"{label}[{i}]: bad difficulty '{p['difficulty']}'"


def validate_sprint(sprint: dict, label: str):
    assert isinstance(sprint, dict), f"{label}: expected dict"
    assert "explanation" in sprint, f"{label}: missing 'explanation'"
    assert isinstance(sprint["explanation"], str), f"{label}: explanation should be str"
    assert len(sprint["explanation"]) > 50, f"{label}: explanation too short"
    assert "practice_problems" in sprint, f"{label}: missing 'practice_problems'"
    pps = sprint["practice_problems"]
    assert isinstance(pps, list), f"{label}: practice_problems should be list"
    assert len(pps) >= 1, f"{label}: need at least 1 practice problem"
    for i, pp in enumerate(pps):
        assert "text" in pp, f"{label}.practice_problems[{i}]: missing 'text'"
        assert "solution" in pp, f"{label}.practice_problems[{i}]: missing 'solution'"


# ─── Main test ───────────────────────────────────────────────────────────────

def main():
    from ai.prompts import parse_corpus, select_diagnostic, generate_sprint, calibration_note

    api_key = os.environ.get("GEMINI_API_KEY", "")
    live = bool(api_key)

    if live:
        print("=== LIVE MODE (Gemini API) ===\n")
    else:
        print("=== MOCK MODE (no GEMINI_API_KEY) ===\n")

    # ── Load sample data ──
    exam_text = (SAMPLE_DIR / "sample_exam.txt").read_text()
    disc_text = (SAMPLE_DIR / "sample_discussion.txt").read_text()
    print(f"Loaded sample_exam.txt ({len(exam_text)} chars)")
    print(f"Loaded sample_discussion.txt ({len(disc_text)} chars)\n")

    # ── 1. parse_corpus ──
    print("─── parse_corpus ───────────────────────")
    if live:
        exam_problems = parse_corpus(exam_text)
        disc_problems = parse_corpus(disc_text)
    else:
        exam_problems = MOCK_PARSED_EXAM
        disc_problems = MOCK_PARSED_DISCUSSION

    validate_problems(exam_problems, "exam")
    validate_problems(disc_problems, "discussion")
    print(f"Exam: {len(exam_problems)} problems parsed")
    for p in exam_problems:
        print(f"  [{p['difficulty']:6s}] {p['source_label']}: {p['topic']}")
    print(f"Discussion: {len(disc_problems)} problems parsed")
    for p in disc_problems:
        print(f"  [{p['difficulty']:6s}] {p['source_label']}: {p['topic']}")
    print()

    # ── 2. select_diagnostic ──
    print("─── select_diagnostic ──────────────────")
    combined = exam_problems + disc_problems
    if live:
        diagnostic = select_diagnostic(combined, n=12)
    else:
        diagnostic = combined[:12]

    validate_problems(diagnostic, "diagnostic")
    assert len(diagnostic) <= 12, "diagnostic should have ≤12 problems"
    topics_covered = set(p["topic"] for p in diagnostic)
    print(f"Selected {len(diagnostic)} problems covering {len(topics_covered)} topics:")
    for p in diagnostic:
        print(f"  {p['source_label']} — {p['topic']} ({p['difficulty']})")
    print()

    # ── 3. Find topic with most problems ──
    topic_counts = Counter(p["topic"] for p in combined)
    top_topic = topic_counts.most_common(1)[0][0]
    top_topic_problems = [p for p in combined if p["topic"] == top_topic]
    print(f"─── generate_sprint (topic='{top_topic}', confidence=2) ──")

    if live:
        sprint = generate_sprint(top_topic, top_topic_problems, confidence=2)
    else:
        sprint = MOCK_SPRINT

    validate_sprint(sprint, "sprint")
    print(f"Explanation ({len(sprint['explanation'])} chars):")
    print(f"  {sprint['explanation'][:200]}...")
    print(f"Practice problems: {len(sprint['practice_problems'])}")
    for i, pp in enumerate(sprint["practice_problems"]):
        print(f"  [{i+1}] {pp['text'][:80]}...")
        print(f"      Solution: {pp['solution'][:80]}...")
    print()

    # ── 4. calibration_note ──
    print("─── calibration_note ───────────────────")
    note = calibration_note()
    assert isinstance(note, str)
    assert len(note) > 20
    print(f"  {note}\n")

    # ── Summary ──
    print("═══ ALL ASSERTIONS PASSED ═══")
    return 0


if __name__ == "__main__":
    sys.exit(main())
