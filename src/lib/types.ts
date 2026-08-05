export type AmountUnit = "mg" | "mcg" | "mL" | "units";
export type SyringeType = "U-100 insulin" | "U-50 insulin" | "1 mL syringe" | "3 mL syringe" | "Pen";

export type Compound = {
  id: string;
  name: string;
  alternate_names: string[];
  category: string;
  regulatory_status: string;
  research_status: string;
  mechanism_summary: string;
  half_life_value: number | null;
  half_life_unit: string;
  half_life_source: string;
  educational_ranges: string;
  evidence_quality: "Limited" | "Moderate" | "Substantial";
  references: string[];
  last_reviewed_at: string;
  is_custom: boolean;
};

export type ScheduleRule =
  | { kind: "daily" }
  | { kind: "weekdays"; days: number[] }
  | { kind: "every_n_days"; n: number }
  | { kind: "weekly"; day: number }
  | { kind: "times_per_week"; n: number }
  | { kind: "as_recorded" };

export type Protocol = {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  instruction_source: string;
  start_date: string;
  end_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ProtocolCompound = {
  id: string;
  protocol_id: string;
  compound_id: string;
  administration_format: string;
  scheduled_amount: number;
  amount_unit: AmountUnit;
  schedule_rule: ScheduleRule;
  preferred_times: string[];
  active_vial_id: string | null;
  reminder_enabled: boolean;
  started_at: string;
  stopped_at: string | null;
};

export type Vial = {
  id: string;
  compound_id: string;
  protocol_ids: string[];
  name: string;
  status: "sealed" | "active" | "low" | "depleted" | "discarded" | "archived";
  original_amount: number;
  amount_unit: AmountUnit;
  diluent_volume_ml: number;
  reconstitution_date: string | null;
  user_expiry_date: string | null;
  batch_number: string;
  supplier_or_clinic: string;
  label_photo_uri: string | null;
  storage_notes: string;
  estimated_remaining_amount: number;
  manual_remaining_amount: number | null;
  created_at: string;
  depleted_at: string | null;
  archived_at: string | null;
};

export type CheckSeverity = "consistent" | "explainable" | "mismatch";
export type CheckFinding = { field: string; detail: string; severity: CheckSeverity };
export type ProtocolCheckResult = { severity: CheckSeverity; findings: CheckFinding[] };

export type DoseLog = {
  id: string;
  protocol_id: string;
  protocol_compound_id: string;
  compound_id: string;
  vial_id: string | null;
  scheduled_entry_id: string | null;
  scheduled_amount: number;
  actual_amount: number;
  amount_unit: AmountUnit;
  volume_ml: number | null;
  syringe_units: number | null;
  syringe_type: SyringeType;
  injection_site_id: string | null;
  scheduled_at: string | null;
  logged_at: string;
  status: "logged" | "skipped" | "delayed" | "partial";
  notes: string;
  attachment_uris: string[];
  protocol_check_result: ProtocolCheckResult | null;
  created_at: string;
  updated_at: string;
};

export type SymptomEntry = {
  id: string;
  name: string;
  severity: number;
  started_at: string;
  duration: string;
  resolved_at: string | null;
  related_protocol_id: string | null;
  related_compound_id: string | null;
  related_dose_id: string | null;
  related_vial_id: string | null;
  related_site_id: string | null;
  notes: string;
  attachment_uris: string[];
  created_at: string;
};

export type MetricEntry = {
  id: string;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  source: "manual" | "health" | "calculated";
  source_record_id: string | null;
  notes: string;
};

export type SiteRecord = {
  id: string;
  site_key: string;
  used_at: string;
  compound_id: string | null;
  dose_id: string | null;
  tenderness: boolean;
  redness: boolean;
  bruising: boolean;
  irritation: boolean;
  lump: boolean;
  unavailable: boolean;
  notes: string;
  attachment_uris: string[];
};

export type ProtocolEventType =
  | "protocol_created"
  | "protocol_activated"
  | "protocol_paused"
  | "protocol_resumed"
  | "compound_added"
  | "compound_removed"
  | "amount_changed"
  | "schedule_changed"
  | "vial_opened"
  | "vial_changed"
  | "vial_depleted"
  | "dose_logged"
  | "dose_skipped"
  | "dose_edited"
  | "site_used"
  | "site_reaction_recorded"
  | "symptom_recorded"
  | "weight_recorded"
  | "metric_recorded"
  | "lifestyle_entry_recorded"
  | "travel_started"
  | "travel_ended"
  | "note_added"
  | "export_generated";

export type ProtocolEvent = {
  id: string;
  event_type: ProtocolEventType;
  protocol_id: string | null;
  compound_id: string | null;
  vial_id: string | null;
  dose_id: string | null;
  timestamp: string;
  previous_value: string | null;
  new_value: string | null;
  source: string;
  notes: string;
  attachment_uris: string[];
  created_at: string;
  updated_at: string;
};

export type ChangeObservation = {
  id: string;
  protocol_event_id: string;
  tracked_metrics: string[];
  before_period: { start: string; end: string };
  after_period: { start: string; end: string };
  before_summary: Record<string, number | null>;
  after_summary: Record<string, number | null>;
  record_counts: Record<string, number>;
  missing_data: string[];
  ai_observation: string | null;
  generated_at: string;
};

export type EntitlementState = {
  tier: "free" | "pro";
  source: "developer" | "subscription_service";
  expires_at: string | null;
  last_verified_at: string;
};

export type Preferences = {
  measurement_system: "metric" | "imperial";
  amount_display: "mg" | "mcg" | "both";
  syringe_type: SyringeType;
  syringe_capacity_ml: number;
  unit_scale: "U-100" | "custom";
  administration_format: string;
  time_format: "12h" | "24h";
  ai_sharing: boolean;
  health_import: boolean;
  local_only: boolean;
  disclaimer_accepted: boolean;
  objectives: string[];
  experience: string;
  difficulties: string[];
  onboarded: boolean;
};
