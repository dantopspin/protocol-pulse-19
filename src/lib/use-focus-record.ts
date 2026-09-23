import { useEffect, useState } from "react";
import { anchorId } from "./ai-sources";

/**
 * Reads the `#rec-<id>` fragment used by assistant source links, scrolls the
 * matching entry into view, and returns its record id so the screen can
 * highlight it.
 */
export function useFocusedRecord(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.replace(/^#/, "");
      setId(hash.startsWith("rec-") ? hash.slice(4) : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    if (!id) return;
    const el = document.getElementById(anchorId(id));
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [id]);

  return id;
}

/** Classes applied to the referenced entry so it reads as the target. */
export const focusClass = "-mx-3 rounded-sm bg-accent/60 px-3 ring-1 ring-primary/40";
