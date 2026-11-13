# Fase 4 · Voz del personaje

Objetivo: tener, por cada línea del guion, un MP3 elegido en `<serie>\Guiones\voces\<episodio>-<guia|eleven|propia>\` y listo para importar. **Presentale a Nico las opciones y dejalo elegir**; no decidas la voz por él.

## Las opciones (presentalas en una tabla corta)

| Opción | Costo / licencia | Calidad | Qué requiere de Nico | Cuándo |
|---|---|---|---|---|
| **a) ElevenLabs** (se genera con su cuenta) | Plan gratis: 10.000 caracteres/mes, **sin licencia comercial** y pide atribución (según su ayuda oficial). Starter, con licencia comercial: $1 el primer mes y $6 después (precios del 2026-11-10: verificar). | La mejor: voces con acento argentino (Agustín, Ignacio, Malena Tango aparecieron en su página), etiquetas de emoción con `eleven_v3`. | Completar el `.env` con su clave y los IDs de voz (yo corro el script). | Cuando la voz importa y ya hay formato aprobado. |
| **b1) Voz guía de Windows (SAPI)** | Gratis, local, sin red, sin instalar. | Robótica. **Solo para fijar formato y tiempos.** | Nada. | Siempre, para armar el episodio antes de la voz final. |
| **b2) `edge-tts`** (voz Microsoft `es-AR-TomasNeural`) | Gratis pero **uso no oficial**, términos y licencia comercial dudosos. Para publicar con monetización **no es seguro**. | Buena, pero solo `rate`, `pitch` y `volume` (sin SSML ni estilos). | Revisión de seguridad ANTES de instalar y su permiso. | Solo si pide una opción gratis y entiende el riesgo. |
| **b3) Kokoro vía `hyperframes tts`** | Gratis, local, pero **baja un modelo** (pedir permiso). | Solo voz femenina `ef_dora`, sin acento argentino. | Permiso de descarga. | Raro: personaje femenino sin acento. |
| **b4) Piper** | Gratis, local. | `es_AR-daniela` es femenina. | Permiso de descarga. | Raro. |
| **c) Voz propia grabada** | Gratis y sin dudas de licencia. | La que tenga; la más natural. | Grabar los MP3. | Si quiere su voz o la de alguien que conoce. |

Recomendación por defecto: **SAPI para armar → ElevenLabs para publicar** (o su propia voz).

## Lección: la voz tiene que ser DINÁMICA

La primera tanda de Gonza con Tomás salió lenta (−8%) y grave (−3 Hz) por la idea de "cansado, resignado", y Nico dijo que **"parece de un muerto"**. Regla: la voz del personaje es **rápida, con subidas y bajadas y remates en la palabra clave**, no apagada. El resignado se actúa con el texto y los gestos, no ralentizando la voz.

Medido en el reel de referencia @30.diaspara (WebAudio sobre el video en reproducción, sin descargar; la referencia puede llevar música mezclada, así que son aproximados): tono mediano **131 Hz**, movimiento p10–p90 **13,3 semitonos**, desvío **4,8**, pausas típicas **0,57 s**. El Tomás lento: 6,8 / 2,7 / 1,2 s. El Tomás dinámico: 8,3 / 3,2 / 0,45 s. Las variantes con etiquetas de ElevenLabs dan 8 a 10 semitonos de movimiento pero salen más lentas y con pausas.

## a) ElevenLabs

1. **Armar las líneas:** `<serie>\tts-eleven\lineas-ep-NN.json`, cada línea con `id`, `sin` (texto limpio) y `con` (con etiquetas de emoción entre corchetes: `[excited]`, `[cheerful]`, `[sarcastic]`, `[sighs]`, `[sheepish]`, `[proud]`; solo las usan los modelos `eleven_v3`/`eleven_v4`; **las etiquetas son una propuesta sin verificar**). Pausas con "..." en el texto.
2. **Gasto:** `node tts-eleven/generar.mjs --lineas lineas-ep-NN.json --probar` no manda nada y muestra los caracteres. Con `--tomas 2` y las dos variantes salen 4 audios por línea (Día 2: 20 audios, 1.706 caracteres). Para ahorrar: `--tomas 1` primero y repetir lo que no convenza.
3. **Cómo elegir la voz y los ajustes (se lo decís a Nico):** voz masculina/femenina joven y con ganas con acento argentino (no un locutor); **estabilidad baja** (modo "creativo": la entonación sube y baja), **velocidad 1,05 a 1,15**, **estilo alto**. Probar una frase con cada voz.
4. **Claves en un `.env`** (Nico, 2026-11-12: la terminal no escala). Nico copia `.env.example` a `.env` en la carpeta de la serie y completa `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` y, si hay otra voz, `ELEVENLABS_VOICE_ID_<NOMBRE>` (a mano en su editor, no por el chat). `generar.mjs` lo lee solo, y lo corro yo:
   ```bash
   node tts-eleven/generar.mjs --lineas lineas-ep-NN.json --probar   # variables cargadas (sin valores) y caracteres
   node tts-eleven/generar.mjs --lineas lineas-ep-NN.json --tomas 2
   ```
   **Yo no abro, leo ni imprimo el `.env`.** Si Nico pega una clave en el chat, decile que la revoque y genere otra.
5. **Ranking objetivo** (cuando las tomas están en `Guiones\voces\<ep>-eleven\`), todo local:
   ```bash
   node voz-herramientas/analizar-tomas.mjs "<ffmpeg.exe>" "<python con whisper>" Guiones/voces/ep-NN-eleven voz-herramientas/analisis-ep-NN
   node voz-herramientas/ranking-tomas.mjs voz-herramientas/analisis-ep-NN tts-eleven/lineas-ep-NN.json
   ```
   Puntos = 3 × parecido del texto con lo esperado (Whisper) + dinámica del tono (rango/14 y desvío/5) + ritmo (2,6 a 4,2 palabras/s) + 0,5 × rapidez relativa. Muestra la ★ de cada línea.
   - **Whisper se equivoca** con números ("30" vs "treinta"), nombres propios y palabras raras (leyó "cuenta" por "cuento", "Gonzá" por "Gonza"): leé el "OJO transcripción" antes de confiar.
   - A veces conviene **elegir a mano** (Día 2: `03-ducha-con-t1` porque trae el suspiro de `[sighs]`). Anotá el porqué en `tomas-elegidas.json`.
   - **Elegís sin poder escuchar. Avisalo siempre:** "elegí por métricas, no de oído; escuchalas vos". Si el tono medio de una toma es raro (la 05-voto de Día 2 tenía 120 Hz, más agudo que el resto) dejá una alternativa anotada.
6. **Elegir:** `node tts-eleven/generar.mjs --lineas lineas-ep-NN.json --elegir 01-gancho-con-t2,...` copia las elegidas como `01-gancho.mp3`; después se pone `"_carpeta": "ep-NN-eleven"` en `episodio-NN\build\tomas-elegidas.json`.
7. **Si cambia un texto** (Gonza pasó de 30 a 28 años: la voz decía "treinta años"): el usuario regenera solo esa línea (`--solo 01-gancho --tomas 2 --forzar`), vos re-medís, importás y retimeás. Avisale que se gastan caracteres.

## b1) Voz guía de Windows (SAPI)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File voz-herramientas\generar-guia-sapi.ps1 `
    -Lineas tts-eleven\lineas-ep-01.json -Salida Guiones\voces\ep-01-guia -Ffmpeg "<ffmpeg.exe>"
