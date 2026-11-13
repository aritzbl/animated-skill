---
name: crear-serie-animada
description: Crear una serie o un reel animado 2D con un personaje (Reels de Instagram, 9:16) desde cero hasta el video renderizado con HyperFrames (HTML/SVG/GSAP), con entrevista y análisis de cuentas de referencia, personaje y rig 2D, guion por episodio con votación del público, voz del personaje (ElevenLabs, ranking de tomas con Whisper, voz guía gratis de Windows o voz propia), sonido, subtítulos, HUD de días y barra de progreso, retimeo y render 1080x1920. Usala SIEMPRE que Nico pida crear un personaje animado, una serie animada, un reel animado con personaje, un rig 2D, una voz para un personaje, analizar cuentas de referencia de series animadas, elegir o rankear tomas de voz, o un episodio nuevo o su retimeo en una serie ya empezada (Gonza y la serie 30 días para conseguir laburo), o una serie donde el público vota por comentarios, aunque no diga la palabra skill. No sirve para video con grabaciones reales, animación 3D ni videos explicativos sin personaje (esos son de HyperFrames a secas).
---

# Crear una serie animada 2D (personaje + episodios + voz + render)

Skill nacida del trabajo con **Gonza Benítez** y la serie "30 días para conseguir laburo" (@en30diass): Día 1 terminado, Día 2 en v0.5 con voz de ElevenLabs. Resume todo el proceso tedioso para repetirlo con un personaje y una serie nuevos sin volver a descubrir las mismas cosas. Se escribe y se habla en **español rioplatense (voseo)**.

## Tres formas de entrar

| Nico pide... | Hacé |
|---|---|
| **Una serie nueva con un personaje nuevo** | Fases 1 a 7, en orden. |
| **Un personaje nuevo para una serie que ya existe** | Fase 2 (y fase 1 solo si cambia el estilo). |
| **El episodio siguiente de una serie que ya existe** | Fases 3 a 7 con `references/flujo-episodio.md`. Leé primero la memoria y el `LEEME.md` del último episodio. |

## Antes de empezar (siempre)

