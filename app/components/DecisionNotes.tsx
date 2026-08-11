"use client";

import Link from "next/link";
import { useDecisionsContext } from "../lib/DecisionsProvider";

export default function DecisionNotes({ decisionId }: { decisionId: string }) {
  const { decisions, ready, renameDecision, commitDecisionName, updateDecisionNotes } = useDecisionsContext();

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
  const avg = decision.tunnels.length
    ? Math.round(decision.tunnels.reduce((sum, t) => sum + t.fill, 0) / decision.tunnels.length)
    : 0;

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
          {decision.tunnels.length ? ` · ${avg}% avg` : ""}
        </span>
      </header>

      <div className="notes">
        <label className="notes__label" htmlFor="decision-notes">
          decision notes
        </label>
        <textarea
          id="decision-notes"
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
