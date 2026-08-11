"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDecisionsContext } from "../lib/DecisionsProvider";

export default function DecisionsIndex() {
  const router = useRouter();
  const { decisions, ready, addDecision, renameDecision, commitDecisionName, removeDecision } =
    useDecisionsContext();
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );
  }, []);

  function handleAdd() {
    const id = addDecision();
    router.push(`/decisions/${id}`);
  }

  const hasDecisions = ready && decisions.length > 0;

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead__title">
          <span className="masthead__mark">◎</span>
          <h1>TUNNELS</h1>
        </div>
        <div className="masthead__meta">
          <span className="masthead__label">decision index</span>
          <span className="masthead__date">{today}</span>
        </div>
      </header>

      {hasDecisions && (
        <div className="ledger-head">
          <span>decision</span>
          <span className="ledger-head__progress">bores</span>
        </div>
      )}

      <main className="decisions" aria-live="polite">
        {decisions.map((decision) => {
          const avg = decision.tunnels.length
            ? Math.round(decision.tunnels.reduce((sum, t) => sum + t.fill, 0) / decision.tunnels.length)
            : 0;
          return (
            <article
              key={decision.id}
              className="decision"
              onClick={() => router.push(`/decisions/${decision.id}`)}
            >
              <div className="decision__id">№{String(decision.seq).padStart(2, "0")}</div>
              <input
                className="decision__name"
                value={decision.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => renameDecision(decision.id, e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => commitDecisionName(decision.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                spellCheck={false}
                aria-label="Decision name"
              />
              <div className="decision__stats">
                <span className="decision__count">
                  {decision.tunnels.length} bore{decision.tunnels.length === 1 ? "" : "s"}
                </span>
                <span className="decision__avg">{decision.tunnels.length ? `${avg}% avg` : "—"}</span>
              </div>
              <button
                className="decision__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeDecision(decision.id);
                }}
                aria-label="Delete decision"
                title="Delete decision"
              >
                ×
              </button>
              <span className="decision__open" aria-hidden="true">
                →
              </span>
            </article>
          );
        })}
      </main>

      {ready && !hasDecisions && (
        <p className="empty">
          no decisions yet — press <strong>+</strong> to open one.
        </p>
      )}

      <button className="add-btn" onClick={handleAdd} aria-label="Add new decision">
        <span className="add-btn__plus">+</span>
        <span className="add-btn__text">new decision</span>
      </button>
    </div>
  );
}
