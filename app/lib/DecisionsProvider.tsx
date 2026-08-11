"use client";

import { createContext, useContext } from "react";
import { useDecisions } from "./useDecisions";

type DecisionsContextValue = ReturnType<typeof useDecisions>;

const DecisionsContext = createContext<DecisionsContextValue | null>(null);

export function DecisionsProvider({ children }: { children: React.ReactNode }) {
  const value = useDecisions();
  return <DecisionsContext.Provider value={value}>{children}</DecisionsContext.Provider>;
}

export function useDecisionsContext() {
  const ctx = useContext(DecisionsContext);
  if (!ctx) throw new Error("useDecisionsContext must be used within DecisionsProvider");
  return ctx;
}
