import { useSyncExternalStore } from "react";
import { idbGet, idbSet } from "./idb";
import type {
  ChangeObservation,
  DoseLog,
  EntitlementState,
  MetricEntry,
  Preferences,
  Protocol,
  ProtocolCompound,
  ProtocolEvent,
  ProtocolEventType,
  SiteRecord,
  SymptomEntry,
  Vial,
} from "./types";

export type SavedCalculation = {
  id: string;
  label: string;
  vialAmount: number;
  vialUnit: "mg" | "mcg";
  diluentMl: number;
  targetAmount: number;
  targetUnit: "mg" | "mcg";
  syringe: string;
  created_at: string;
};

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources: string[];
  queued: boolean;
  created_at: string;
};

export type AiQueueStatus = "queued" | "processing" | "failed";

export type AiQueueItem = {
  id: string;
  question: string;
  kind: "question" | "weekly_summary" | "change_observation";
  event_id: string | null;
  status: AiQueueStatus;
  attempts: number;
  error: string | null;
  created_at: string;
};

export type AppState = {
  schema_version: number;
  preferences: Preferences;
  entitlement: EntitlementState;
  protocols: Protocol[];
  protocolCompounds: ProtocolCompound[];
  vials: Vial[];
  doses: DoseLog[];
  symptoms: SymptomEntry[];
  metrics: MetricEntry[];
  sites: SiteRecord[];
  events: ProtocolEvent[];
  observations: ChangeObservation[];
  calculations: SavedCalculation[];
  aiMessages: AiMessage[];
  aiQueue: AiQueueItem[];
  aiUsedThisWeek: number;
  /** ISO timestamp of the start of the current 7-day AI allowance window. */
  aiWeekStart: string;
  activeProtocolId: string | null;
  notificationsGranted: boolean | null;
  travelMode: boolean;
};

export const SCHEMA_VERSION = 2;

/** Storage keys. v1 lived in localStorage; v2 lives in IndexedDB. */
const LEGACY_KEY = "peptidelens.v1";
const KEY = "peptidelens.state";

export const initialState: AppState = {
  schema_version: SCHEMA_VERSION,
  preferences: {
    measurement_system: "metric",
    amount_display: "both",
    syringe_type: "U-100 insulin",
    syringe_capacity_ml: 1,
    unit_scale: "U-100",
    administration_format: "Vial",
    time_format: "12h",
    ai_sharing: false,
    health_import: false,
    local_only: true,
    disclaimer_accepted: false,
    objectives: [],
    experience: "",
    difficulties: [],
    onboarded: false,
  },
  entitlement: {
    tier: "free",
    source: "subscription_service",
    expires_at: null,
    last_verified_at: new Date(0).toISOString(),
  },
  protocols: [],
  protocolCompounds: [],
  vials: [],
  doses: [],
  symptoms: [],
  metrics: [],
  sites: [],
  events: [],
  observations: [],
  calculations: [],
  aiMessages: [],
  aiQueue: [],
  aiUsedThisWeek: 0,
  aiWeekStart: new Date(0).toISOString(),
  activeProtocolId: null,
  notificationsGranted: null,
  travelMode: false,
};

/* ------------------------------------------------------------------ */
/* Migration                                                            */
/* ------------------------------------------------------------------ */

/** Upgrades any previously stored shape to the current schema without loss. */
export function migrateState(parsed: Partial<AppState> & Record<string, unknown>): AppState {
  const merged: AppState = {
    ...initialState,
    ...(parsed as Partial<AppState>),
    preferences: { ...initialState.preferences, ...(parsed.preferences ?? {}) },
    entitlement: { ...initialState.entitlement, ...(parsed.entitlement ?? {}) },
    schema_version: SCHEMA_VERSION,
  };
  // v1 queue items had no status/attempts/error fields.
  merged.aiQueue = (merged.aiQueue ?? []).map((q) => ({
    status: "queued" as AiQueueStatus,
    attempts: 0,
    error: null,
    ...q,
  }));
  if (!merged.aiWeekStart || merged.aiWeekStart === initialState.aiWeekStart) {
    merged.aiWeekStart = merged.aiUsedThisWeek > 0 ? new Date().toISOString() : initialState.aiWeekStart;
  }
  return merged;
}

