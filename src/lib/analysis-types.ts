export type KeywordGap = {
  term: string;
  category: "hard_skill" | "framework_standard" | "tool" | "leadership" | "domain";
  status: "present" | "partial" | "missing";
  evidence: string;
  jd_quote: string;
};
export type BulletSuggestion = {
  original: string;
  tailored: string;
  keywords_added: string[];
  grounding: string;
};
export type Analysis = {
  company: string;
  role_title: string;
  match_score: number;
  summary: string;
  keywords: KeywordGap[];
  bullets: BulletSuggestion[];
  tailored_summary: string;
  honest_gaps: string[];
  screen_prep: string[];
};
