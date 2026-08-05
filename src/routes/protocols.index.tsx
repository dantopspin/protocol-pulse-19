import { createFileRoute, Link } from "@tanstack/react-router";
import { HeaderActions, Screen } from "@/components/AppShell";
import { EmptyState, LinkButton, Note, Section, StatusTag } from "@/components/kit";
import { fmt } from "@/lib/calc";
import { compoundName, scheduleLabel } from "@/lib/domain";
import { useEntitlement } from "@/lib/entitlements";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/protocols/")({
  head: () => ({
    meta: [
      { title: "Protocols — Peptide Lens" },
      {
        name: "description",
        content: "Every protocol, compound, schedule, and vial connection in one list.",
      },
      { property: "og:title", content: "Protocols — Peptide Lens" },
      {
        property: "og:description",
        content: "Manage active, paused, and archived protocols and their change history.",
      },
    ],
  }),
  component: ProtocolsPage,
});

function ProtocolsPage() {
  const state = useStore((s) => s);
  const { isPro, limits } = useEntitlement();
  const atLimit = !isPro && state.protocols.length >= limits.protocols;

  return (
    <Screen
      title="Protocols"
      right={<HeaderActions />}
      eyebrow={`${state.protocols.length} recorded`}
    >
      <Section>
        {state.protocols.length === 0 ? (
          <EmptyState
            title="No active protocol"
            body="Add an existing schedule to populate Today."
            action={<LinkButton to="/protocols/new">Add protocol</LinkButton>}
          />
        ) : (
          <ul>
            {state.protocols.map((p) => {
              const pcs = state.protocolCompounds.filter((c) => c.protocol_id === p.id);
              return (
                <li key={p.id} className="hairline-b">
                  <Link
                    to="/protocols/$protocolId"
                    params={{ protocolId: p.id }}
                    className="block py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[17px] font-medium">{p.name}</p>
                      <StatusTag tone={p.status === "active" ? "accent" : "neutral"}>
                        {p.status}
                      </StatusTag>
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {pcs.map((c) => compoundName(c.compound_id)).join(", ") || "No compounds"}
                    </p>
                    {pcs[0] && (
                      <p className="num mt-1 text-[12px] text-muted-foreground">
                        {fmt(pcs[0].scheduled_amount, 3)} {pcs[0].amount_unit} ·{" "}
                        {scheduleLabel(pcs[0].schedule_rule)}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section>
        {atLimit ? (
          <div className="border border-hairline p-4">
            <p className="text-[14px] font-medium">One active protocol on Free</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Pro records unlimited active and archived protocols, multi-compound stacks, templates,
              and complete change history.
            </p>
            <LinkButton to="/paywall" variant="secondary" className="mt-4 min-h-[44px]">
              See Pro
            </LinkButton>
          </div>
        ) : (
          <LinkButton to="/protocols/new" full>
            Add protocol
          </LinkButton>
        )}
      </Section>

      <Section title="Related">
        <ul className="border-t border-hairline">
          {[
            { to: "/vials", label: "Vial inventory" },
            { to: "/sites", label: "Injection site map" },
            { to: "/timeline", label: "Change Timeline" },
            { to: "/handoff", label: "Protocol Handoff" },
          ].map((l) => (
            <li key={l.to} className="hairline-b">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link to={l.to as any} className="block py-4 text-[15px]">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <Note>A stack is an organizational container, not a clinical recommendation.</Note>
      </Section>
    </Screen>
  );
}