/* ------------------------------------------------------------------ */
/* Store                                                                */
/* ------------------------------------------------------------------ */

let state: AppState = initialState;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  const snapshot = state;
  void idbSet(KEY, snapshot).then((ok) => {
    if (ok) return;
    try {
      window.localStorage.setItem(LEGACY_KEY, JSON.stringify(snapshot));
    } catch {
      /* storage unavailable; records stay in memory for this session */
    }
  });
}

export async function hydrateAsync() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const stored = await idbGet<Partial<AppState>>(KEY);
    if (stored) {
      state = migrateState(stored as never);
    } else {
      const raw = window.localStorage.getItem(LEGACY_KEY);
      if (raw) {
        state = migrateState(JSON.parse(raw) as never);
        persist(); // carry the v1 records into IndexedDB
      }
    }
  } catch {
    state = initialState;
  }
  emit();
}

/** Synchronous entry point used by screens; hydration completes async. */
export function hydrate() {
  void hydrateAsync();
}

function emit() {
  listeners.forEach((l) => l());
}

export function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  emit();
}

export function getState() {
  return state;
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(initialState),
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function recordEvent(
  event_type: ProtocolEventType,
  partial: Partial<ProtocolEvent> = {},
): ProtocolEvent {
  const now = new Date().toISOString();
  const event: ProtocolEvent = {
    id: uid(),
    event_type,
    protocol_id: null,
    compound_id: null,
    vial_id: null,
    dose_id: null,
    timestamp: now,
    previous_value: null,
    new_value: null,
    source: "user",
    notes: "",
    attachment_uris: [],
    created_at: now,
    updated_at: now,
    ...partial,
  };
  setState((s) => ({ ...s, events: [event, ...s.events] }));
  return event;
}

export function resetAllData() {
  state = { ...initialState };
  persist();
  emit();
}

/* ------------------------------------------------------------------ */
/* Granular deletion                                                    */
/* ------------------------------------------------------------------ */

export type RecordCollection =
  | "protocols"
  | "vials"
  | "doses"
  | "symptoms"
  | "metrics"
  | "sites"
  | "events"
  | "observations"
  | "calculations"
  | "aiMessages";

export function deleteRecord(collection: RecordCollection, id: string) {
  setState((s) => {
    if (collection === "protocols") {
      return {
        ...s,
        protocols: s.protocols.filter((p) => p.id !== id),
        protocolCompounds: s.protocolCompounds.filter((pc) => pc.protocol_id !== id),
        activeProtocolId: s.activeProtocolId === id ? null : s.activeProtocolId,
      };
    }
    const list = s[collection] as { id: string }[];
    return { ...s, [collection]: list.filter((r) => r.id !== id) } as AppState;
  });
}

export function clearCollection(collection: RecordCollection) {
  setState((s) => {
    if (collection === "protocols") {
      return { ...s, protocols: [], protocolCompounds: [], activeProtocolId: null };
    }
    return { ...s, [collection]: [] } as AppState;
  });
}

/* ------------------------------------------------------------------ */
/* Backup restore                                                       */
/* ------------------------------------------------------------------ */

export function restoreFromJson(json: string): { ok: boolean; error?: string } {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  if (typeof parsed !== "object" || parsed === null || !("protocols" in parsed)) {
    return { ok: false, error: "That file is not a Peptide Lens backup." };
  }
  const camel = {
    ...parsed,
    protocolCompounds: parsed["protocolCompounds"] ?? parsed["protocol_compounds"] ?? [],
  };
  state = migrateState(camel as never);
  persist();
  emit();
  return { ok: true };
}
