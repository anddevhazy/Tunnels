"use client";

import Link from "next/link";
import { statusFor, type Tunnel } from "../lib/useDecisions";

export default function TunnelCard({
  decisionId,
  tunnel,
  onFill,
  onRename,
  onCommitName,
  onRemove,
}: {
  decisionId: string;
  tunnel: Tunnel;
  onFill: (fill: number) => void;
  onRename: (name: string) => void;
  onCommitName: (name: string) => void;
  onRemove: () => void;
}) {
  return (
    <article className="tunnel">
      <div className="tunnel__row">
        <div className="tunnel__id">№{String(tunnel.seq).padStart(2, "0")}</div>
        <input
          className="tunnel__name"
          value={tunnel.name}
          onChange={(e) => onRename(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => onCommitName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          spellCheck={false}
          aria-label="Tunnel name"
        />
        <div className="tunnel__pct">
          <span className="tunnel__pct-num">{tunnel.fill}</span>
          <span className="tunnel__pct-sign">%</span>
        </div>
        <button className="tunnel__remove" aria-label="Remove tunnel" title="Abandon bore" onClick={onRemove}>
          ×
        </button>
      </div>

      <div className="shaft">
        <div className="shaft__ruler" />
        <div className="shaft__bore" style={{ "--fill": `${tunnel.fill}%` } as React.CSSProperties}>
          <div className="shaft__fill">
            <div className="shaft__head" />
          </div>
        </div>
        <input
          className="shaft__slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={tunnel.fill}
          onChange={(e) => onFill(Number(e.target.value))}
          aria-label="Tunnel advance percentage"
        />
      </div>

      <div className="tunnel__foot">
        <span className="tunnel__foot-start">0m</span>
        <span className="tunnel__foot-status">{statusFor(tunnel.fill)}</span>
        <span className="tunnel__foot-end">100m</span>
      </div>

      <Link className="tunnel__notes-link" href={`/decisions/${decisionId}/bores/${tunnel.id}`}>
        {tunnel.notes.trim() ? "field notes →" : "+ add field notes"}
      </Link>
    </article>
  );
}
