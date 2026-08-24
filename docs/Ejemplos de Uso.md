# Ritmo — Ejemplos de uso

Este documento explica **qué hace cada función de cada pantalla y por qué existe**.
El "por qué" importa tanto como el "qué": casi todas las restricciones de la app
son deliberadas y varias parecen molestias hasta que se entiende contra qué
problema fueron puestas.

> La app parte de un diagnóstico: trabajas sin jefe que te pida cuentas, y sin
> estructura externa la disciplina se erosiona sola. Ritmo no te ayuda a
> organizarte — te obliga a rendir cuentas. Si una función te resulta incómoda,
> normalmente es porque está funcionando.

---

## El ciclo completo, en una pasada

| Cuándo | Pantalla | Qué haces |
|---|---|---|
| Lunes, 15 min | `/semana/planificar` | Declaras capacidad, defines 3-5 compromisos, arrancas la semana |
| Cada mañana | `/hoy` | Planificas bloques de foco y los cronometras |
| Cada día, al cerrar | `/hoy` | Registras energía, concentración y **el logro del día** |
| Al terminar cada tarea | `/semana` → Documentar | Escribes la documentación y cierras el compromiso |
| Cuando algo te frena | `/semana` → Bloqueos | Lo anotas en el momento |
| Viernes | `/semana/retro` | Arrastras o descartas lo abierto, escribes la retro, cierras |
| Viernes, después de la retro | `/semana/informe` | Imprimes o descargas lo que la semana puede demostrar |
| Cuando quieras mirar atrás | `/metricas`, `/semana/historial` | Tendencias y semanas cerradas |
| Cuando algo dura más de una semana | `/proyectos` | Agrupas compromisos y documentos, y ves el tiempo real acumulado |

---

## Pantalla: Hoy (`/hoy`)

Es la pantalla del día a día: dónde se va tu tiempo y qué te sacó de él.

### Bloques de foco

**Planificar un bloque.** Defines una hora de inicio, una de fin, una categoría
(Soporte, Desarrollo, Reportes, Documentación, Aprendizaje, Reunión) y,
opcionalmente, el compromiso de la semana al que pertenece.

*Por qué:* un día sin bloques planificados es un día que se va en reaccionar. El
plan original del que nace la app decía "bloque protegido de 90 minutos, sin
excepciones"; esto es ese bloque, hecho dato.

**Vincular un compromiso** es opcional pero es lo que hace que el tiempo real
aparezca luego en `/semana` junto a la estimación ("45m de 1h 30m"). Sin
vincular, el bloque cuenta para el total del día pero no dice a qué tarea fue.

**Iniciar.** Arranca el cronómetro real.

> **Solo puede haber un bloque corriendo a la vez.** Si intentas arrancar un
> segundo, la app lo rechaza. *Por qué:* dos cronómetros simultáneos son
> exactamente la dispersión que la herramienta combate; permitirlo convertiría
> el registro en ficción.

**Me distraí.** Un contador que subes tú, en el momento.

*Por qué:* contarlas al final del día es inventarlas. Solo se pueden contar
mientras el bloque corre — antes de iniciarlo o después de cerrarlo, la app lo
rechaza.

**Terminar.** Cierra el bloque, calcula los minutos reales y te pide un número:
**los minutos que te robó una interrupción** (0 si ninguna).

*Por qué ese número y no una casilla de "¿fue protegido?":* `wasProtected` se
**deriva** de ese dato en lugar de preguntarse. Preguntar "¿estuvo protegido?"
invita a mentirse; preguntar "¿cuántos minutos perdiste?" no tanto. Si pones más
minutos de los que duró el bloque, la app te lo dice.

Un bloque ya cerrado **no se puede borrar**. Es tu historial real.

### Cierre del día

Cuatro campos: energía (1-5), concentración (1-5), **logro del día
(obligatorio)** y qué te frenó (opcional).

*Por qué el logro es obligatorio y pide mínimo 10 caracteres:* es el antídoto
directo contra la negatividad que motivó el proyecto. Un día sin un solo logro
registrado casi nunca es un día sin logros — es un día que no miraste. La app no
acepta "ok" como logro.

Es un registro **por día**: si vuelves, corriges el de hoy, no creas otro.

### Los tres datos de arriba