1. **Leé la memoria del proyecto**: `serie-30-dias-laburo.md` y `feedback-formato-reels-9x16.md` en la carpeta `memory\` del proyecto (hay dos rutas de memoria, la vieja de OneDrive y la de `Desktop`: abrí las dos y quedate con lo más reciente). Si es una serie nueva, creá su archivo de memoria propio apenas tengas el brief.
2. **Leé `references/08-seguridad-y-reglas.md`.** Son reglas que Nico pidió y mandan sobre todo lo demás (resumen abajo).
3. **Armá la lista de tareas** de la sesión con las fases que vas a recorrer.
4. **Recomendale a Nico** (una línea, comando listo para pegar) un **`flujo.md`** si el episodio se repite, o un **`/goal`** cuando haya un final comprobable (bloque listo en `references/flujo-episodio.md`). No lo fuerces en tareas cortas.

## Reglas duras (resumen; detalle en `references/08-seguridad-y-reglas.md`)

- **Veredicto de seguridad ANTES de instalar o correr código de terceros.** Nada global, versiones fijas, telemetría apagada (`DO_NOT_TRACK=1 HYPERFRAMES_NO_AUTO_INSTALL=1 HYPERFRAMES_NO_UPDATE_CHECK=1`).
- **Nunca** `hyperframes skills`, `hyperframes skills update`, `npx skills add`, `hyperframes events`.
- **No crear cuentas.** Las claves y los IDs de ElevenLabs van en un archivo `.env` de la serie (copiado de `.env.example`): **Nico lo completa a mano en su editor** (decisión suya, 2026-11-12: la terminal no escala) y `tts-eleven\generar.mjs` lo lee solo. **Yo corro el script, pero no abro, leo, imprimo, copio ni guardo el `.env`** (compruebo que esté cargado con `--probar`, que dice cargada o FALTA sin mostrar valores). Un ID de voz que Nico pega en el chat lo escribo en el `.env` y nada más (no va a memoria, LEEME ni comandos); si pega una **clave**, le digo que la revoque y genere otra. Antes de cada tanda muestro `--probar` (caracteres y variables) y pido OK, porque gasta caracteres de su cuenta.
- **Preguntar antes de descargar** videos, música, fuentes o imágenes (por archivo). `yt-dlp` solo para metadata.
- **No publicar ni mandar nada sin preguntar.**
- **Nunca coautoría de Claude en commits.**
- **Trabajar solo en `C:\Users\nicol\Desktop\Proyectos\Animaciones`. Nunca escribir en `C:\Users\nicol\OneDrive`.** Lo ya hecho (otros episodios, personajes, guiones, terminados) es de solo lectura: se copia.
- **Avisar siempre qué NO pude verificar:** no escucho audio ni veo movimiento, solo cuadros y mediciones. **Nada inventado** (comentarios del público, números de votos).
- **El humor lo juzga Nico**: un chiste que no es claramente bueno se reemplaza o se saca.

## Rutas y comandos conocidos

- ffmpeg: `C:\Users\nicol\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe` (ffprobe al lado).
- Python con Whisper: `C:\Users\nicol\Desktop\Proyectos\Animaciones\Animador de IA\.venv\Scripts\python.exe` (verificá que exista). Whisper `small` ya está en `~/.cache/whisper`.
- HyperFrames **0.9.30**, desde la carpeta del episodio: `npx --no-install hyperframes check | snapshot --at 1,4,8 | render -o renders/x.mp4` (**render sin `--quiet`**).
- La skill: `<skill>` = esta carpeta (`...\.claude\skills\crear-serie-animada`). Los scaffolds: `node "<skill>\templates\crear-serie.mjs" ...` y `node "<skill>\templates\crear-episodio.mjs" ...`.

## Las 7 fases

Cada fase termina con un **"salió bien si" comprobable**. No pases a la siguiente sin cumplirlo y sin el **OK de Nico en el chat** cuando la fase es creativa.

| # | Fase | Qué se hace | Leé | Template |
|---|---|---|---|---|
| 1 | **Entrevista y referencias** | Preguntas una por una (usar `AskUserQuestion`); pedir ejemplos; analizar referencias sin iniciar sesión | `references/01-entrevista.md` | `templates/serie/Guiones/brief-serie.md`, `Referencias/plantilla-analisis.md` |
| 2 | **Personaje y rig** | 3 propuestas en HTML → elegida → rig SVG con pivotes, IK, expresiones, bocas, poses, mejoras → ficha, hojas y logo | `references/02-personaje-y-rig.md` | `templates/serie/bocetos/`, `personaje/`, `logo/` |
| 3 | **Guion por episodio** | Tabla de escenas con tiempos, voces, HUD, chistes (A)/(B), caption | `references/03-guion.md` | `templates/serie/Guiones/plantilla-guion.md`, `plantilla-descripcion.md` |
| 4 | **Voz** | Presentar opciones y dejar elegir; generar, medir, elegir; importar | `references/04-voces.md` | `templates/serie/tts-eleven/`, `voz-herramientas/` |
| 5 | **Producción HyperFrames** | Un proyecto por episodio; pipeline completo; retimeo; verificar | `references/05-pipeline-produccion.md` | `templates/episodio/`, `crear-episodio.mjs` |
| 6 | **Sonido** | Efectos sintetizados con ffmpeg; música solo con OK | `references/06-sonido.md` | `templates/episodio/build/sonidos.mjs`, `sonido.json` |
| 7 | **Entrega** | Render a `Terminados\`, documentar, `SendUserFile`; nada se publica | `references/05-pipeline-produccion.md` (Verificar y entregar) | — |

Referencias transversales: **`references/07-formato-reels.md`** (zonas seguras 9:16), **`references/08-seguridad-y-reglas.md`**, **`references/09-lecciones-gotchas.md`**, **`references/flujo-episodio.md`** (el flujo.md de producción de un episodio).

### Fase 1 · Entrevista (resumen)
Una pregunta por vez, con un default razonable. Bloques: A narrativa y formato (serie por días con votación / one-shot; Reels 9:16 1080×1920 30 fps por defecto; duración; tono y dialecto), B mecánica con la audiencia (votos por comentarios, HUD con contador y barra de progreso, nombre de la cuenta), C protagonista (especie, edad, personalidad, defectos, accesorio identitario), D arco de mejoras (tabla estilo `Personaje.MEJORAS`: estética / hábito / skill), E estilo de arte (recorte plano, trazo oscuro, paleta corta), F referencias. **Pedile siempre ejemplos:** reels, fotos, capturas, links de cuentas de referencia, personajes que le gusten. Analizalos con Playwright **sin login** (solo cerrar el cartel de registro), capturas a `Referencias\`, análisis escrito (tomamos / no copiamos / riesgo). **Evitá parecerte demasiado al personaje de la referencia.**
**Salió bien si:** `Guiones\brief-serie.md` completo y confirmado por Nico, más un análisis escrito por referencia.

### Fase 2 · Personaje y rig (resumen)
Crear la serie con `crear-serie.mjs` (carpeta nueva dentro de `Animaciones`; no instala nada). Tres propuestas en `bocetos\propuestas.html` (siluetas **distintas**) → Nico elige → editar `personaje\rig\personaje.svg` **conservando ids, jerarquía y pivotes** → `node rig/build.mjs` → paleta en `personaje.css` **y** `BASE_VARS` → capas de mejora y tabla `MEJORAS` → `hoja.html` y `hoja-mejoras.html` (render con `-c`) → ficha → logo de la cuenta. El rig base no es un personaje terminado: si no se redibuja, se parece a Gonza.
**Salió bien si:** las hojas se renderizan y muestran 6 expresiones, 4 bocas, 6 poses y el antes/después; las manos IK no quedan detrás de la cabeza; Nico dijo que sí al diseño.

### Fase 3 · Guion (resumen)
`Guiones\ep-NN.md` con la plantilla: tabla de escenas con tiempos y voz literal, cambios de rig, HUD, caption propuesta, decisiones abiertas, historial de cambios. **Marcá los chistes (A) fuertes y (B) a validar.** Gancho con estacas desde el cuadro 1 y el resultado del voto anterior; **pedile a Nico qué ganó**; nunca inventes números ni comentarios.
**Salió bien si:** Nico aprobó el guion en el chat y no hay datos inventados.

### Fase 4 · Voz (resumen)
**Presentá las opciones y dejá que elija:** (a) **ElevenLabs** (`tts-eleven\generar.mjs` lee las claves del `.env` que completa Nico, y lo corro yo; plan gratis 10.000 caracteres/mes **sin licencia comercial**, Starter con licencia; ranking objetivo con Whisper + tono + ritmo y elegir sin poder oír, avisándolo), (b) **gratis**: voz guía de Windows SAPI (Sabina es-MX, local, solo para formato y tiempos), `edge-tts` (no oficial, revisión de seguridad y permiso antes de instalar), Kokoro vía `hyperframes tts` (baja un modelo: permiso; solo voz femenina sin acento argentino), Piper; (c) **voz propia grabada**. **La voz tiene que ser DINÁMICA** (rápida, con subidas y bajadas), no lenta y grave.
**Salió bien si:** hay un MP3 por línea en `assets\voz\`, `voz-palabras.json` con las palabras, y Nico aprobó la voz (o quedó dicho que se eligió por métricas y que no pude oírla).

### Fase 5 · Producción (resumen)
`crear-episodio.mjs` → escenas a mano (`esc1`, `esc2` son plantillas) → cadena: `sonidos` → `importar-voces` → `afinar-inicios` → `alinear-tarjetas` → ajustar `inicio`/`escenas.json` → `armar-index` → `generar-subtitulos` → `colocar-sonidos` → `check` → `snapshot` (**mirar los cuadros**) → `render` → ffprobe y `ebur128`. Cuando **cambia la voz**, recorré la **lista de retimeo** de `05-pipeline-produccion.md`.
**Salió bien si:** `check` 0 errores, cuadros dentro de las zonas seguras, 1080×1920 a 30 fps, ~−14 LUFS, silencios largos solo al final.

### Fase 6 · Sonido (resumen)
Biblioteca de ~40 efectos sintetizados con `aevalsrc` (`build\sonidos.mjs`); se colocan con `sonido.json` + `colocar-sonidos.mjs`; **ningún hueco de silencio largo**. Música: **solo con OK explícito de Nico por archivo**; por defecto, sin música.

### Fase 7 · Entrega (resumen)
Copiar a `Terminados\ep-NN-vX.Y-<voz>.mp4` (sin borrar versiones), documentar en `episodio-NN\LEEME.md` y en la memoria, mandar con `SendUserFile` y decir qué no se pudo verificar. **Nada se publica ni se manda.** La caption propuesta queda en el guion.

## Formato Reels 9:16 (resumen; detalle en `references/07-formato-reels.md`)
1080×1920, 30 fps, H.264 + AAC. **Nada importante en los 168 px de arriba.** Texto y elementos clave entre y 168 e y 1330. Subtítulos en y 1088 a 1332, **tarjetas de 1 a 3 palabras y una o dos líneas (~12 caracteres por línea)**: una de 4 líneas tapó al personaje. Borde derecho de la mitad inferior libre (botones de Instagram). HUD desde y 186. Portada: la cara del personaje y el cartel DÍA N al centro.

## Contrato de HyperFrames (resumen; detalle en `references/05-pipeline-produccion.md`)
Elementos con `class="clip"` y `data-start`/`data-duration`; **un timeline pausado por composición** en `window.__timelines`; sin `Date.now`, `Math.random` ni `repeat: -1`; no tweenear `display`/`visibility` en `.clip`; **fuentes locales** con `@font-face` a `assets/fonts` (si no, baja Google Fonts); rutas `assets/...`. `check` marca como falsos positivos las advertencias del rig (`rotation_pivot_drift`) y "film's last line".

## Cómo reportar (siempre)
- Mostrá cada chequeo (check, ffprobe, medidas) y **no digas que comprobaste algo que no comprobaste**.
- Cada entrega lleva: qué cambió, medidas, **qué NO pude verificar** (audio, movimiento, efectos sintéticos, voces elegidas por ranking), qué falta y qué decisiones necesito.
- Decisiones y pedidos de Nico: registralos con fecha en la memoria y en el `LEEME.md` del episodio.

## Qué hay en la skill

```
crear-serie-animada/
├── SKILL.md
├── references/
│   ├── 01-entrevista.md · 02-personaje-y-rig.md · 03-guion.md · 04-voces.md
│   ├── 05-pipeline-produccion.md · 06-sonido.md · 07-formato-reels.md
│   ├── 08-seguridad-y-reglas.md · 09-lecciones-gotchas.md · flujo-episodio.md
└── templates/                     (ver templates/README.md)
    ├── crear-serie.mjs · crear-episodio.mjs
    ├── serie/                     personaje/ (rig), tts-eleven/, voz-herramientas/, bocetos/, logo/, Guiones/, Referencias/
    └── episodio/                  index.html, compositions/, build/ (pipeline), assets/helpers.js
```
La skill es **autocontenida**: se puede copiar a `~/.claude/skills/` para usarla en cualquier proyecto (ofrecérselo a Nico, pero no lo hagas sin preguntar).
