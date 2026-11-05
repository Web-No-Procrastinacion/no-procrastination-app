import type { GoalProgress } from "@/lib/engine";

export function actionsLabel(n: number) {
  return `${n} ${n === 1 ? "acción completada" : "acciones completadas"}`;
}

export function GoalProgressView({ p, large }: { p: GoalProgress; large?: boolean }) {
  if (p.empty) {
    return (
      <div>
        <p className={large ? "font-display text-3xl font-semibold" : "font-bold"}>0 %</p>
        <p className="text-sm text-muted-foreground">Asocia tareas o hábitos para ver tu avance</p>
      </div>
    );
  }
  if (p.percent === null) {
    return <p className={large ? "font-display text-2xl font-semibold" : "font-bold"}>{actionsLabel(p.actions)}</p>;
  }
  const detail = `${p.percent} % · ${p.completedTasks} de ${p.totalTasks} ${p.totalTasks === 1 ? "tarea" : "tareas"}`;
  return (
    <div>
      <p className={large ? "font-display text-2xl font-semibold" : "font-bold"}>{detail}</p>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Avance del objetivo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p.percent}
        aria-valuetext={detail}
      >
        <div className="progress-fill h-full rounded-full transition-all duration-500" style={{ width: `${p.percent}%` }} />
      </div>
      {p.habitCount > 0 && !large && <p className="mt-1.5 text-sm text-muted-foreground">{actionsLabel(p.actions)}</p>}
    </div>
  );
}
