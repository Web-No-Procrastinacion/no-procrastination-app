import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, Flame, PartyPopper, Repeat, Sprout, Star, X } from "lucide-react";
import { ItemRow } from "@/components/constancia/ItemRow";
import { AddFab, EmptyState, useAddMenu } from "@/components/constancia/AppChrome";
import { Avatar } from "@/components/constancia/Avatar";
import { gamification } from "@/config/gamification";
import { useApp } from "@/lib/app-store";
import { addDays, formatDayLong, formatDayShort } from "@/lib/dates";
import { habitCompletion, isHabitScheduled, taskCompletion } from "@/lib/engine";
import { habitScheduleOn } from "@/lib/habit-schedule";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/hoy")({
  head: () => ({
    meta: [
      { title: "Hoy — AKTIVA" },
      { name: "description", content: "Tus hábitos y tareas de hoy, tu racha y tus puntos en un solo lugar." },
      { property: "og:title", content: "Hoy — AKTIVA" },
      { property: "og:description", content: "Tus hábitos y tareas de hoy en AKTIVA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Hoy,
});


function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: typeof Repeat }) {
  return (
    <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-xl font-semibold">
      {Icon && <Icon className="h-5 w-5 text-icon-accent" aria-hidden />}
      {children}
    </h2>
  );
}

