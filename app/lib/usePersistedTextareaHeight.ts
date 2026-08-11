"use client";

import { useEffect, useRef } from "react";

const STORAGE_PREFIX = "notes-height:";

// A textarea's manual resize (dragging its corner handle) is a browser-native
// inline style on that DOM node, never React state — so it's lost whenever
// the node is recreated, e.g. navigating away from a notes page and back.
// This restores whatever height was last set, per note, and keeps saving it
// as the user drags.
export function usePersistedTextareaHeight(key: string) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) el.style.height = stored;

    const observer = new ResizeObserver(() => {
      localStorage.setItem(STORAGE_PREFIX + key, el.style.height || `${el.offsetHeight}px`);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [key]);

  return ref;
}
