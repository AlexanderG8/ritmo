"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Imprimir es lo único de esta pantalla que necesita cliente. El PDF lo genera
 * el navegador: una librería de PDF en el servidor sería una dependencia nueva
 * para hacer peor lo que Ctrl+P ya hace bien.
 */
export function PrintButton() {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()}>
      <Printer aria-hidden className="size-4" />
      Imprimir
    </Button>
  );
}
