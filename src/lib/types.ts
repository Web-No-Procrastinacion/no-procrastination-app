export interface Task {
  id: string;
  title: string;
  dueDate?: string | undefined; // YYYY-MM-DD
  goalId?: string | undefined;
  createdAt: string; // ISO UTC
}

export interface HabitSchedule {
  frequency: "daily" | "specific";
  days: number[];
  effectiveFrom: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "specific";
  /** Lunes = 0 … Domingo = 6. Solo aplica si frequency = "specific". */
  days: number[];
  scheduleHistory?: HabitSchedule[] | undefined;
  goalId?: string | undefined;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetDate?: string | undefined;
  createdAt: string;
}

export interface Completion {
  id: string;
  kind: "task" | "habit";
  refId: string;
  /** Día local calculado con la zona horaria vigente al marcar. */
  localDay: string;
  /** Fecha y hora en UTC. */
  atUTC: string;
  /** Título al marcar; el historial de días cerrados lo muestra aunque luego se renombre. */
  title?: string | undefined;
}

export interface UserData {
  name: string;
  email: string;
  timezone: string;
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  completions: Completion[];
  /** Etapa máxima alcanzada del avatar (nunca retrocede). */
  maxStage: number;
  /** Semanas (lunes YYYY-MM-DD) cuyo bono ya se mostró. */
  seenBonusWeeks: string[];
}
