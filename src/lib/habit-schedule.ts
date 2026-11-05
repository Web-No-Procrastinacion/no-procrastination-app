import { addDays, weekdayNames } from "./dates";
import type { Habit, HabitSchedule } from "./types";

export function habitScheduleOn(habit: Habit, day: string): Pick<Habit, "frequency" | "days"> {
  return [...(habit.scheduleHistory ?? [])]
    .filter(s => s.effectiveFrom <= day)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? habit;
}

export function revisedHabitSchedule(habit: Habit, frequency: Habit["frequency"], days: number[], today: string): HabitSchedule[] {
  const effectiveFrom = addDays(today, 1);
  const previous = habit.scheduleHistory ?? [{ frequency: habit.frequency, days: [...habit.days], effectiveFrom: "" }];
  return [...previous.filter(s => s.effectiveFrom < effectiveFrom), {
    frequency, days: frequency === "daily" ? [] : [...days].sort((a, b) => a - b), effectiveFrom,
  }];
}

const weekdayShort = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] as const;

/** Frecuencia corta y clara: "Todos los días", "De lunes a viernes", "Los martes", "Lun, mié y vie". */
export function habitFrequencyLabel(habit: Pick<Habit, "frequency" | "days">) {
  const days = [...new Set(habit.days)].sort((a, b) => a - b);
  if (habit.frequency === "daily" || days.length === 7) return "Todos los días";
  const key = days.join(",");
  if (key === "0,1,2,3,4") return "De lunes a viernes";
  if (key === "5,6") return "Fines de semana";
  if (days.length === 1) {
    const name = weekdayNames[days[0] ?? 0] ?? "lunes";
    return `Los ${name.endsWith("s") ? name : `${name}s`}`;
  }
  const names = days.map(d => weekdayShort[d]);
  const text = `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