| Dato | Qué mide | Por qué |
|---|---|---|
| **Tiempo registrado** | Minutos de bloques **cerrados** hoy | Solo cuenta lo terminado: un bloque abierto todavía no es tiempo trabajado |
| **Bloques protegidos** | Cuántos bloques cerrados terminaron sin interrupción. **Meta ≥ 70%** | Es la medida de si tus bloques son reales o teóricos |
| **Distracciones** | Suma del contador del día | En verde solo si hay bloques y ninguna distracción: cero sin bloques no es mérito |

---

## Pantalla: Semana (`/semana`)

La pantalla central. Tiene tres estados según el ciclo: **Planificando**, **En
curso** y **Cerrada**.

### El ritual del lunes (`/semana/planificar`)

Tres pasos, 15 minutos.

**1. Declarar capacidad.** Los minutos que realmente tienes esta semana. Debe ser
mayor que cero y como máximo 3.600 minutos (60 horas).

*Por qué:* no son tus horas de contrato. Descuentas soporte, reuniones e
interrupciones. Sin este número no se puede saber si te comprometes a poco, y
"cumplí el 100%" de tres tareas triviales no es cumplir.

**2. Definir 3-5 compromisos.** Título (mínimo 4 caracteres, máximo 140),
categoría, prioridad (alta/media/baja), estimación opcional en minutos (entre 15
y 2.400) y la casilla **"Exige documentación para cerrarse"**, marcada por
defecto.

*Por qué el mínimo de 15 minutos:* menos que eso no merece ser un compromiso
semanal. *Por qué el máximo de 2.400:* si algo te ocupa 40 horas, divídelo.

**3. Iniciar la semana.** No se puede iniciar sin un solo compromiso.

> **Este botón es el que cambia el significado de todo lo que entre después.**
> Mientras la semana está en planificación, lo que agregas cuenta como
> planificado. En cuanto arrancas, todo lo nuevo se marca automáticamente como
> **no planificado**. Tú no eliges esa etiqueta: la decide el estado del ciclo.
>
> *Por qué:* así no puedes reclasificar una incidencia del miércoles como si la
> hubieras previsto el lunes. Es la diferencia entre "no cumplí" y "me
> interrumpieron", y es el dato con el que puedes defender tu carga de trabajo
> ante la empresa.

### Durante la semana

**Registrar trabajo no planificado.** El mismo formulario, pero ahora lo que
entra queda marcado como no planificado. Es donde van las incidencias de Exactus
que aparecen a media semana.

**Cambiar el estado** de un compromiso: Planificado, En curso, Bloqueado,
Arrastrado o Descartado.

> Fíjate en lo que **no** está en esa lista: **Hecho**. No se puede marcar a
> mano. La única forma de llegar a "Hecho" es el botón **Cerrar**, que valida la
> documentación. Si el código intentara cambiar el estado a `DONE` por esta vía,
> falla con un error explícito en lugar de permitirlo en silencio.

**Documentar.** Abre un campo de texto con la plantilla mental sugerida: qué
hace, cómo se usa, decisiones técnicas, pendientes conocidos.

**Cerrar.** Aquí vive la regla central del proyecto:

> **No puedes cerrar una tarea sin documentación.** Si el compromiso exige
> documentación y no hay ni notas ni un documento vinculado, la app se niega:
> *"No puedes cerrar esta tarea sin documentación. Escribe qué hace, cómo se usa
> y qué decidiste."*
>
> *Por qué:* no documentar era uno de los cuatro problemas declarados al inicio.
> Convertir la documentación en parte de la definición de terminado es la única
> forma de que no se quede para "cuando haya tiempo". Si una tarea concreta
> realmente no lo necesita, se desmarca la casilla **al crearla** — conscientemente,
> no por olvido.

**Ascender a documento.** Si el compromiso tiene notas, este botón las convierte
en un documento real de `/docs`, lo vincula y limpia las notas. Todo en una
transacción: si algo falla, el compromiso sigue documentado como estaba.

Un compromiso ya cerrado **no se puede eliminar**. Es tu historial.

### Bloqueos

Registras qué te frenó (mínimo 10 caracteres: *"no avanza"* no le sirve a nadie),
opcionalmente vinculado a un compromiso. Puedes marcarlo como resuelto.

*Por qué:* es la tercera pregunta del auto-Scrum ("qué bloqueó algo") y la que
más se olvida. Anotarlo cuando pasa, no el viernes de memoria.

### Los cinco datos de la semana

Las tres primeras son las que deciden si la semana valió:

