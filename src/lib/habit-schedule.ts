import { addDays, weekdayLetters } from "./dates";
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

export function habitFrequencyLabel(habit: Pick<Habit, "frequency" | "days">) {
  if (habit.frequency === "daily" || habit.days.length === 7) return "Todos los días";
  const days = [...habit.days].sort((a, b) => a - b);
  if (days.join(",") === "0,1,2,3,4") return "L a V";
  return days.map(d => weekdayLetters[d]).join(" · ");
}
