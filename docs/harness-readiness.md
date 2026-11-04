# Preparación de repo-harness-builder

Esta preparación se conserva como referencia histórica de la base de Amimis.
El plan del harness fue aplicado después de la entrevista y aprobación del
usuario. El estado vigente pertenece a [estado actual](repo-harness/current-state.md)
y los pendientes a la [hoja de ruta](repo-harness/roadmap.md), no a este registro.

## Base del proyecto

| Área | Evidencia actual |
| --- | --- |
| Producto | Calculadora de hora de dormir, pensada primero para celular; ES/EN y temas claro/oscuro. |
| Stack | TypeScript, Vite 7 y CSS sin framework; requiere build. |
| Inicio | `npm ci`, `npm run dev`, `http://localhost:4173/amimis/`. |
| Publicación estática | `npm run build`; contenido de `dist/` servido bajo `/amimis/`. |
| Estado local | Idioma y tema se guardan automáticamente; los valores del formulario solo si se activa «Recordar tus valores». |
| Enlaces | Parámetros `wake`, `sleep`, `fmt`; hora normalizada `HH:mm` de 24 horas. |
| Datos remotos | No hay backend, cuentas ni base de datos remota configurados. |

## Mapa que debe conservarse

- `README.md`: guía del producto, inicio, validación, despliegue y pendiente conocido.
- `index.html`: controles accesibles, opciones desplegables y resultado.
- `src/app.ts`: DOM, eventos, validación, URL, temas y persistencia.
- `src/time.ts`: utilidades puras; `normalizeWakeTime` acepta 24 h y AM/PM sin
  cambiar el contrato estricto de `computeBedtime`.
- `src/i18n.ts`: textos ES/EN y selección de idioma.
- `src/styles.css`: tokens, contraste y diseño móvil compacto; escritorio en dos columnas.
- `tests/`: cuatro scripts de comprobación mediante Playwright CLI; no hay un
  runner Jest/Vitest ni un script `npm test` configurados.
- `.playwright/cli.config.json`: Chromium aislado y headless; CLI validado en `0.1.22`.
- `vite.config.ts`: base `/amimis/` y puerto 4173. No sustituirlo por un servidor
  estático directo sobre los archivos TypeScript.

Durante la preparación, `AGENTS.md` y las carpetas `skills/` estaban ignorados.
El usuario autorizó después versionar solo la entrada, las skills del harness
y sus proyecciones Pi. Las excepciones acotadas conservan privados otros
artefactos; su razón y alcance están en [decisiones](repo-harness/decisions.md).

## Contrato visual y de entrada

- En móvil, priorizar el cálculo y el resultado compacto: sin ilustración grande
  y con las opciones secundarias contraídas. Al abrir opciones se permite scroll.
- Comprobar altura y posición del resultado, no solo ausencia de desbordamiento horizontal.
- Conservar edición carácter por carácter de la hora, incluidos Backspace y AM/PM.
- Conservar los datos y enlaces existentes; no cambiar las claves `*-v1` ni su
  formato sin una necesidad y una migración explícitas.
- Mantener foco visible, errores accesibles, movimiento reducido y controles de
  al menos 44 × 44 px; el checkbox conserva su etiqueta táctil.
- Medir contraste de texto y placeholder a 4,5:1 y de controles/foco a 3:1.
  Estos controles específicos no equivalen a una auditoría WCAG completa.

## Validación reproducible

Los comandos completos y la instalación de Playwright están en
[la guía de desarrollo](desarrollo.md#comprobaciones-de-navegador).

| Comprobación | Comando o archivo |
| --- | --- |
| Tipos | `npm run typecheck` |
| Producción | `npm run build` |
| Funcionalidad y responsive | `tests/visual-checks.js` |
| Preferencias y contraste | `tests/preferences-contrast.js` |
| Backspace, AM/PM y resultado móvil | `tests/mobile-editing.js` |
| Paleta antes/después de recargar | `tests/theme-reload.js` |
| Espacios/errores del diff | `git diff --check` |

Los scripts se ejecutan con `playwright-cli -s=amimis run-code --filename=<archivo>`
tras abrir la app en esa sesión. Crean contextos separados del almacenamiento
habitual. Las capturas son locales, en `.playwright-cli/`, y no se publican.

Como referencia de la corrección móvil: a 375 × 812, el resultado pasó de unos
394 px de alto y fuera del viewport a unos 120 px, visible dentro del viewport.
La prueba fija límites, no coordenadas exactas: tarjeta de hasta 180 px, título
de 18–22 px y resultado visible en 320 × 667, 375 × 812 y 390 × 844, ES/EN y ambos temas.

## Evidencia del pendiente de tema

La captura del usuario mostró apariencia oscura después de seleccionar claro y
recargar. Chromium limpio conservó selección y colores correctos con ambas
preferencias del sistema; no reprodujo esa captura. No atribuirla a una extensión
sin evidencia ni darla por resuelta por un atributo `data-theme` correcto.
El estado y la siguiente condición pertenecen ahora a `RH-W-0001` en la
[hoja de ruta](repo-harness/roadmap.md).

**Resuelto (2026-11-03):** el usuario confirmó que la causa era su extensión
Dark Reader; la app no tenía defecto.

## Entorno y dependencias pendientes

La instalación limpia con `npm ci`, tipos y build se comprobaron usando el
lockfile existente (Vite 7.3.1). En Windows fue necesario cerrar un proceso Vite
de esta sesión que retenía binarios nativos antes de poder reinstalar. Detener
solo el wrapper no liberó todos sus procesos hijos; identificar su propietario
y cerrar únicamente el proceso correspondiente, no procesos Node desconocidos.

`npm ci` informó **6 vulnerabilidades (1 baja y 5 altas)** en las dependencias
bloqueadas existentes. No se aplicó `npm audit fix`, no se amplió la política de
scripts de instalación y no se modificaron `package.json` ni `package-lock.json`.
Los avisos necesitan revisión separada; no presentar esta preparación como una
actualización de seguridad.

**Resuelto (2026-11-03):** `RH-W-0002` actualizó el lockfile (Vite 7.3.7);
`npm audit` informa 0 vulnerabilidades.

## Aplicación posterior del builder

Se inspeccionó inicialmente `repo-harness-builder` **3.2.0** en el portfolio de
referencia. Después se verificó la copia local de Amimis y se ejecutó aquí su
plan aprobado, sin copiar archivos generados de otro proyecto. El apply informó
`VALIDATED`, 43 creaciones y dos ampliaciones, sin reemplazos ni migraciones.

La entrevista y sus selecciones viven en [decisiones](repo-harness/decisions.md).
Las comprobaciones y el cierre de la instalación se registran en `RH-W-0003` de
la [hoja de ruta](repo-harness/roadmap.md) y en el registro técnico ODD enlazado
por el mapa de documentación. No se presume una validación por el mero hecho de
que existan los archivos; la guía de uso explica qué prueba cada checker.

La aprobación del plan no otorga autoridad para publicidad, empaquetado móvil,
cambios de licencia de producto ni publicación remota.

## Archivos que no deben publicarse

`node_modules/`, `dist/`, `export/`, `.engram/`, `.ldout/` y `.playwright-cli/`
son dependencias, salidas generadas o estado local. Se mantienen fuera de Git,
sin borrar los archivos del usuario. El estado local del harness bajo `.repo-harness/tmp/`, `archive/`, `state/` y
`memory-bk/` también está excluido. Se comparten la configuración de Playwright,
las pruebas y las fuentes del harness, no perfiles, sesiones, preferencias ni
capturas.
