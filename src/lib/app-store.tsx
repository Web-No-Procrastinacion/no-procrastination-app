import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Context,
  type ReactNode,
} from "react";
import { localDayOf } from "./dates";
import { computeStats, habitCompletion, isHabitScheduled, taskCompletion, type Stats } from "./engine";
import { EXAMPLE_EMAIL, emptyUserData, exampleUserData, newId } from "./seed";
import {
  SaveError,
  getClockOffset,
  getSession,
  loadUser,
  normalizeEmail,
  saveUser,
  setClockOffset,
  setSession,
  simulateNextSaveFailure,
  userExists,
} from "./storage";
import type { UserData } from "./types";
import { revisedHabitSchedule } from "./habit-schedule";

const DAY_MS = 86_400_000;

type Mutator = (d: UserData) => UserData;

interface SaveErrorState {
  retry: () => void;
}

interface AppState {
  hydrated: boolean;
  data: UserData | null;
  stats: Stats | null;
  today: string;
  offsetDays: number;
  now: () => Date;
  saveError: SaveErrorState | null;
  dismissSaveError: () => void;
  celebration: number | null;
  closeCelebration: () => void;
  plusOneKey: number;
  editing: { kind: "task" | "habit"; id: string } | null;
  openEdit: (kind: "task" | "habit", id: string) => void;
  closeEdit: () => void;
  updateTask: (id: string, input: { title: string; dueDate?: string; goalId?: string }, onSuccess?: () => void) => boolean;
  updateHabit: (id: string, input: { title: string; frequency: "daily" | "specific"; days: number[]; goalId?: string }, onSuccess?: () => void) => boolean;

  register: (name: string, email: string) => "ok" | "exists" | "save";
  login: (email: string) => boolean;
  loginExample: () => void;
  logout: () => void;

  commit: (mutator: Mutator, onSuccess?: () => void) => boolean;
  toggleTask: (taskId: string) => void;
  toggleHabit: (habitId: string) => void;
  addTask: (
    input: { title: string; dueDate?: string; goalId?: string },
    onSuccess?: () => void,
  ) => boolean;
  addHabit: (
    input: { title: string; frequency: "daily" | "specific"; days: number[]; goalId?: string },
    onSuccess?: () => void,
  ) => boolean;
  addGoal: (input: { title: string; targetDate?: string }, onSuccess?: () => void) => boolean;
  /** Cambia solo el nombre del objetivo; la fecha meta y lo asociado no se tocan. */
  renameGoal: (id: string, title: string, onSuccess?: () => void) => boolean;
  associate: (kind: "task" | "habit", id: string, goalId: string) => boolean;
  updateProfile: (patch: Partial<Pick<UserData, "name" | "timezone">>) => boolean;
  markBonusSeen: (weeks: string[]) => void;

  advanceDay: () => void;
  resetExample: () => void;
  simulateFailure: () => void;
}

