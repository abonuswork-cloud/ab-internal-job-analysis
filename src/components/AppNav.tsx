import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

const LINKEDIN = "https://www.linkedin.com/in/abonus";

export function AppNav({ name }: { name?: string | null }) {
  const cls = "font-mono text-xs uppercase tracking-widest px-3 py-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground";
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <span className="py-4 font-mono text-sm font-medium">
            <span className="text-accent">▲</span> GAP/MATCHER
          </span>
          <nav className="flex">
            <Link to="/" className={cls} activeOptions={{ exact: true }} activeProps={{ className: "!border-accent !text-foreground" }}>Analyze</Link>
            <Link to="/log" className={cls} activeProps={{ className: "!border-accent !text-foreground" }}>Application log</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(LINKEDIN); toast.success("LinkedIn URL copied"); }}
            title={LINKEDIN}
            className="rounded-sm border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:border-accent hover:text-accent"
          >
            Copy LinkedIn URL
          </button>
          {name && <span className="font-mono text-xs text-muted-foreground">{name}</span>}
        </div>
      </div>
    </header>
  );
}

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text)}
      className="shrink-0 rounded-sm border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-accent hover:text-accent"
    >
      Copy
    </button>
  );
}
