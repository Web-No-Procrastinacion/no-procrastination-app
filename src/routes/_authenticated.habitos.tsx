import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemRow } from "@/components/constancia/ItemRow";
import { EmptyState, useAddMenu } from "@/components/constancia/AppChrome";
import { useApp } from "@/lib/app-store";
import { habitCompletion, isHabitScheduled } from "@/lib/engine";
import { habitFrequencyLabel } from "@/lib/habit-schedule";

export const Route = createFileRoute("/_authenticated/habitos")({
  head: () => ({ meta: [
    { title: "Mis hábitos — AKTIVA" },
    { name: "description", content: "Tus hábitos y sus días programados en AKTIVA." },
    { property: "og:title", content: "Mis hábitos — AKTIVA" },
    { property: "og:description", content: "Tus hábitos y sus días programados en AKTIVA." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Habits,
});

function Habits() {
  const { data, today, toggleHabit } = useApp();
  const openAdd = useAddMenu();
  if (!data) return null;
  return <div>
    <Button asChild variant="ghost" className="-ml-3"><Link to="/hoy"><ArrowLeft aria-hidden /> Hoy</Link></Button>
    <h1 className="mb-5 mt-2 flex items-center gap-3 font-display text-[28px] font-extrabold"><Repeat className="h-7 w-7" aria-hidden />Mis hábitos</h1>
    {data.habits.length === 0 ? <EmptyState title="Un pequeño paso cada día" text="¿Qué te gustaría empezar a cultivar?" action="Nuevo hábito" onAction={() => openAdd("habit")} /> :
      <ul className="space-y-2">{data.habits.map(h => <ItemRow key={h.id} id={`all-habit-${h.id}`} title={h.title}
        editItem={{ kind: "habit", id: h.id }} checked={!!habitCompletion(data.completions, h.id, today)} disabled={!isHabitScheduled(h, today)} onToggle={() => toggleHabit(h.id)}
        meta={<><span className="inline-block rounded-full bg-primary-soft px-2 py-0.5 text-base text-secondary-foreground">{habitFrequencyLabel(h)}</span>{!isHabitScheduled(h, today) && <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-sm text-foreground">No toca hoy</span>}</>} />)}</ul>}
  </div>;
}
