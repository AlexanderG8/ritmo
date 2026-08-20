"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "system" | "light" | "dark";

const order: Theme[] = ["system", "light", "dark"];
const icon = { system: Monitor, light: Sun, dark: Moon };
const label = {
  system: "Tema del sistema",
  light: "Tema claro",
  dark: "Tema oscuro",
};

/**
 * El tema vive en la clase de <html>, no en un estado de React: el script
 * inline del layout ya lo aplicó antes del primer pintado. Aquí solo se lee
 * esa fuente única y se escribe sobre ella.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  const classes = document.documentElement.classList;
  if (classes.contains("dark")) return "dark";
  if (classes.contains("light")) return "light";
  return "system";
}

/** En servidor no se sabe el tema: se reserva el hueco y ya. */
function getServerSnapshot(): Theme | null {
  return null;
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);
  try {
    if (theme === "system") localStorage.removeItem("ritmo-theme");
    else localStorage.setItem("ritmo-theme", theme);
  } catch {
    // Sin almacenamiento el tema dura la sesión. No es un error que reportar.
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (theme === null) return <div className="size-7" aria-hidden />;

  const Icon = icon[theme];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={label[theme]}
      aria-label={`${label[theme]}. Cambiar tema.`}
      onClick={() => apply(order[(order.indexOf(theme) + 1) % order.length])}
    >
      <Icon />
    </Button>
  );
}
