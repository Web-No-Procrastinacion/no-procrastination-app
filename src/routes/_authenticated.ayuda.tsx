import { createFileRoute } from "@tanstack/react-router";
import { Brain, Phone, School, Sprout } from "lucide-react";
import { Aviso } from "@/components/constancia/texts";
import { gamification as g } from "@/config/gamification";

export const Route = createFileRoute("/_authenticated/ayuda")({
  head: () => ({
    meta: [
      { title: "Ayuda — AKTIVA" },
      {
        name: "description",
        content: "Qué es AKTIVA, dónde buscar apoyo y cómo funcionan los puntos, la racha y el avatar.",
      },
      { property: "og:title", content: "Ayuda — AKTIVA" },
      { property: "og:description", content: "Dónde buscar apoyo y cómo funciona AKTIVA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ayuda,
});

function Ayuda() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[28px] font-extrabold">Ayuda</h1>
      <Aviso />

      <section className="card-surface p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Brain className="h-5 w-5 text-icon-accent" aria-hidden /> ¿Qué es la TCC?
        </h2>
        <p className="mt-2">
          La terapia cognitivo-conductual (TCC) es un tratamiento psicológico que ayuda a identificar y
          cambiar pensamientos y comportamientos que nos afectan. La realiza un profesional de la salud
          mental; esta aplicación solo toma algunas ideas para motivarte, pero no la reemplaza.
        </p>
      </section>

      <section className="card-surface p-5">
        <h2 className="font-display text-xl font-semibold">¿Dónde buscar apoyo?</h2>
        <ul className="mt-3 space-y-3">
          <li className="flex gap-3">
            <School className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
            <span>El servicio de bienestar universitario de tu institución.</span>
          </li>
          <li className="flex gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
            <span>
              Línea 106 en Bogotá:{" "}
              <a href="tel:106" className="font-bold text-foreground underline underline-offset-4">
                llamar al 106
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
            <span>
              Línea nacional 192, opción 4:{" "}
              <a href="tel:192" className="font-bold text-foreground underline underline-offset-4">
                llamar al 192
              </a>
            </span>
          </li>
        </ul>
      </section>

      <section className="card-surface p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Sprout className="h-5 w-5 text-icon-accent" aria-hidden /> ¿Cómo funciona?
        </h2>
        <dl className="mt-3 space-y-4">
          <div>
            <dt className="font-bold">Puntos</dt>
            <dd className="text-muted-foreground">
              Ganas {g.puntosPorTarea} punto por cada tarea o hábito que completes. Una tarea nunca suma dos
              veces. Si desmarcas algo de hoy, se resta su punto.
            </dd>
          </div>
          <div>
            <dt className="font-bold">Racha</dt>
            <dd className="text-muted-foreground">
              Un día cuenta para tu racha si al cerrar (a las 11:59 p. m.) completaste al menos{" "}
              {g.minTareasRacha} tareas o hábitos. Si un día cierra con menos, la racha vuelve a empezar desde
              0. Lo de días anteriores ya no se puede cambiar.
            </dd>
          </div>
          <div>
            <dt className="font-bold">Meta semanal</dt>
            <dd className="text-muted-foreground">
              Si de lunes a domingo completas {g.metaSemanalTareas} o más, recibes {g.puntosMetaSemanal} puntos
              extra una sola vez, al cerrar el domingo.
            </dd>
          </div>
          <div>
            <dt className="font-bold">Avatar</dt>
            <dd className="text-muted-foreground">
              Tu compañero crece en 6 etapas ({g.etapasAvatar.join(", ")}) al llegar a{" "}
              {g.umbralesAvatar.join(", ")} puntos. Nunca retrocede.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
