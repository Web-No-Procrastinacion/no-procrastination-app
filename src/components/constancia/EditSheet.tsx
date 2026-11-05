import { useRef } from "react";
import { useApp } from "@/lib/app-store";
import { taskCompletion } from "@/lib/engine";
import { BottomSheet, HabitForm, TaskForm } from "./Forms";

export function EditSheet() {
  const { data, editing, closeEdit, today } = useApp();
  const focusRef = useRef<HTMLInputElement>(null);
  if (!data || !editing) return null;
  const task = editing.kind === "task" ? data.tasks.find(t => t.id === editing.id) : undefined;
  const habit = editing.kind === "habit" ? data.habits.find(h => h.id === editing.id) : undefined;
  const completion = task ? taskCompletion(data.completions, task.id) : undefined;
  if ((!task && !habit) || (completion && completion.localDay !== today)) return null;
  return (
    <BottomSheet open onOpenChange={open => { if (!open) closeEdit(); }} title={task ? "Editar tarea" : "Editar hábito"} focusRef={focusRef}>
      {task && <TaskForm key={task.id} task={task} onDone={closeEdit} focusRef={focusRef} />}
      {habit && <HabitForm key={habit.id} habit={habit} onDone={closeEdit} focusRef={focusRef} />}
    </BottomSheet>
  );
}
