# Fase 5 · Producción con HyperFrames

Objetivo: de guion + voz a un MP4 verificado en `<serie>\Terminados\`. Un proyecto HyperFrames **por episodio** (`episodio-NN\`), con un `LEEME.md` propio. Todo local, versiones fijas, telemetría apagada.

## Entorno

| Qué | Valor |
|---|---|
| HyperFrames | **0.9.30** fijo (`package.json` + `package-lock.json` con hashes). GSAP 3.15.0 viene vendoreado en `node_modules\hyperframes\dist\vendor\npm`. |
| Node | 22 (el `fetch` de `tts-eleven` lo necesita). |
| ffmpeg | `C:\Users\nicol\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe` (y `ffprobe.exe` al lado). Si no se encuentra en una shell ya abierta, abrir una nueva. |
| Python con Whisper | `C:\Users\nicol\Desktop\Proyectos\Animaciones\Animador de IA\.venv\Scripts\python.exe` (3.13.3; `openai-whisper`, `numpy`, `yt-dlp`). **Verificá que exista**. Para uno nuevo: `requirements-pinned.txt` (descarga paquetes: pedir permiso). |
| Whisper | modelo `small`, ya en `~/.cache/whisper/small.pt` (hash oficial verificado). No hay que descargar nada. |
| Variables en cada shell | `DO_NOT_TRACK=1 HYPERFRAMES_NO_AUTO_INSTALL=1 HYPERFRAMES_NO_UPDATE_CHECK=1` |
| Comandos | siempre `npx --no-install hyperframes <cmd>` desde la carpeta del episodio |

**Nunca** `hyperframes skills`, `hyperframes skills update`, `npx skills add` ni `hyperframes events` (beacon). `hyperframes init` imprime la sugerencia de `skills update`: ignorarla.

### Serie nueva (primera vez)
```bash
node "<skill>\templates\crear-serie.mjs" --destino "C:\Users\nicol\Desktop\Proyectos\Animaciones\<serie>" --serie "Nombre" --cuenta @cuenta --personaje "Nombre"
```
Crea la carpeta con `personaje\`, `episodio-01\`, `Guiones\`, `Referencias\`, `Terminados\`, `tts-eleven\`, `voz-herramientas\`, `bocetos\`, `logo\`, `package.json` y lock. **No instala nada.** Después, con permiso de Nico, una de dos: copiar `node_modules` de una serie que ya tenga HyperFrames 0.9.30 (sin red), o `npm ci` (instala solo lo que dice el lock). Es una serie nueva **dentro de `Animaciones`**; nunca en OneDrive.

### Episodio nuevo
```bash
node "<skill>\templates\crear-episodio.mjs" --serie "<carpeta de la serie>" --numero 02 [--desde episodio-01]
```
(`<skill>` = la carpeta de esta skill, p. ej. `...\Animador de IA\.claude\skills\crear-serie-animada`). Copia la plantilla de episodio, el rig y las fuentes de `<serie>\personaje\assets`, y con `--desde` reusa el HUD y los efectos ya sintetizados. Cada episodio queda **congelado con el rig que tenía**: si el rig cambia, recopiá `personaje.js/.css/-markup.js` a `assets\` del episodio que lo necesite (el Día 1 de Gonza no se tocó cuando se agregó `pelo-largo`).

## Anatomía de un episodio

```
episodio-NN\
  index.html                  raíz: #root main 1080x1920; ESCENAS y VOCES entre marcas (las escribe armar-index.mjs)
  compositions\escN.html      una escena cada una (a mano)
  compositions\hud.html       HUD con objeto de configuración HUD al principio del script
  compositions\subt.html      GENERADO desde build\tiempos.json
  assets\personaje*.js/css, helpers.js, fonts\Fuente-*.woff2, voz\, sfx\, voz-palabras.js, episodio-tiempos.js
  build\escenas.json          inicio y duración de cada escena
  build\tiempos.json          voces (inicio, línea, archivo) y tarjetas de subtítulo
  build\sonido.json           efectos por escena
  build\tomas-elegidas.json   toma elegida por línea y carpeta de las tomas
  build\correcciones-voz.json arreglos manuales de Whisper (sobreviven a reimportar)
  build\*.mjs                 el pipeline
  renders\                    MP4 de cada versión
  LEEME.md                    estructura, versiones, qué falta