| Dato | Cálculo | Meta | Por qué |
|---|---|---|---|
| **Cumplimiento** | Hechos ÷ total, **solo sobre lo planificado el lunes** | ≥ 80% | Si contara lo no planificado, una semana devorada por incidencias te marcaría como incumplidor |
| **Trabajo no planificado** | Tareas no planificadas ÷ total | Conocerlo | Te dice si el problema eres tú o es la carga de soporte. Es el único dato con el que puedes negociar tu tiempo |
| **Arrastre** | Tareas que pasan a la semana siguiente | ≤ 1 por semana | La más brutal: distingue "me sobre-comprometo" de "no cumplo" |

Y dos de control, en tamaño menor:

| Dato | Cálculo | Meta | Por qué |
|---|---|---|---|
| **Compromiso vs capacidad** | Minutos comprometidos ÷ capacidad declarada | 70-90% | Evita que el sistema premie la cobardía: cumplir el 100% de casi nada no es cumplir |
| **Deuda de documentación** | Tareas cerradas sin documentar | 0 siempre | Por diseño debería ser imposible. Si alguna vez no es 0, hay un camino a "Hecho" que se saltó la regla |

> Con la semana vacía, estos números salen en **gris, no en verde**. Un cero sin
> datos no es un logro, es ausencia de información — y felicitarte por él sería
> justo la mentira que la app existe para evitar.

### El ritual del viernes (`/semana/retro`)

**Qué haces con lo abierto.** Cada compromiso sin cerrar lleva una casilla,
marcada por defecto.

- **Marcado** → se arrastra: el original queda como *Arrastrado* y **nace una
  copia en la semana siguiente** que apunta al original.
- **Sin marcar** → se descarta conscientemente.

> No hay tercera opción. *Por qué:* dejarlo flotando es exactamente lo que hacías
> antes de tener la app. Y como la copia guarda de qué semana viene, **el arrastre
> no se puede borrar reescribiendo la tarea**.

**Qué salió bien / qué hay que mejorar.** Ambos obligatorios, mínimo 10
caracteres. *"Si no puedes nombrar una sola cosa que salió bien, no miraste"* y
*"una retro sin nada que mejorar no es una retro"*.

**Cerrar la semana.** Todo ocurre en una transacción: se guarda la retro, se
marcan los estados, se crea la semana siguiente en modo planificación con lo
arrastrado ya dentro, y el ciclo queda cerrado. **No se puede cerrar dos veces**,
ni cerrar una semana que nunca arrancó, ni registrar bloqueos después.

### Historial (`/semana/historial`)

Las semanas terminadas, de la más reciente a la más antigua, con cumplimiento,
trabajo no planificado, arrastre y minutos comprometidos.

Una semana cerrada aparece aquí **aunque siga siendo la semana en curso**: si
solo mirara la fecha, cerrar la semana el viernes te dejaría frente a un historial
vacío.

### Informe de la semana (`/semana/informe`)

Una página pensada para salir de la pantalla: **Imprimir** (el navegador genera
el PDF) o **Descargar .md**. Sin `?cycle=`, es la semana en curso; desde el
historial, cada semana tiene su propio enlace.

Trae, en este orden: el resumen con las cinco métricas más las tres del tiempo
—registrado, bloques protegidos y distracciones—, la tabla de compromisos
planificados, la de trabajo no planificado con los minutos que se comieron las
interrupciones, el reparto real por categoría, los bloqueos y la retro si la
semana ya está cerrada.

*Por qué existe:* toda la app repite que el trabajo no planificado es el único
dato con el que puedes defender tu tiempo ante la empresa — y hasta ahora ese
dato no salía de aquí. Lo único exportable era la documentación. Un número que
solo existe dentro de tu herramienta personal no sirve para negociar nada.

*Por qué imprimible y no un PDF generado en el servidor:* Ctrl+P ya hace bien ese
trabajo. Añadir una librería de PDF sería una dependencia nueva para maquetar
aparte lo que la página ya sabe mostrar.

Al imprimir desaparecen la barra de navegación y los botones, y la hoja sale
siempre en tema claro aunque estés en oscuro. Una hoja impresa en negro es
ilegible y gasta tinta.

> Los compromisos **descartados** aparecen en las tablas aunque no cuenten para
> el cumplimiento. Un informe que esconde lo que abandonaste no sirve para rendir
> cuentas.

---

## Pantalla: Documentos (`/docs`)

