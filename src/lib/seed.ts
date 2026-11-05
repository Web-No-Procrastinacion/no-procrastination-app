import { gamification } from "@/config/gamification";
import { addDays, localDayOf, weekdayIndex } from "./dates";
import { bonusWeeks, stageForPoints, totalPoints } from "./engine";
import type { Completion, Habit, Task, UserData } from "./types";

export const EXAMPLE_EMAIL = "valentina.rojas@ejemplo.edu.co";
export const EXAMPLE_NAME = "Valentina Rojas";

export function newId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function emptyUserData(name: string, email: string): UserData {
  return {
    name,
    email,
    timezone: gamification.zonaHorariaPorDefecto,
    tasks: [],
    habits: [],
    goals: [],
    completions: [],
    maxStage: 0,
    seenBonusWeeks: [],
  };
}

/** Hora en Bogotá (UTC-5, sin horario de verano) a ISO UTC. */
function bogotaISO(day: string, hour: number, minute = 0): string {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${day}T${hh}:${mm}:00-05:00`).toISOString();
}

type Slot = { kind: "task" | "habit"; refId: string };

/**
 * Datos de "Valentina Rojas" calculados en relación con `now`.
 * Historial de 12 días: 2 a 4 completados por día, salvo hace 6 días (solo 1),
 * para que la racha actual sea de 5 días. Puntos entre 25 y 34 (etapa "Eclosión").
 */
export function exampleUserData(now: Date): UserData {
  const tz = gamification.zonaHorariaPorDefecto;
  const today = localDayOf(now, tz);
  const created = bogotaISO(addDays(today, -20), 9);

  const goalId = "goal_semestre";
  const goals = [
    {
      id: goalId,
      title: "Aprobar el semestre con buen promedio",
      targetDate: addDays(today, 61),
      createdAt: created,
    },
  ];

  const habits: Habit[] = [
    {
      id: "habit_leer",
      title: "Leer 20 minutos",
      frequency: "specific",
      days: [0, 1, 2, 3, 4],
      goalId,
      createdAt: created,
    },
    {
      id: "habit_repasar",
      title: "Repasar apuntes",
      frequency: "daily",
      days: [],
      createdAt: created,
    },
  ];

  const pendingTasks: Task[] = [
    {
      id: "task_informe",
      title: "Entregar el informe de Ingeniería de Software",
      dueDate: addDays(today, 2),
      goalId,
      createdAt: created,
    },
    {
      id: "task_calculo",
      title: "Estudiar para el parcial de Cálculo",
      dueDate: addDays(today, 6),
      goalId,
      createdAt: created,
    },
    {
      id: "task_matricula",
      title: "Pagar la matrícula del próximo semestre",
      dueDate: addDays(today, 14),
      createdAt: created,
    },
  ];

  const doneTaskDefs: Array<{ title: string; goal?: boolean }> = [
    { title: "Hacer el taller de Probabilidad", goal: true },
    { title: "Enviar correo al profesor de Física" },
    { title: "Organizar los apuntes de Estructuras de Datos" },
    { title: "Preparar la exposición de Ética", goal: true },
    { title: "Inscribir la electiva de Inglés" },
    { title: "Imprimir la guía de laboratorio" },
  ];
  const doneTasks: Task[] = doneTaskDefs.map((d, i) => ({
    id: `task_done_${i + 1}`,
    title: d.title,
    goalId: d.goal ? goalId : undefined,
    createdAt: created,
  }));

  // Construcción de los días (de hace 12 días a ayer).
  const days: string[] = [];
  for (let i = 12; i >= 1; i--) days.push(addDays(today, -i));
  const lowDay = addDays(today, -6);

  const plan = new Map<string, Slot[]>();
  const taskQueue = doneTasks.map((t) => t.id);
  for (const day of days) {
    const weekend = weekdayIndex(day) >= 5;
    const slots: Slot[] = [{ kind: "habit", refId: "habit_repasar" }];
    if (day !== lowDay) {
      if (weekend) slots.push({ kind: "task", refId: taskQueue.shift()! });
      else slots.unshift({ kind: "habit", refId: "habit_leer" });
    }
    plan.set(day, slots);
  }

  const build = (): Completion[] => {
    const list: Completion[] = [];
    for (const day of days) {
      (plan.get(day) ?? []).forEach((s, idx) => {
        list.push({
          id: `c_${s.refId}_${day}`,
          kind: s.kind,
          refId: s.refId,
          localDay: day,
          atUTC: bogotaISO(day, 8 + idx * 4, 15 + idx * 7),
        });
      });
    }
    return list;
  };

  // Las tareas completadas restantes se reparten en días hábiles (de más reciente a más antiguo),
  // como tercer completado si los puntos siguen en el rango, o reemplazando "Repasar apuntes".
  const weekdays = days.filter((d) => d !== lowDay && weekdayIndex(d) < 5).reverse();
  let w = 0;
  while (taskQueue.length > 0 && weekdays.length > 0) {
    const day = weekdays[w % weekdays.length]!;
    w++;
    const slots = plan.get(day)!;
    if (slots.some((s) => s.kind === "task")) {
      if (w > weekdays.length * 2) break;
      continue;
    }
    const taskId = taskQueue.shift()!;
    slots.push({ kind: "task", refId: taskId });
    if (totalPoints(build(), today) > 34) {
      const i = slots.findIndex((s) => s.refId === "habit_repasar");
      slots.splice(i, 1);
    }
  }

  const titles = new Map<string, string>([...doneTasks, ...habits].map((i) => [i.id, i.title]));
  const completions = build().map((c) => ({ ...c, title: titles.get(c.refId) }));
  const points = totalPoints(completions, today);

  return {
    name: EXAMPLE_NAME,
    email: EXAMPLE_EMAIL,
    timezone: tz,
    tasks: [...pendingTasks, ...doneTasks.filter((t) => completions.some((c) => c.refId === t.id))],
    habits,
    goals,
    completions,
    maxStage: stageForPoints(points),
    seenBonusWeeks: bonusWeeks(completions, today),
  };
}
