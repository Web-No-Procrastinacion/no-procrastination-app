import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export function ItemRow({
  id,
  title,
  meta,
  checked,
  disabled,
  onToggle,
  closedNote,
  editItem,
}: {
  id: string;
  title: string;
  meta?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  closedNote?: boolean;
  editItem?: { kind: "task" | "habit"; id: string };
}) {
  const { openEdit } = useApp();
  // Lo de un día cerrado no se edita, sea tarea o hábito (CA-G8). Los hábitos se editan desde sus filas de hoy.
  const canEdit = !!editItem && !closedNote;
  const edit = () => { if (editItem && canEdit) openEdit(editItem.kind, editItem.id); };
  return (
    <li className={cn("card-surface flex items-center gap-3 px-4 py-3", disabled && "bg-muted/60 shadow-none")}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={() => onToggle?.()}
        aria-labelledby={`${id}-title`}
        aria-describedby={closedNote ? `${id}-closed` : undefined}
      />
      <div className="min-w-0 flex-1 py-1">
        {canEdit ? (
          <Button variant="ghost" type="button" onClick={edit} className={cn("h-auto min-h-11 w-full justify-start whitespace-normal rounded-lg px-0 py-1 text-left font-bold leading-snug", checked && !disabled && "text-muted-foreground line-through")}>
            <span id={`${id}-title`} className="min-w-0 break-words">{title}</span>
          </Button>
        ) : <span id={`${id}-title`} className={cn("block break-words font-bold leading-snug", checked && !disabled && "text-muted-foreground line-through")}>{title}</span>}
        {meta && <span className="mt-0.5 block text-sm text-muted-foreground">{meta}</span>}
        {closedNote && (
          <span id={`${id}-closed`} className="mt-0.5 block text-sm text-muted-foreground">
            Este día ya cerró
          </span>
        )}
      </div>
      {canEdit && <Button variant="ghost" size="icon" type="button" className="h-11 w-11 shrink-0" aria-label="Editar" title="Editar" onClick={edit}>
        <Pencil className="h-5 w-5" aria-hidden />
      </Button>}
    </li>
  );
}

