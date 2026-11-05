import { describe, expect, it } from "vitest";
import { isHabitScheduled } from "./engine";
import { habitFrequencyLabel, revisedHabitSchedule } from "./habit-schedule";
import type { Habit } from "./types";

describe("Texto de la frecuencia", () => {
  it.each([
    [{ frequency: "daily", days: [] }, "Todos los días"],
    [{ frequency: "specific", days: [0, 1, 2, 3, 4, 5, 6] }, "Todos los días"],
    [{ frequency: "specific", days: [4, 2, 0, 1, 3] }, "De lunes a viernes"],
    [{ frequency: "specific", days: [6, 5] }, "Fines de semana"],
    [{ frequency: "specific", days: [1] }, "Los martes"],
    [{ frequency: "specific", days: [5] }, "Los sábados"],
    [{ frequency: "specific", days: [1, 3] }, "Mar y jue"],
    [{ frequency: "specific", days: [4, 0, 2] }, "Lun, mié y vie"],
  ] as const)("%o → %s", (habit, label) => {
    expect(habitFrequencyLabel({ frequency: habit.frequency, days: [...habit.days] })).toBe(label);
  });
});

describe("Vigencia de la frecuencia", () => {
  it("aplica desde mañana en cambio de año y conserva el día original", () => {
    const habit: Habit = { id: "h", title: "Leer", createdAt: "2026-01-01T00:00:00Z", frequency: "daily", days: [] };
    const revised = { ...habit, frequency: "specific" as const, days: [5], scheduleHistory: revisedHabitSchedule(habit, "specific", [5], "2026-12-31") };
    expect(isHabitScheduled(revised, "2026-12-31")).toBe(true);
    expect(isHabitScheduled(revised, "2027-01-01")).toBe(false);
    expect(isHabitScheduled(revised, "2027-01-02")).toBe(true);
  });
  it("conserva versiones anteriores al editar en varios días", () => {
    const habit: Habit = { id: "h", title: "Leer", createdAt: "2026-01-01T00:00:00Z", frequency: "specific", days: [6] };
    const first = { ...habit, frequency: "daily" as const, days: [], scheduleHistory: revisedHabitSchedule(habit, "daily", [], "2026-11-08") };
    const second = { ...first, frequency: "specific" as const, days: [2], scheduleHistory: revisedHabitSchedule(first, "specific", [2], "2026-11-09") };
    expect(isHabitScheduled(second, "2026-11-08")).toBe(true);
    expect(isHabitScheduled(second, "2026-11-09")).toBe(true);
    expect(isHabitScheduled(second, "2026-11-10")).toBe(false);
    expect(isHabitScheduled(second, "2026-11-11")).toBe(true);
  });
});
