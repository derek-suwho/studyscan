from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.session_store import create_session, get_session, update_session
from backend.pdf_parser import extract_text
from backend.gap_scorer import compute_gap_map
from ai.prompts import parse_corpus, select_diagnostic, generate_sprint

app = FastAPI(title="StudyScan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _require_session(session_id: str) -> dict:
    s = get_session(session_id)
    if s is None:
        raise HTTPException(404, "session not found")
    return s


# ── Models ──────────────────────────────────────────────────

class CreateSessionBody(BaseModel):
    course_name: str = ""
    exam_date: str = ""

class Rating(BaseModel):
    problem_id: str
    confidence: int  # 1-5

class RatingsBody(BaseModel):
    ratings: list[Rating]

class RerateBody(BaseModel):
    topic: str
    confidence: int  # 1-5


# ── Endpoints ───────────────────────────────────────────────

@app.post("/sessions")
def new_session(body: CreateSessionBody):
    sid = create_session(body.course_name, body.exam_date)
    return {"session_id": sid}


@app.post("/sessions/{session_id}/upload")
async def upload_files(session_id: str, files: list[UploadFile] = File(...)):
    session = _require_session(session_id)
    total_chars = 0
    for f in files:
        pdf_bytes = await f.read()
        try:
            text = extract_text(pdf_bytes)
        except Exception:
            continue
        if text.strip():
            session["raw_texts"].append(text)
            total_chars += len(text)
    if total_chars == 0:
        raise HTTPException(400, "could not extract text from any PDF")
    return {"files_processed": len(files), "total_chars": total_chars}


@app.get("/sessions/{session_id}/diagnostic")
def get_diagnostic(session_id: str):
    session = _require_session(session_id)

    if not session["problems"]:
        raw = "\n".join(session["raw_texts"])
        if not raw.strip():
            raise HTTPException(400, "no PDF uploaded yet")
        problems = parse_corpus(raw)
        update_session(session_id, {"problems": problems})
    else:
        problems = session["problems"]

    if not session["diagnostic"]:
        diagnostic = select_diagnostic(problems)
        update_session(session_id, {"diagnostic": diagnostic})
    else:
        diagnostic = session["diagnostic"]

    return diagnostic


@app.post("/sessions/{session_id}/ratings")
def submit_ratings(session_id: str, body: RatingsBody):
    session = _require_session(session_id)
    if not session["problems"]:
        raise HTTPException(400, "run diagnostic first")

    ratings = {r.problem_id: r.confidence for r in body.ratings}
    gap_map = compute_gap_map(session["problems"], ratings)
    update_session(session_id, {"ratings": ratings, "gap_map": gap_map})
    return gap_map


@app.get("/sessions/{session_id}/sprint")
def get_sprint(session_id: str, topic: str = Query(...)):
    session = _require_session(session_id)

    # verify topic exists in gap map
    topics_lower = {g["topic"].lower(): g for g in session["gap_map"]}
    if topic.lower() not in topics_lower:
        raise HTTPException(404, f"topic '{topic}' not found in gap map")

    entry = topics_lower[topic.lower()]
    # get problems for this topic
    topic_problems = [p for p in session["problems"] if p["topic"].lower() == topic.lower()]
    avg_conf = entry["avg_confidence"]
    confidence = max(1, min(5, round(avg_conf)))

    sprint = generate_sprint(topic, topic_problems, confidence)
    return sprint


@app.post("/sessions/{session_id}/sprint/rerate")
def rerate_topic(session_id: str, body: RerateBody):
    session = _require_session(session_id)

    # find matching gap entry
    entry = None
    for g in session["gap_map"]:
        if g["topic"].lower() == body.topic.lower():
            entry = g
            break
    if not entry:
        raise HTTPException(404, f"topic '{body.topic}' not found in gap map")

    # update ratings for all problems in this topic
    for pid in entry["problem_ids"]:
        session["ratings"][pid] = body.confidence

    gap_map = compute_gap_map(session["problems"], session["ratings"])
    update_session(session_id, {"gap_map": gap_map})
    return gap_map