```

### Contrato de HyperFrames (lo que hace que `check` y el render funcionen)
- Cada elemento temporal lleva `class="clip"` y `data-start` / `data-duration`; las escenas se montan con `data-composition-id` + `data-composition-src="compositions/escN.html"` y `data-track-index` (pistas distintas para lo que se superpone).
- **Un solo timeline pausado por composición**, registrado en `window.__timelines["<id>"]`. Nada de `Date.now`, `Math.random` ni `repeat: -1` (usar ciclos explícitos). No tweenear `display`/`visibility` en elementos `.clip`.
- **Fuentes locales:** `@font-face` a `assets/fonts/Fuente-*.woff2`. Si no, HyperFrames **baja Google Fonts** al renderizar cualquier texto, incluso con `font-family: sans-serif` (bajó Archivo Black e Inter). Composiciones sin texto no descargan nada. Rutas siempre `assets/...`.
- Elementos fuera del cuadro (el rig montado con `overflow: true`, sacudones) llevan `data-layout-allow-overflow`.
- **El render va SIN `--quiet`** (con `--quiet` falló una vez sin mensaje; sin `--quiet` anduvo). Si falla sin mensaje, reintentar sin `--quiet`.
- `check` marca como **falsos positivos** (no hace falta tocarlos): `rotation_pivot_drift` / `off_pivot_rotation` de las articulaciones del rig ("gauge/dial pointer": el brazo rota sobre el hombro a propósito), y el aviso de "film's last line" por dos muestras en blanco al final. `timeline_track_too_dense` de los subtítulos es solo estético.
- `check` **sí** hay que atenderlo cuando marca: contraste (< 3:1), `line_unread` (un cartel final tiene que quedar ≥ 2 s en pantalla), audio sin archivo, solapes de pista.

## Cadena de producción (desde `episodio-NN\`)

```bash
export DO_NOT_TRACK=1 HYPERFRAMES_NO_AUTO_INSTALL=1 HYPERFRAMES_NO_UPDATE_CHECK=1
FFMPEG="<ffmpeg.exe>"; PY="<python con whisper>"
node build/sonidos.mjs "$FFMPEG"                    # 1. efectos sintetizados (una vez; ver 06-sonido.md)
node build/importar-voces.mjs "$FFMPEG" "$PY"       # 2. voces: recorta, nivela, Whisper por palabra
node build/afinar-inicios.mjs "$FFMPEG"             # 3. informe de inicios (con --aplicar los corrige)
node build/alinear-tarjetas.mjs                     # 4. t0/t1 de cada tarjeta
# 5. ajustar a mano: "inicio" de cada voz en tiempos.json y duración de cada escena en escenas.json
node build/armar-index.mjs                          # 6. escenas + voces en index.html y assets/episodio-tiempos.js
node build/generar-subtitulos.mjs                   # 7. compositions/subt.html
node build/colocar-sonidos.mjs                      # 8. <audio> de efectos entre SONIDO:INICIO/FIN de cada escena
npx --no-install hyperframes check                  # 9. 0 errores
npx --no-install hyperframes snapshot --at 1,4.8,19.4   # 10. cuadros; MIRARLOS
npx --no-install hyperframes render -o renders/ep-NN-v0.1.mp4   # 11. SIN --quiet
```
`snapshot` deja los PNG y una `contact-sheet.jpg` en `.hyperframes\artifacts\snapshots\<id>\`: abrila con `Read` para mirar los cuadros. Elegí tiempos clave (gancho a 1 s, cada escena, el resultado, el cierre).

### Escribir las escenas (a mano)
- Partí de `compositions\esc1.html` (gancho) y `esc2.html` (voto). Una escena = `<template>` con `<style>`, `<div id="root" data-composition-id="escN">`, el fondo, el host del personaje y el `<script>` con el timeline.
- El personaje: `Personaje.mount(host, { width: "680px", overflow: true, pose, expr, dia: N })` + `Personaje.breathe`, `blink`, `Hab.hablaLinea(tl, p, "<línea>", "escN", "cerrada")`, `poseTo`, `exprTo`, `mejoraTo`.
- Los tiempos dentro de la escena son **locales a la escena**; `Hab.hablaLinea` ya convierte la voz usando `assets\episodio-tiempos.js`. El HUD usa segundos del **episodio**.
- Una escena nueva se agrega en `build\escenas.json` (`{ "id": "esc3", "inicio": 11.3, "dur": 6 }`) y `node build/armar-index.mjs`.
- Zonas de seguridad y tamaños: `07-formato-reels.md`.

### Subtítulos
`tiempos.json` define tarjetas `{ "voz": "v01", "t0": 0, "t1": 0.8, "pal": [["DÍA"], ["DOS."]] }`. Palabra `["29", "n"]` = número en amarillo, `["PELO.", "k"]` = palabra clave en rojo; `punch: true` = más grande con rebote; `fijo: true` = no se recalcula. **Tarjetas de 1 a 3 palabras y una o dos líneas (~12 caracteres por línea).** Una de 4 líneas tapó al personaje y Nico se quejó: partí en varias (`GONZA / SE ENFRENTA / A LO QUE MÁS / TEME: / EL AGUA`). `alinear-tarjetas.mjs` las alinea solas con las palabras de Whisper (deletrea los números para que "29" calce con "veintinueve").

## LISTA DE RETIMEO cuando cambia la voz

Cuando llegan voces nuevas (guía → ElevenLabs) o se regenera una línea, **todo lo atado a la voz** se corre. En orden:
1. `build\tiempos.json`: `inicio` de cada voz (el `dur` sale de importar) y las tarjetas `"fijo": true` (se revisan a mano: la voz guía no reconocía "Ahhh").
2. `build\escenas.json`: duración de cada escena (en el Día 2 la escena 6 pasó de 9,1 a 7 s y el episodio de 56,4 a 54,3 s); después `node build/armar-index.mjs` (reescribe `<audio>` de voces y `data-start/duration` de escenas).
3. En `escN.html`: la boca por palabra con `Hab.hablaLinea` se corre sola; la que hayas hecho a mano con `Hab.habla(tl, p, t0, [[ini, fin], ...])` hay que rehacerla; también gestos, cambios de expresión y apariciones de carteles atadas a una palabra.
4. `compositions\hud.html`: `tDias` (segundo en que baja el contador, el de la palabra que lo dice) y `tBarra`.
5. `build\sonido.json` (los efectos atados a la voz o a una escena que cambió de largo) y `node build/colocar-sonidos.mjs`.
6. `node build/generar-subtitulos.mjs`.
7. `check`, `snapshot` en los cuadros afectados, render nuevo.

### Truco: afinar el inicio de las palabras con la energía del audio
**Whisper adelanta palabras después de una pausa** (marca una palabra 0,2 a 0,5 s antes de que se oiga) y **a veces inventa una palabra al final** ("siglo"). Un cartel o una boca que arrancan en silencio se notan. `node build/afinar-inicios.mjs "<ffmpeg.exe>"` mide la energía del audio cada 10 ms y propone mover cada inicio al primer tramo con voz (30 ms seguidos a −20 dB de la voz fuerte, con 30 ms de adelanto); también marca las palabras que caen en puro silencio. Con `--aplicar` escribe los cambios en `voz-palabras.json`, `voz-palabras.js` y `correcciones-voz.json` (así **sobreviven a reimportar**). Es una heurística: mirá el informe antes de aplicar. Una palabra "sin energía" se confirma de oído (o con Whisper en tomas vecinas) y se saca con `"quitar"` en `correcciones-voz.json`.

## Verificar y entregar

1. `hyperframes check` con **0 errores** (los falsos positivos de arriba se ignoran y se dicen).
2. `snapshot` en los cuadros clave y **mirarlos** (zonas seguras, nada tapado, subtítulos legibles, HUD en y 186).
3. Render sin `--quiet` → `renders\ep-NN-vX.Y.mp4`.
4. Medir con ffprobe y ffmpeg:
   ```bash
   ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of csv=p=0 renders/ep-NN-v0.1.mp4   # 1080x1920, 30/1, h264 + aac
   ffmpeg -hide_banner -nostats -i renders/ep-NN-v0.1.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:"           # ~ -13 a -15 LUFS, pico ≈ -1 dBFS
   ffmpeg -hide_banner -nostats -i renders/ep-NN-v0.1.mp4 -af silencedetect=noise=-50dB:d=1 -f null - 2>&1 | grep silence      # silencios largos solo al final
   ```
5. Copiar a `Terminados\ep-NN-v0.1-<voz>.mp4` (ej. `dia-02-v0.5-elevenlabs.mp4`). **No se borran versiones anteriores.**
6. Documentar la versión en `episodio-NN\LEEME.md` y en la memoria (qué cambió, medidas, qué falta).
7. Mandarle el render con `SendUserFile` (`display: "render"`) y **decir qué no pude verificar**: no escucho el audio ni veo el movimiento, solo cuadros y mediciones; los efectos sintetizados no se pudieron oír.
8. **Nada se publica ni se manda a nadie.**

## Salió bien si
- Cada paso de la cadena corrió sin error y `check` da 0 errores.
- Los cuadros muestran HUD en y 186, subtítulos en y 1088 a 1332, personaje sin tapar, sin elementos importantes en los 168 px de arriba ni en el borde derecho de la mitad de abajo.
- ffprobe: 1080×1920, 30 fps, H.264 + AAC, duración = `escenas.json`. Loudness cerca de −14 LUFS, pico ≈ −1 dBFS.
- El render está copiado en `Terminados\`, documentado en el `LEEME.md` y enviado a Nico con el aviso de lo no verificado.
