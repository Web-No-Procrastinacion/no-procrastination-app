import { useState, type ComponentType } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "@/lib/app-store";
import { loadUser, saveUser, setSession } from "@/lib/storage";
import type { UserData } from "@/lib/types";
import { goalProgress } from "@/lib/engine";
import { SaveErrorNotice } from "@/components/constancia/SaveError";

// Keep the real pages, rows and store; replace only routing, not completion logic.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({
    options,
    useParams: () => ({ goalId: "goal" }),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { Route as GoalRoute } from "@/routes/_authenticated.objetivos.$goalId";
import { Route as TodayRoute } from "@/routes/_authenticated.hoy";

const GoalDetail = GoalRoute.options.component as ComponentType;
const Today = TodayRoute.options.component as ComponentType;
const email = "objetivo@example.test";
const createdAt = "2026-11-02T17:00:00.000Z";

function fixture(): UserData {
  return {
    name: "Ana", email, timezone: "America/Bogota", maxStage: 0, seenBonusWeeks: [],
    goals: [{ id: "goal", title: "Preparar el parcial", targetDate: "2026-11-20", createdAt }],
    tasks: ["Leer", "Resumir", "Practicar", "Repasar"].map((title, i) => ({ id: `t${i}`, title, goalId: "goal", createdAt })),
    habits: [
      { id: "daily", title: "Estudiar", frequency: "daily", days: [], goalId: "goal", createdAt },
      { id: "off", title: "Biblioteca", frequency: "specific", days: [4], goalId: "goal", createdAt },
    ],
    completions: [
      { id: "old-task", kind: "task", refId: "t3", localDay: "2026-11-04", atUTC: "2026-11-04T18:00:00.000Z" },
      { id: "old-habit", kind: "habit", refId: "daily", localDay: "2026-11-04", atUTC: "2026-11-04T19:00:00.000Z" },
    ],
  };
}

function Harness() {
  const app = useApp();
  const [view, setView] = useState("goal");
  if (!app.hydrated) return null;
  return <>
    <button onClick={() => setView(view === "goal" ? "today" : "goal")}>Cambiar vista</button>
    <button onClick={app.simulateFailure}>Simular fallo de guardado</button>
    <button onClick={app.advanceDay}>Avanzar al día siguiente</button>
    <output data-testid="stats">{JSON.stringify(app.stats)}</output>
    {view === "goal" ? <GoalDetail /> : <Today />}
    <SaveErrorNotice />
  </>;
}

