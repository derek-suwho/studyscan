from collections import defaultdict


def compute_gap_map(problems: list[dict], ratings: dict[str, int]) -> list[dict]:
    """
    score = frequency_weight × (6 - avg_confidence), normalized to 0-1.
    """
    topic_problems: dict[str, list[dict]] = defaultdict(list)
    for p in problems:
        topic_problems[p["topic"]].append(p)

    gap_map = []
    for topic, probs in topic_problems.items():
        confidences = [ratings.get(p["id"], 3) for p in probs]
        freq = len(probs)
        avg_conf = sum(confidences) / len(confidences)
        score = freq * (6 - avg_conf)
        gap_map.append({
            "topic": topic,
            "score": score,
            "frequency": freq,
            "avg_confidence": round(avg_conf, 2),
            "problem_ids": [p["id"] for p in probs],
        })

    gap_map.sort(key=lambda x: x["score"], reverse=True)

    # normalize scores to 0-1
    max_score = gap_map[0]["score"] if gap_map else 1
    if max_score == 0:
        max_score = 1
    for g in gap_map:
        g["score"] = round(g["score"] / max_score, 2)

    return gap_map
