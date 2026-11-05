import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { Avatar } from "./Avatar";

export function PublicShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md px-5 pb-16 pt-8">
        <Brand />
        <div className="summary-surface mt-6 flex items-center gap-4 p-5">
          <Avatar stage={0} size={84} decorative className="animate-wiggle" />
          <div>
            <h1 className="font-display text-[28px] font-extrabold leading-tight">{title}</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
