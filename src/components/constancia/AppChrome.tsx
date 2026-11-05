import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, CheckSquare, LifeBuoy, ListPlus, Plus, Repeat, Sprout, Sun, Target, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { gamification } from "@/config/gamification";
import { useApp } from "@/lib/app-store";
import { formatDayMedium } from "@/lib/dates";
import { Avatar } from "./Avatar";
import { BottomSheet, HabitForm, TaskForm } from "./Forms";
import { SaveErrorNotice } from "./SaveError";
import { Brand } from "./Brand";

export function AppHeader() {
  const { offsetDays, today } = useApp();
  return (
    <header className="glass-header sticky top-0 z-30 border-b border-border">
      <div className="mx-auto flex min-h-20 max-w-2xl items-center gap-3 px-4 py-3">
        <Link to="/hoy" className="tap-target flex items-center gap-2 rounded-xl">
          <Brand />
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {offsetDays !== 0 && (
            <span className="inline-flex max-w-28 flex-wrap items-center gap-1 rounded-xl bg-primary-soft px-2.5 py-1 text-xs font-semibold text-foreground sm:max-w-none">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              Fecha simulada: {formatDayMedium(today)}
            </span>
          )}
          <Link
            to="/perfil"
            aria-label="Perfil"
            className="tap-target grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-muted"
            activeProps={{ className: "bg-primary-soft", "aria-current": "page" }}
          >
            <UserRound className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

const tabs = [
  { to: "/hoy", label: "Hoy", icon: Sun },
  { to: "/objetivos", label: "Objetivos", icon: Target },
  { to: "/progreso", label: "Progreso", icon: Sprout },
  { to: "/ayuda", label: "Ayuda", icon: LifeBuoy },
] as const;

export function BottomNav() {
  return (
    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
      <ul className="mx-auto grid h-[4.5rem] max-w-2xl grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex">
            <Link
              to={to}
              className="group flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-bold text-muted-foreground"
              activeProps={{ className: "text-foreground", "aria-current": "page" }}
              activeOptions={{ exact: false }}
            >
              <span className="grid h-8 w-14 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-primary-soft">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SaveErrorBanner() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.25rem] z-40 px-4">
      <div className="pointer-events-auto mx-auto max-w-lg shadow-lift">
        <SaveErrorNotice />
      </div>
    </div>
  );
}

export function CelebrationDialog() {
  const { celebration, closeCelebration } = useApp();
  const stage = celebration ?? 0;
  const name = gamification.etapasAvatar[stage];
  const title = stage === 1 ? "¡Tu huevo eclosionó!" : `¡Evolucionaste a ${name}!`;
  return (
    <Dialog open={celebration !== null} onOpenChange={(o) => !o && closeCelebration()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-card text-center">
        <div className="mx-auto animate-pop-in">
          <Avatar stage={stage} size={160} />
        </div>
        <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
        <DialogDescription className="text-base text-muted-foreground">
          Tu constancia hizo crecer a tu compañero. Ahora está en la etapa <strong className="text-foreground">{name}</strong>.
        </DialogDescription>
        <Button size="lg" onClick={closeCelebration} className="w-full">
          ¡Genial!
        </Button>
      </DialogContent>
    </Dialog>
  );
}

type AddMode = "closed" | "menu" | "task" | "habit";
const AddMenuContext = createContext<(mode: AddMode) => void>(() => {});
export const useAddMenu = () => useContext(AddMenuContext);

export function AddFab() {
  const open = useAddMenu();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-30">
      <div className="mx-auto flex max-w-2xl justify-end px-4">
        <Button
          variant="fab"
          size="fab"
          className="pointer-events-auto"
          aria-label="Agregar tarea o hábito"
          onClick={() => open("menu")}
        >
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function AddMenuProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AddMode>("closed");
  const taskRef = useRef<HTMLInputElement>(null);
  const habitRef = useRef<HTMLInputElement>(null);
  const close = () => setMode("closed");

  return (
    <AddMenuContext.Provider value={setMode}>
      {children}
      <BottomSheet open={mode === "menu"} onOpenChange={(o) => !o && close()} title="¿Qué quieres agregar?">
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setMode("task")}
            className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary-soft"
          >
            <span className="icon-tile grid h-12 w-12 place-items-center" aria-hidden>
              <CheckSquare className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-bold">Nueva tarea</span>
              <span className="text-muted-foreground">Algo que haces una vez</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("habit")}
            className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary-soft"
          >
            <span className="icon-tile grid h-12 w-12 place-items-center" aria-hidden>
              <Repeat className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-bold">Nuevo hábito</span>
              <span className="text-muted-foreground">Algo que repites en ciertos días</span>
            </span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={mode === "task"} onOpenChange={(o) => !o && close()} title="Nueva tarea" focusRef={taskRef}>
        <TaskForm onDone={close} focusRef={taskRef} />
      </BottomSheet>
      <BottomSheet open={mode === "habit"} onOpenChange={(o) => !o && close()} title="Nuevo hábito" focusRef={habitRef}>
        <HabitForm onDone={close} focusRef={habitRef} />
      </BottomSheet>
    </AddMenuContext.Provider>
  );
}

export function EmptyState({
  title,
  text,
  action,
  onAction,
  icon: Icon = ListPlus,
}: {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
  icon?: typeof ListPlus;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card/60 p-6 text-center">
      <Icon className="mx-auto h-8 w-8 text-icon-accent" aria-hidden />
      <p className="mt-2 font-bold">{title}</p>
      <p className="mt-1 text-muted-foreground">{text}</p>
      <Button variant="soft" className="mt-4" onClick={onAction}>
        {action}
      </Button>
    </div>
  );
}
