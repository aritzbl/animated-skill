# Templates de `crear-serie-animada`

Copias **parametrizadas y limpias** de lo que se armó para Gonza y la serie "30 días para conseguir laburo": sin nombres de Gonza ni del Día N. Se usan con los dos scripts de abajo; casi nunca hace falta copiar a mano.

## Scaffolds

```bash
# serie nueva (carpeta nueva dentro de Animaciones; no instala nada, no descarga nada)
node crear-serie.mjs --destino "C:\Users\nicol\Desktop\Proyectos\Animaciones\<serie>" --serie "Nombre de la serie" --cuenta @cuenta --personaje "Nombre"

# episodio nuevo dentro de una serie (reusa el rig de <serie>\personaje y, con --desde, el HUD y los efectos del episodio anterior)
node crear-episodio.mjs --serie "<carpeta de la serie>" --numero 02 [--desde episodio-01]
```
Los dos se niegan a escribir en una ruta con `OneDrive`, no pisan carpetas existentes y reemplazan `{{SERIE}}`, `{{CUENTA}}`, `{{PERSONAJE}}`, `{{FECHA}}`, `{{SLUG}}` (serie) y `{{NN}}` (episodio). Los `{{N}}`, `{{N+1}}` y `{{TOTAL}}` de las plantillas de guion se completan a mano por episodio.

## Mapa

| Ruta | Qué es |
|---|---|
| `serie/package.json`, `package-lock.json` | HyperFrames **0.9.30** fijo, con los hashes del lock. `npm ci` (con permiso) o copiar `node_modules` de otra serie. |
| `serie/requirements-pinned.txt` | Whisper, numpy, yt-dlp (versiones fijas) para un venv nuevo (descarga paquetes: pedir permiso). |
| `serie/personaje/` | Proyecto del rig. `rig/personaje.svg` (fuente única), `rig/build.mjs`, `assets/personaje.js` (API `Personaje`), `assets/personaje.css` (paleta y variables de mejoras), `assets/fonts/Fuente-*.woff2` (Inter, OFL), `compositions/hoja.html` y `hoja-mejoras.html`, `index.html` (prueba), `ficha.md`. |
| `serie/bocetos/propuestas.html` | Página de 3 propuestas de personaje. |
| `serie/logo/` | Logo de cuenta armado con el rig (`index.html` paramétrico + `exportar.mjs`). |
| `serie/tts-eleven/` | `generar.mjs` (ElevenLabs; claves del `.env` de la serie o del entorno), `lineas-ep-01.json` de ejemplo, `LEEME.md`. |
| `serie/voz-herramientas/` | `generar-guia-sapi.ps1` (voz guía de Windows), `analizar-tomas.mjs`, `medir_voz.py`, `medir_varios.py`, `ranking-tomas.mjs`. |
| `serie/Guiones/`, `serie/Referencias/` | `plantilla-guion.md`, `plantilla-descripcion.md`, `brief-serie.md`, `plantilla-analisis.md`. |
| `serie/flujo-episodio.md` | Copia del flujo de producción de un episodio (el original está en `references/`). |
| `episodio/index.html` | Raíz 1080×1920; escenas y voces entre marcas, las escribe `build/armar-index.mjs`. |
| `episodio/compositions/` | `esc1.html` (gancho) y `esc2.html` (voto) de plantilla, `hud.html` configurable, `subt.html` (generado). |
| `episodio/build/` | `sonidos.mjs`, `importar-voces.mjs`, `afinar-inicios.mjs`, `alinear-tarjetas.mjs`, `armar-index.mjs`, `generar-subtitulos.mjs`, `colocar-sonidos.mjs` y los JSON de esquema: `escenas.json`, `tiempos.json`, `sonido.json`, `tomas-elegidas.json`, `correcciones-voz.json`. |
| `episodio/assets/helpers.js` | `Hab.habla`, `Hab.hablaLinea`, `Hab.brazo`, `Hab.pose`, `Hab.sacudon`. |

## Esquemas de los JSON

- **`escenas.json`**: `{ "duracion": 54.3, "hud": true, "escenas": [ { "id": "esc1", "inicio": 0, "dur": 11.3 }, ... ] }`
- **`tiempos.json`**: `{ "voces": [ { "id": "v01", "linea": "01-gancho", "archivo": "assets/voz/01-gancho.mp3", "inicio": 0.35, "dur": 10.45 } ], "tarjetas": [ { "voz": "v01", "t0": 0, "t1": 0.8, "punch": true, "fijo": true, "pal": [["DÍA"], ["29", "n"], ["PELO.", "k"]] } ] }`
- **`sonido.json`**: `{ "esc1": [ { "s": "pop", "t": 3.08, "v": 0.5, "d": 0.2, "n": 3, "cada": 0.05 } ], "hud": [...] }`
- **`tomas-elegidas.json`**: `{ "_carpeta": "ep-02-eleven", "01-gancho": "01-gancho-con-t2", ... }`
- **`correcciones-voz.json`**: `{ "04-resultado": { "quitar": ["siglo"], "renombrar": { "Gonzá": "Gonza" }, "ini": { "Cortado.": 1.02 }, "texto": "..." } }`
- **`lineas-ep-NN.json`**: `[ { "id": "01-gancho", "sin": "texto limpio", "con": "[excited] texto con etiquetas" } ]`

## Qué cambió respecto del proyecto original (y por qué)

- Nombres: `Gonza` → `Personaje`, `--g-*` → `--p-*`, `mate` → `prop-mano` / `prop-sorbo`, `joystick` → `prop-manos`, `auriculares` → `habito`, `pelo-grasa` → `pelo-sucio`, `GonzaSans` → `Fuente`, `episodio-dia-NN` → `episodio-NN`. La **estructura del rig (ids, jerarquía, pivotes, coordenadas) no cambió**: poses, IK y `ARM` valen igual.
- Nuevo: `armar-index.mjs` (escenas y voces desde JSON), `correcciones-voz.json` (los arreglos de Whisper sobreviven a reimportar), `afinar-inicios.mjs` (el truco de la energía del audio, que era manual), `Hab.hablaLinea` (la boca sigue sola a la voz), `voz-palabras.js`/`episodio-tiempos.js` (datos para las escenas), números deletreados en `alinear-tarjetas.mjs` (antes una tabla fija), `ranking-tomas.mjs` y `analizar-tomas.mjs` (estaban en el scratchpad), `generar-guia-sapi.ps1`, `crear-serie.mjs` / `crear-episodio.mjs`.
- `tiempos.json` ya no lleva `duracion` (vive en `escenas.json`) y cada voz lleva `linea`.
