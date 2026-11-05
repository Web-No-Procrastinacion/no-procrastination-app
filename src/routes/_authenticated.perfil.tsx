import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, CloudOff, FlaskConical, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FieldLabel } from "@/components/constancia/Field";
import { selectClass } from "@/components/constancia/Forms";
import { zonasHorarias } from "@/config/gamification";
import { useApp } from "@/lib/app-store";
import { formatDayMedium } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — AKTIVA" },
      { name: "description", content: "Tu nombre, tu zona horaria y las herramientas de demostración del prototipo." },
      { property: "og:title", content: "Perfil — AKTIVA" },
      { property: "og:description", content: "Ajusta tu perfil en AKTIVA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { data, today, offsetDays, updateProfile, logout, advanceDay, resetExample, simulateFailure } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(data?.name ?? "");
  const [nameError, setNameError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (data) setName(data.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.name]);

  if (!data) return null;

  const saveName = () => {
    if (!name.trim()) {
      setNameError("Escribe tu nombre.");
      return;
    }
    setNameError("");
    if (name.trim() !== data.name) updateProfile({ name: name.trim() });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[28px] font-extrabold">Perfil</h1>

      <section className="card-surface space-y-5 p-5">
        <div>
          <FieldLabel htmlFor="profile-name">Nombre</FieldLabel>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "profile-name-error" : undefined}
          />
          <FieldError id="profile-name-error">{nameError}</FieldError>
          <p className="mt-1.5 text-sm text-muted-foreground">{data.email}</p>
        </div>
        <div>
          <FieldLabel htmlFor="profile-tz">Zona horaria</FieldLabel>
          <select
            id="profile-tz"
            className={selectClass}
            value={data.timezone}
            onChange={(e) => updateProfile({ timezone: e.target.value })}
            aria-describedby="profile-tz-note"
          >
            {zonasHorarias.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace("_", " ")}
              </option>
            ))}
          </select>
          <p id="profile-tz-note" className="mt-1.5 text-sm text-muted-foreground">
            El cambio aplica a lo que marques desde ahora.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            logout();
            navigate({ to: "/entrar" });
          }}
        >
          <LogOut aria-hidden /> Cerrar sesión
        </Button>
      </section>

      <section aria-labelledby="demo-title" className="rounded-[1.375rem] border-2 border-dashed border-border bg-card/50 p-5">
        <h2 id="demo-title" className="flex items-center gap-2 font-display text-xl font-semibold">
          <FlaskConical className="h-5 w-5 text-icon-accent" aria-hidden /> Herramientas de demostración (solo prototipo)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fecha actual de la app: <strong className="text-foreground">{formatDayMedium(today)}</strong>
          {offsetDays !== 0 && " (simulada)"}
        </p>
        <div className="mt-4 grid gap-2">
          <Button
            variant="soft"
            className="justify-start"
            onClick={() => {
              advanceDay();
              setNote("Avanzaste al día siguiente. El día anterior ya cerró.");
            }}
          >
            <CalendarPlus aria-hidden /> Avanzar al día siguiente
          </Button>
          <Button
            variant="soft"
            className="justify-start"
            onClick={() => {
              simulateFailure();
              setNote("El próximo guardado va a fallar.");
            }}
          >
            <CloudOff aria-hidden /> Simular fallo de guardado
          </Button>
          <Button
            variant="soft"
            className="justify-start"
            onClick={() => {
              resetExample();
              setNote("");
              navigate({ to: "/hoy" });
            }}
          >
            <RotateCcw aria-hidden /> Restablecer datos de ejemplo
          </Button>
        </div>
        <p className="mt-3 min-h-6 text-sm font-bold text-secondary-foreground" role="status">
          {note}
        </p>
      </section>
    </div>
  );
}
