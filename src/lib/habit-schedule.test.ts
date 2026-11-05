import { describe, expect, it } from "vitest";
import { isHabitScheduled } from "./engine";
import { revisedHabitSchedule } from "./habit-schedule";
import type { Habit } from "./types";

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
