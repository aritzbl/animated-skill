# Fase 6 · Sonido: efectos y música

Objetivo: que **no haya huecos de silencio** y que cada acción tenga su sonido, sin descargar nada. Efectos **sintetizados con ffmpeg** (`aevalsrc`, determinista); **música solo con OK explícito de Nico por archivo**.

## Lección: el silencio se nota
En la v0.2 del Día 1, 27,7 s de 51,4 s estaban en silencio total (un hueco de 13,8 s en la escena de la mamá, que es muda). Nico se quejó. Desde entonces: **todas las escenas llevan ambiente + efectos**, y se mide con `silencedetect` (ver abajo). Las escenas mudas (el personaje que no habla, los personajes de burbujas) se llenan con efectos y, si Nico lo aprueba, con música.

## Efectos sintetizados: `build\sonidos.mjs`

```bash
node build/sonidos.mjs "<ffmpeg.exe>"      # escribe assets/sfx/*.wav (48 kHz mono 16 bits)
```
Es una **biblioteca de unos 40 efectos**; cada episodio agrega los suyos al final. Los sintetiza con expresiones `aevalsrc` (tonos con envolvente exponencial, ruido blanco con `random(0)` y filtros `lowpass`/`highpass`), así que los archivos salen iguales cada vez y no hay licencias que revisar. Para uno nuevo:
```js
// nombre, expresión en t, duración (s), filtros
sintetizar("campana", "sin(2*PI*1200*t)*exp(-t*9)*0.6", 0.8, "volume=1.0");
```
Es sonido **básico**: no se pudo escuchar. Avisalo siempre y dejá que Nico pida cambios ("sacá el sluuurp": se saca el efecto y a veces también el texto en pantalla).

### Catálogo
| Familia | Efectos |
|---|---|
| Golpes y madera | `toc`, `toc-iman` (golpe en madera: tono grave que cae + clic), `golpe`, `sello`, `latido`, `portazo`, `puerta-abre`, `pasos` |
| UI y avisos | `pop`, `plink`, `ping` (mensaje: dos notas), `ding`, `nivel` (arpegio de subida de la barra), `tick1`-`tick3` (un tic por tarjeta), `click1`, `click2` |
| Movimiento | `whoosh`, `whoosh-largo`, `papel`, `toalla` |
| Escritura | `lapicera-a`, `lapicera-b`, `lapicera-c` |
| Personaje | `suspiro`, `trago`, `ronquido` |
| Agua y baño | `ducha` (9 s), `goteo`, `plink`, `pfff` (champú), `espuma`, `gorgoteo`, `agua-off` |
| Pelo | `snip` (tijera), `peine`, `pelo-cae` |
| Ambientes | `amb-noche` (20 s: zumbido, tele, grillos), `amb-manana` (14 s: soplido y pajaritos), `reloj` (tic-tac) |
| Otros | `tin` (metal del cucharón) |

## Colocarlos: `build\sonido.json` + `build\colocar-sonidos.mjs`

```json
{ "esc1": [ { "s": "amb-manana", "t": 0, "d": 11.3, "v": 0.2 },
            { "s": "pop", "t": 3.08, "v": 0.5 },
            { "s": "pop", "t": 3.13, "n": 3, "cada": 0.05, "v": 0.4 } ],
  "hud":  [ { "s": "latido", "t": 1.33, "v": 0.4 } ] }
```
- `t` = segundo **local de la escena** (el HUD usa segundos del episodio). `s` = archivo de `assets\sfx` sin `.wav`. `v` = volumen. `d` = duración si hay que cortarlo (los ambientes largos). `n` y `cada` repiten.
- `node build/colocar-sonidos.mjs` escribe los `<audio>` entre `<!-- SONIDO:INICIO -->` y `<!-- SONIDO:FIN -->` de cada `escN.html` / `hud.html` (si no están las marcas, las inserta después del `<div id="root">`). Lleva una franja de `data-track-index` por escena (`escN` → N×100, `hud` → 5000) para que el lint no vea solapes.
- **Volúmenes de referencia:** ambientes 0,2; efectos 0,3 a 0,6; tics de tarjetas 0,3 (los pone `generar-subtitulos.mjs`, uno por tarjeta rotando `tick1-3`); latido del HUD 0,4. La voz va a 1 (−16 LUFS por línea).
- Sincronizá con el momento visual: el `ding` cuando aparece el cartel, el `snip` en cada corte, el `latido` cuando baja el contador del HUD.

### Medir el resultado
```bash
ffmpeg -hide_banner -nostats -i renders/ep-NN-vX.mp4 -af silencedetect=noise=-50dB:d=1 -f null - 2>&1 | grep -E "silence_(start|end)"
```
Meta: **silencios largos solo en la cola final** (unos 2 a 4 s). Cualquier hueco de más de 2 s adentro del episodio se llena.

## Música: solo con OK explícito

- **No se baja nada sin OK de Nico por archivo** (nombre, origen, tamaño). Tampoco "para probar".
- Cuando él quiera música, **proponé candidatas y esperá el sí.** Candidatas que se encontraron (nunca se bajó nada): **Mixkit**, licencia gratuita (uso comercial y redes, sin atribución, no revendible tal cual, según su página oficial; revisá los términos vigentes):
  - "Sweet September" de Arulo, 1:39, 3,0 MB, `https://assets.mixkit.co/music/282/282.mp3`
  - "Sleepy Cat" de Alejandro Magaña, 1:59, 3,6 MB, `https://assets.mixkit.co/music/135/135.mp3`
- Con el OK: `assets\musica\<archivo>.mp3`, anotar origen y licencia en el `LEEME.md` del episodio, mezclarla **a volumen bajo** (debajo de la voz, ~0,1 a 0,15), con **corte o bajada** en los remates (el portazo, la voz del voto), y volver a medir el loudness. El Día 1 se aprobó **sin música**; ese es el default.
