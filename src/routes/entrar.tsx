import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FieldLabel } from "@/components/constancia/Field";
import { PublicShell } from "@/components/constancia/PublicShell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Inicia sesión — AKTIVA" },
      { name: "description", content: "Entra a AKTIVA y retoma tus tareas, hábitos y objetivos donde los dejaste." },
      { property: "og:title", content: "Inicia sesión — AKTIVA" },
      { property: "og:description", content: "Retoma tu progreso en AKTIVA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const { hydrated, data, login, loginExample } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (hydrated && data) navigate({ to: "/hoy" });
  }, [hydrated, data, navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    let eErr = "";
    let pErr = "";
    if (!email.trim()) eErr = "Escribe tu correo.";
    if (!password) pErr = "Escribe tu contraseña.";
    if (!eErr && !pErr && !login(email)) {
      eErr = "No encontramos una cuenta con este correo. Revisa que esté bien escrito o crea una cuenta.";
    }
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr) document.getElementById("login-email")?.focus();
    else if (pErr) document.getElementById("login-password")?.focus();
    else navigate({ to: "/hoy" });
  };

  return (
    <PublicShell title="Qué bueno verte" subtitle="Entra para seguir donde lo dejaste.">
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <FieldLabel htmlFor="login-email">Correo</FieldLabel>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "login-email-error" : undefined}
          />
          <FieldError id="login-email-error">{emailError}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "login-password-error" : undefined}
          />
          <FieldError id="login-password-error">{passwordError}</FieldError>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Entrar
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
          ¿Aún no tienes cuenta?{" "}
          <Link to="/" className="font-bold text-foreground underline underline-offset-4">
            Crea una cuenta
          </Link>
        </p>
      </form>
    </PublicShell>
  );
}
