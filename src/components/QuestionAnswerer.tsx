import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { answerQuestion } from "@/lib/jobs.functions";
import type { Analysis } from "@/lib/analysis-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "./AppNav";

const KEY = "gm-notebook-notes";

export function QuestionAnswerer({ resumeText, jd, analysis }: { resumeText: string; jd: string; analysis: Analysis | null }) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(answerQuestion);

  useEffect(() => { setNotes(localStorage.getItem(KEY) ?? ""); }, []);

  async function run() {
    setBusy(true);
    try {
      const r = await ask({ data: { resumeText, jd, notes, question, analysis } });
      setAnswer(r.answer);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Answer failed");
    } finally { setBusy(false); }
  }

  return (
    <section className="border-t border-border pt-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest"><span className="text-accent">07</span> Application questions</h2>
        <button onClick={() => setShowNotes((s) => !s)} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-accent">
          {showNotes ? "Hide" : "Edit"} my notebook notes {notes ? `(${notes.length.toLocaleString()} chars)` : "(empty)"}
        </button>
      </div>
      {showNotes && (
        <Textarea className="mb-3 h-56 font-mono text-[11px]" placeholder="Paste notes, stories, STAR examples or a NotebookLM summary here. Saved in this browser."
          value={notes} onChange={(e) => { setNotes(e.target.value); localStorage.setItem(KEY, e.target.value); }} />
      )}
      <Textarea className="h-28 bg-card text-sm" placeholder='Paste the question, e.g. "Why do you want to work here? (150 words max)"' value={question} onChange={(e) => setQuestion(e.target.value)} />
      <div className="mt-2 flex items-center justify-end gap-2">
        {answer && <CopyButton text={answer} />}
        <Button size="sm" variant="outline" disabled={busy || !question.trim()} onClick={run}>{busy ? "Writing…" : answer ? "Regenerate" : "Generate answer"}</Button>
      </div>
      {answer && <Textarea className="mt-3 min-h-48 bg-card text-sm leading-relaxed" value={answer} onChange={(e) => setAnswer(e.target.value)} />}
    </section>
  );
}
