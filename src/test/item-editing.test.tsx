import { useState, type ComponentType, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "@/lib/app-store";
import { EditSheet } from "@/components/constancia/EditSheet";
import { loadUser, saveUser, setSession } from "@/lib/storage";
import { computeStats, goalProgress, isHabitScheduled } from "@/lib/engine";
import type { UserData } from "@/lib/types";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({ options, useParams: () => ({ goalId: "g1" }) }),
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
import { Route as GoalRoute } from "@/routes/_authenticated.objetivos.$goalId";
import { Route as TodayRoute } from "@/routes/_authenticated.hoy";
import { Route as HabitsRoute } from "@/routes/_authenticated.habitos";
const Goal = GoalRoute.options.component as ComponentType;
const Today = TodayRoute.options.component as ComponentType;
const Habits = HabitsRoute.options.component as ComponentType;
const email = "edicion@example.test";
const createdAt = "2026-11-02T17:00:00.000Z";
const today = "2026-11-05";

function fixture(): UserData {
  return {
    name: "Ana", email, timezone: "America/Bogota", maxStage: 0, seenBonusWeeks: [],
    goals: [{ id: "g1", title: "Parcial", createdAt }, { id: "g2", title: "Proyecto", createdAt }],
    tasks: [
      { id: "pending", title: "Leer", dueDate: "2026-11-10", goalId: "g1", createdAt },
      { id: "done", title: "Resumir", goalId: "g1", createdAt },
      { id: "closed", title: "Repasar", goalId: "g1", createdAt },
    ],
    habits: [
      { id: "on", title: "Estudiar", frequency: "daily", days: [], goalId: "g1", createdAt },
      { id: "off", title: "Biblioteca", frequency: "specific", days: [4], goalId: "g1", createdAt },
    ],
    completions: [
      { id: "ct", kind: "task", refId: "closed", localDay: "2026-11-04", atUTC: "2026-11-04T17:00:00.000Z" },
      { id: "cd", kind: "task", refId: "done", localDay: today, atUTC: "2026-11-05T16:00:00.000Z" },
      { id: "ch", kind: "habit", refId: "on", localDay: "2026-11-04", atUTC: "2026-11-04T18:00:00.000Z" },
    ],
  };
}

function Harness({ initial }: { initial: string }) {
  const app = useApp();
  const [view, setView] = useState(initial);
  if (!app.hydrated) return null;
  return <>
    <button onClick={() => setView("today")}>Vista Hoy</button>
    <button onClick={() => setView("habits")}>Vista hábitos</button>
    <button onClick={app.advanceDay}>Avanzar al día siguiente</button>
    <button onClick={app.simulateFailure}>Simular fallo de guardado</button>
    <button onClick={() => app.updateTask("closed", { title: "Cambio prohibido" })}>Intentar editar cerrada</button>
    {view === "today" ? <Today /> : view === "habits" ? <Habits /> : <Goal />}
    <EditSheet />
  </>;
}
async function open(view = "goal", data = fixture()) {
  saveUser(data); setSession(email);
  render(<AppProvider><Harness initial={view} /></AppProvider>);
  await screen.findByRole("button", { name: "Leer" }).catch(async () => { await screen.findByRole("button", { name: "Estudiar" }); });
}
function user() { const data = loadUser(email); if (!data) throw new Error("No fixture"); return data; }
function habit(id = "on") { const h = user().habits.find(h => h.id === id); if (!h) throw new Error("No habit"); return h; }
function missing(): never { throw new Error("Missing item"); }
function requiredGoal(data: UserData, index: number) { return data.goals[index] ?? missing(); }
function dialog() { return within(screen.getByRole("dialog")); }
function save() { fireEvent.click(dialog().getByRole("button", { name: "Guardar cambios" })); }
async function closed() { await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); }
function title(value: string) { fireEvent.change(dialog().getByLabelText("Título"), { target: { value } }); }

