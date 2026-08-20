# Ritmo — Sistema de diseño

> El producto es la honestidad de los números. El diseño existe para que el
> número se lea de un vistazo y no se pueda discutir.

**Tono:** sobrio, directo, casi severo. Sin gamificación, sin confeti, sin
emojis, sin frases motivacionales. El color se gasta solo cuando un dato lo
justifica.

**Contexto de uso:** monitor de 27", sesiones de 30 segundos entre incidencias
de soporte. Desktop primero; móvil tiene que funcionar, no lucirse.

---

## 1. Reglas que no se negocian

1. Una pantalla, un `h1`. El resto son títulos de sección.
2. El número más grande de la pantalla es siempre una métrica, nunca un título.
3. El color semántico (verde / ámbar / rojo) solo aparece cuando hay un dato
   medido detrás. Sin datos, tono neutro: un cero sin semana registrada no es
   un logro, es ausencia de información.
4. Ningún control sin `label` asociado. Los placeholders no son etiquetas.
5. Todo número que se compare o cambie va con cifras tabulares (`numeric`).
6. Los textos de producto no se suavizan. Se pueden mover de sitio; no reescribir.
7. Nada de colores literales de Tailwind (`text-emerald-600`, `bg-red-50`) en
   los componentes. Solo tokens semánticos.

---

## 2. Color

Todos los tokens viven en `src/app/globals.css` y se definen **una sola vez**
con `light-dark(claro, oscuro)`. No hay un bloque `:root` y otro `.dark` que se
puedan desincronizar.

### Tema

| Estado de `<html>` | Resultado |
|---|---|
| sin clase | sigue al sistema operativo |
| `.light` | claro forzado |
| `.dark` | oscuro forzado |

`ThemeToggle` cicla los tres y lo persiste en `localStorage`. Un script inline
en `<head>` lo aplica antes del primer pintado para que no haya parpadeo.

### Tokens de superficie y acción

| Token | Uso |
|---|---|
| `background` | fondo de página (ligeramente más apagado que `card`) |
| `card` | toda superficie elevada: tarjetas, ítems de lista, métricas |
| `foreground` | texto principal |
| `muted-foreground` | metadatos, ayudas, rótulos de sección |
| `border` / `input` | separadores y bordes de control |
| `ring` | anillo de foco |
| `primary` | única acción principal por bloque |
| `secondary` | acción de apoyo |

Las superficies elevadas se separan con `ring-1 ring-foreground/10`, no con
sombra. En oscuro las sombras no separan nada.

### Tokens de estado

Tres, y ninguno más:

| Token | Significado | Ejemplo |
|---|---|---|
| `success` | la métrica cumple su meta | cumplimiento ≥ 80%, bloque protegido |
| `warning` | zona de aviso, aún no incumplimiento | sobre-compromiso, tarea sin documentar |
| `destructive` | incumplimiento o error de validación | cumplimiento < 80%, deuda de doc > 0 |

Contraste verificado sobre `card` en ambos temas: mínimo 4.5:1 en todos los
casos (claro: 4.8–6.2; oscuro: 6.3–9.5).

El color **nunca** es el único portador del dato: la tarjeta de métrica añade
el estado en texto para lectores de pantalla (`En meta.` / `Fuera de meta.`) y
siempre acompaña la meta escrita (`Meta ≥ 80%`).

---

## 3. Tipografía

Geist Sans para todo; Geist Mono solo para el cronómetro.

| Nivel | Clase | Uso |
|---|---|---|
| Métrica principal | `text-4xl font-semibold numeric` | cumplimiento, arrastre, no planificado |
| Métrica secundaria | `text-3xl font-semibold numeric` | resto de métricas |
| Cronómetro | `font-mono text-3xl font-semibold numeric` | bloque en curso |
| Título de página | `text-xl sm:text-2xl font-semibold tracking-tight` | un `h1` por pantalla |
| Título de tarjeta | `text-base font-medium` (`CardTitle`) | |
| Título de sección | `text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground` | rótulo, no protagonista |
| Cuerpo | `text-sm` (por defecto en `body`) | |
| Metadato / ayuda | `text-xs text-muted-foreground` | categoría, prioridad, hints |

Cinco tamaños en total. Si hace falta un sexto, es que la jerarquía está mal.

---

## 4. Espaciado y layout

Base 4px. Solo estos valores: `2, 3, 4, 6, 8`.

| Distancia | Valor |
|---|---|
| Entre secciones de página | `gap-8` |
| Entre columnas del split | `gap-6` |
| Entre ítems de una lista | `gap-3` |
| Interior de tarjeta / ítem | `p-4` |
| Entre campos de un formulario | `gap-4` |
| Etiqueta ↔ control | `gap-1.5` |

**Contenedor:** `max-w-6xl` con `px-4 sm:px-6`, definido **una vez** en
`src/app/(app)/layout.tsx`. Las páginas no repiten el contenedor.

**Split de trabajo (≥ `xl`):** `grid xl:grid-cols-[minmax(0,1fr)_22rem]`.
Izquierda lo que se lee (listas), derecha lo que se escribe (formularios), en
`sticky` cuando la lista es larga. En 27" esto evita la columna de 768px
perdida en medio de la pantalla.

**Excepción:** el ritual del lunes usa `max-w-3xl` y una sola columna. Es una
secuencia de tres pasos; repartirla en columnas la rompe.

