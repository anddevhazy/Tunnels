"use client";

import { useEffect, useRef, useState } from "react";

export type Tunnel = {
  id: string;
  seq: number;
  name: string;
  fill: number;
};

export type Decision = {
  id: string;
  seq: number;
  name: string;
  tunnels: Tunnel[];
};

const STORAGE_KEY = "decisions.log";

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

export function statusFor(pct: number) {
  if (pct <= 0) return "staged";
  if (pct >= 100) return "breakthrough";
  return "boring";
}

export function useDecisions() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [ready, setReady] = useState(false);
  // Mirrors `decisions` synchronously so mutators never read a stale array
  // and can write to localStorage before a caller navigates away.
  const decisionsRef = useRef<Decision[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        decisionsRef.current = parsed;
        setDecisions(parsed);
      }
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  function persist(next: Decision[]) {
    decisionsRef.current = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDecisions(next);
  }

  function addDecision() {
    const id = makeId();
    const prev = decisionsRef.current;
    const seq = prev.reduce((max, d) => Math.max(max, d.seq || 0), 0) + 1;
    persist([...prev, { id, seq, name: "DECISION-" + String(seq).padStart(2, "0"), tunnels: [] }]);
    return id;
  }

  function renameDecision(id: string, name: string) {
    persist(decisionsRef.current.map((d) => (d.id === id ? { ...d, name } : d)));
  }

  function commitDecisionName(id: string, name: string) {
    persist(decisionsRef.current.map((d) => (d.id === id ? { ...d, name: name.trim() || d.name } : d)));
  }

  function removeDecision(id: string) {
    persist(decisionsRef.current.filter((d) => d.id !== id));
  }

  function addTunnel(decisionId: string) {
    persist(
      decisionsRef.current.map((d) => {
        if (d.id !== decisionId) return d;
        const seq = d.tunnels.reduce((max, t) => Math.max(max, t.seq || 0), 0) + 1;
        const tunnel: Tunnel = { id: makeId(), seq, name: "BORE-" + String(seq).padStart(2, "0"), fill: 0 };
        return { ...d, tunnels: [...d.tunnels, tunnel] };
      })
    );
  }

  function updateTunnelFill(decisionId: string, tunnelId: string, fill: number) {
    persist(
      decisionsRef.current.map((d) =>
        d.id !== decisionId
          ? d
          : { ...d, tunnels: d.tunnels.map((t) => (t.id === tunnelId ? { ...t, fill } : t)) }
      )
    );
  }

  function renameTunnel(decisionId: string, tunnelId: string, name: string) {
    persist(
      decisionsRef.current.map((d) =>
        d.id !== decisionId
          ? d
          : { ...d, tunnels: d.tunnels.map((t) => (t.id === tunnelId ? { ...t, name } : t)) }
      )
    );
  }

  function commitTunnelName(decisionId: string, tunnelId: string, name: string) {
    persist(
      decisionsRef.current.map((d) =>
        d.id !== decisionId
          ? d
          : {
              ...d,
              tunnels: d.tunnels.map((t) => (t.id === tunnelId ? { ...t, name: name.trim() || t.name } : t)),
            }
      )
    );
  }

  function removeTunnel(decisionId: string, tunnelId: string) {
    persist(
      decisionsRef.current.map((d) =>
        d.id !== decisionId ? d : { ...d, tunnels: d.tunnels.filter((t) => t.id !== tunnelId) }
      )
    );
  }

  return {
    decisions,
    ready,
    addDecision,
    renameDecision,
    commitDecisionName,
    removeDecision,
    addTunnel,
    updateTunnelFill,
    renameTunnel,
    commitTunnelName,
    removeTunnel,
  };
}