beforeEach(() => { localStorage.clear(); vi.spyOn(Date, "now").mockReturnValue(new Date("2026-11-05T17:00:00.000Z").getTime()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe("Edición compartida", () => {
  it.each(["goal", "today"])("edita título, fecha y objetivo de una tarea pendiente desde %s", async view => {
    await open(view);
    fireEvent.click(screen.getByRole("button", { name: "Leer" }));
    expect(dialog().getByLabelText("Título")).toHaveValue("Leer");
    expect(dialog().getByLabelText(/Fecha límite/)).toHaveValue("2026-11-10");
    title("Leer capítulo 5");
    fireEvent.change(dialog().getByLabelText(/Fecha límite/), { target: { value: "2026-11-12" } });
    fireEvent.change(dialog().getByLabelText(/Objetivo asociado/), { target: { value: "g2" } });
    save(); await closed();
    expect(user().tasks.find(t => t.id === "pending")).toEqual({ ...fixture().tasks[0], title: "Leer capítulo 5", dueDate: "2026-11-12", goalId: "g2" });
    expect(user().completions).toEqual(fixture().completions);
    expect(computeStats(user(), today)).toEqual(computeStats(fixture(), today));
  });

  it("edita una tarea completada hoy y recalcula los dos objetivos sin cambiar estadísticas", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Resumir" }));
    title("Resumen final");
    fireEvent.change(dialog().getByLabelText(/Objetivo asociado/), { target: { value: "g2" } });
    save(); await closed();
    const data = user();
    expect(goalProgress(requiredGoal(data, 0), data.tasks, data.habits, data.completions)).toMatchObject({ percent: 50, actions: 2 });
    expect(goalProgress(requiredGoal(data, 1), data.tasks, data.habits, data.completions)).toMatchObject({ percent: 100, actions: 1 });
    expect(data.completions).toEqual(fixture().completions);
    expect(computeStats(data, today)).toEqual(computeStats(fixture(), today));
  });

  it("permite quitar fecha y objetivo opcionales", async () => {
    await open(); fireEvent.click(screen.getByRole("button", { name: "Leer" }));
    fireEvent.change(dialog().getByLabelText(/Fecha límite/), { target: { value: "" } });
    fireEvent.change(dialog().getByLabelText(/Objetivo asociado/), { target: { value: "" } });
    save(); await closed();
    expect(user().tasks[0]?.dueDate).toBeUndefined(); expect(user().tasks[0]?.goalId).toBeUndefined();
  });

  it("impide editar tarea de día cerrado tanto desde la fila como desde el store", async () => {
    await open(); fireEvent.click(screen.getByText("Repasar", { exact: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Intentar editar cerrada"));
    expect(user().tasks[2]).toEqual(fixture().tasks[2]);
  });

  it("en 'Completadas en días anteriores' no se edita nada, ni tareas ni hábitos", async () => {
    await open("today");
    for (const id of ["prev-ct", "prev-ch"]) {
      const row = document.getElementById(`${id}-title`)?.closest("li") ?? missing();
      expect(within(row).queryByRole("button")).not.toBeInTheDocument();
      expect(within(row).getByRole("checkbox")).toBeDisabled();
      expect(within(row).getByText("Este día ya cerró")).toBeInTheDocument();
      fireEvent.click(document.getElementById(`${id}-title`) ?? missing());
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }
  });

  it("renombrar un hábito hoy no cambia cómo se ve en los días cerrados", async () => {
    await open("today");
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Estudiar" })[0] ?? missing());
    fireEvent.click(screen.getByText("Avanzar al día siguiente"));
    fireEvent.click(screen.getByText("Vista hábitos"));
    fireEvent.click(screen.getAllByRole("button", { name: "Estudiar" })[0] ?? missing());
    title("Estudiar con calma"); save(); await closed();
    fireEvent.click(screen.getByText("Vista Hoy"));
    const marked = user().completions.find(c => c.refId === "on" && c.localDay === today) ?? missing();
    expect(marked.title).toBe("Estudiar");
    expect(document.getElementById(`prev-${marked.id}-title`)).toHaveTextContent("Estudiar");
    expect(document.getElementById(`prev-${marked.id}-title`)).not.toHaveTextContent("calma");
    expect(screen.getAllByRole("button", { name: "Estudiar con calma" })[0]).toBeVisible();
  });

  it("tocar la casilla no abre la edición y el lápiz sí", async () => {
    await open(); fireEvent.click(screen.getByRole("checkbox", { name: "Leer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(user().completions).toHaveLength(4);
    const row = screen.getByRole("button", { name: "Leer" }).closest("li");
    if (!row) throw new Error("No row");
    fireEvent.click(within(row).getByRole("button", { name: "Editar" }));
    expect(dialog().getByLabelText("Título")).toHaveValue("Leer");
  });

  it.each(["goal", "today", "habits"])("edita título y objetivo de un hábito desde %s conservando historial y puntos", async view => {
    await open(view); fireEvent.click(screen.getAllByRole("button", { name: "Estudiar" })[0] ?? missing());
    title("Estudiar con calma");
    fireEvent.change(dialog().getByLabelText(/Objetivo asociado/), { target: { value: "g2" } });
    save(); await closed();
    expect(habit()).toMatchObject({ title: "Estudiar con calma", goalId: "g2", id: "on", createdAt });
    expect(user().completions).toEqual(fixture().completions);
    expect(computeStats(user(), today)).toEqual(computeStats(fixture(), today));
    const data = user();
    expect(goalProgress(requiredGoal(data, 0), data.tasks, data.habits, data.completions).actions).toBe(2);
    expect(goalProgress(requiredGoal(data, 1), data.tasks, data.habits, data.completions).actions).toBe(1);
  });

  it("quitar hoy mantiene el hábito hoy y aplica la frecuencia nueva mañana, incluso con ediciones repetidas", async () => {
    await open("habits"); fireEvent.click(screen.getAllByRole("button", { name: "Estudiar" })[0] ?? missing());
    fireEvent.click(dialog().getByLabelText("Días específicos"));
    fireEvent.click(dialog().getByLabelText("sábado"));
    save(); await closed();
    expect(isHabitScheduled(habit(), today)).toBe(true);
    expect(isHabitScheduled(habit(), "2026-11-06")).toBe(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Estudiar" })[0] ?? missing());
    fireEvent.click(dialog().getByLabelText("viernes"));
    save(); await closed();
    expect(habit().scheduleHistory).toHaveLength(2);
    expect(habit().scheduleHistory?.[1]?.effectiveFrom).toBe("2026-11-06");
    expect(isHabitScheduled(habit(), today)).toBe(true);
    expect(isHabitScheduled(habit(), "2026-11-06")).toBe(true);
    expect(isHabitScheduled(habit(), "2026-11-04")).toBe(true);
    fireEvent.click(screen.getByText("Vista Hoy"));
    expect(screen.getAllByRole("button", { name: "Estudiar" })[0] ?? missing()).toBeVisible();
    expect(user().completions).toEqual(fixture().completions);
  });

  it("agregar hoy no programa hoy; desde mañana usa la nueva frecuencia y sobrevive recarga", async () => {
    await open("habits"); fireEvent.click(screen.getByRole("button", { name: "Biblioteca" }));
    fireEvent.click(dialog().getByLabelText("Diaria")); save(); await closed();
    expect(isHabitScheduled(habit("off"), today)).toBe(false);
    expect(isHabitScheduled(habit("off"), "2026-11-06")).toBe(true);
    fireEvent.click(screen.getByText("Vista Hoy"));
    expect(screen.queryByRole("button", { name: "Biblioteca" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Avanzar al día siguiente"));
    expect(screen.getByRole("button", { name: "Biblioteca" })).toBeVisible();
    const persisted = user(); cleanup();
    await open("habits", persisted);
    expect(isHabitScheduled(habit("off"), today)).toBe(false);
  });

  it.each(["Leer", "Estudiar"])("valida título obligatorio al editar %s", async name => {
    await open(); fireEvent.click(screen.getByRole("button", { name }));
    title("   "); save();
    expect(dialog().getByLabelText("Título")).toHaveAttribute("aria-invalid", "true");
    expect(user()).toEqual(fixture());
  });

  it("valida al menos un día específico sin guardar ni cerrar", async () => {
    await open(); fireEvent.click(screen.getAllByRole("button", { name: "Estudiar" })[0] ?? missing());
    fireEvent.click(dialog().getByLabelText("Días específicos")); save();
    expect(dialog().getByRole("group", { name: "Días" })).toHaveAttribute("aria-describedby", "habit-days-error");
    expect(user()).toEqual(fixture());
  });

  it.each(["Leer", "Estudiar"])("fallo al editar %s conserva el formulario y reintenta sin cambiar puntos", async name => {
    await open(); fireEvent.click(screen.getByText("Simular fallo de guardado"));
    fireEvent.click(screen.getByRole("button", { name })); title(`${name} mejor`); save();
    expect(dialog().getByLabelText("Título")).toHaveValue(`${name} mejor`);
    expect(dialog().getByRole("alert")).toBeVisible();
    expect(user()).toEqual(fixture());
    fireEvent.click(dialog().getByRole("button", { name: "Reintentar" })); await closed();
    expect([...user().tasks, ...user().habits].some(item => item.title === `${name} mejor`)).toBe(true);
    expect(user().completions).toEqual(fixture().completions);
    expect(computeStats(user(), today)).toEqual(computeStats(fixture(), today));
  });
});