// The context lives on globalThis so a hot reload of this file reuses the same
// context object; otherwise the provider and the consumers can end up on two
// different copies and useApp() throws "debe usarse dentro de AppProvider".
const globalForCtx = globalThis as unknown as {
  __constanciaAppContext?: Context<AppState | null>;
};
const AppContext =
  globalForCtx.__constanciaAppContext ??
  (globalForCtx.__constanciaAppContext = createContext<AppState | null>(null));

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<UserData | null>(null);
  const [offsetDays, setOffsetDays] = useState(0);
  const [tick, setTick] = useState(0);
  const [saveError, setSaveError] = useState<SaveErrorState | null>(null);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [plusOneKey, setPlusOneKey] = useState(0);
  const [editing, setEditing] = useState<AppState["editing"]>(null);
  const dataRef = useRef<UserData | null>(null);
  dataRef.current = data;

  // Carga inicial desde localStorage (solo en el navegador).
  useEffect(() => {
    setOffsetDays(getClockOffset());
    const email = getSession();
    if (email) {
      const u = loadUser(email);
      if (u) setData(u);
      else setSession(null);
    }
    setHydrated(true);
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const now = useCallback(() => new Date(Date.now() + offsetDays * DAY_MS), [offsetDays]);

  const today = useMemo(
    () => localDayOf(now(), data?.timezone ?? "America/Bogota"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now, data?.timezone, tick],
  );

  const stats = useMemo(() => (data ? computeStats(data, today) : null), [data, today]);

  // El avatar nunca retrocede: si se alcanza una etapa nueva, se guarda y se celebra.
  useEffect(() => {
    if (!data || !stats) return;
    if (stats.stage > data.maxStage) {
      const next = { ...data, maxStage: stats.stage };
      try {
        saveUser(next, { ignoreSimulatedFailure: true });
      } catch {
        return;
      }
      setData(next);
      setCelebration(stats.stage);
    }
  }, [data, stats]);

  const commit = useCallback(
    (mutator: Mutator, onSuccess?: () => void): boolean => {
      if (!data) return false;
      const attempt = (): boolean => {
        const current = dataRef.current;
        if (!current) return false;
        const next = mutator(current);
        if (next === current) return false;
        try {
          saveUser(next);
        } catch (e) {
          if (e instanceof SaveError) {
            setSaveError({
              retry: () => {
                setSaveError(null);
                attempt();
              },
            });
            return false;
          }
          throw e;
        }
        setSaveError(null);
        dataRef.current = next;
        setData(next);
        onSuccess?.();
        return true;
      };
      return attempt();
    },
    [data],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      if (!data) return;
      const existing = taskCompletion(data.completions, taskId);
      if (existing) {
        if (existing.localDay !== today) return; // día cerrado: inmutable
        commit((d) => ({ ...d, completions: d.completions.filter((c) => c.id !== existing.id) }));
      } else {
        const at = now();
        commit(
          (d) => ({
            ...d,
            completions: [
              ...d.completions,
              {
                id: newId("c"),
                kind: "task",
                refId: taskId,
                localDay: localDayOf(at, d.timezone),
                atUTC: at.toISOString(),
                title: d.tasks.find((t) => t.id === taskId)?.title,
              },
            ],
          }),
          () => setPlusOneKey((k) => k + 1),
        );
      }
    },
    [data, today, commit, now],
  );

  const toggleHabit = useCallback(
    (habitId: string) => {
      if (!data) return;
      const habit = data.habits.find((h) => h.id === habitId);
      if (!habit || !isHabitScheduled(habit, today)) return;
      const existing = habitCompletion(data.completions, habitId, today);
      if (existing) {
        commit((d) => ({ ...d, completions: d.completions.filter((c) => c.id !== existing.id) }));
      } else {
        const at = now();
        commit(
          (d) => ({
            ...d,
            completions: [
              ...d.completions,
              {
                id: newId("c"),
                kind: "habit",
                refId: habitId,
                localDay: localDayOf(at, d.timezone),
                atUTC: at.toISOString(),
                title: d.habits.find((h) => h.id === habitId)?.title,
              },
            ],
          }),
          () => setPlusOneKey((k) => k + 1),
        );
      }
    },
    [data, today, commit, now],
  );

  const addTask: AppState["addTask"] = useCallback(
    (input, onSuccess) => {
      const createdAt = now().toISOString();
      const id = newId("task");
      return commit(
        (d) => ({
          ...d,
          tasks: [
            ...d.tasks,
            {
              id,
              title: input.title.trim(),
              dueDate: input.dueDate || undefined,
              goalId: input.goalId || undefined,
              createdAt,
            },
          ],
        }),
        onSuccess,
      );
    },
    [commit, now],
  );

  const addHabit: AppState["addHabit"] = useCallback(
    (input, onSuccess) => {
      const createdAt = now().toISOString();
      const id = newId("habit");
      return commit(
        (d) => ({
          ...d,
          habits: [
            ...d.habits,
            {
              id,
              title: input.title.trim(),
              frequency: input.frequency,
              days: input.frequency === "daily" ? [] : [...input.days].sort(),
              goalId: input.goalId || undefined,
              createdAt,
            },
          ],
        }),
        onSuccess,
      );
    },
    [commit, now],
  );

  const updateTask: AppState["updateTask"] = useCallback((id, input, onSuccess) => {
    if (!input.title.trim()) return false;
    return commit(d => {
      const completion = taskCompletion(d.completions, id);
      const currentDay = localDayOf(now(), d.timezone);
      if (!d.tasks.some(t => t.id === id) || (completion && completion.localDay !== currentDay)) return d;
      return { ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, title: input.title.trim(), dueDate: input.dueDate || undefined, goalId: input.goalId || undefined } : t) };
    }, onSuccess);
  }, [commit, now]);

  const updateHabit: AppState["updateHabit"] = useCallback((id, input, onSuccess) => {
    if (!input.title.trim() || (input.frequency === "specific" && input.days.length === 0)) return false;
    return commit(d => {
      if (!d.habits.some(h => h.id === id)) return d;
      return { ...d, habits: d.habits.map(h => {
        if (h.id !== id) return h;
        const days = input.frequency === "daily" ? [] : [...input.days].sort((a, b) => a - b);
        const currentDay = localDayOf(now(), d.timezone);
        const next = { ...h, frequency: input.frequency, days };
        // Also revise when today should be scheduled but a pending revision (saved under the old tomorrow-only rule) still excludes it.
        const changed = h.frequency !== input.frequency || h.days.join(",") !== days.join(",")
          || isHabitScheduled({ ...next, scheduleHistory: undefined }, currentDay) !== isHabitScheduled(h, currentDay);
        return { ...next, title: input.title.trim(), goalId: input.goalId || undefined,
          scheduleHistory: changed ? revisedHabitSchedule(h, input.frequency, days, currentDay) : h.scheduleHistory };
      }) };
    }, onSuccess);
  }, [commit, now]);

  const openEdit = useCallback((kind: "task" | "habit", id: string) => {
    const current = dataRef.current;
    if (!current) return;
    if (kind === "task") {
      const completion = taskCompletion(current.completions, id);
      if (completion && completion.localDay !== localDayOf(now(), current.timezone)) return;
    }
    setSaveError(null);
    setEditing({ kind, id });
  }, [now]);

  const addGoal: AppState["addGoal"] = useCallback(
    (input, onSuccess) => {
      const createdAt = now().toISOString();
      const id = newId("goal");
      return commit(
        (d) => ({
          ...d,
          goals: [
            ...d.goals,
            { id, title: input.title.trim(), targetDate: input.targetDate || undefined, createdAt },
          ],
        }),
        onSuccess,
      );
    },
    [commit, now],
  );

  const renameGoal: AppState["renameGoal"] = useCallback(
    (id, title, onSuccess) => {
      const next = title.trim();
      if (!next) return false;
      return commit(
        (d) =>
          d.goals.some((g) => g.id === id)
            ? { ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, title: next } : g)) }
            : d,
        onSuccess,
      );
    },
    [commit],
  );

  const associate: AppState["associate"] = useCallback(
    (kind, id, goalId) =>
      commit((d) =>
        kind === "task"
          ? { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, goalId } : t)) }
          : { ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, goalId } : h)) },
      ),
    [commit],
  );

  const updateProfile: AppState["updateProfile"] = useCallback(
    (patch) => commit((d) => ({ ...d, ...patch })),
    [commit],
  );

  const markBonusSeen = useCallback(
    (weeks: string[]) => {
      if (!data || weeks.length === 0) return;
      const next = {
        ...data,
        seenBonusWeeks: Array.from(new Set([...data.seenBonusWeeks, ...weeks])),
      };
      try {
        saveUser(next, { ignoreSimulatedFailure: true });
        setData(next);
      } catch {
        /* se reintentará en la próxima visita */
      }
    },
    [data],
  );

  const register: AppState["register"] = useCallback((name, email) => {
    if (userExists(email)) return "exists";
    const fresh = emptyUserData(name.trim(), normalizeEmail(email));
    try {
      saveUser(fresh);
    } catch {
      return "save";
    }
    setSession(fresh.email);
    setData(fresh);
    return "ok";
  }, []);

  const login = useCallback((email: string) => {
    const u = loadUser(email);
    if (!u) return false;
    setSession(u.email);
    setData(u);
    return true;
  }, []);

  const loginExample = useCallback(() => {
    let u = loadUser(EXAMPLE_EMAIL);
    if (!u) {
      u = exampleUserData(new Date(Date.now() + offsetDays * DAY_MS));
      saveUser(u, { ignoreSimulatedFailure: true });
    }
    setSession(u.email);
    setData(u);
  }, [offsetDays]);

  const logout = useCallback(() => {
    setSession(null);
    setData(null);
    setSaveError(null);
  }, []);

  const advanceDay = useCallback(() => {
    const next = offsetDays + 1;
    setClockOffset(next);
    setOffsetDays(next);
  }, [offsetDays]);

  const resetExample = useCallback(() => {
    setClockOffset(0);
    setOffsetDays(0);
    const u = exampleUserData(new Date());
    saveUser(u, { ignoreSimulatedFailure: true });
    setSession(u.email);
    setSaveError(null);
    setData(u);
  }, []);

  const value: AppState = {
    hydrated,
    data,
    stats,
    today,
    offsetDays,
    now,
    saveError,
    dismissSaveError: () => setSaveError(null),
    celebration,
    closeCelebration: () => setCelebration(null),
    plusOneKey,
    editing,
    openEdit,
    closeEdit: () => { setEditing(null); setSaveError(null); },
    updateTask,
    updateHabit,
    register,
    login,
    loginExample,
    logout,
    commit,
    toggleTask,
    toggleHabit,
    addTask,
    addHabit,
    addGoal,
    renameGoal,
    associate,
    updateProfile,
    markBonusSeen,
    advanceDay,
    resetExample,
    simulateFailure: simulateNextSaveFailure,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
