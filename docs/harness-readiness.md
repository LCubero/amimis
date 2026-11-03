# Preparación de repo-harness-builder

Amimis tiene una base funcional y visual comprobada. Este documento prepara una
instalación futura del harness: **no es un harness generado, una instalación ni
un plan de aplicación aprobado**.

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

`AGENTS.md` existe como instrucción **local ignorada por Git**. La política del
repositorio también excluye skills y artefactos del asistente. No forzar su
publicación ni reemplazarlos silenciosamente al preparar el harness.

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
[README.md](../README.md#revisión-visual-con-playwright).

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

## Pendiente abierto

**El fallo de apariencia clara tras F5 reportado por el usuario no está resuelto.**
En Chromium limpio, con ambas preferencias del sistema, se conservaron selección
y colores calculados correctos. Falta identificar navegador, versión y ajustes
relevantes para reproducir la captura. No atribuirlo a una extensión sin evidencia.
No cambiar persistencia ni declarar el problema cerrado solo porque el atributo
`data-theme` diga `light`.

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

## Preparación del builder

Se inspeccionó una copia de referencia de `repo-harness-builder` **3.2.0** en
`ld9_dev_portfolio`. Sus archivos generados son específicos de ese proyecto y no
se copiaron. Amimis todavía no tiene `.repo-harness/manifest.json`, checker ni
`REPO-HARNESS.md`; no se ha ejecutado render, apply o check del builder aquí.

Antes de aplicar:

1. Hacer disponible una copia confiable de la skill y seleccionar explícitamente
   este repositorio. No usar otro proyecto como destino de la instalación.
2. Auditar y proponer integración de la documentación existente; este README y
   este documento son contenido humano, no archivos generados reemplazables.
3. Resolver los perfiles de runtime y los idiomas de documentación. La sesión
   actual usa Pi y el README está en español, pero eso no selecciona perfiles ni
   idiomas del futuro harness en nombre del usuario.
4. Resolver la licencia: no hay licencia de proyecto declarada. Decidir también
   si se necesita una guía de contribución; no crear ninguna por suposición.
5. Revisar la política de `AGENTS.md` y de las proyecciones de skills ignoradas.
   Cualquier cambio de seguimiento debe estar incluido en el plan aprobado.
6. Mostrar los cuatro conjuntos de acciones del builder y el digest vigente.
   Aplicar solo tras la aprobación propia de ese plan y ejecutar su validación.

La preparación documental y el commit/push actuales **no aprueban** la futura
instalación, elecciones del builder ni su plan de cambios.

## Archivos que no deben publicarse

`node_modules/`, `dist/`, `export/`, `.engram/`, `.ldout/` y `.playwright-cli/`
son dependencias, salidas generadas o estado local. Se mantienen fuera de Git,
sin borrar los archivos del usuario. Solo se comparte la configuración de
Playwright y los scripts de prueba, no perfiles, sesiones ni capturas.
