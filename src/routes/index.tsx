import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FieldError, FieldLabel } from "@/components/constancia/Field";
import { PublicShell } from "@/components/constancia/PublicShell";
import { Aviso, PolicyDialog } from "@/components/constancia/texts";
import { SAVE_ERROR_TEXT } from "@/components/constancia/SaveError";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crea tu cuenta — AKTIVA" },
      {
        name: "description",
        content:
          "Regístrate en AKTIVA y organiza tus tareas, hábitos y objetivos de la universidad sin presión.",
      },
      { property: "og:title", content: "Crea tu cuenta — AKTIVA" },
      {
        property: "og:description",
        content: "Un acompañamiento motivacional y tranquilo para vencer la procrastinación.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Registro,
});

type Errors = Partial<Record<"name" | "email" | "password" | "policy" | "form", string>>;

function Registro() {
  const { hydrated, data, register, loginExample } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (hydrated && data) navigate({ to: "/hoy" });
  }, [hydrated, data, navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Escribe tu nombre.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Escribe un correo válido, por ejemplo nombre@universidad.edu.co.";
    if (password.length < 8) next.password = "La contraseña debe tener al menos 8 caracteres.";
    if (!accepted) next.policy = "Para crear tu cuenta, acepta la política de tratamiento de datos personales.";
    if (Object.keys(next).length === 0) {
      const result = register(name, email);
      if (result === "exists") next.email = "Ya existe una cuenta con este correo. Puedes iniciar sesión.";
      if (result === "save") next.form = SAVE_ERROR_TEXT;
      if (result === "ok") navigate({ to: "/hoy" });
    }
    setErrors(next);
    const first = (["name", "email", "password", "policy"] as const).find((k) => next[k]);
    if (first) document.getElementById(`reg-${first}`)?.focus();
  };

  return (
    <PublicShell title="Te damos la bienvenida" subtitle="Organiza tu semestre a tu ritmo, un paso a la vez.">
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <FieldLabel htmlFor="reg-name">Nombre</FieldLabel>
          <Input
            id="reg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "reg-name-error" : undefined}
          />
          <FieldError id="reg-name-error">{errors.name}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="reg-email">Correo</FieldLabel>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "reg-email-error" : undefined}
          />
          <FieldError id="reg-email-error">{errors.email}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="reg-password">Contraseña</FieldLabel>
          <Input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "reg-password-error" : "reg-password-hint"}
          />
          {!errors.password && (
            <p id="reg-password-hint" className="mt-1.5 text-sm text-muted-foreground">
              Mínimo 8 caracteres.
            </p>
          )}
          <FieldError id="reg-password-error">{errors.password}</FieldError>
        </div>
        <div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="reg-policy"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              aria-invalid={!!errors.policy}
              aria-describedby={errors.policy ? "reg-policy-error" : undefined}
              className="mt-1"
            />
            <div className="leading-relaxed">
              <label htmlFor="reg-policy" className="cursor-pointer">
                Acepto la política de tratamiento de datos personales (Ley 1581 de 2012)
              </label>{" "}
              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="font-bold text-foreground underline underline-offset-4"
              >
                Leer la política
              </button>
            </div>
          </div>
          <FieldError id="reg-policy-error">{errors.policy}</FieldError>
        </div>

        <Aviso />

        {errors.form && <FieldError id="reg-form-error">{errors.form}</FieldError>}

        <Button type="submit" size="lg" className="w-full">
          Crear cuenta
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            loginExample();
            navigate({ to: "/hoy" });
          }}
        >
          Entrar con el usuario de ejemplo
        </Button>
        <p className="text-center">
          ¿Ya tienes cuenta?{" "}
          <Link to="/entrar" className="font-bold text-foreground underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </form>
      <PolicyDialog open={policyOpen} onOpenChange={setPolicyOpen} />
    </PublicShell>
  );
}
