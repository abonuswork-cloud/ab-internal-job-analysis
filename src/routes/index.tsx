import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { $getSessionUser } from "@/lib/session";
import { RESUMES } from "@/lib/resumes";
import { analyzeJob, saveApplication } from "@/lib/jobs.functions";
import type { Analysis } from "@/lib/analysis-types";
import { AppNav } from "@/components/AppNav";
import { AnalysisView } from "@/components/AnalysisView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Analyze a job — Gap Matcher" },
      { name: "description", content: "Match a resume variant against a job description and get ATS-grounded bullet rewrites." },
      { property: "og:title", content: "Analyze a job — Gap Matcher" },
      { property: "og:description", content: "Reverse-ATS keyword gap analysis with truthful bullet tailoring." },
    ],
  }),
  loader: () => $getSessionUser(),
  component: Index,
});

function Index() {
  const user = Route.useLoaderData();
  const [variant, setVariant] = useState(RESUMES[0].id);
  const [texts, setTexts] = useState<Record<string, string>>(() => Object.fromEntries(RESUMES.map((r) => [r.id, r.text])));
  const [showResume, setShowResume] = useState(false);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [appliedOn, setAppliedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const analyze = useServerFn(analyzeJob);
  const save = useServerFn(saveApplication);

  async function run() {
    setLoading(true);
    try {
      const a = await analyze({ data: { resumeText: texts[variant], jd } });
      setResult(a);
      setCompany(a.company);
      setRole(a.role_title);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  async function log() {
    if (!result) return;
    setSaving(true);
    try {
      await save({ data: { company, role_title: role, resume_variant: variant, job_description: jd, analysis: result, applied_on: appliedOn, notes: "" } });
      toast.success("Saved to application log");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <div className="p-10 font-mono text-sm">Sign in to Lovable to use this tool.</div>;

  return (
    <div className="min-h-screen bg-background">
      <AppNav name={user.displayName} />
      <main className="mx-auto grid max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-widest">Resume variant</label>
            <div className="flex flex-wrap gap-1.5">
              {RESUMES.map((r) => (
                <button key={r.id} onClick={() => setVariant(r.id)} className={`rounded-sm border px-3 py-1.5 text-xs ${variant === r.id ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground"}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowResume((s) => !s)} className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-accent">
              {showResume ? "Hide" : "View / edit"} resume text
            </button>
            {showResume && (
              <Textarea className="mt-2 h-64 font-mono text-[11px]" value={texts[variant]} onChange={(e) => setTexts({ ...texts, [variant]: e.target.value })} />
            )}
          </div>
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-widest">Target job description</label>
            <Textarea className="h-80 bg-card text-sm" placeholder="Paste the full JD here…" value={jd} onChange={(e) => setJd(e.target.value)} />
          </div>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading || jd.trim().length < 50} onClick={run}>
            {loading ? "Analyzing… (~30–60s)" : "Run gap analysis"}
          </Button>
          {result && (
            <div className="space-y-3 rounded-sm border border-border bg-card p-4">
              <div className="font-mono text-xs uppercase tracking-widest">Log this application</div>
              <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
              <Input type="date" value={appliedOn} onChange={(e) => setAppliedOn(e.target.value)} />
              <Button className="w-full" disabled={saving} onClick={log}>{saving ? "Saving…" : "Save to log"}</Button>
            </div>
          )}
        </div>
        <div>
          {result ? <AnalysisView a={result} /> : (
            <div className="flex h-full min-h-96 items-center justify-center rounded-sm border border-dashed border-border">
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                Pick a resume, paste a JD, and run. You'll get the exact ATS taxonomy, what's missing, and rewritten bullets grounded only in your real experience.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
