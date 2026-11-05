import { cn } from "@/lib/utils";

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
    <svg viewBox="0 0 100 100" className="logo-surface h-11 w-11 shrink-0 rounded-xl p-1" aria-hidden="true">
      <path d="M25 80 L50 20 L75 80" className="stroke-brand-dark" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 65 C40 50, 65 40, 85 25" className="stroke-logo-arrow" strokeWidth="8" strokeLinecap="round" fill="none" />
      <polygon points="85,25 73,26 82,37" className="fill-logo-arrow" />
    </svg>
    <span className="min-w-0">
      <span className="block text-xl font-extrabold text-foreground">AKTIVA</span>
      {!compact && <span className="block text-sm leading-snug text-muted-foreground">El cambio comienza cuando te aktivas</span>}
    </span>
  </span>;
}
