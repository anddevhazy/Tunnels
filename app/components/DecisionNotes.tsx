"use client";

import Link from "next/link";
import { useDecisionsContext } from "../lib/DecisionsProvider";
import { usePersistedTextareaHeight } from "../lib/usePersistedTextareaHeight";

export default function DecisionNotes({ decisionId }: { decisionId: string }) {
  const { decisions, ready, renameDecision, commitDecisionName, updateDecisionNotes } = useDecisionsContext();
  const notesRef = usePersistedTextareaHeight(`decision:${decisionId}`);

  const decision = decisions.find((d) => d.id === decisionId);

  if (ready && !decision) {
    return (
      <div className="page">
        <div className="breadcrumb-row">
          <Link className="breadcrumb" href="/">
            ← decisions
          </Link>
        </div>
        <p className="empty">this decision no longer exists.</p>
      </div>
    );
  }

  if (!decision) return null;

  const concluded = Boolean(decision.concludedAt);

  return (
    <div className="page">
      <div className="breadcrumb-row">
        <Link className="breadcrumb" href={`/decisions/${decisionId}`}>
          ← {decision.name}
        </Link>
      </div>

      <header className="masthead masthead--decision">
        <input
          className="decision-title"
          value={decision.name}
          readOnly={concluded}
          onChange={(e) => renameDecision(decision.id, e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commitDecisionName(decision.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          spellCheck={false}
          aria-label="Decision name"
        />
        {concluded && <span className="decision__stamp">concluded</span>}
        <span className="masthead__label">
          {decision.tunnels.length} bore{decision.tunnels.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="notes">
        <label className="notes__label" htmlFor="decision-notes">
          decision notes
        </label>
        <textarea
          id="decision-notes"
          ref={notesRef}
          className="notes__editor"
          value={decision.notes}
          readOnly={concluded}
          onChange={(e) => updateDecisionNotes(decision.id, e.target.value)}
          placeholder={concluded ? "no decision notes were recorded." : "What's the overall framing here? Record context, constraints, and the eventual call…"}
          spellCheck={!concluded}
        />
      </div>
    </div>
  );
}
