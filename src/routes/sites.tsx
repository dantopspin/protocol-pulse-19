import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { Note, Section } from "@/components/kit";
import { SITES } from "@/lib/compounds";
import { suggestedSite } from "@/lib/domain";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/sites")({
  head: () => ({
    meta: [
      { title: "Injection site map — Peptide Lens" },
      { name: "description", content: "Front and back site map with recorded use, reactions, and rotation based only on your history." },
      { property: "og:title", content: "Injection site map — Peptide Lens" },
      { property: "og:description", content: "Rotation suggestions derived from recorded use." },
    ],
  }),
  component: SitesPage,
});

function SitesPage() {
  const state = useStore((s) => s);
  const suggested = suggestedSite(state);
  const lastUse = (key: string) => state.sites.find((r) => r.site_key === key)?.used_at ?? null;

  return (
    <Screen title="Sites" eyebrow="Rotation" back={{ to: "/protocols", label: "Protocols" }}>
      {(["front", "back"] as const).map((side) => (
        <Section key={side} title={side === "front" ? "Front" : "Back"}>
          <div className="relative h-[320px] border border-hairline bg-surface/50">
            {SITES.filter((s) => s.side === side).map((s) => {
              const used = lastUse(s.key);
              return (
                <button
                  key={s.key}
                  aria-label={`${s.label}. ${used ? `Last used ${new Date(used).toLocaleDateString()}` : "Not recorded"}`}
                  className={`absolute size-[26px] -translate-x-1/2 -translate-y-1/2 border ${suggested === s.key ? "border-primary bg-primary/20" : used ? "border-foreground/40 bg-foreground/10" : "border-hairline"}`}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                />
              );
            })}
          </div>
          <ul className="mt-4 border-t border-hairline">
            {SITES.filter((s) => s.side === side).map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 py-3 hairline-b">
                <span className="text-[14px]">{s.label}</span>
                <span className="num text-[12px] text-muted-foreground">
                  {lastUse(s.key) ? new Date(lastUse(s.key)!).toLocaleDateString() : "Not recorded"}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <Section><Note>Suggestions reflect recorded use only. This site was used recently. Consider another recorded site.</Note></Section>
    </Screen>
  );
}
