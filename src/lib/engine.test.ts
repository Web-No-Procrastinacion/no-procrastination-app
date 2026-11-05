import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import {
  bonusWeeks,
  currentStreak,
  goalProgress,
  stageForPoints,
  streakJustReset,
  totalPoints,
} from "./engine";
import { exampleUserData } from "./seed";
import type { Completion, Goal, Habit, Task } from "./types";

let n = 0;
const c = (localDay: string, kind: "task" | "habit" = "task", refId?: string): Completion => ({
  id: `c${n++}`,
  kind,
  refId: refId ?? `r${n}`,
  localDay,
  atUTC: `${localDay}T15:00:00.000Z`,
});

// 2026-11-05 es jueves.
const TODAY = "2026-11-05";

describe("reglas de gamificación", () => {
  it("1 punto por cada tarea o instancia de hábito completada", () => {
    expect(totalPoints([c(TODAY), c(TODAY, "habit")], TODAY)).toBe(2);
  });

  it("el día en curso no suma a la racha hasta que cierre", () => {
    const list = [c(TODAY), c(TODAY)];
    expect(currentStreak(list, TODAY)).toBe(0);
    expect(currentStreak(list, addDays(TODAY, 1))).toBe(1);
  });

  it("un día cerrado con menos de 2 completados reinicia la racha a 0", () => {
    const y = addDays(TODAY, -1);
    const list = [c(addDays(TODAY, -2)), c(addDays(TODAY, -2)), c(y)];
    expect(currentStreak(list, TODAY)).toBe(0);
    expect(streakJustReset(list, TODAY)).toBe(true);
  });

  it("tareas e instancias de hábito cuentan igual para la racha", () => {
    const y = addDays(TODAY, -1);
    expect(currentStreak([c(y, "task"), c(y, "habit")], TODAY)).toBe(1);
  });

  it("la meta semanal (5) da +5 una sola vez, solo al cerrar el domingo", () => {
    // Semana del lunes 2026-10-26 al domingo 2026-11-01.
    const week = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-11-01"].map((d) =>
      c(d),
    );
    expect(totalPoints(week, "2026-11-01")).toBe(5); // domingo aún abierto
    expect(totalPoints(week, "2026-11-02")).toBe(10); // cerró el domingo
    expect(totalPoints(week, "2026-11-20")).toBe(10); // no vuelve a sumar
    expect(bonusWeeks(week.slice(0, 4), "2026-11-02")).toEqual([]);
  });

  it("umbrales del avatar en 10/35/75/130/200 puntos", () => {
    expect(stageForPoints(9)).toBe(0);
    expect(stageForPoints(10)).toBe(1);
    expect(stageForPoints(34)).toBe(1);
    expect(stageForPoints(35)).toBe(2);
    expect(stageForPoints(75)).toBe(3);
    expect(stageForPoints(130)).toBe(4);
    expect(stageForPoints(200)).toBe(5);
  });

  it("los puntos nunca son negativos", () => {
    expect(totalPoints([], TODAY)).toBe(0);
  });
});

describe("avance del objetivo", () => {
  const goal: Goal = { id: "g", title: "G", createdAt: "" };
  const t = (id: string, goalId?: string): Task => ({ id, title: id, goalId, createdAt: "" });
  const h = (id: string, goalId?: string): Habit => ({
    id,
    title: id,
    frequency: "daily",
    days: [],
    goalId,
    createdAt: "",
  });

  it("porcentaje solo con tareas; los hábitos suben el contador", () => {
    const tasks = [t("a", "g"), t("b", "g"), t("c", "g"), t("d", "g")];
    const habits = [h("x", "g")];
    const done = [c(TODAY, "task", "a"), c(TODAY, "task", "b"), c(TODAY, "habit", "x")];
    const p = goalProgress(goal, tasks, habits, done);
    expect(p.percent).toBe(50);
    expect(p.completedTasks).toBe(2);
    expect(p.totalTasks).toBe(4);
    expect(p.actions).toBe(3);
  });

  it("solo hábitos: sin porcentaje, solo contador", () => {
    const done = Array.from({ length: 8 }, (_, i) => c(addDays(TODAY, -i), "habit", "x"));
    const p = goalProgress(goal, [], [h("x", "g")], done);
    expect(p.percent).toBeNull();
    expect(p.actions).toBe(8);
  });

  it("sin nada asociado: 0 %", () => {
    const p = goalProgress(goal, [], [], []);
    expect(p.percent).toBe(0);
    expect(p.empty).toBe(true);
  });
});

describe("usuario de ejemplo", () => {
  // Se prueba con cada día de la semana como "hoy".
  for (let i = 0; i < 14; i++) {
    const day = addDays(TODAY, i);
    it(`puntos 25–34, etapa Eclosión y racha 5 (hoy = ${day})`, () => {
      const now = new Date(`${day}T15:00:00Z`);
      const data = exampleUserData(now);
      const points = totalPoints(data.completions, day);
      expect(points).toBeGreaterThanOrEqual(25);
      expect(points).toBeLessThanOrEqual(34);
      expect(stageForPoints(points)).toBe(1);
      expect(currentStreak(data.completions, day)).toBe(5);
      const perDay = new Map<string, number>();
      data.completions.forEach((x) => perDay.set(x.localDay, (perDay.get(x.localDay) ?? 0) + 1));
      expect(perDay.get(addDays(day, -6))).toBe(1);
      for (const [d, count] of perDay) {
        if (d !== addDays(day, -6)) {
          expect(count).toBeGreaterThanOrEqual(2);
          expect(count).toBeLessThanOrEqual(4);
        }
      }
      expect(data.completions.filter((x) => x.kind === "task")).toHaveLength(6);
    });
  }
});
