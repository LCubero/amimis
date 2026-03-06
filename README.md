# Amimis

Calculadora web para estimar a qué hora dormirte según tu hora de despertar y la duración de sueño deseada.

## Características

- Cálculo inmediato de hora recomendada para dormir.
- Entrada flexible de duración (`7.5`, `7,5`, `7:30`, `7h 30m`, etc.).
- Atajos rápidos: `4.5h`, `6h`, `7.5h`, `8h`, `9h`.
- Soporte de idioma `ES/EN` con persistencia en `localStorage`.
- Modo claro/oscuro con persistencia.
- Estado compartible vía query params (`wake`, `sleep`, `fmt`).
- UI responsive para desktop y móvil.

## Stack

- Vanilla TypeScript
- Vite
- CSS moderno (sin framework UI)

## Desarrollo local

```bash
npm install
npm run dev
```

Por defecto Vite sirve en `http://localhost:4173`.

Para probar en otros dispositivos de tu red local:

```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

Ejemplo LAN: `http://192.168.5.82:4173/`

## Scripts

- `npm run dev`: servidor de desarrollo.
- `npm run build`: build de producción en `dist/`.
- `npm run preview`: previsualiza el build.
- `npm run typecheck`: validación de tipos sin emitir archivos.

## Estructura

- `index.html`: shell de la app.
- `src/app.ts`: interacción UI/DOM, estado, eventos.
- `src/time.ts`: lógica pura de tiempo y parseo.
- `src/i18n.ts`: textos, idioma activo y persistencia.
- `src/styles.css`: estilos y responsive.

## Deploy

Compila con:

```bash
npm run build
```

Publica el contenido de `dist/` en tu hosting estático.
