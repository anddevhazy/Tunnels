"use client";

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
  } = useDecisionsContext();

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

  return (
    <div className="page">
      <div className="breadcrumb-row">
        <Link className="breadcrumb" href="/">
          ← decisions
        </Link>
      </div>

      <header className="masthead masthead--decision">
        <input
          className="decision-title"
          value={decision.name}
          onChange={(e) => renameDecision(decision.id, e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commitDecisionName(decision.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          spellCheck={false}
          aria-label="Decision name"
        />
        <span className="masthead__label">survey log</span>
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
            onFill={(fill) => updateTunnelFill(decision.id, tunnel.id, fill)}
            onRename={(name) => renameTunnel(decision.id, tunnel.id, name)}
            onCommitName={(name) => commitTunnelName(decision.id, tunnel.id, name)}
            onRemove={() => removeTunnel(decision.id, tunnel.id)}
          />
        ))}
      </main>

      {!hasTunnels && (
        <p className="empty">
          no active bores — press <strong>+</strong> to start one.
        </p>
      )}

      <button className="add-btn" onClick={() => addTunnel(decision.id)} aria-label="Add new tunnel">
        <span className="add-btn__plus">+</span>
        <span className="add-btn__text">new bore</span>
      </button>
    </div>
  );
}
