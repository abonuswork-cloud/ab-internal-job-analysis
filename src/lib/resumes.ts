import data from "@/data/resumes.json";

export type ResumeVariant = { id: string; label: string; text: string };
export const RESUMES = data as ResumeVariant[];
export const getResume = (id: string) => RESUMES.find((r) => r.id === id);
