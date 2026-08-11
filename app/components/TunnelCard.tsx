"use client";

import Link from "next/link";
import { statusFor, type Tunnel } from "../lib/useDecisions";

// Horizontal scatter (px) and stagger (s) for each falling grain of the
// breakthrough spill — spread out so they don't all drop as one clump.
const SPILL_PARTICLES = [
  { dx: -11, delay: 0 },
  { dx: -3, delay: 0.09 },
  { dx: 6, delay: 0.17 },
  { dx: -7, delay: 0.27 },
  { dx: 2, delay: 0.36 },
  { dx: 10, delay: 0.44 },
  { dx: -4, delay: 0.55 },
  { dx: 4, delay: 0.65 },
];

export default function TunnelCard({
  decisionId,
  tunnel,
  locked = false,
  onFill,
  onRename,
  onCommitName,
  onRemove,
}: {
  decisionId: string;
  tunnel: Tunnel;
  locked?: boolean;
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
          readOnly={locked}
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
        {!locked && (
          <button className="tunnel__remove" aria-label="Remove tunnel" title="Abandon bore" onClick={onRemove}>
            ×
          </button>
        )}
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
          disabled={locked}
          onChange={(e) => onFill(Number(e.target.value))}
          aria-label="Tunnel advance percentage"
        />
      </div>

      <div className="tunnel__foot">
        <span className="tunnel__foot-start">0m</span>
        <span className="tunnel__foot-status">{statusFor(tunnel.fill)}</span>
        <span className="tunnel__foot-end">100m</span>
      </div>

      <div className="tunnel__bottom">
        <Link className="tunnel__notes-link" href={`/decisions/${decisionId}/bores/${tunnel.id}`}>
          {tunnel.notes.trim() ? "field notes →" : locked ? "field notes →" : "+ add field notes"}
        </Link>

        {tunnel.fill >= 100 && (
          <div className="tunnel__spill" aria-hidden="true">
            {SPILL_PARTICLES.map((p, i) => (
              <div
                key={i}
                className="tunnel__spill-particle"
                style={{ "--dx": `${p.dx}px`, "--delay": `${p.delay}s` } as React.CSSProperties}
              />
            ))}
            <div className="tunnel__spill-heap tunnel__spill-heap--base" />
            <div className="tunnel__spill-heap tunnel__spill-heap--peak" />
          </div>
        )}
      </div>
    </article>
  );
}
