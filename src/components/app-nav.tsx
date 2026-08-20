"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, ChartLine, FileText, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/hoy", label: "Hoy", icon: Timer },
  { href: "/semana", label: "Semana", icon: CalendarRange },
  { href: "/docs", label: "Documentos", icon: FileText },
  { href: "/metricas", label: "Métricas", icon: ChartLine },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors sm:px-2.5",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              {/* Con cuatro destinos el texto ya no cabe en 375px. Se oculta
                  visualmente, no para lectores de pantalla. */}
              <span className="sr-only sm:not-sr-only">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
