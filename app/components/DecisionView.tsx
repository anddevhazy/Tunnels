"use client";

import { useState } from "react";
import Link from "next/link";
import { useDecisionsContext } from "../lib/DecisionsProvider";
import TunnelCard from "./TunnelCard";

export default function DecisionView({ id }: { id: string }) {
  const {
    decisions,
    ready,
    addTunnel,
    updateTunnelFill,
    renameTunnel,
    commitTunnelName,
    removeTunnel,
    renameDecision,
    commitDecisionName,
    concludeDecision,
  } = useDecisionsContext();
  const [confirming, setConfirming] = useState(false);

  const decision = decisions.find((d) => d.id === id);

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

  const hasTunnels = decision.tunnels.length > 0;
  const concluded = Boolean(decision.concludedAt);
  const concludedDate = decision.concludedAt
    ? new Date(decision.concludedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : null;

  return (
    <div className="page">
      <div className="breadcrumb-row">
        <Link className="breadcrumb" href="/">
          ← decisions
        </Link>
        <Link className="breadcrumb breadcrumb--notes" href={`/decisions/${decision.id}/notes`}>
          {decision.notes.trim() ? "decision notes →" : "+ add decision notes"}
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
        {concluded ? (
          <span className="decision__stamp decision__stamp--large">concluded {concludedDate}</span>
        ) : (
          <span className="masthead__label">survey log</span>
        )}
      </header>

      {hasTunnels && (
        <div className="ledger-head">
          <span>bore</span>
          <span className="ledger-head__progress">advance</span>
        </div>
      )}

      <main className="tunnels" aria-live="polite">
        {decision.tunnels.map((tunnel) => (
          <TunnelCard
            key={tunnel.id}
            decisionId={decision.id}
            tunnel={tunnel}
            locked={concluded}
            onFill={(fill) => updateTunnelFill(decision.id, tunnel.id, fill)}
            onRename={(name) => renameTunnel(decision.id, tunnel.id, name)}
            onCommitName={(name) => commitTunnelName(decision.id, tunnel.id, name)}
            onRemove={() => removeTunnel(decision.id, tunnel.id)}
          />
        ))}
      </main>

      {!hasTunnels && (
        <p className="empty">
          {concluded ? "no bores were dug for this decision." : (
            <>no active bores — press <strong>+</strong> to start one.</>
          )}
        </p>
      )}

      {!concluded && (
        <button className="add-btn" onClick={() => addTunnel(decision.id)} aria-label="Add new tunnel">
          <span className="add-btn__plus">+</span>
          <span className="add-btn__text">new bore</span>
        </button>
      )}

      {!concluded && (
        <div className="conclude">
          {confirming ? (
            <div className="conclude__confirm">
              <span className="conclude__warning">
                Concluding is permanent — this decision and its bores become view-only forever.
              </span>
              <div className="conclude__actions">
                <button className="conclude__cancel" onClick={() => setConfirming(false)}>
                  cancel
                </button>
                <button
                  className="conclude__confirm-btn"
                  onClick={() => {
                    concludeDecision(decision.id);
                    setConfirming(false);
                  }}
                >
                  yes, conclude
                </button>
              </div>
            </div>
          ) : (
            <button className="conclude__btn" onClick={() => setConfirming(true)}>
              conclude decision
            </button>
          )}
        </div>
      )}
    </div>
  );
}
