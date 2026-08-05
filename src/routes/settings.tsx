import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { Button, Card, Choice, Note, Row, Section } from "@/components/kit";
import { useEntitlement } from "@/lib/entitlements";
import { resetAllData, setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Peptide Lens" },
      { name: "description", content: "Units, notifications, health data, privacy controls, and legal information." },
      { property: "og:title", content: "Settings — Peptide Lens" },
      { property: "og:description", content: "Local-first data controls and entitlement preview." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const state = useStore((s) => s);
  const { entitlement, setDeveloperTier } = useEntitlement();

  return (
    <Screen title="Settings" back={{ to: "/", label: "Today" }}>
      <Section title="Plan">
        <Card>
          <Row label="Tier" value={entitlement.tier} mono={false} />
          <Row label="Source" value={entitlement.source} mono={false} className="border-b-0" />
        </Card>
        <div className="mt-4 border border-hairline p-4">
          <p className="eyebrow">Developer entitlement switch</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Preview Free and Pro states locally. Purchases are not connected in this build.</p>
          <div className="mt-3 space-y-2">
            <Choice title="Free" selected={entitlement.tier === "free"} onClick={() => setDeveloperTier("free")} />
            <Choice title="Pro" selected={entitlement.tier === "pro"} onClick={() => setDeveloperTier("pro")} />
          </div>
        </div>
      </Section>

      <Section title="Units and equipment">
        <Card>
          <Row label="Measurements" value={state.preferences.measurement_system} mono={false} />
          <Row label="Amount display" value={state.preferences.amount_display} mono={false} />
          <Row label="Syringe" value={state.preferences.syringe_type} mono={false} />
          <Row label="Syringe capacity" value={`${state.preferences.syringe_capacity_ml} mL`} className="border-b-0" />
        </Card>
      </Section>

      <Section title="Notifications">
        <Card>
          <Row label="Permission" value={state.notificationsGranted == null ? "Not requested" : state.notificationsGranted ? "Allowed" : "Not allowed"} mono={false} />
          <Row label="Scheduled entry" value="On" mono={false} />
          <Row label="Low inventory" value="On" mono={false} />
          <Row label="Weekly review" value="On" mono={false} className="border-b-0" />
        </Card>
      </Section>

      <Section title="Health data">
        <Card>
          <Row label="Status" value={state.healthConnected ? "Connected" : "Not connected"} mono={false} className="border-b-0" />
        </Card>
        <Button variant="secondary" full className="mt-4" onClick={() => setState((s) => ({ ...s, healthConnected: !s.healthConnected }))}>
          {state.healthConnected ? "Disconnect health data" : "Connect health data"}
        </Button>
        <p className="mt-3"><Note>The health adapter is prepared. Imported values are labeled by source and kept separate from manual entries.</Note></p>
      </Section>

      <Section title="Privacy and data">
        <Card>
          <Row label="Storage" value="This device" mono={false} />
          <Row label="AI sharing" value={state.preferences.ai_sharing ? "Selected records" : "Off"} mono={false} className="border-b-0" />
        </Card>
        <div className="mt-4 space-y-3">
          <Button variant="secondary" full onClick={() => setState((s) => ({ ...s, aiMessages: [] }))}>Clear assistant history</Button>
          <Button variant="destructive" full onClick={() => resetAllData()}>Delete all data on this device</Button>
        </div>
      </Section>

      <Section title="Legal">
        <ul className="border-t border-hairline">
          <li className="py-3 text-[15px] hairline-b">Medical and Educational Disclaimer</li>
          <li className="py-3 text-[15px] hairline-b">Privacy Policy</li>
          <li className="py-3 text-[15px] hairline-b">Terms of Service</li>
          <li className="py-3 text-[15px] hairline-b">About Peptide Lens</li>
        </ul>
        <p className="mt-4"><Note>Peptide Lens records user-entered information, performs conversions, and shows educational content. It does not prescribe, diagnose, or verify medical appropriateness.</Note></p>
      </Section>
    </Screen>
  );
}
