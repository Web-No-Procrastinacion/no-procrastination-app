import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useApp } from "@/lib/app-store";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldError } from "./Field";

const titleText = "break-words font-display text-[28px] font-extrabold leading-tight tracking-normal";

/**
 * Nombre del objetivo que se cambia tocándolo, sin lápiz ni botón aparte.
 * Enter o tocar fuera guardan; Escape deja el nombre como estaba. Solo cambia el nombre.
 */
export function GoalTitle({ goal }: { goal: Goal }) {
  const { renameGoal, dismissSaveError } = useApp();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(goal.title);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLButtonElement>(null);
  const editingRef = useRef(false);
  const failedRef = useRef(false);
  const refocusRef = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (refocusRef.current) {
      refocusRef.current = false;
      titleRef.current?.focus();
    }
  }, [editing]);

  // El campo crece con el texto para que un nombre largo se vea completo, como el título.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 4}px`;
  }, [editing, value]);

  const start = () => {
    setValue(goal.title);
    setError("");
    failedRef.current = false;
    editingRef.current = true;
    setEditing(true);
  };

  const finish = (refocus: boolean) => {
    editingRef.current = false;
    refocusRef.current = refocus;
    setError("");
    setEditing(false);
  };

  const cancel = (refocus: boolean) => {
    if (failedRef.current) dismissSaveError();
    finish(refocus);
  };

  const save = (refocus: boolean) => {
    if (!editingRef.current) return;
    const next = value.trim();
    if (!next) {
      if (!refocus) return cancel(false); // tocar fuera con el campo vacío deja el nombre anterior
      setError("Escribe un nombre para el objetivo.");
      inputRef.current?.focus();
      return;
    }
    if (next === goal.title) return finish(refocus);
    if (!renameGoal(goal.id, next, () => finish(refocus))) failedRef.current = true;
  };

  if (!editing) {
    return (
      <>
        <h1 className={titleText}>
          <button
            ref={titleRef}
            type="button"
            onClick={start}
            aria-describedby="goal-title-hint"
            className="-mx-2 block min-h-11 w-[calc(100%+1rem)] cursor-text rounded-xl px-2 py-0.5 text-left transition-colors hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {goal.title}
          </button>
        </h1>
        <span id="goal-title-hint" className="sr-only">
          Toca el nombre para cambiarlo
        </span>
      </>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        save(true);
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        rows={1}
        onChange={(e) => {
          setValue(e.target.value.replace(/\s*\n\s*/g, " "));
          if (error) setError("");
        }}
        onBlur={() => save(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel(true);
          } else if (e.key === "Enter") {
            e.preventDefault();
            save(true);
          }
        }}
        aria-label="Nombre del objetivo"
        aria-invalid={!!error}
        aria-describedby={error ? "goal-name-error" : undefined}
        autoComplete="off"
        enterKeyHint="done"
        className={cn(
          titleText,
          "-mx-2 block min-h-11 w-[calc(100%+1rem)] resize-none overflow-hidden rounded-xl border-2 border-primary bg-card px-2 py-0.5 text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
          error && "border-destructive",
        )}
      />
      <FieldError id="goal-name-error">{error}</FieldError>
    </form>
  );
}
