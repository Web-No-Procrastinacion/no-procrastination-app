import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, CheckSquare, Link2, Plus, Repeat, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/constancia/AppChrome";
import { ItemRow } from "@/components/constancia/ItemRow";
import { BottomSheet, TaskForm } from "@/components/constancia/Forms";
import { GoalProgressView, actionsLabel } from "@/components/constancia/GoalProgress";
import { GoalTitle } from "@/components/constancia/GoalTitle";
import { useApp } from "@/lib/app-store";
import { formatDayMedium } from "@/lib/dates";
import { goalProgress, habitCompletion, habitCompletionCount, isHabitScheduled, taskCompletion } from "@/lib/engine";

export const Route = createFileRoute("/_authenticated/objetivos/$goalId")({
  head: () => ({
    meta: [
      { title: "Detalle del objetivo — AKTIVA" },
      { name: "description", content: "Avance, tareas y hábitos asociados a tu objetivo." },
      { property: "og:title", content: "Detalle del objetivo — AKTIVA" },
      { property: "og:description", content: "Avance, tareas y hábitos asociados a tu objetivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoalDetail,
});

function GoalDetail() {
  const { goalId } = Route.useParams();
  const { data, stats, today, associate, toggleTask, toggleHabit, plusOneKey } = useApp();
  const [sheet, setSheet] = useState<"closed" | "associate" | "task">("closed");
  const taskRef = useRef<HTMLInputElement>(null);
  const initialPlusOneKey = useRef(plusOneKey);
  if (!data) return null;

  const goal = data.goals.find((g) => g.id === goalId);
  if (!goal) {
    return (
      <div className="py-10 text-center">
        <h1 className="font-display text-2xl font-semibold">No encontramos este objetivo</h1>
        <Button asChild variant="soft" className="mt-4">
          <Link to="/objetivos">Volver a Objetivos</Link>
        </Button>
      </div>
    );
  }

  const p = goalProgress(goal, data.tasks, data.habits, data.completions);
  const tasks = data.tasks.filter((t) => t.goalId === goal.id);
  const habits = data.habits.filter((h) => h.goalId === goal.id);
  const freeTasks = data.tasks.filter((t) => !t.goalId);
  const freeHabits = data.habits.filter((h) => !h.goalId);

  return (
    <div>
      <Link to="/objetivos" className="tap-target -ml-2 inline-flex items-center gap-1 rounded-xl px-2 font-bold text-foreground">
        <ArrowLeft className="h-5 w-5" aria-hidden /> Objetivos
      </Link>
      <section aria-label="Avance" className="summary-surface mt-3 overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="icon-tile grid h-11 w-11 shrink-0 place-items-center">
            <Target className="h-6 w-6" aria-hidden />
          </span>
          {goal.targetDate && (
            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-foreground">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden /> Fecha meta: {formatDayMedium(goal.targetDate)}
            </span>
          )}
        </div>
        <GoalTitle key={goal.id} goal={goal} />
        <div className="mt-5 [&_[role=progressbar]]:mt-3 [&_[role=progressbar]]:h-3 [&_p]:text-base sm:[&_p]:text-2xl">
          <GoalProgressView p={p} large />
        </div>
        {p.percent !== null && (
          <p className="mt-4 flex items-center gap-2 font-bold text-foreground" aria-live="polite">
            <CheckSquare className="h-5 w-5 shrink-0" aria-hidden /> {actionsLabel(p.actions)}
          </p>
        )}
        {stats && (
          <div className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-base">
            <p><strong>{stats.points}</strong> puntos</p>
            <p>Racha: <strong>{stats.streak}</strong> {stats.streak === 1 ? "día" : "días"}</p>
            {plusOneKey > initialPlusOneKey.current && (
              <span key={plusOneKey} role="status" className="pointer-events-none absolute right-0 top-3 rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground animate-float-up">
                +1 punto
              </span>
            )}
            <span className="sr-only" aria-live="polite">{stats.points} puntos. Racha de {stats.streak} días. {stats.todayCount} completados hoy.</span>
          </div>
        )}
      </section>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {!p.empty && <Button variant="outline" onClick={() => setSheet("associate")}>
          <Link2 aria-hidden /> Asociar tareas o hábitos
        </Button>}
        <Button variant="soft" onClick={() => setSheet("task")}>
          <Plus aria-hidden /> Crear tarea asociada
        </Button>
      </div>

      {p.empty ? (
        <div className="mt-6">
          <EmptyState icon={Link2} title="Un primer paso para este objetivo" text="Cada pequeña acción cuenta. ¿Qué te gustaría hacer primero?" action="Asociar tareas o hábitos" onAction={() => setSheet("associate")} />
        </div>
      ) : <>
      <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-xl font-semibold"><CheckSquare className="h-5 w-5" aria-hidden />Tareas</h2>
      {tasks.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay tareas asociadas.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const completion = taskCompletion(data.completions, t.id);
            const closed = !!completion && completion.localDay !== today;
            return (
              <ItemRow key={t.id} id={`goal-task-${t.id}`} title={t.title}
                editItem={{ kind: "task", id: t.id }}
                checked={!!completion} disabled={closed} closedNote={closed}
                meta={t.dueDate ? <span className="text-base">Fecha: {formatDayMedium(t.dueDate)}</span> : undefined}
                onToggle={() => toggleTask(t.id)} />
            );
          })}
        </ul>
      )}

      <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-xl font-semibold"><Repeat className="h-5 w-5" aria-hidden />Hábitos</h2>
      {habits.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay hábitos asociados.</p>
      ) : (
        <ul className="space-y-2">
          {habits.map((h) => {
            const n = habitCompletionCount(data.completions, h.id);
            const scheduled = isHabitScheduled(h, today);
            return (
              <ItemRow key={h.id} id={`goal-habit-${h.id}`} title={h.title}
                editItem={{ kind: "habit", id: h.id }}
                checked={!!habitCompletion(data.completions, h.id, today)} disabled={!scheduled}
                onToggle={() => toggleHabit(h.id)}
                meta={<span className="text-base"><span className="block">Completado {n} {n === 1 ? "vez" : "veces"}</span>{!scheduled && <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-sm font-semibold text-foreground">No toca hoy</span>}</span>} />
            );
          })}
        </ul>
      )}
      </>}

      <BottomSheet
        open={sheet === "associate"}
        onOpenChange={(o) => !o && setSheet("closed")}
        title="Asociar al objetivo"
        description="Elige tareas o hábitos que aún no tienen objetivo."
      >
        {freeTasks.length === 0 && freeHabits.length === 0 ? (
          <p className="text-muted-foreground">
            No hay tareas ni hábitos sin objetivo. Puedes crear una tarea ya asociada.
          </p>
        ) : (
          <ul className="space-y-2">
            {freeTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <span className="flex-1">
                  <span className="block font-bold">{t.title}</span>
                  <span className="text-sm text-muted-foreground">Tarea</span>
                </span>
                <Button size="sm" variant="soft" onClick={() => associate("task", t.id, goal.id)}>
                  Asociar
                </Button>
              </li>
            ))}
            {freeHabits.map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <span className="flex-1">
                  <span className="block font-bold">{h.title}</span>
                  <span className="text-sm text-muted-foreground">Hábito</span>
                </span>
                <Button size="sm" variant="soft" onClick={() => associate("habit", h.id, goal.id)}>
                  Asociar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>

      <BottomSheet
        open={sheet === "task"}
        onOpenChange={(o) => !o && setSheet("closed")}
        title="Nueva tarea asociada"
        description={goal.title}
        focusRef={taskRef}
      >
        <TaskForm onDone={() => setSheet("closed")} fixedGoalId={goal.id} focusRef={taskRef} />
      </BottomSheet>
    </div>
  );
}
