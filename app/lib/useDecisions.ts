"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

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

const FILL_DEBOUNCE_MS = 400;

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

export function useDecisions(uid: string | null) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [ready, setReady] = useState(false);
  // Mirrors `decisions` synchronously so mutators (which patch one decision's
  // array field) always read the latest array, even right after a local
  // optimistic update Firestore's onSnapshot hasn't echoed back yet.
  const decisionsRef = useRef<Decision[]>([]);
  // One pending debounce timer per tunnel, so dragging a slider doesn't fire
  // a Firestore write on every pixel of movement.
  const fillTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    decisionsRef.current = [];
    setDecisions([]);

    if (!uid) {
      setReady(true);
      return;
    }

    setReady(false);
    const q = query(collection(db, "users", uid, "decisions"), orderBy("seq", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            seq: data.seq ?? 0,
            name: data.name ?? "",
            tunnels: Array.isArray(data.tunnels) ? data.tunnels : [],
          } as Decision;
        });
        decisionsRef.current = next;
        setDecisions(next);
        setReady(true);
      },
      () => setReady(true)
    );
    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    const timers = fillTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  function setLocal(next: Decision[]) {
    decisionsRef.current = next;
    setDecisions(next);
  }

  function patchDecision(id: string, patch: Partial<Decision>) {
    setLocal(decisionsRef.current.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function patchTunnels(decisionId: string, tunnels: Tunnel[]) {
    patchDecision(decisionId, { tunnels });
    return tunnels;
  }

  function decisionDoc(id: string) {
    if (!uid) throw new Error("Cannot mutate decisions while signed out");
    return doc(db, "users", uid, "decisions", id);
  }

  function addDecision() {
    if (!uid) throw new Error("Cannot add a decision while signed out");
    const ref = doc(collection(db, "users", uid, "decisions"));
    const seq = decisionsRef.current.reduce((max, d) => Math.max(max, d.seq || 0), 0) + 1;
    const name = "DECISION-" + String(seq).padStart(2, "0");
    setLocal([...decisionsRef.current, { id: ref.id, seq, name, tunnels: [] }]);
    void setDoc(ref, { seq, name, tunnels: [] });
    return ref.id;
  }

  // Live-typing state while a name input is focused: local only, no network.
  function renameDecision(id: string, name: string) {
    patchDecision(id, { name });
  }

  // Called on blur: trims and persists.
  function commitDecisionName(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    patchDecision(id, { name: trimmed });
    void updateDoc(decisionDoc(id), { name: trimmed });
  }

  function removeDecision(id: string) {
    setLocal(decisionsRef.current.filter((d) => d.id !== id));
    void deleteDoc(decisionDoc(id));
  }

  function addTunnel(decisionId: string) {
    const decision = decisionsRef.current.find((d) => d.id === decisionId);
    if (!decision) return;
    const seq = decision.tunnels.reduce((max, t) => Math.max(max, t.seq || 0), 0) + 1;
    const tunnel: Tunnel = { id: makeId(), seq, name: "BORE-" + String(seq).padStart(2, "0"), fill: 0 };
    const tunnels = patchTunnels(decisionId, [...decision.tunnels, tunnel]);
    void updateDoc(decisionDoc(decisionId), { tunnels });
  }

  // Fires on every slider tick: update local state instantly, debounce the write.
  function updateTunnelFill(decisionId: string, tunnelId: string, fill: number) {
    const decision = decisionsRef.current.find((d) => d.id === decisionId);
    if (!decision) return;
    const tunnels = patchTunnels(
      decisionId,
      decision.tunnels.map((t) => (t.id === tunnelId ? { ...t, fill } : t))
    );

    const timerKey = `${decisionId}:${tunnelId}`;
    const existing = fillTimers.current.get(timerKey);
    if (existing) clearTimeout(existing);
    fillTimers.current.set(
      timerKey,
      setTimeout(() => {
        fillTimers.current.delete(timerKey);
        void updateDoc(decisionDoc(decisionId), { tunnels });
      }, FILL_DEBOUNCE_MS)
    );
  }

  function renameTunnel(decisionId: string, tunnelId: string, name: string) {
    const decision = decisionsRef.current.find((d) => d.id === decisionId);
    if (!decision) return;
    patchTunnels(
      decisionId,
      decision.tunnels.map((t) => (t.id === tunnelId ? { ...t, name } : t))
    );
  }

  function commitTunnelName(decisionId: string, tunnelId: string, name: string) {
    const decision = decisionsRef.current.find((d) => d.id === decisionId);
    if (!decision) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const tunnels = patchTunnels(
      decisionId,
      decision.tunnels.map((t) => (t.id === tunnelId ? { ...t, name: trimmed } : t))
    );
    void updateDoc(decisionDoc(decisionId), { tunnels });
  }

  function removeTunnel(decisionId: string, tunnelId: string) {
    const decision = decisionsRef.current.find((d) => d.id === decisionId);
    if (!decision) return;
    const tunnels = patchTunnels(
      decisionId,
      decision.tunnels.filter((t) => t.id !== tunnelId)
    );
    void updateDoc(decisionDoc(decisionId), { tunnels });
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
