import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HeaderActions, Screen } from "@/components/AppShell";
import { Note, Section, StatusTag } from "@/components/kit";
import { CATEGORIES, COMPOUNDS } from "@/lib/compounds";

export const Route = createFileRoute("/library/")({
  head: () => ({
    meta: [
      { title: "Compound library — Peptide Lens" },
      { name: "description", content: "Educational compound profiles with category, regulatory status, mechanism, and half-life references." },
      { property: "og:title", content: "Compound library — Peptide Lens" },
      { property: "og:description", content: "Non-personalized educational reference material, clearly labeled." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const list = COMPOUNDS.filter(
    (c) =>
      (!cat || c.category === cat) &&
      (c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.alternate_names.join(" ").toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <Screen title="Library" eyebrow="Educational reference" right={<HeaderActions />}>
      <Section>
        <input
          className="w-full min-h-[48px] border border-hairline bg-transparent px-3 text-[15px] outline-none focus:border-primary"
          placeholder="Search compounds"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setCat(null)} className={`border px-3 py-2 text-[12px] ${!cat ? "border-primary text-primary" : "border-hairline text-muted-foreground"}`}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`border px-3 py-2 text-[12px] ${cat === c ? "border-primary text-primary" : "border-hairline text-muted-foreground"}`}>{c}</button>
          ))}
        </div>
      </Section>

      <Section title={`${list.length} profiles`}>
        <ul className="border-t border-hairline">
          {list.map((c) => (
            <li key={c.id} className="hairline-b">
              <Link to="/library/$compoundId" params={{ compoundId: c.id }} className="block py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[17px] font-medium">{c.name}</p>
                    <p className="text-[12px] text-muted-foreground">{c.category}</p>
                  </div>
                  <StatusTag>{c.regulatory_status}</StatusTag>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <Note>Sample content. Profiles are educational, non-personalized, and never instructions.</Note>
      </Section>
    </Screen>
  );
}
