import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/actions/session";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/85 sticky top-0 z-20 border-b backdrop-blur print:hidden">
        <nav
          aria-label="Principal"
          className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6"
        >
          <Link
            href="/hoy"
            className="font-heading mr-1 shrink-0 text-sm font-semibold tracking-[0.14em] uppercase"
          >
            Ritmo
          </Link>

          <AppNav />

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut aria-hidden />
                Salir
              </Button>
            </form>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
