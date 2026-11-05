import { createFileRoute } from "@tanstack/react-router";
import { Check, Flame, Star, Target } from "lucide-react";
import { Avatar } from "@/components/constancia/Avatar";
import { gamification } from "@/config/gamification";
import { useApp } from "@/lib/app-store";
import { addDays, weekdayIndex, weekdayLetters, formatDayLong } from "@/lib/dates";
import { countsByDay, dayCountsForStreak, pointsToNextStage } from "@/lib/engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/progreso")({
  head: () => ({
    meta: [
      { title: "Tu progreso — AKTIVA" },
      { name: "description", content: "Tu avatar, tus puntos, tu racha, tu meta semanal y los últimos 14 días." },
      { property: "og:title", content: "Tu progreso — AKTIVA" },
      { property: "og:description", content: "Mira cómo crece tu avatar con tu constancia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Progreso,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="summary-surface p-4">
      <span className="icon-tile mb-3 grid h-10 w-10 place-items-center">{label === "Racha" ? <Flame className="h-5 w-5" aria-hidden /> : <Star className="h-5 w-5" aria-hidden />}</span>
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Progreso() {
  const { data, stats, today } = useApp();
  if (!data || !stats) return null;
  const g = gamification;
  const stage = stats.displayStage;
  const missing = pointsToNextStage(stage, stats.points);
  const counts = countsByDay(data.completions);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const weekMet = stats.weekCount >= g.metaSemanalTareas;

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold">Tu progreso</h1>

      <section aria-label="Avatar" className="summary-surface mt-5 p-6 text-center">
        <Avatar stage={stage} size={176} className="mx-auto" />
        <p className="mt-2 text-sm font-semibold uppercase text-muted-foreground">Etapa {stage + 1} de 6</p>
        <h2 className="font-display text-xl font-semibold">{g.etapasAvatar[stage]}</h2>
        <p className="mt-1">
          {missing === null
            ? "Llegaste a la etapa más alta. ¡Qué constancia!"
            : `Te faltan ${missing} ${missing === 1 ? "punto" : "puntos"} para la siguiente etapa`}
        </p>
      </section>

      <section aria-labelledby="etapas-title" className="mt-6">
        <h2 id="etapas-title" className="sr-only">
          Etapas del avatar
        </h2>
        <ol className="flex items-end justify-between gap-1 overflow-x-auto rounded-2xl bg-card/60 px-2 py-3">
          {g.etapasAvatar.map((name, i) => {
            const reached = i <= stage;
            return (
              <li key={name} className="flex min-w-[3.25rem] flex-col items-center text-center">
                <Avatar stage={i} size={48} silhouette={!reached} />
                <span className={cn("mt-1 text-xs font-bold", reached ? "text-foreground" : "text-muted-foreground")}>
                  {name}
                </span>
                <span className="text-xs text-muted-foreground">{i === 0 ? "0" : g.umbralesAvatar[i - 1]} pts</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Puntos totales" value={String(stats.points)} />
        <Stat label="Racha" value={`${stats.streak} ${stats.streak === 1 ? "día" : "días"}`} />
      </div>

      <section aria-labelledby="meta-title" className="summary-surface mt-3 p-4">
        <span className="icon-tile mb-3 grid h-10 w-10 place-items-center"><Target className="h-5 w-5" aria-hidden /></span>
        <h2 id="meta-title" className="text-sm font-bold text-muted-foreground">
          Meta semanal
        </h2>
        <p className="mt-1 font-bold">
          {Math.min(stats.weekCount, g.metaSemanalTareas)} de {g.metaSemanalTareas} tareas esta semana ·{" "}
          {weekMet ? `¡Lo lograste! +${g.puntosMetaSemanal} puntos al cerrar el domingo` : `+${g.puntosMetaSemanal} puntos al cerrar el domingo`}
        </p>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {Array.from({ length: g.metaSemanalTareas }, (_, i) => (
            <span
              key={i}
              className={cn("h-3 flex-1 rounded-full", i < stats.weekCount ? "progress-fill" : "bg-muted")}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="cal-title" className="card-surface mt-3 p-4">
        <h2 id="cal-title" className="font-display text-lg font-semibold">
          Últimos 14 días
        </h2>
        <p className="text-sm text-muted-foreground">
          Los días marcados cerraron con {g.minTareasRacha} o más completados y contaron para tu racha.
        </p>
        <ul className="mt-4 grid grid-cols-7 gap-2">
          {days.map((d) => {
            const count = counts.get(d) ?? 0;
            const isToday = d === today;
            const counted = !isToday && dayCountsForStreak(count);
            const status = isToday ? "en curso" : counted ? "contó para la racha" : "no contó para la racha";
            return (
              <li
                key={d}
                className="flex flex-col items-center gap-1"
                aria-label={`${formatDayLong(d)}: ${count} completados, ${status}`}
              >
                <span className="text-xs font-bold text-muted-foreground" aria-hidden>
                  {weekdayLetters[weekdayIndex(d)]}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "grid aspect-square w-full max-w-11 place-items-center rounded-xl text-sm font-bold",
                    counted && "bg-primary text-primary-foreground",
                    !counted && !isToday && "bg-muted text-muted-foreground",
                    isToday && "border-2 border-dashed border-primary text-foreground",
                  )}
                >
                  {counted ? <Check className="h-4 w-4" strokeWidth={3} /> : Number(d.slice(8))}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-md bg-primary" aria-hidden /> Contó para la racha
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-md bg-muted" aria-hidden /> No contó
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-md border-2 border-dashed border-primary" aria-hidden /> Hoy (en curso)
          </span>
        </div>
      </section>
    </div>
  );
}
