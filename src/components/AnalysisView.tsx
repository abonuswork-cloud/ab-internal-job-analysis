import type { Analysis, KeywordGap } from "@/lib/analysis-types";
import { CopyButton } from "./AppNav";

const STATUS: Record<KeywordGap["status"], string> = {
  present: "bg-success/15 text-success border-success/40",
  partial: "bg-warning/20 text-foreground border-warning/60",
  missing: "bg-destructive/10 text-destructive border-destructive/40",
};
const CAT: Record<KeywordGap["category"], string> = {
  hard_skill: "Hard skills",
  framework_standard: "Frameworks & standards",
  tool: "Tools",
  domain: "Domain",
  leadership: "Leadership",
};

function Section({ n, title, children, action }: { n: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest"><span className="text-accent">{n}</span> {title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AnalysisView({ a }: { a: Analysis }) {
  const counts = { present: 0, partial: 0, missing: 0 };
  a.keywords.forEach((k) => counts[k.status]++);
  const cats = Object.keys(CAT) as KeywordGap["category"][];
  const allBullets = a.bullets.map((b) => `• ${b.tailored}`).join("\n");
  return (
    <div className="space-y-8">
      <div className="flex items-end gap-6">
        <div>
          <div className="font-mono text-6xl font-medium leading-none">{a.match_score}<span className="text-2xl text-muted-foreground">/100</span></div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Baseline coverage</div>
        </div>
        <div className="flex gap-3 pb-1 font-mono text-xs">
          <span className="text-success">{counts.present} present</span>
          <span>{counts.partial} partial</span>
          <span className="text-destructive">{counts.missing} missing</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{a.summary}</p>

      <Section n="01" title="Keyword gap matrix">
        <div className="space-y-4">
          {cats.map((c) => {
            const items = a.keywords.filter((k) => k.category === c);
            if (!items.length) return null;
            return (
              <div key={c}>
                <div className="mb-2 text-xs font-semibold">{CAT[c]}</div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((k) => (
                    <span key={k.term} title={k.evidence ? `Resume: ${k.evidence}` : `JD: ${k.jd_quote}`} className={`cursor-help rounded-sm border px-2 py-0.5 font-mono text-xs ${STATUS[k.status]}`}>
                      {k.term}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section n="02" title="Tailored summary" action={<CopyButton text={a.tailored_summary} />}>
        <p className="rounded-sm border border-border bg-card p-4 text-sm leading-relaxed">{a.tailored_summary}</p>
      </Section>

      <Section n="03" title="Surgical bullets" action={<CopyButton text={allBullets} />}>
        <ol className="space-y-4">
          {a.bullets.map((b, i) => (
            <li key={i} className="rounded-sm border border-border bg-card p-4">
              <div className="mb-2 text-xs text-muted-foreground line-through decoration-muted-foreground/40">{b.original}</div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-relaxed">{b.tailored}</p>
                <CopyButton text={b.tailored} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {b.keywords_added.map((k) => (
                  <span key={k} className="rounded-sm bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">+{k}</span>
                ))}
              </div>
              <p className="mt-2 text-xs italic text-muted-foreground">Grounding: {b.grounding}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section n="04" title="Do not claim — honest gaps">
        <ul className="list-disc space-y-1.5 pl-5 text-sm">{a.honest_gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
      </Section>

      <Section n="05" title="Screen prep">
        <ul className="space-y-2 text-sm">{a.screen_prep.map((g, i) => <li key={i} className="border-l-2 border-accent pl-3">{g}</li>)}</ul>
      </Section>
    </div>
  );
}
