import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { $getSessionUser } from "@/lib/session";
import { listApplications, updateApplication, deleteApplication } from "@/lib/jobs.functions";
import { getResume } from "@/lib/resumes";
import { AppNav } from "@/components/AppNav";
import { AnalysisView } from "@/components/AnalysisView";

const STATUSES = ["applied", "screen", "interview", "offer", "rejected", "ghosted"];

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "Application log — Gap Matcher" },
      { name: "description", content: "Every application with its exact JD, tailored bullets, and date applied." },
      { property: "og:title", content: "Application log — Gap Matcher" },
      { property: "og:description", content: "Every application with its exact JD, tailored bullets, and date applied." },
    ],
  }),
  loader: () => $getSessionUser(),
  component: LogPage,
});

function LogPage() {
  const user = Route.useLoaderData();
  const list = useServerFn(listApplications);
  const update = useServerFn(updateApplication);
  const del = useServerFn(deleteApplication);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["apps"], queryFn: () => list(), enabled: !!user });
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"analysis" | "jd">("analysis");

  if (!user) return <div className="p-10 font-mono text-sm">Sign in to Lovable to use this tool.</div>;
  const refresh = () => qc.invalidateQueries({ queryKey: ["apps"] });

  return (
    <div className="min-h-screen bg-background">
      <AppNav name={user.displayName} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-6 font-mono text-xs uppercase tracking-widest"><span className="text-accent">▲</span> {data?.length ?? 0} applications</h1>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && <p className="text-sm text-muted-foreground">Nothing logged yet. Run an analysis and save it.</p>}
        <div className="divide-y divide-border border-y border-border">
          {data?.map((r) => (
            <div key={r.id}>
              <div className="grid cursor-pointer grid-cols-[110px_1fr_160px_70px_130px_40px] items-center gap-4 py-3 text-sm hover:bg-card" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <span className="font-mono text-xs text-muted-foreground">{r.applied_on}</span>
                <span><span className="font-semibold">{r.company || "—"}</span> <span className="text-muted-foreground">· {r.role_title}</span></span>
                <span className="text-xs text-muted-foreground">{getResume(r.resume_variant)?.label ?? r.resume_variant}</span>
                <span className="font-mono">{r.analysis?.match_score ?? "–"}</span>
                <select
                  onClick={(e) => e.stopPropagation()}
                  value={r.status}
                  onChange={async (e) => { await update({ data: { id: r.id, status: e.target.value } }); refresh(); }}
                  className="rounded-sm border border-border bg-card px-2 py-1 font-mono text-xs"
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button
                  onClick={async (e) => { e.stopPropagation(); if (confirm("Delete this entry?")) { await del({ data: { id: r.id } }); toast.success("Deleted"); refresh(); } }}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >✕</button>
              </div>
              {open === r.id && (
                <div className="grid gap-8 pb-8 pt-2 lg:grid-cols-[1fr_320px]">
                  <div>
                    <div className="mb-4 flex gap-4 font-mono text-xs uppercase tracking-widest">
                      {(["analysis", "jd"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)} className={tab === t ? "text-accent" : "text-muted-foreground"}>{t === "jd" ? "Exact JD" : "Analysis"}</button>
                      ))}
                    </div>
                    {tab === "jd" ? <pre className="whitespace-pre-wrap rounded-sm border border-border bg-card p-4 text-xs">{r.job_description}</pre> : <AnalysisView a={r.analysis} />}
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase tracking-widest">Notes</label>
                    <textarea
                      defaultValue={r.notes}
                      onBlur={async (e) => { if (e.target.value !== r.notes) { await update({ data: { id: r.id, notes: e.target.value } }); toast.success("Notes saved"); refresh(); } }}
                      className="h-48 w-full rounded-sm border border-border bg-card p-3 text-sm"
                      placeholder="Recruiter name, salary range, next step…"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
