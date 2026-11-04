# Desarrollo de Amimis

## Entorno y comandos

El proyecto se desarrolla en Linux (Fedora). Requiere npm y Node.js `^20.19.0 || >=22.12.0`, compatible con Vite 7.

```bash
npm ci
npm run dev
```

Abre http://localhost:4173/amimis/. Usa `localhost`: el servidor de desarrollo no responde en `127.0.0.1`.

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en el puerto 4173 |
| `npm run build` | Compila producción en `dist/` |
| `npm run preview` | Sirve el build para revisarlo localmente |
| `npm run typecheck` | Comprueba tipos sin emitir archivos |

Para probar desde un dispositivo de tu red local:

```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

Abre `http://<IP-local>:4173/amimis/` desde ese dispositivo; expón el servidor solo en una red de confianza.

## Estructura

- `index.html`: formulario accesible, opciones contraídas y resultado.
- `src/app.ts`: DOM, eventos, validación, URL, preferencias y almacenamiento local.
- `src/time.ts`: cálculo y parseo puros; normalización de la hora a `HH:mm`.
- `src/i18n.ts`: textos ES/EN y persistencia del idioma.
- `src/styles.css`: temas, contraste y diseño adaptable.
- `tests/`: cinco scripts de navegador para Playwright CLI; no hay `npm test` ni Jest/Vitest.
- `.playwright/cli.config.json`: Chromium aislado y sin interfaz gráfica.
- `vite.config.ts`: base `/amimis/` y puerto de desarrollo.

Conserva las claves y formatos de almacenamiento `*-v1` y los parámetros `wake`, `sleep`, `fmt`. Idioma y tema se recuerdan independientemente de «Recordar tus valores». «Limpiar» vacía hora y duración; «Restablecer» confirma antes de borrar el formulario, sus datos guardados y la URL. Ambos conservan idioma y tema.

## Comprobaciones de navegador

Instala Playwright CLI y Chromium si no los tienes:

```bash
npm install -g @playwright/cli@0.1.22
playwright-cli install-browser chromium
```

Con `npm run dev` activo, ejecuta desde otro terminal en la raíz:

```bash
playwright-cli -s=amimis open http://localhost:4173/amimis/
playwright-cli -s=amimis run-code --filename=tests/visual-checks.js
playwright-cli -s=amimis run-code --filename=tests/preferences-contrast.js
playwright-cli -s=amimis run-code --filename=tests/mobile-editing.js
playwright-cli -s=amimis run-code --filename=tests/theme-reload.js
playwright-cli -s=amimis run-code --filename=tests/wake-picker.js
playwright-cli -s=amimis close
```

| Script | Qué comprueba |
| --- | --- |
| `visual-checks.js` | Cálculo, formatos, errores, atajos, ayuda de ciclos, limpieza y restablecimiento, URL, persistencia, idiomas, temas, foco y movimiento reducido; controles de 44 × 44 px y ausencia de desbordamiento entre 320 y 1920 px |
| `preferences-contrast.js` | Preferencias tras recargar, limpiar y reabrir; contraste de texto y placeholders ≥ 4,5:1 y controles/foco ≥ 3:1 en ambos temas |
| `mobile-editing.js` | Backspace, entrada 12/24 h, validación, URL/datos guardados y español; resultado visible y compacto (tarjeta ≤ 180 px, texto principal de 18–22 px) en 320×667, 375×812 y 390×844, ES/EN y ambos temas |
| `theme-reload.js` | Paletas realmente calculadas antes/después de recargar con ambas preferencias del sistema, e iconos del tema |
| `wake-picker.js` | Las 96 sugerencias, mouse y teclado, cierre sin cambios, escritura libre, URL, traducciones, formato y ancho de 320 px en ambos temas |

Los contextos son nuevos, sin los datos de tu sesión habitual. Las capturas y snapshots quedan en `.playwright-cli/`, excluido de Git. Revisa también las imágenes: estas pruebas no sustituyen una auditoría completa de accesibilidad ni pruebas con lectores de pantalla o un celular físico. En móvil las opciones empiezan contraídas; abrirlas puede requerir desplazamiento.

**Tema claro que se ve oscuro:** revisa Dark Reader y el oscurecimiento forzado del navegador antes de cambiar el código. Un reporte anterior se debió a esa extensión; Chromium limpio no cubre extensiones que reescriben estilos.

## Publicar

Ejecuta `npm run build` y publica el contenido de `dist/` bajo `/amimis/` en un alojamiento estático. Si cambias la ruta, ajusta `base` en `vite.config.ts` y vuelve a compilar. No sirvas el TypeScript directamente con un servidor estático.

La web en línea usa un procedimiento local del autor que no se incluye aquí; no hay despliegue automatizado en este repositorio.

## Harness y continuidad

Consulta la [guía de uso](repo-harness/usage.md), el [estado actual](repo-harness/current-state.md) y el [mapa documental](repo-harness/README.md). La [preparación original](harness-readiness.md) es histórica.

Tras instalar o actualizar skills, ejecuta `/reload` en Pi. Comprueba las copias y su manifiesto con `python3 .repo-harness/check.py` (solo lectura). Las memorias, sesiones y capturas de pruebas permanecen locales.
