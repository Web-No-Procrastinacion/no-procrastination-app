import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useApp } from "@/lib/app-store";
import type { Habit, Task } from "@/lib/types";
import { weekdayLetters, weekdayNames } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { FieldError, FieldLabel } from "./Field";
import { SaveErrorNotice } from "./SaveError";

export const selectClass =
  "h-12 w-full rounded-xl border border-input bg-field px-4 text-base focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  focusRef?: React.RefObject<HTMLInputElement | null>;
}

export function BottomSheet({ open, onOpenChange, title, description, children, focusRef }: BottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border-0 bg-card px-5 pb-8 pt-6"
        onOpenAutoFocus={(e) => {
          if (focusRef?.current) {
            e.preventDefault();
            focusRef.current.focus();
          }
        }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <SheetHeader className="mb-5 pr-10 text-left">
          <SheetTitle className="font-display text-2xl">{title}</SheetTitle>
          {description ? (
            <SheetDescription className="text-base">{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{title}</SheetDescription>
          )}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

function GoalSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const { data } = useApp();
  if (!data || data.goals.length === 0) return null;
  return (
    <div>
      <FieldLabel htmlFor={id} optional>
        Objetivo asociado
      </FieldLabel>
      <select id={id} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Sin objetivo</option>
        {data.goals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TaskForm({
  onDone,
  fixedGoalId,
  focusRef,
  task,
}: {
  onDone: () => void;
  fixedGoalId?: string;
  task?: Task;
  focusRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const { addTask, updateTask } = useApp();
  const localRef = useRef<HTMLInputElement>(null);
  const ref = focusRef ?? localRef;
  const [title, setTitle] = useState(task?.title ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [goalId, setGoalId] = useState(task?.goalId ?? fixedGoalId ?? "");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Escribe un título para la tarea.");
      ref.current?.focus();
      return;
    }
    setError("");
    const input = { title, dueDate, goalId: fixedGoalId ?? goalId };
    const done = () => {
      setTitle("");
      setDueDate("");
      onDone();
    };
    if (task) updateTask(task.id, input, done);
    else addTask(input, done);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <SaveErrorNotice />
      <div>
        <FieldLabel htmlFor="task-title">Título</FieldLabel>
        <Input
          id="task-title"
          ref={ref}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej.: Leer el capítulo 4"
          aria-invalid={!!error}
          aria-describedby={error ? "task-title-error" : undefined}
          autoComplete="off"
        />
        <FieldError id="task-title-error">{error}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="task-due" optional>
          Fecha límite
        </FieldLabel>
        <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      {!fixedGoalId && <GoalSelect id="task-goal" value={goalId} onChange={setGoalId} />}
      <Button type="submit" size="lg" className="w-full">
        {task ? "Guardar cambios" : "Guardar"}
      </Button>
    </form>
  );
}

export function HabitForm({
  onDone,
  fixedGoalId,
  focusRef,
  habit,
}: {
  onDone: () => void;
  fixedGoalId?: string;
  habit?: Habit;
  focusRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const { addHabit, updateHabit } = useApp();
  const localRef = useRef<HTMLInputElement>(null);
  const ref = focusRef ?? localRef;
  const [title, setTitle] = useState(habit?.title ?? "");
  const [frequency, setFrequency] = useState<"daily" | "specific">(habit?.frequency ?? "daily");
  const [days, setDays] = useState<number[]>(habit?.days ?? []);
  const [goalId, setGoalId] = useState(habit?.goalId ?? fixedGoalId ?? "");
  const [titleError, setTitleError] = useState("");
  const [daysError, setDaysError] = useState("");

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const tErr = title.trim() ? "" : "Escribe un título para el hábito.";
    const dErr = frequency === "specific" && days.length === 0 ? "Elige al menos un día." : "";
    setTitleError(tErr);
    setDaysError(dErr);
    if (tErr) {
      ref.current?.focus();
      return;
    }
    if (dErr) return;
    const input = { title, frequency, days, goalId: fixedGoalId ?? goalId };
    const done = () => {
      setTitle("");
      setDays([]);
      onDone();
    };
    if (habit) updateHabit(habit.id, input, done);
    else addHabit(input, done);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <SaveErrorNotice />
      <div>
        <FieldLabel htmlFor="habit-title">Título</FieldLabel>
        <Input
          id="habit-title"
          ref={ref}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej.: Repasar 15 minutos"
          aria-invalid={!!titleError}
          aria-describedby={titleError ? "habit-title-error" : undefined}
          autoComplete="off"
        />
        <FieldError id="habit-title-error">{titleError}</FieldError>
      </div>
      <fieldset>
        <legend className="mb-2 font-bold">Frecuencia</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["daily", "Diaria"],
              ["specific", "Días específicos"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                "tap-target flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 font-bold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring",
                frequency === value ? "border-primary bg-primary-soft text-secondary-foreground" : "border-border bg-card",
              )}
            >
              <input
                type="radio"
                name="habit-frequency"
                value={value}
                checked={frequency === value}
                onChange={() => setFrequency(value)}
                className="h-5 w-5 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {frequency === "specific" && (
        <fieldset aria-describedby={daysError ? "habit-days-error" : undefined}>
          <legend className="mb-2 font-bold">Días</legend>
          <div className="flex flex-wrap gap-1.5">
            {weekdayLetters.map((letter, i) => {
              const on = days.includes(i);
              return (
                <label
                  key={letter}
                  className={cn(
                    "tap-target flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 font-bold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleDay(i)} aria-label={weekdayNames[i]} />
                  <span aria-hidden>{letter}</span>
                </label>
              );
            })}
          </div>
          <FieldError id="habit-days-error">{daysError}</FieldError>
        </fieldset>
      )}
      {!fixedGoalId && <GoalSelect id="habit-goal" value={goalId} onChange={setGoalId} />}
      <Button type="submit" size="lg" className="w-full">
        {habit ? "Guardar cambios" : "Guardar"}
      </Button>
    </form>
  );
}

export function GoalForm({
  onDone,
  focusRef,
}: {
  onDone: () => void;
  focusRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const { addGoal } = useApp();
  const localRef = useRef<HTMLInputElement>(null);
  const ref = focusRef ?? localRef;
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Escribe un título para el objetivo.");
      ref.current?.focus();
      return;
    }
    setError("");
    addGoal({ title, targetDate }, () => {
      setTitle("");
      setTargetDate("");
      onDone();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <SaveErrorNotice />
      <div>
        <FieldLabel htmlFor="goal-title">Título</FieldLabel>
        <Input
          id="goal-title"
          ref={ref}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej.: Aprobar Física II"
          aria-invalid={!!error}
          aria-describedby={error ? "goal-title-error" : undefined}
          autoComplete="off"
        />
        <FieldError id="goal-title-error">{error}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="goal-date" optional>
          Fecha meta
        </FieldLabel>
        <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </div>
      <Button type="submit" size="lg" className="w-full">
        Guardar
      </Button>
    </form>
  );
}