function Hoy() {
  const { data, stats, today, toggleTask, toggleHabit, plusOneKey, markBonusSeen } = useApp();
  const openAdd = useAddMenu();
  const [shownBonus, setShownBonus] = useState<string[]>([]);

  // Bono semanal: se muestra una sola vez y queda registrado.
  useEffect(() => {
    if (!data || !stats) return;
    const unseen = stats.bonusWeeks.filter((w) => !data.seenBonusWeeks.includes(w));
    if (unseen.length > 0) {
      setShownBonus(unseen);
      markBonusSeen(unseen);
    }
  }, [data, stats, markBonusSeen]);

  if (!data || !stats) return null;

  const firstName = data.name.split(" ")[0] || data.name;
  const habitsToday = data.habits.filter((h) => isHabitScheduled(h, today));
  const pendingHabits = habitsToday.filter((h) => !habitCompletion(data.completions, h.id, today));
  const pendingTasks = data.tasks
    .filter((t) => !taskCompletion(data.completions, t.id))
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const titleOf = (kind: "task" | "habit", refId: string) =>
    (kind === "task" ? data.tasks.find((t) => t.id === refId) : data.habits.find((h) => h.id === refId))?.title ??
    "Elemento eliminado";
  const doneToday = data.completions.filter((c) => c.localDay === today);
  const weekAgo = addDays(today, -7);
  const doneBefore = data.completions
    .filter((c) => c.localDay < today && c.localDay >= weekAgo)
    .sort((a, b) => b.atUTC.localeCompare(a.atUTC));

  const min = gamification.minTareasRacha;
  const dayProgress =
    stats.todayCount >= min
      ? `¡${Math.min(stats.todayCount, min)} de ${min}! Hoy cuenta para tu racha al cerrar el día`
      : `${stats.todayCount} de ${min} para tu racha`;

  const dueLabel = (d?: string) => {
    if (!d) return undefined;
    if (d === today) return "Vence hoy";
    if (d === addDays(today, 1)) return "Vence mañana";
    if (d < today) return `Tenía fecha el ${formatDayShort(d)}`;
    return `Vence el ${formatDayShort(d)}`;
  };

  return (
    <div>
      <p className="text-muted-foreground first-letter:uppercase">{formatDayLong(today)}</p>
      <h1 className="font-display text-[28px] font-extrabold">Hola, {firstName}</h1>

      {shownBonus.length > 0 && (
        <div role="status" className="mt-5 flex items-center gap-3 success-surface rounded-2xl p-4 shadow-soft animate-pop-in">
          <PartyPopper className="h-6 w-6 shrink-0" aria-hidden />
          <p className="flex-1 font-bold">¡Cumpliste tu meta semanal! +{gamification.puntosMetaSemanal} puntos</p>
          <button
            type="button"
            onClick={() => setShownBonus([])}
            aria-label="Cerrar mensaje"
            className="tap-target grid place-items-center rounded-full hover:bg-warm-foreground/15"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}

      <section aria-label="Resumen" className="summary-surface relative mt-5 p-5">
        <div className="flex items-start gap-4">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
            <div className="relative">
              <span className="icon-tile mb-2 grid h-10 w-10 place-items-center"><Star className="h-5 w-5" aria-hidden /></span>
              <p className="text-sm font-bold text-muted-foreground">Puntos</p>
              <p className="font-display text-[28px] font-extrabold">{stats.points}</p>
              {plusOneKey > 0 && (
                <span
                  key={plusOneKey}
                  className="pointer-events-none absolute left-14 top-4 rounded-full bg-primary px-2.5 py-0.5 text-sm font-bold text-primary-foreground animate-float-up"
                  aria-hidden
                >
                  +1 punto
                </span>
              )}
            </div>
            <div>
              <span className="icon-tile mb-2 grid h-10 w-10 place-items-center"><Flame className="h-5 w-5" aria-hidden /></span>
              <p className="text-sm font-bold text-muted-foreground">Racha</p>
              <p className="font-display text-[28px] font-extrabold">
                {stats.streak} {stats.streak === 1 ? "día" : "días"}
              </p>
            </div>
          </div>
          <Link to="/progreso" aria-label="Ver tu progreso y tu avatar" className="rounded-2xl bg-card/70 p-1">
            <Avatar stage={stats.displayStage} size={72} decorative />
          </Link>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm font-bold">
            <span>{dayProgress}</span>
          </div>
          <div
            className="mt-2 h-3 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Progreso del día para la racha"
            aria-valuemin={0}
            aria-valuemax={min}
            aria-valuenow={Math.min(stats.todayCount, min)}
          >
            <div
              className="progress-fill h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (stats.todayCount / min) * 100)}%` }}
            />
          </div>
        </div>
        {stats.streak === 0 && stats.streakReset && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-card/80 p-3">
            <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
            <span>Tu racha volvió a empezar. Cada día es una nueva oportunidad 🌱</span>
          </p>
        )}
        <p className="sr-only" aria-live="polite">
          {stats.points} puntos. {dayProgress}.
        </p>
      </section>

      <SectionTitle icon={Repeat}>Hábitos de hoy</SectionTitle>
      {habitsToday.length === 0 ? (
        <EmptyState
          title="No tienes hábitos para hoy"
          text="Los hábitos te ayudan a avanzar con pasos pequeños y repetidos."
          action="Crear un hábito"
          onAction={() => openAdd("habit")}
        />
      ) : pendingHabits.length === 0 ? (
        <p className="success-surface rounded-2xl p-4 font-semibold">
          Completaste tus hábitos de hoy. ¡Bien hecho!
        </p>
      ) : (
        <ul className="space-y-2">
          {pendingHabits.map((h) => (
            <ItemRow
              key={h.id}
              id={`habit-${h.id}`}
              title={h.title}
              editItem={{ kind: "habit", id: h.id }}
              meta={habitScheduleOn(h, today).frequency === "daily" ? "Diario" : "Hoy está programado"}
              checked={false}
              onToggle={() => toggleHabit(h.id)}
            />
          ))}
        </ul>
      )}

      <Button asChild variant="link" className="mt-2 h-11 px-0"><Link to="/habitos">Ver todos mis hábitos</Link></Button>

      <SectionTitle icon={CalendarDays}>Tareas pendientes</SectionTitle>
      {pendingTasks.length === 0 ? (
        <EmptyState
          title="No tienes tareas pendientes"
          text="Anota lo próximo que quieras hacer; con un título basta."
          action="Crear una tarea"
          onAction={() => openAdd("task")}
        />
      ) : (
        <ul className="space-y-2">
          {pendingTasks.map((t) => (
            <ItemRow
              key={t.id}
              id={`task-${t.id}`}
              title={t.title}
              editItem={{ kind: "task", id: t.id }}
              meta={dueLabel(t.dueDate)}
              checked={false}
              onToggle={() => toggleTask(t.id)}
            />
          ))}
        </ul>
      )}

      <SectionTitle>Completadas hoy</SectionTitle>
      {doneToday.length === 0 ? (
        <p className="text-muted-foreground">Aún no has completado nada hoy. Empieza por algo pequeño.</p>
      ) : (
        <ul className="space-y-2">
          {doneToday.map((c) => (
            <ItemRow
              key={c.id}
              id={`done-${c.id}`}
              title={titleOf(c.kind, c.refId)}
              editItem={{ kind: c.kind, id: c.refId }}
              meta={c.kind === "habit" ? "Hábito · puedes desmarcarlo hoy" : "Tarea · puedes desmarcarla hoy"}
              checked
              onToggle={() => (c.kind === "task" ? toggleTask(c.refId) : toggleHabit(c.refId))}
            />
          ))}
        </ul>
      )}

      <details className="group mt-8 rounded-2xl border border-border bg-card/60">
        <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 py-3 font-display text-lg font-semibold">
          Completadas en días anteriores
          <span className="flex items-center gap-2 font-sans text-sm font-bold text-muted-foreground">
            {doneBefore.length}
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </summary>
        <div className="px-3 pb-3">
          <p className="mb-2 px-1 text-sm text-muted-foreground">Últimos 7 días</p>
          {doneBefore.length === 0 ? (
            <p className="px-1 pb-2 text-muted-foreground">Aquí verás lo que completes en los próximos días.</p>
          ) : (
            <ul className="space-y-2">
              {doneBefore.map((c) => (
                <ItemRow
                  key={c.id}
                  id={`prev-${c.id}`}
                  title={c.title ?? titleOf(c.kind, c.refId)}
                  meta={`${c.kind === "habit" ? "Hábito" : "Tarea"} · ${formatDayShort(c.localDay)}`}
                  checked
                  disabled
                  closedNote
                />
              ))}
            </ul>
          )}
        </div>
      </details>

      <AddFab />
    </div>
  );
}
