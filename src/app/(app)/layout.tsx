import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/session";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-3xl items-center gap-5 p-4 text-sm">
          <Link href="/hoy" className="font-semibold tracking-tight">
            Ritmo
          </Link>
          <Link href="/hoy" className="text-muted-foreground hover:text-foreground">
            Hoy
          </Link>
          <Link href="/semana" className="text-muted-foreground hover:text-foreground">
            Semana
          </Link>
          <form action={logout} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              Salir
            </Button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
