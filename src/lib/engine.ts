import { gamification as g } from "@/config/gamification";
import { addDays, weekdayIndex, weekStart } from "./dates";
import type { Completion, Goal, Habit, Task, UserData } from "./types";
import { habitScheduleOn } from "./habit-schedule";

/** Solo cuentan los completados hasta el día actual de la app. */
function relevant(completions: Completion[], today: string) {
  return completions.filter((c) => c.localDay <= today);
}

export function countsByDay(completions: Completion[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of completions) m.set(c.localDay, (m.get(c.localDay) ?? 0) + 1);
  return m;
}

export function dayCountsForStreak(count: number) {
  return count >= g.minTareasRacha;
}

/** Racha que termina en `lastClosedDay` (incluido). */
export function streakEndingAt(counts: Map<string, number>, lastClosedDay: string): number {
  let streak = 0;
  let day = lastClosedDay;
  while (dayCountsForStreak(counts.get(day) ?? 0)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Racha actual: días cerrados consecutivos hasta ayer. El día en curso no suma. */
export function currentStreak(completions: Completion[], today: string): number {
  return streakEndingAt(countsByDay(relevant(completions, today)), addDays(today, -1));
}

/** La racha volvió a 0 al cerrar ayer, después de tener al menos un día. */
export function streakJustReset(completions: Completion[], today: string): boolean {
  const counts = countsByDay(relevant(completions, today));
  const yesterday = addDays(today, -1);
  if (dayCountsForStreak(counts.get(yesterday) ?? 0)) return false;
  return streakEndingAt(counts, addDays(today, -2)) > 0;
}

/** Lunes de cada semana cerrada (domingo < hoy) con la meta semanal cumplida. */
export function bonusWeeks(completions: Completion[], today: string): string[] {
  const perWeek = new Map<string, number>();
  for (const c of relevant(completions, today)) {
    const ws = weekStart(c.localDay);
    perWeek.set(ws, (perWeek.get(ws) ?? 0) + 1);
  }
  const result: string[] = [];
  for (const [ws, count] of perWeek) {
    const sunday = addDays(ws, 6);
    if (sunday < today && count >= g.metaSemanalTareas) result.push(ws);
  }
  return result.sort();
}

export function totalPoints(completions: Completion[], today: string): number {
  const base = relevant(completions, today).length * g.puntosPorTarea;
  const bonus = bonusWeeks(completions, today).length * g.puntosMetaSemanal;
  return Math.max(0, base + bonus);
}

export function stageForPoints(points: number): number {
  return g.umbralesAvatar.filter((t) => points >= t).length;
}

export function currentWeekCount(completions: Completion[], today: string): number {
  const ws = weekStart(today);
  return relevant(completions, today).filter((c) => c.localDay >= ws).length;
}

export function todayCount(completions: Completion[], today: string): number {
  return completions.filter((c) => c.localDay === today).length;
}

export function isHabitScheduled(habit: Habit, day: string): boolean {
  const schedule = habitScheduleOn(habit, day);
  if (schedule.frequency === "daily") return true;
  return schedule.days.includes(weekdayIndex(day));
}

export function taskCompletion(completions: Completion[], taskId: string) {
  return completions.find((c) => c.kind === "task" && c.refId === taskId);
}

export function habitCompletion(completions: Completion[], habitId: string, day: string) {
  return completions.find((c) => c.kind === "habit" && c.refId === habitId && c.localDay === day);
}

export function habitCompletionCount(completions: Completion[], habitId: string) {
  return completions.filter((c) => c.kind === "habit" && c.refId === habitId).length;
}

export interface GoalProgress {
  totalTasks: number;
  completedTasks: number;
  habitCount: number;
  habitInstances: number;
  actions: number;
  percent: number | null; // null = solo hábitos (no se muestra porcentaje)
  empty: boolean;
}

export function goalProgress(
  goal: Goal,
  tasks: Task[],
  habits: Habit[],
  completions: Completion[],
): GoalProgress {
  const gTasks = tasks.filter((t) => t.goalId === goal.id);
  const gHabits = habits.filter((h) => h.goalId === goal.id);
  const completedTasks = gTasks.filter((t) => taskCompletion(completions, t.id)).length;
  const habitInstances = gHabits.reduce(
    (sum, h) => sum + habitCompletionCount(completions, h.id),
    0,
  );
  const empty = gTasks.length === 0 && gHabits.length === 0;
  let percent: number | null;
  if (gTasks.length > 0) percent = Math.round((completedTasks / gTasks.length) * 100);
  else if (gHabits.length > 0) percent = null;
  else percent = 0;
  return {
    totalTasks: gTasks.length,
    completedTasks,
    habitCount: gHabits.length,
    habitInstances,
    actions: completedTasks + habitInstances,
    percent,
    empty,
  };
}

export interface Stats {
  points: number;
  streak: number;
  stage: number;
  displayStage: number;
  todayCount: number;
  weekCount: number;
  streakReset: boolean;
  bonusWeeks: string[];
}

export function computeStats(data: UserData, today: string): Stats {
  const points = totalPoints(data.completions, today);
  const stage = stageForPoints(points);
  return {
    points,
    streak: currentStreak(data.completions, today),
    stage,
    displayStage: Math.max(stage, data.maxStage),
    todayCount: todayCount(data.completions, today),
    weekCount: currentWeekCount(data.completions, today),
    streakReset: streakJustReset(data.completions, today),
    bonusWeeks: bonusWeeks(data.completions, today),
  };
}

export function pointsToNextStage(stage: number, points: number): number | null {
  if (stage >= g.umbralesAvatar.length) return null;
  return Math.max(0, (g.umbralesAvatar[stage] ?? 0) - points);
}
