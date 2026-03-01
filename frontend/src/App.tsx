import { useReducer, useCallback } from "react";
import { sessionReducer, getDevInitialState } from "./store/sessionStore";
import {
  createSession,
  uploadFiles,
  getDiagnostic,
  submitRatings,
  getSprint,
  rerateTopicSprint,
} from "./api";
import type { Rating } from "./types";

import UploadScreen from "./components/UploadScreen";
import DiagnosticScreen from "./components/DiagnosticScreen";
import GapMapScreen from "./components/GapMapScreen";
import SprintScreen from "./components/SprintScreen";

export default function App() {
  const [state, dispatch] = useReducer(sessionReducer, undefined, getDevInitialState);

  // ── Upload flow ────────────────────────────────────────

  const handleUpload = useCallback(
    async (files: File[], courseName: string, examDate: string) => {
      dispatch({ type: "SET_LOADING", loading: true });
      try {
        const session = await createSession(courseName, examDate);
        dispatch({
          type: "SET_SESSION",
          sessionId: session.session_id,
          courseName,
          examDate,
        });
        await uploadFiles(session.session_id, files);
        const problems = await getDiagnostic(session.session_id);
        dispatch({ type: "SET_PROBLEMS", problems });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    []
  );

  // ── Diagnostic flow ────────────────────────────────────

  const pendingRatings: Rating[] = [];

  const handleRate = useCallback(
    async (problemId: string, confidence: 1 | 2 | 3 | 4 | 5) => {
      const rating: Rating = { problem_id: problemId, confidence };
      dispatch({ type: "ADD_RATING", rating });
      pendingRatings.push(rating);

      // If all problems rated, submit
      const totalAfter = state.ratings.length + 1;
      if (totalAfter >= state.problems.length) {
        dispatch({ type: "SET_LOADING", loading: true });
        try {
          const allRatings = [...state.ratings, rating];
          const gaps = await submitRatings(state.sessionId!, allRatings);
          dispatch({ type: "SET_GAPS", gaps });
        } finally {
          dispatch({ type: "SET_LOADING", loading: false });
        }
      }
    },
    [state.ratings, state.problems.length, state.sessionId]
  );

  // ── Sprint flow ────────────────────────────────────────

  const handleSelectTopic = useCallback(
    async (topic: string) => {
      dispatch({ type: "SET_LOADING", loading: true });
      try {
        const content = await getSprint(state.sessionId!, topic);
        dispatch({ type: "START_SPRINT", topic, content });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [state.sessionId]
  );

  const handleRerate = useCallback(
    async (confidence: 1 | 2 | 3 | 4 | 5) => {
      dispatch({ type: "SET_LOADING", loading: true });
      try {
        const gaps = await rerateTopicSprint(
          state.sessionId!,
          state.activeTopic!,
          confidence
        );
        dispatch({ type: "RETURN_TO_GAPS", gaps });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [state.sessionId, state.activeTopic]
  );

  const handleBackToGaps = useCallback(() => {
    dispatch({ type: "GO_TO", screen: "GAP_MAP" });
  }, []);

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-16 pt-12">
      {state.screen === "UPLOAD" && (
        <UploadScreen loading={state.loading} onSubmit={handleUpload} />
      )}
      {state.screen === "DIAGNOSTIC" && (
        <DiagnosticScreen
          problems={state.problems}
          ratings={state.ratings}
          onRate={handleRate}
        />
      )}
      {state.screen === "GAP_MAP" && (
        <GapMapScreen
          gaps={state.gaps}
          courseName={state.courseName}
          onSelectTopic={handleSelectTopic}
        />
      )}
      {state.screen === "SPRINT" && state.sprintContent && (
        <SprintScreen
          topic={state.activeTopic!}
          content={state.sprintContent}
          loading={state.loading}
          onRerate={handleRerate}
          onBack={handleBackToGaps}
        />
      )}
    </div>
  );
}
