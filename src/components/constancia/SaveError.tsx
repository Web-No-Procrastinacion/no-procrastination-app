import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const SAVE_ERROR_TEXT = "No pudimos guardar tu cambio. Revisa tu conexión e inténtalo de nuevo.";

/** Aviso de fallo de guardado con botón "Reintentar". */
export function SaveErrorNotice({ className }: { className?: string }) {
  const { saveError } = useApp();
  if (!saveError) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-error-border bg-destructive-soft p-4 text-destructive",
        className,
      )}
    >
      <CloudOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-bold">{SAVE_ERROR_TEXT}</p>
        <Button type="button" variant="destructive" size="sm" className="mt-3" onClick={saveError.retry}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
