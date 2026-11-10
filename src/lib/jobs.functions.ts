import { createServerFn } from "@tanstack/react-start";
import type { Analysis } from "./analysis-types";

async function requireUser() {
  const { getSessionUser } = await import("./auth.server");
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  return user;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["company", "role_title", "match_score", "summary", "keywords", "bullets", "tailored_summary", "honest_gaps", "screen_prep"],
  properties: {
    company: { type: "string" },
    role_title: { type: "string" },
    match_score: { type: "integer", description: "0-100 estimated ATS keyword coverage" },
    summary: { type: "string" },
    keywords: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "category", "status", "evidence", "jd_quote"],
        properties: {
          term: { type: "string" },
          category: { type: "string", enum: ["hard_skill", "framework_standard", "tool", "leadership", "domain"] },
          status: { type: "string", enum: ["present", "partial", "missing"] },
          evidence: { type: "string", description: "Exact resume phrase proving it, or empty if missing" },
          jd_quote: { type: "string" },
        },
      },
    },
    bullets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "tailored", "keywords_added", "grounding"],
        properties: {
          original: { type: "string" },
          tailored: { type: "string" },
          keywords_added: { type: "array", items: { type: "string" } },
          grounding: { type: "string", description: "Why this is truthful, citing the resume" },
        },
      },
    },
    tailored_summary: { type: "string" },
    honest_gaps: { type: "array", items: { type: "string" } },
    screen_prep: { type: "array", items: { type: "string" } },
  },
} as const;

const INSTRUCTIONS = `You are a reverse-ATS analyst for enterprise parsers (Workday, Greenhouse, Lever, iCIMS, Taleo).
Rules:
- Extract the JD's exact taxonomy: verbatim hard skills, protocols (e.g. gRPC vs REST), frameworks/standards (e.g. NIST 800-53 vs SOC 2 vs ISO 27001), tools, domain terms, and leadership competencies. Use the JD's exact spelling and acronyms. Distinguish near-misses precisely (SOC 2 is not NIST 800-53).
- Mark each term present (exact or clear synonym in resume), partial (adjacent experience), or missing.
- Bullet tailoring: rewrite ONLY bullets that exist in the resume. Never invent employers, metrics, tools, certifications, or scope. You may reorder, use the JD's exact terminology for things the candidate demonstrably did, and surface implied skills only when the original bullet clearly supports them. Keep every number as in the original. Plain ASCII text, no markdown, starts with a strong verb, under ~35 words.
- 6-10 bullets, prioritising the biggest keyword wins.
- honest_gaps: missing items that must NOT be claimed; suggest how to address them in a cover letter or interview.
- screen_prep: 5-8 likely recruiter/hiring-manager screen questions tied to this JD with a one-line pointer to the resume story to use.
- tailored_summary: 2-3 sentence professional summary using JD keywords, truthful.
- match_score: honest coverage estimate before tailoring.`;

export const analyzeJob = createServerFn({ method: "POST" })
  .inputValidator((d: { resumeText: string; jd: string }) => {
    if (!d.jd?.trim() || d.jd.length > 30000) throw new Error("Paste a job description (max 30k chars)");
    if (!d.resumeText?.trim() || d.resumeText.length > 30000) throw new Error("Resume text missing");
    return d;
  })
  .handler(async ({ data }): Promise<Analysis> => {
    await requireUser();
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: INSTRUCTIONS,
        input: [
          { role: "user", content: `RESUME:\n${data.resumeText}\n\n---\nJOB DESCRIPTION:\n${data.jd}` },
        ],
        text: { format: { type: "json_schema", name: "gap_analysis", strict: true, schema: SCHEMA as unknown as Record<string, unknown> } },
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") {
          for (const c of item.content) if (c.type === "output_text") text += c.text;
        }
      }
      if (!text) throw new Error("The AI returned no result. Try again.");
      return JSON.parse(text) as Analysis;
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("gateway", e.code, e.ids);
        if (e.code === "rate_limited") throw new Error("Rate limited — wait a minute and retry.");
        if (e.code === "payment_required") throw new Error("Out of AI credits for this workspace.");
        throw new Error("AI request failed. Please try again.");
      }
      throw e;
    }
  });

export const saveApplication = createServerFn({ method: "POST" })
  .inputValidator((d: { company: string; role_title: string; resume_variant: string; job_description: string; analysis: Analysis; applied_on: string; notes: string; cover_letter?: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("applications")
      .insert({ ...data, analysis: data.analysis as never, owner_id: user.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listApplications = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("*")
    .eq("owner_id", user.userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((r) => ({ ...r, analysis: r.analysis as unknown as Analysis }));
});

export const updateApplication = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status?: string; notes?: string; cover_letter?: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("applications").update(patch).eq("id", id).eq("owner_id", user.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("applications").delete().eq("id", data.id).eq("owner_id", user.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generateCoverLetter = createServerFn({ method: "POST" })
  .inputValidator((d: { resumeText: string; jd: string; analysis: Analysis }) => {
    if (!d.jd?.trim() || !d.resumeText?.trim()) throw new Error("Resume and JD required");
    return d;
  })
  .handler(async ({ data }) => {
    await requireUser();
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const a = data.analysis;
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `Write a tailored cover letter for ${a.role_title} at ${a.company}.
Rules: plain text, no markdown, 250-380 words, 3-4 paragraphs plus greeting ("Dear Hiring Team,") and sign-off with the candidate's name from the resume.
Open with why this role/company, reusing language from the provided tailored summary. Middle: 2-3 concrete achievements taken ONLY from the resume, keeping numbers exact, using the JD's exact terminology. Never invent employers, metrics, tools, certifications or scope. Address at most one honest gap constructively (eagerness/adjacent experience), never claiming it. Close confidently with a call to action. No clichés like "I am writing to express".`,
        input: [{ role: "user", content: `TAILORED SUMMARY:\n${a.tailored_summary}\n\nHONEST GAPS:\n${a.honest_gaps.join("\n")}\n\nRESUME:\n${data.resumeText}\n\n---\nJOB DESCRIPTION:\n${data.jd}` }],
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
      if (!text.trim()) throw new Error("The AI returned no letter. Try again.");
      return { letter: text.trim() };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("gateway", e.code, e.ids);
        if (e.code === "rate_limited") throw new Error("Rate limited — wait a minute and retry.");
        if (e.code === "payment_required") throw new Error("Out of AI credits for this workspace.");
        throw new Error("AI request failed. Please try again.");
      }
      throw e;
    }
  });
