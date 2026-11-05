import { cn } from "@/lib/utils";

/** Marca de AKTIVA con el huevo y el brote del estilo "nido cálido" (Pasito A Pasito). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-10 w-10 shrink-0", className)} aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--primary-soft)" />
      <path d="M20 8 C28 8 31 20 31 24 C31 30 26 33 20 33 C14 33 9 30 9 24 C9 20 12 8 20 8 Z" fill="var(--avatar-shell)" />
      <ellipse cx="16" cy="18" rx="2" ry="1.4" fill="var(--avatar-shell-shade)" />
      <ellipse cx="24" cy="25" rx="2.4" ry="1.6" fill="var(--avatar-shell-shade)" />
      <path d="M20 9 Q19.5 5 22 3" stroke="var(--primary)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M22 3.5 C24 1 28 1 29 2.5 C27 4.5 24 5 22 3.5 Z" fill="var(--primary)" />
    </svg>
  );
}

// `compact` se conserva por compatibilidad con los lugares que ya usan <Brand compact />.
export function Brand({ className }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark />
      <span className="font-display text-xl font-extrabold tracking-tight text-foreground">AKTIVA</span>
    </span>
  );
}
