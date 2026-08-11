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
  notes: string;
};

export type Decision = {
  id: string;
  seq: number;
  name: string;
  notes: string;
  tunnels: Tunnel[];
};

const FILL_DEBOUNCE_MS = 400;
const NOTES_DEBOUNCE_MS = 600;

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
  // One pending debounce timer per (field, tunnel), so dragging a slider or
  // typing notes doesn't fire a Firestore write on every tick/keystroke.
  const writeTimers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; flush: () => void }>());

  useEffect(() => {
    decisionsRef.current = [];
    setDecisions([]);

    if (!uid) {
      setReady(true);
      return;
    }

    setReady(false);

    // Deferred by a tick on purpose. In dev, React StrictMode mounts every
    // effect twice (mount -> cleanup -> mount) to surface missing-cleanup
    // bugs. If we subscribed synchronously here, that first throwaway mount
    // would open a real Firestore connection just to tear it down a moment
    // later — and the SDK doesn't cleanly catch a request aborted that
    // fast, so it surfaces as an unhandled `AbortError`. Deferring the
    // actual subscribe means the throwaway mount's cleanup runs (via
    // clearTimeout) before any connection is ever opened; only the
    // surviving mount subscribes for real. The delay is a single tick —
    // imperceptible, and `ready` still gates the UI until data arrives.
    let unsubscribe = () => {};
    const timer = setTimeout(() => {
      const q = query(collection(db, "users", uid, "decisions"), orderBy("seq", "asc"));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const next = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              seq: data.seq ?? 0,
              name: data.name ?? "",
              notes: data.notes ?? "",
              tunnels: Array.isArray(data.tunnels)
                ? data.tunnels.map((t: Partial<Tunnel>) => ({ ...t, notes: t.notes ?? "" }) as Tunnel)
                : [],
            } as Decision;
          });
          decisionsRef.current = next;
          setDecisions(next);
          setReady(true);
        },
        () => setReady(true)
      );
    }, 0);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [uid]);

  // Flush (not just discard) pending debounced writes on teardown, so a
  // slider drag or a few typed words aren't silently lost if this provider
  // ever unmounts mid-debounce (e.g. sign-out).
  useEffect(() => {
    const timers = writeTimers.current;
    return () => {
      timers.forEach(({ timer, flush }) => {
        clearTimeout(timer);
        flush();
      });
      timers.clear();
    };
  }, []);

  // Patches local state immediately, then writes to Firestore after `delay`
  // of inactivity on this key — shared by the fill slider and both notes
  // editors (bore-level and decision-level) so none of them hammer the
  // database on every tick/keystroke.
  function writeDebounced(key: string, decisionId: string, patch: Partial<Decision>, delay: number) {
    const existing = writeTimers.current.get(key);
    if (existing) clearTimeout(existing.timer);
    const flush = () => void updateDoc(decisionDoc(decisionId), patch);
    const timer = setTimeout(() => {
      writeTimers.current.delete(key);
      flush();
    }, delay);
    writeTimers.current.set(key, { timer, flush });
  }

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
    setLocal([...decisionsRef.current, { id: ref.id, seq, name, notes: "", tunnels: [] }]);
    void setDoc(ref, { seq, name, notes: "", tunnels: [] });
    return ref.id;
  }

  // Fires on every keystroke in the decision's own notes editor: update
  // local state instantly, debounce the write.
  function updateDecisionNotes(id: string, notes: string) {
    patchDecision(id, { notes });
    writeDebounced(`decision-notes:${id}`, id, { notes }, NOTES_DEBOUNCE_MS);
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
    const tunnel: Tunnel = {
      id: makeId(),
      seq,
      name: "BORE-" + String(seq).padStart(2, "0"),
      fill: 0,
      notes: "",
    };
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
    writeDebounced(`fill:${decisionId}:${tunnelId}`, decisionId, { tunnels }, FILL_DEBOUNCE_MS);
  }

  // Fires on every keystroke in the notes editor: update local state
  // instantly, debounce the write.
  function updateTunnelNotes(decisionId: string, tunnelId: string, notes: string) {
    const decision = decisionsRef.current.find((d) => d.id === decisionId);
    if (!decision) return;
    const tunnels = patchTunnels(
      decisionId,
      decision.tunnels.map((t) => (t.id === tunnelId ? { ...t, notes } : t))
    );
    writeDebounced(`notes:${decisionId}:${tunnelId}`, decisionId, { tunnels }, NOTES_DEBOUNCE_MS);
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
    updateDecisionNotes,
    removeDecision,
    addTunnel,
    updateTunnelFill,
    updateTunnelNotes,
    renameTunnel,
    commitTunnelName,
    removeTunnel,
  };
}