---

## 5. Jerarquía de pantalla

Orden fijo, de arriba abajo:

1. **Barra de app** — identidad, navegación, tema, salir. `sticky`.
2. **Encabezado** — `h1` + contexto + estado del ciclo a la derecha.
3. **Aviso** — solo si el estado del ciclo lo exige (`Alert`).
4. **Métricas** — lo que la app tiene que decirte. Primero las que deciden si
   la semana valió: cumplimiento, trabajo no planificado, arrastre. Debajo, en
   tamaño menor: compromiso vs capacidad y deuda de documentación.
5. **Trabajo** — listas de compromisos o bloques.
6. **Entrada de datos** — formularios. Al final en móvil, a la derecha en 27".

Las métricas van antes que el trabajo, siempre. Es el punto entero del producto.

---

## 6. Patrones de componente

### Tarjeta de métrica — `<Metric>`

```
[•] RÓTULO EN MAYÚSCULAS
42%
pista en xs
Meta ≥ 80%
```

- `emphasis="primary"` para las métricas que deciden la semana; el resto por defecto.
- `tone`: `neutral | good | warn | bad`. Colorea el número y el punto.
- `target`: la meta escrita. Sin meta escrita, un porcentaje no significa nada.
- Sin iconos. Un icono decorativo en una métrica es ruido.

### Ítem de lista — `<CommitmentItem>`, `<FocusBlockItem>`

```
<li class="bg-card ring-1 ring-foreground/10 rounded-lg p-4 flex flex-col gap-3">
  fila 1: título (text-sm) + meta (xs, separada por ·)   |   badges de estado
  fila 2: acciones — principal a la izquierda, destructiva al extremo derecho
  fila 3 (condicional): panel expandido / error
</li>
```

- El estado va en `Badge`, con el color que corresponde a la palabra:
  `DONE`→success, `BLOCKED`/`CARRIED_OVER`→warning, resto neutro.
- La acción destructiva es `variant="ghost"` + icono `Trash2` + `aria-label`
  con el título del ítem. Nunca un botón rojo compitiendo con la acción real.
- La deuda de documentación se señala **en el botón que la resuelve**
  (`Documentar` en ámbar), no con una etiqueta más en una fila ya llena.
- El bloque en curso sube su anillo a `ring-foreground/30` y muestra el
  cronómetro grande. Es lo único que corre; tiene que verse desde lejos.

### Formulario

- Todo control dentro de `<Field htmlFor label hint error>`.
- La ayuda recibe id `${htmlFor}-hint`; el control la referencia con
  `aria-describedby`.
- Escalas 1–5 como grupo de radios (`ScaleField`), no como `<select>`:
  se responde de un clic y se ve entera.
- Un solo botón `primary` por formulario, `self-start`.
- Los `<select>` son nativos (`<Select>` de `components/field.tsx`): se envían
  con el form sin estado en cliente.

### Estado vacío — `<EmptyState>`

Caja con borde punteado, icono `lucide` en `muted-foreground`, texto tal cual
está escrito y, si existe, la salida como botón. No consuela ni celebra.

### Error de validación — `<FormError>`

`role="alert"`, icono `CircleAlert`, `text-destructive`, siempre pegado al
control o al final del formulario. El control afectado lleva `aria-invalid`.
Confirmaciones con `<FormSuccess>` (`role="status"`, icono `Check`).

---

## 7. Iconos

`lucide-react`, tamaño heredado (`size-4` en botones, `size-3.5` en texto xs).

Se usan en cuatro sitios y en ninguno más:

1. Navegación (`Timer`, `CalendarRange`).
2. Acciones repetidas donde el icono ahorra lectura: `Play`, `Square`, `Plus`,
   `Trash2`, `Zap`, `LogOut`, `Check`, `FileText`.
3. Estado en avisos y errores: `CircleAlert`, `CalendarClock`.
4. Estados vacíos, uno por caja.

Todo icono decorativo lleva `aria-hidden`. Un icono sin texto exige
`aria-label`. Prohibido el icono ornamental junto a un título.

---

## 8. Responsive

| Breakpoint | Qué cambia |
|---|---|
| base (< 640) | una columna; métricas apiladas; formularios al final |
| `sm` (≥ 640) | métricas en 2–3 columnas; campos de formulario en rejilla |
| `xl` (≥ 1280) | split lista / formulario con aside `sticky` |

Reglas:

- Ninguna pantalla produce scroll horizontal a 375px (verificado).
- Los contenedores de texto llevan `min-w-0` dentro de flex; los títulos largos
  usan `text-pretty` / `text-balance`.
- Las filas de acciones son `flex-wrap`. Nunca se recortan botones.
- La altura de control es `h-8` (`sm` → `h-7`) en toda la app: `Input`,
  `Select` y `Button` coinciden.

---

## 9. Accesibilidad

- Foco visible global: `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px }`.
  Los componentes shadcn conservan su propio anillo; el resto hereda este.
- Contraste mínimo 4.5:1 para texto en ambos temas.
- `lang="es"` en `<html>`.
- Cronómetro con `role="timer"` y `aria-label`.
- Separadores decorativos (`·`) con `aria-hidden`.
- El estado de una métrica se enuncia también en texto para lectores de pantalla.