Es donde vive lo que la regla del "Cerrar" te obliga a escribir.

**Buscar.** Por título, módulo, contenido o etiqueta, con filtro por tipo.

**Nuevo documento.** Título, tipo, módulo, etiquetas y contenido en Markdown con
vista previa.

- **Tipo**: Feature (qué hace, cómo se usa, decisiones), Proceso (procedimiento
  operativo), Incidente (postmortem de un soporte), Reporte (definición de un
  reporte) o Decisión (por qué se eligió X sobre Y).
- **Módulo**: dónde vive esto — *"App Órdenes de Pago"*, *"Exactus - CxC"*.
- **Etiquetas**: separadas por comas, máximo 10, normalizadas a minúsculas.
- **Contenido**: mínimo 30 caracteres. *"Eso no es documentación, es una nota."*

*Por qué esos cinco tipos:* cubren lo que realmente produces —una función nueva,
un procedimiento, un incidente resuelto, un reporte y una decisión técnica— sin
inventar categorías que nunca usarías.

**Compromisos vinculados.** Un documento puede cubrir **varios** compromisos y un
compromiso puede tener **varios** documentos.

*Por qué no uno a uno:* un incidente de Exactus genera varios documentos; un
documento de proceso cubre varias tareas; y un documento vivo, que se actualiza
con el tiempo, no pertenece a la tarea de una semana concreta.

> **Un documento no puede dejar huérfano a un compromiso ya cerrado.** Si es la
> única prueba de una tarea cerrada, la app no te deja ni desvincularlo ni
> borrarlo. Sin esto, la regla central se podría vaciar por la puerta de atrás:
> cerrar con documento, borrar el documento.

**Exportar.** Un documento suelto o todo de golpe, como archivo `.md` con
frontmatter.

*Por qué importa:* tu documentación no puede quedar secuestrada dentro de un
proyecto personal. Si mañana abandonas Ritmo, tiene que sobrevivir en archivos.
La exportación completa incluye **también las notas que aún no has ascendido** a
documento — si no, la promesa de "puede salir de la app" sería falsa.

---

## Pantalla: Proyectos (`/proyectos`)

La semana contesta *"¿cumplí?"*. El proyecto contesta la otra pregunta, la que el
ciclo semanal no puede responder: **"¿cuánto tiempo real llevo metido en esto?"**.

**Crear un proyecto.** Nombre (único, mínimo 3 caracteres), módulo, estado
—Activo, En pausa, Terminado, Archivado— y una descripción opcional.

*Por qué el nombre es único:* dos proyectos con el mismo nombre son el mismo
proyecto escrito dos veces, y sus horas quedarían repartidas entre ambos.

**Asignar trabajo.** Al crear un compromiso o un documento aparece un selector de
proyecto. **Siempre opcional**, y por defecto "Sin proyecto".

*Por qué opcional:* una incidencia de Exactus del martes no pertenece a ningún
proyecto. Obligar a elegir uno llenaría la lista de proyectos inventados para
contentar al formulario, y eso convierte la agrupación en ruido.

El selector solo aparece si ya existe algún proyecto: un desplegable vacío no
ayuda a nadie.

### Detalle del proyecto

| Dato | Qué mide | Por qué |
|---|---|---|
| **Tiempo real** | Minutos de bloques de foco **cerrados** de sus compromisos | Es la respuesta a "¿cuánto me ha costado esto de verdad?". Sale de los bloques, nunca de un contador acumulado que habría que mantener a mano |
| **Compromisos cerrados** | Hechos sobre el total, con su cumplimiento | Un proyecto con muchos compromisos abiertos y ninguno cerrado no avanza: se acumula |
| **Semanas tocadas** | Desde la primera hasta la última | Distingue un proyecto de dos semanas de uno que lleva cuatro meses abierto |

Debajo, el reparto de ese tiempo por categoría y las listas de compromisos —con
su semana y su estado— y de documentos propios.

### Archivar en vez de borrar

> **Un proyecto con compromisos cerrados no se puede borrar.** La app se niega y
> te manda a archivarlo. *Por qué:* es la misma regla que impide borrar un
> compromiso cerrado o un bloque ya registrado. Es tu historial.

Y si borras uno que **sí** se puede borrar, sus compromisos y documentos **no se
van con él**: se quedan sin proyecto. El trabajo que hiciste no dejó de existir
porque hayas reorganizado tus carpetas.

---

## Pantalla: Métricas (`/metricas`)

