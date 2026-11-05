import { useEffect } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AddMenuProvider,
  AppHeader,
  BottomNav,
  CelebrationDialog,
  SaveErrorBanner,
} from "@/components/constancia/AppChrome";
import { Avatar } from "@/components/constancia/Avatar";
import { EditSheet } from "@/components/constancia/EditSheet";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/_authenticated")({
  component: AppLayout,
});

function AppLayout() {
  const { hydrated, data } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !data) navigate({ to: "/entrar" });
  }, [hydrated, data, navigate]);

  if (!hydrated || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background" aria-busy="true">
        <div className="text-center">
          <Avatar stage={0} size={72} decorative className="mx-auto animate-wiggle" />
          <p className="mt-3 text-muted-foreground">Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <AddMenuProvider>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 pb-44 pt-5">
          <Outlet />
        </main>
        <SaveErrorBanner />
        <BottomNav />
        <CelebrationDialog />
        <EditSheet />
      </div>
    </AddMenuProvider>
  );
}
