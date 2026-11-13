# Episodio {{NN}}: "TÍTULO"

Proyecto HyperFrames **Reels 9:16, 1080×1920, 30 fps, ___ s**. Guion: `..\Guiones\ep-{{NN}}.md`. Salió de la plantilla de la skill `crear-serie-animada` (o de copiar el episodio anterior).

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Raíz: monta las escenas, el HUD, los subtítulos y las voces. **Lo que está entre marcas lo escribe `build/armar-index.mjs`.** |
| `compositions/escN.html` | Una escena cada una (contenido a mano) |
| `compositions/hud.html` | HUD configurable (objeto `HUD` al principio del script) |
| `compositions/subt.html` | Tarjetas cinéticas. **Generado**, no se edita a mano |
| `build/escenas.json` | Escenas: inicio y duración de cada una |
| `build/tiempos.json` | Voces (inicio, línea, archivo) y tarjetas de subtítulo |
| `build/sonido.json` | Efectos de sonido por escena |
| `build/tomas-elegidas.json` | Qué toma de voz usa cada línea (y de qué carpeta) |
| `build/correcciones-voz.json` | Arreglos manuales de Whisper (palabras inventadas, inicios afinados) |
| `build/*.mjs` | Pipeline (ver abajo) |

## Pipeline (desde esta carpeta; ffmpeg y python son rutas a ejecutables locales)

```bash
export DO_NOT_TRACK=1 HYPERFRAMES_NO_AUTO_INSTALL=1 HYPERFRAMES_NO_UPDATE_CHECK=1
node build/sonidos.mjs "<ffmpeg.exe>"                         # efectos sintetizados (una vez)
node build/importar-voces.mjs "<ffmpeg.exe>" "<python con whisper>"   # recorta, nivela a -16 LUFS, Whisper por palabra
node build/afinar-inicios.mjs "<ffmpeg.exe>"                  # informe; con --aplicar corrige inicios con la energía del audio
node build/alinear-tarjetas.mjs                               # t0/t1 de cada tarjeta
node build/armar-index.mjs                                    # escenas + voces en index.html
node build/generar-subtitulos.mjs                             # compositions/subt.html
node build/colocar-sonidos.mjs                                # <audio> de efectos en cada escena
npx --no-install hyperframes check
npx --no-install hyperframes snapshot --at 1,4,8                # mirar los cuadros
npx --no-install hyperframes render -o renders/ep-{{NN}}-v0.1.mp4   # SIN --quiet
```

## Lista de retimeo cuando cambia la voz

1. `build/tiempos.json`: `inicio` de cada voz (y `dur` sale de importar). Tarjetas con `"fijo": true` se revisan a mano.
2. `build/escenas.json`: duración de cada escena; después `node build/armar-index.mjs`.
3. Dentro de `escN.html`: gestos y cambios de expresión atados a palabras (la boca se corre sola con `Hab.hablaLinea`; la que sea a mano `Hab.habla` hay que tocarla).
4. `compositions/hud.html`: `tDias` y `tBarra`.
5. `build/sonido.json` y después `node build/colocar-sonidos.mjs`.

## Estado y versiones

- v0.1 (FECHA): … (qué cambió, medidas: duración, LUFS, pico, check).
- Qué NO se pudo verificar: audio (no se escucha), movimiento (solo cuadros y mediciones).