Doce semanas. Lo que no se sostiene en el tiempo no es un hábito.

### Los cuatro cuadros de arriba

| Cuadro | Qué muestra | Para qué sirve |
|---|---|---|
| **Racha** | Semanas consecutivas cumpliendo la meta del 80% | Es el número que más cuesta reconstruir y el que más duele perder. **La semana en curso no cuenta**: todavía puede caerse, e inflarla un lunes por la mañana sería mentir |
| **Cumplimiento medio** | Promedio de cumplimiento de las semanas cerradas. **Meta ≥ 80%** | Una semana mala es ruido; tres seguidas son un patrón. Las semanas sin dato se ignoran en el promedio: una semana vacía no es un 0% |
| **Trabajo no planificado** | Promedio de cuánto de cada semana no elegiste tú | **La meta es conocerlo, no bajarlo a cero.** Si está alto de forma sostenida, el problema no es tu disciplina: es la carga de soporte, y esto es la evidencia |
| **Arrastre acumulado** | Total de tareas arrastradas. **Meta ≤ 1 por semana** | Sube si te sobre-comprometes o si no cumples. Cruzarlo con el cumplimiento te dice cuál de los dos |

### Los cinco gráficos

**Cumplimiento por semana** (barras). Una barra por semana, con una **línea de
referencia en el 80%**. Las barras que llegan a la meta van en verde, las que no
en rojo.

*Para qué sirve:* ver de un vistazo si el 80% es tu suelo o tu techo. La línea
está dibujada a propósito, no solo el color: el dato tiene que leerse aunque no
distingas los colores.

**Trabajo no planificado** (línea). El porcentaje semana a semana.

*Para qué sirve:* detectar tendencia. Un pico aislado es una mala semana; una
línea que sube durante un mes es un cambio en tu puesto que conviene nombrar en
voz alta.

**Arrastre** (barras, con línea de referencia en 1).

*Para qué sirve:* es la alarma temprana. El arrastre sube antes de que el
cumplimiento caiga, porque primero empiezas a aplazar y después a incumplir.

**Distracciones** (barras). Las que contaste tú, en el momento.

*Para qué sirve:* es la única métrica que mide directamente el problema original
—YouTube en vez de música— y la única que depende por completo de tu honestidad
al registrarla.

**Minutos reales por categoría** (barras horizontales, ordenadas). El tiempo de
los bloques cerrados repartido entre Soporte, Desarrollo, Reportes,
Documentación, Aprendizaje y Reunión.

*Para qué sirve:* responde a "¿en qué se me fue el mes?". Si Documentación o
Aprendizaje aparecen en cero, ya sabes qué se está sacrificando cuando aprieta el
soporte.

### Detalles comunes a todos los gráficos

- **Cada gráfico trae su tabla** ("Ver como tabla"). Ningún valor queda accesible
  solo por el color o por pasar el ratón.
- **Un solo tono y sin leyenda**: hay una sola serie por gráfico, y el título ya
  dice qué se está mirando.
- **Con menos de dos semanas registradas no se dibuja nada.** Un gráfico de una
  sola barra no es una tendencia, es un número disfrazado.

---

## Otras funciones

- **Acceso con Google.** Toda la app está detrás del login. Se entra con Google
  y **solo pasan los correos de la lista blanca** (`ALLOWED_EMAILS`).

  *Por qué una lista blanca y no "cualquiera con cuenta de Google":* un OAuth sin
  lista deja entrar a cualquier cuenta del mundo. La lista es la autorización; el
  botón de Google solo dice quién eres.

  *Por qué no hay registro de usuarios:* sigue siendo una herramienta de una sola
  persona. Google es la puerta, no un sistema multiusuario: no hay tabla `User` ni
  datos separados por cuenta.

  La contraseña única sobrevive como **respaldo**, y sigue activa por su cuenta
  mientras Google no esté configurado. *Por qué:* si el OAuth queda mal
  configurado en producción y la contraseña ya no existe, te quedas fuera de tu
  propia app. Se apaga con `ALLOW_PASSWORD_LOGIN=0`, y solo después de comprobar
  que Google entra de verdad.
- **Tema.** El selector cicla entre seguir al sistema, claro forzado y oscuro
  forzado, y recuerda tu elección.
- **`/api/health`.** Devuelve `{"ok":true,"db":"up"}` si la base responde. Sirve
  para comprobar que un despliegue está realmente vivo.
