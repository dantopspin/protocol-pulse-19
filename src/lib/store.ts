import { useSyncExternalStore } from "react";
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

export type AiQueueItem = {
  id: string;
  question: string;
  kind: "question" | "weekly_summary" | "change_observation";
  event_id: string | null;
  created_at: string;
};

export type AppState = {
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
  activeProtocolId: string | null;
  notificationsGranted: boolean | null;
  healthConnected: boolean;
  travelMode: boolean;
};


const KEY = "peptidelens.v1";

export const initialState: AppState = {
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
  activeProtocolId: null,
  notificationsGranted: null,
  healthConnected: false,
  travelMode: false,
};

let state: AppState = initialState;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable; records stay in memory for this session */
  }
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      state = {
        ...initialState,
        ...parsed,
        preferences: { ...initialState.preferences, ...(parsed.preferences ?? {}) },
        entitlement: { ...initialState.entitlement, ...(parsed.entitlement ?? {}) },
      };
    }
  } catch {
    state = initialState;
  }
  emit();
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
  state = initialState;
  persist();
  emit();
}
