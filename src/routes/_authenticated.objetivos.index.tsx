import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/constancia/AppChrome";
import { BottomSheet, GoalForm } from "@/components/constancia/Forms";
import { GoalProgressView } from "@/components/constancia/GoalProgress";
import { useApp } from "@/lib/app-store";
import { formatDayMedium } from "@/lib/dates";
import { goalProgress } from "@/lib/engine";

export const Route = createFileRoute("/_authenticated/objetivos/")({
  head: () => ({
    meta: [
      { title: "Objetivos — AKTIVA" },
      { name: "description", content: "Tus metas de mediano plazo y cuánto has avanzado en cada una." },
      { property: "og:title", content: "Objetivos — AKTIVA" },
      { property: "og:description", content: "Tus metas y su avance en AKTIVA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Objetivos,
});

function Objetivos() {
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  if (!data) return null;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-extrabold">Objetivos</h1>
          <p className="text-muted-foreground">Avanzan con las tareas y hábitos que les asocias.</p>
        </div>
      </div>
      <Button className="mt-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Nuevo objetivo
      </Button>

      <div className="mt-6">
        {data.goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Aún no tienes objetivos"
            text="Un objetivo es una meta de mediano plazo, como aprobar una materia."
            action="Crear un objetivo"
            onAction={() => setOpen(true)}
          />
        ) : (
          <ul className="space-y-3">
            {data.goals.map((g) => {
              const p = goalProgress(g, data.tasks, data.habits, data.completions);
              return (
                <li key={g.id}>
                  <Link
                    to="/objetivos/$goalId"
                    params={{ goalId: g.id }}
                    className="card-surface block p-5 transition-shadow hover:shadow-lift"
                  >
                    <div className="flex items-start gap-3">
                      <span className="icon-tile grid h-11 w-11 shrink-0 place-items-center" aria-hidden>
                        <Target className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-xl font-semibold leading-snug">{g.title}</h2>
                        {g.targetDate && (
                          <p className="mt-2 flex items-start gap-1 rounded-2xl bg-primary-soft px-2.5 py-1 text-sm text-foreground">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>Fecha meta: {formatDayMedium(g.targetDate)}</span>
                          </p>
                        )}
                        <div className="mt-3">
                          <GoalProgressView p={p} />
                        </div>
                      </div>
                      <ChevronRight className="mt-2 h-5 w-5 text-muted-foreground" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomSheet open={open} onOpenChange={setOpen} title="Nuevo objetivo" focusRef={ref}>
        <GoalForm onDone={() => setOpen(false)} focusRef={ref} />
      </BottomSheet>
    </div>
  );
}
