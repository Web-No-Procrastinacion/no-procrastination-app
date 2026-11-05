import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-bold text-destructive" role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function FieldLabel({ htmlFor, children, optional }: { htmlFor: string; children: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block font-bold">
      {children}
      {optional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
    </label>
  );
}
