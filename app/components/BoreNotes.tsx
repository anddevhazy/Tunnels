"use client";

import Link from "next/link";
import { useDecisionsContext } from "../lib/DecisionsProvider";
import { statusFor } from "../lib/useDecisions";

export default function BoreNotes({ decisionId, tunnelId }: { decisionId: string; tunnelId: string }) {
  const { decisions, ready, renameTunnel, commitTunnelName, updateTunnelNotes } = useDecisionsContext();

  const decision = decisions.find((d) => d.id === decisionId);
  const tunnel = decision?.tunnels.find((t) => t.id === tunnelId);

  if (ready && (!decision || !tunnel)) {
    return (
      <div className="page">
        <div className="breadcrumb-row">
          <Link className="breadcrumb" href={decision ? `/decisions/${decisionId}` : "/"}>
            ← {decision ? decision.name : "decisions"}
          </Link>
        </div>
        <p className="empty">this bore no longer exists.</p>
      </div>
    );
  }

  if (!decision || !tunnel) return null;

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
          value={tunnel.name}
          onChange={(e) => renameTunnel(decisionId, tunnelId, e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commitTunnelName(decisionId, tunnelId, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          spellCheck={false}
          aria-label="Bore name"
        />
        <div className="tunnel__pct tunnel__pct--static">
          <span className="tunnel__pct-num">{tunnel.fill}</span>
          <span className="tunnel__pct-sign">%</span>
        </div>
      </header>

      <div className="shaft shaft--static">
        <div className="shaft__ruler" />
        <div
          className="shaft__bore"
          data-full={tunnel.fill >= 100 ? "true" : "false"}
          style={{ "--fill": `${tunnel.fill}%` } as React.CSSProperties}
        >
          <div className="shaft__fill">
            <div className="shaft__head" />
          </div>
        </div>
      </div>
      <div className="tunnel__foot">
        <span className="tunnel__foot-start">0m</span>
        <span className="tunnel__foot-status">{statusFor(tunnel.fill)}</span>
        <span className="tunnel__foot-end">100m</span>
      </div>

      <div className="notes">
        <label className="notes__label" htmlFor="bore-notes">
          field notes
        </label>
        <textarea
          id="bore-notes"
          className="notes__editor"
          value={tunnel.notes}
          onChange={(e) => updateTunnelNotes(decisionId, tunnelId, e.target.value)}
          placeholder="What's driving this bore's advance? Record findings, blockers, next steps…"
          spellCheck={true}
        />
      </div>
    </div>
  );
}
