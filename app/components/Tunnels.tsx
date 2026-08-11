"use client";

import { useEffect, useRef, useState } from "react";

type Tunnel = {
  id: string;
  seq: number;
  name: string;
  fill: number;
};

const STORAGE_KEY = "tunnels.log";

function statusFor(pct: number) {
  if (pct <= 0) return "staged";
  if (pct >= 100) return "breakthrough";
  return "boring";
}

function makeTunnel(seq: number): Tunnel {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    seq,
    name: "BORE-" + String(seq).padStart(2, "0"),
    fill: 0,
  };
}

export default function Tunnels() {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [today, setToday] = useState("");
  const loaded = useRef(false);
  const nextSeq = useRef(1);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setTunnels(parsed);
        nextSeq.current = parsed.reduce((max: number, t: Tunnel) => Math.max(max, t.seq || 0), 0) + 1;
      }
    } catch {
      // ignore malformed storage
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tunnels));
  }, [tunnels]);

  function addTunnel() {
    const tunnel = makeTunnel(nextSeq.current++);
    setTunnels((prev) => [...prev, tunnel]);
  }

  function updateFill(id: string, fill: number) {
    setTunnels((prev) => prev.map((t) => (t.id === id ? { ...t, fill } : t)));
  }

  function renameTunnel(id: string, name: string) {
    setTunnels((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  function commitTunnelName(id: string, name: string) {
    setTunnels((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: name.trim() || t.name } : t))
    );
  }

  function removeTunnel(id: string) {
    setTunnels((prev) => prev.filter((t) => t.id !== id));
  }

  const hasTunnels = tunnels.length > 0;

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead__title">
          <span className="masthead__mark">◎</span>
          <h1>TUNNELS</h1>
        </div>
        <div className="masthead__meta">
          <span className="masthead__label">survey log</span>
          <span className="masthead__date">{today}</span>
        </div>
      </header>

      {hasTunnels && (
        <div className="ledger-head">
          <span>bore</span>
          <span className="ledger-head__progress">advance</span>
        </div>
      )}

      <main className="tunnels" aria-live="polite">
        {tunnels.map((tunnel) => (
          <TunnelCard
            key={tunnel.id}
            tunnel={tunnel}
            onFill={(fill) => updateFill(tunnel.id, fill)}
            onRename={(name) => renameTunnel(tunnel.id, name)}
            onCommitName={(name) => commitTunnelName(tunnel.id, name)}
            onRemove={() => removeTunnel(tunnel.id)}
          />
        ))}
      </main>

      {!hasTunnels && (
        <p className="empty">
          no active bores — press <strong>+</strong> to start one.
        </p>
      )}

      <button className="add-btn" onClick={addTunnel} aria-label="Add new tunnel">
        <span className="add-btn__plus">+</span>
        <span className="add-btn__text">new bore</span>
      </button>
    </div>
  );
}

function TunnelCard({
  tunnel,
  onFill,
  onRename,
  onCommitName,
  onRemove,
}: {
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
        <div className="shaft__bore" data-full={tunnel.fill >= 100 ? "true" : "false"} style={{ "--fill": `${tunnel.fill}%` } as React.CSSProperties}>
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
    </article>
  );
}
