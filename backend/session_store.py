import uuid
from typing import Any

_sessions: dict[str, dict[str, Any]] = {}


def create_session(course_name: str = "", exam_date: str = "") -> str:
    sid = str(uuid.uuid4())
    _sessions[sid] = {
        "course_name": course_name,
        "exam_date": exam_date,
        "raw_texts": [],
        "problems": [],
        "diagnostic": [],
        "ratings": {},
        "gap_map": [],
    }
    return sid


def get_session(session_id: str) -> dict[str, Any] | None:
    return _sessions.get(session_id)


def update_session(session_id: str, data: dict[str, Any]):
    if session_id in _sessions:
        _sessions[session_id].update(data)