# -ListarVoces muestra las voces instaladas; por defecto "Microsoft Sabina Desktop" (es-MX)
```
Usa `System.Speech` con `SpeakSsml` y `<break>` ("..." = 350 ms; después de cada punto 100 ms). Tiene sus mañas: Whisper lee mal "Día cero" y "treinta días" (corregí el texto a mano y conservá los tiempos) y a veces **inventa una palabra al final** ("siglo"): se saca con `correcciones-voz.json` (`"quitar"`). Sirve solo para tiempos y formato, nunca para juzgar el humor.

## b2) `edge-tts` (solo si Nico lo pide)

**Antes de instalar, reportá un veredicto de seguridad** (regla de `08-seguridad-y-reglas.md`). Lo que se revisó del paquete `edge-tts` 7.3.1: wheel con hash verificado; sin `eval`/`exec`/`subprocess` en `edge_tts`; sin scripts de instalación; único destino de red `speech.platform.bing.com`; **riesgo de términos**: se hace pasar por el navegador Edge (Origin de su extensión, User-Agent y firma `Sec-MS-GEC`), uso no oficial y sin licencia comercial clara. Se instaló en un venv aparte (`tts-edge\.venv`) con `requirements.txt` de 13 paquetes fijados por hash (`--require-hashes --only-binary=:all: --no-deps`). Solo permite `rate`, `pitch`, `volume` por llamada: el techo expresivo es bajo. Un script que parta cada frase en un tramo con su propio rate/pitch, recorte silencios y normalice con ffmpeg lo subió de 6,8 a 8,3 semitonos, pero sigue siendo limitado. Para publicar con monetización: ElevenLabs de pago o voz propia.

## c) Voz propia
Nico graba cada línea (celular, formato MP3/M4A) y deja los archivos en `Guiones\voces\ep-NN-propia\` con los nombres de las líneas (`01-gancho.mp3`...). Se importan igual. Hacé que grabe **rápido y con subidas y bajadas**; si es largo, que grabe por línea.

## Importar las voces al episodio

1. `build\tomas-elegidas.json`: `"_carpeta"` y, por línea, el nombre de la toma (si existe `<línea>.mp3` en la carpeta se usa directo).
2. `node build/importar-voces.mjs "<ffmpeg.exe>" "<python con whisper>"`: recorta los silencios de los bordes (−48 dB), **nivela a −16 LUFS** (ganancia limitada a −12/+18 dB, límite de picos 0,9), guarda `assets\voz\<línea>.mp3` y corre **Whisper small** (`--language es --word_timestamps True`, `HF_HUB_OFFLINE=1`, sin red: `small.pt` ya está en `~/.cache/whisper`) para sacar el tiempo de cada palabra a `build\voz-palabras.json` y `assets\voz-palabras.js`.
3. `build\correcciones-voz.json` aplica lo manual **en cada importación** (palabras inventadas, texto mal reconocido, inicios afinados): no hay que repetirlo.
4. `node build/afinar-inicios.mjs "<ffmpeg.exe>"` (informe) y `--aplicar`: ver `05-pipeline-produccion.md` (afinar con la energía del audio).
5. `node build/alinear-tarjetas.mjs` calcula `t0`/`t1` de cada tarjeta de subtítulo.

## Salió bien si
- Hay un MP3 por línea en `assets\voz\`, `build\voz-palabras.json` con las palabras de cada una y el texto transcripto **coincide con el guion** (salvo las correcciones registradas).
- La voz está nivelada (−16 LUFS por línea) y sin recortes ni silencios largos al inicio o al final.
- Nico **escuchó y aprobó** la voz, o quedó dicho explícitamente que se eligió por métricas y que no se pudo oír.
- Ninguna clave pasó por el chat, por un archivo del proyecto ni por mis comandos.

## Segunda voz (personaje de reparto, Día 3)

- En `tts-eleven\lineas-ep-NN.json` una línea puede traer `"voz": "mama"` (otro personaje) y `"ajustes": { "stability": 0.5, "style": 0.3, "speed": 1.0 }`. `generar.mjs` lee el ID de esa voz de `ELEVENLABS_VOICE_ID_<NOMBRE>` (en mayúsculas) y la clave es la misma. `--probar` lista las variables que hacen falta. Van en el `.env` de la serie (`ELEVENLABS_VOICE_ID_MAMA=...`).
- La voz guía de Windows usa otra voz para esas líneas (`-VozMama`, por defecto Helena es-ES; Gonza usa Sabina es-MX), así se distinguen al revisar el formato.
- Una línea de menos de 0,4 s (ej. "Milagro." susurrado) no se puede medir con `ebur128` (da -70 LUFS y el importador le subía 18 dB): `importar-voces.mjs` ahora la mide rellenando con silencio.
- Una voz de la biblioteca de ElevenLabs puede no andar por API con el plan gratis (sin verificar): si pasa, se agrega a "Mis voces" o se elige otra.

## Lo que pasó al pasar el Día 3 a ElevenLabs (2026-11-12)

- La voz de la mamá que eligió Nico (ID puesto por él en el `.env`) anduvo por API; no sé si es de la biblioteca ni qué plan tiene. Probá primero con la línea más corta (`--solo <línea> --tomas 2`, unos 70 caracteres): confirma la clave y el ID antes de gastar todo, y el resto se genera salteando lo que ya existe.
- Las tomas de ElevenLabs duran más que la voz guía (gancho +0,9 s, ovejas +4,2 s: el episodio pasó de 64,3 a 72,15 s). Tenelo en cuenta al estimar el largo y avisale a Nico; si le parece lento, regenerar con `"ajustes": { "speed": 1.1 }` en esa línea (sin probar).
- `analizar-tomas.mjs` necesita `medir_varios.py` y `medir_voz.py` al lado, en `voz-herramientas/`. Si faltan, falla con "Command failed" (status 2) sin decir por qué: copialos de `templates/serie/voz-herramientas/`. Las tomas con `[whispers]` dan tono 0 (no se mide) y a veces Whisper no las entiende (texto 0%): el ranking las baja, pero la susurrada puede ser la que pide el guion; dejala anotada como alternativa.
- Retimeo: son un centenar de tiempos sueltos en `esc*.html`. Se hizo con un script de reemplazos exactos "todo o nada" (cada cadena vieja tiene que aparecer una sola vez; si no, no escribe nada) y un mapa por escena para `sonido.json`. Orden: 1) `tiempos.json` (inicio y dur de cada voz) y `alinear-tarjetas.mjs`; 2) las escenas: boca por palabra (`Hab.habla`), gestos atados a una palabra, cuenta regresiva, saltos; 3) `index.html` (inicio de escenas y de voces, duración total); 4) el HUD; 5) `sonido.json`, `colocar-sonidos.mjs` y `generar-subtitulos.mjs`; 6) `check`, `snapshot`, render. Una pausa larga de la voz (la oveja que espera el "¡Gooool!") se llena con una animación de espera, no se corta.
- Tarjetas punch de 9 letras o más ("TEMPRANO."): sin tamaño extra; en el pico del rebote de 1,12 rozaban el borde del cuadro incluso con +6.
- **Ruidos raros en la voz (Nico, Día 3: "se escuchan ruidos raros que no se escuchaban en los otros videos").** Dos causas medidas: (1) el ranking de texto/tono/ritmo no ve los clics agudos de las tomas de ElevenLabs: corré `voz-herramientas/medir_impulsos.py` sobre las tomas de cada línea y descartá las de más de ~1,5 impulsos por segundo (los Días 1 y 2 daban 0,8 a 1,3; la toma elegida de 05-voto daba 3,6); (2) la importación vieja subía la ganancia y pasaba `alimiter=limit=0.9`, que llevaba los picos a 0 dBFS con tomas de nivel bajo: `importar-voces.mjs` ahora comprime suave y fija la ganancia para que el pico final sea de -1,5 dBFS o menos. `SIN_WHISPER=1` reescribe solo los audios (sin tocar los tiempos de palabras). No se pudo confirmar de oído: pedile a Nico que escuche.
