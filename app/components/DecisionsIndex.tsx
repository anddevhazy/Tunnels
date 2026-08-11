"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDecisionsContext } from "../lib/DecisionsProvider";
import ConfirmDialog from "./ConfirmDialog";

export default function DecisionsIndex() {
  const router = useRouter();
  const { decisions, ready, addDecision, renameDecision, commitDecisionName, removeDecision } =
    useDecisionsContext();
  const [today, setToday] = useState("");
  const [tab, setTab] = useState<"open" | "concluded">("open");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

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

  const openDecisions = decisions.filter((d) => !d.concludedAt);
  const concludedDecisions = decisions.filter((d) => d.concludedAt);
  const shown = tab === "open" ? openDecisions : concludedDecisions;
  const hasShown = ready && shown.length > 0;

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

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "open"}
          className={`tabs__tab ${tab === "open" ? "tabs__tab--active" : ""}`}
          onClick={() => setTab("open")}
        >
          open <span className="tabs__count">{openDecisions.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "concluded"}
          className={`tabs__tab ${tab === "concluded" ? "tabs__tab--active" : ""}`}
          onClick={() => setTab("concluded")}
        >
          concluded <span className="tabs__count">{concludedDecisions.length}</span>
        </button>
      </div>

      {hasShown && (
        <div className="ledger-head">
          <span>decision</span>
          <span className="ledger-head__progress">bores</span>
        </div>
      )}

      <main className="decisions" aria-live="polite">
        {shown.map((decision) => {
          const concluded = Boolean(decision.concludedAt);
          return (
            <article
              key={decision.id}
              className={`decision ${concluded ? "decision--concluded" : ""}`}
              onClick={() => router.push(`/decisions/${decision.id}`)}
            >
              <div className="decision__id">№{String(decision.seq).padStart(2, "0")}</div>
              <input
                className="decision__name"
                value={decision.name}
                readOnly={concluded}
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
              {concluded && <span className="decision__stamp">concluded</span>}
              <div className="decision__stats">
                <span className="decision__count">
                  {decision.tunnels.length} bore{decision.tunnels.length === 1 ? "" : "s"}
                </span>
              </div>
              {!concluded && (
                <button
                  className="decision__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete({ id: decision.id, name: decision.name });
                  }}
                  aria-label="Delete decision"
                  title="Delete decision"
                >
                  ×
                </button>
              )}
              <span className="decision__open" aria-hidden="true">
                →
              </span>
            </article>
          );
        })}
      </main>

      {ready && !hasShown && tab === "open" && (
        <p className="empty">
          no open decisions — press <strong>+</strong> to open one.
        </p>
      )}

      {ready && !hasShown && tab === "concluded" && (
        <p className="empty">no concluded decisions yet.</p>
      )}

      <button className="add-btn" onClick={handleAdd} aria-label="Add new decision">
        <span className="add-btn__plus">+</span>
        <span className="add-btn__text">new decision</span>
      </button>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this decision?"
        message={`"${confirmDelete?.name}" and all of its bores will be permanently deleted. This can't be undone.`}
        confirmLabel="delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) removeDecision(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