async function open(data = fixture()) {
  saveUser(data);
  setSession(email);
  render(<AppProvider><Harness /></AppProvider>);
  await screen.findByRole("heading", { name: "Preparar el parcial" });
}
function persisted() { return loadUser(email)?.completions ?? []; }
function stats() { return JSON.parse(screen.getByTestId("stats").textContent ?? "{}"); }
function box(title: string) {
  const current = screen.getAllByRole("checkbox", { name: new RegExp(`^${title}`) }).find(el => !el.id.startsWith("prev-"));
  if (!current) throw new Error(`No current checkbox for ${title}`);
  return current;
}
function progress() {
  const data = loadUser(email);
  const goal = data?.goals[0];
  if (!data || !goal) throw new Error("Missing goal fixture");
  return goalProgress(goal, data.tasks, data.habits, data.completions);
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Date, "now").mockReturnValue(new Date("2026-11-05T17:00:00.000Z").getTime());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe("Acciones desde el detalle del objetivo", () => {
  it("completa y desmarca una tarea con un punto por completado y avance 2 de 4", async () => {
    await open();
    fireEvent.click(box("Leer"));
    expect(box("Leer")).toBeChecked();
    expect(stats()).toMatchObject({ points: 3, todayCount: 1, streak: 1 });
    expect(progress()).toMatchObject({ percent: 50, completedTasks: 2, totalTasks: 4, actions: 3 });
    expect(persisted().filter(c => c.refId === "t0")).toHaveLength(1);
    expect(screen.getByRole("progressbar", { name: "Avance del objetivo" })).toHaveAttribute("aria-valuenow", "50");
    fireEvent.click(box("Leer"));
    expect(box("Leer")).not.toBeChecked();
    expect(stats()).toMatchObject({ points: 2, todayCount: 0, streak: 1 });
    expect(progress()).toMatchObject({ percent: 25, actions: 2 });
    expect(persisted().filter(c => c.refId === "t0")).toHaveLength(0);
    expect(screen.getByRole("progressbar", { name: "Avance del objetivo" })).toHaveAttribute("aria-valuenow", "25");
  });

  it("completa y desmarca solo la instancia de hoy del hábito sin cambiar el porcentaje", async () => {
    await open();
    fireEvent.click(box("Estudiar"));
    expect(stats()).toMatchObject({ points: 3, todayCount: 1 });
    expect(persisted().filter(c => c.refId === "daily")).toHaveLength(2);
    expect(progress()).toMatchObject({ percent: 25, habitInstances: 2, actions: 3 });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    fireEvent.click(box("Estudiar"));
    expect(stats()).toMatchObject({ points: 2, todayCount: 0 });
    expect(persisted().filter(c => c.refId === "daily")).toEqual([fixture().completions[1]]);
  });

  it("mantiene inmutable la tarea de un día cerrado", async () => {
    await open();
    expect(box("Repasar")).toBeChecked();
    expect(box("Repasar")).toBeDisabled();
    fireEvent.click(box("Repasar"));
    expect(persisted()).toEqual(fixture().completions);
  });

  it("impide completar un hábito que no toca hoy", async () => {
    await open();
    expect(box("Biblioteca")).toBeDisabled();
    fireEvent.click(box("Biblioteca"));
    expect(persisted().filter(c => c.refId === "off")).toHaveLength(0);
  });

  it("sincroniza tareas y hábitos en ambos sentidos con Hoy", async () => {
    await open();
    fireEvent.click(box("Leer"));
    fireEvent.click(box("Estudiar"));
    fireEvent.click(screen.getByText("Cambiar vista"));
    expect(box("Leer")).toBeChecked();
    expect(box("Estudiar")).toBeChecked();
    fireEvent.click(box("Leer"));
    fireEvent.click(box("Estudiar"));
    fireEvent.click(box("Resumir"));
    fireEvent.click(screen.getByText("Cambiar vista"));
    expect(box("Leer")).not.toBeChecked();
    expect(box("Estudiar")).not.toBeChecked();
    expect(box("Resumir")).toBeChecked();
    expect(stats()).toMatchObject({ points: 3, todayCount: 1 });
  });

  it.each(["Leer", "Estudiar"])("conserva %s y sus puntos ante fallos al completar o desmarcar, y permite reintentar", async title => {
    await open();
    const before = persisted();
    fireEvent.click(screen.getByText("Simular fallo de guardado"));
    fireEvent.click(box(title));
    expect(box(title)).not.toBeChecked();
    expect(persisted()).toEqual(before);
    expect(stats().points).toBe(2);
    expect(screen.getByRole("alert")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(box(title)).toBeChecked();
    expect(stats().points).toBe(3);
    fireEvent.click(screen.getByText("Simular fallo de guardado"));
    fireEvent.click(box(title));
    expect(box(title)).toBeChecked();
    expect(persisted()).toHaveLength(3);
    expect(stats().points).toBe(3);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(box(title)).not.toBeChecked();
    expect(persisted()).toEqual(before);
    expect(stats().points).toBe(2);
  });

  it("cuenta la racha solo al cerrar el día con dos acciones del detalle", async () => {
    await open();
    fireEvent.click(box("Leer"));
    fireEvent.click(box("Estudiar"));
    expect(stats()).toMatchObject({ streak: 1, todayCount: 2 });
    fireEvent.click(screen.getByText("Avanzar al día siguiente"));
    await waitFor(() => expect(stats()).toMatchObject({ streak: 2, todayCount: 0 }));
    expect(box("Leer")).toBeDisabled();
    expect(box("Estudiar")).not.toBeChecked();
  });

  describe("Cambiar el nombre del objetivo", () => {
    const savedGoal = () => loadUser(email)?.goals[0];
    const nameField = () => screen.getByRole("textbox", { name: "Nombre del objetivo" });
    const tapName = (name = "Preparar el parcial") =>
      fireEvent.click(within(screen.getByRole("heading", { level: 1, name })).getByRole("button"));
    const submit = () => fireEvent.submit(nameField().closest("form") ?? document.body);

    it("se cambia tocando el nombre, sin lápiz, y solo cambia el nombre", async () => {
      await open();
      const summary = screen.getByRole("region", { name: "Avance" });
      expect(within(summary).queryByRole("button", { name: /editar|lápiz|cambiar/i })).not.toBeInTheDocument();
      tapName();
      expect(nameField()).toHaveValue("Preparar el parcial");
      expect(nameField()).toHaveFocus();
      fireEvent.change(nameField(), { target: { value: "  Aprobar el parcial  " } });
      submit();
      expect(await screen.findByRole("heading", { level: 1, name: "Aprobar el parcial" })).toBeVisible();
      const before = fixture();
      const after = loadUser(email);
      expect(savedGoal()).toEqual({ ...before.goals[0], title: "Aprobar el parcial" });
      expect(after?.tasks).toEqual(before.tasks);
      expect(after?.habits).toEqual(before.habits);
      expect(after?.completions).toEqual(before.completions);
      expect(stats()).toMatchObject({ points: 2 });
    });

    it("tocar fuera guarda y Escape deja el nombre como estaba", async () => {
      await open();
      tapName();
      fireEvent.change(nameField(), { target: { value: "Nombre descartado" } });
      fireEvent.keyDown(nameField(), { key: "Escape" });
      expect(screen.getByRole("heading", { level: 1, name: "Preparar el parcial" })).toBeVisible();
      expect(savedGoal()?.title).toBe("Preparar el parcial");
      tapName();
      fireEvent.change(nameField(), { target: { value: "Aprobar Física II" } });
      fireEvent.blur(nameField());
      expect(await screen.findByRole("heading", { level: 1, name: "Aprobar Física II" })).toBeVisible();
      expect(savedGoal()?.title).toBe("Aprobar Física II");
    });

    it("no guarda un nombre vacío", async () => {
      await open();
      tapName();
      fireEvent.change(nameField(), { target: { value: "   " } });
      submit();
      expect(nameField()).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("Escribe un nombre para el objetivo.")).toBeVisible();
      expect(savedGoal()?.title).toBe("Preparar el parcial");
      fireEvent.blur(nameField());
      expect(screen.getByRole("heading", { level: 1, name: "Preparar el parcial" })).toBeVisible();
      expect(loadUser(email)).toEqual(fixture());
    });

    it("si falla el guardado conserva lo escrito y permite reintentar", async () => {
      await open();
      fireEvent.click(screen.getByText("Simular fallo de guardado"));
      tapName();
      fireEvent.change(nameField(), { target: { value: "Aprobar el parcial" } });
      submit();
      expect(nameField()).toHaveValue("Aprobar el parcial");
      expect(screen.getByRole("alert")).toBeVisible();
      expect(savedGoal()?.title).toBe("Preparar el parcial");
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
      expect(await screen.findByRole("heading", { level: 1, name: "Aprobar el parcial" })).toBeVisible();
      expect(savedGoal()?.title).toBe("Aprobar el parcial");
    });
  });

  it("muestra solo el contador si el objetivo tiene únicamente hábitos", async () => {
    const data = fixture();
    data.tasks = [];
    await open(data);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    fireEvent.click(box("Estudiar"));
    expect(stats().points).toBe(3);
    expect(persisted().filter(c => c.refId === "daily")).toHaveLength(2);
  });
});
