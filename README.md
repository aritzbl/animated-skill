# animated-skill

Skill de [Claude Code](https://claude.com/claude-code) para **crear series animadas 2D para Reels de Instagram**, con un personaje propio, desde cero hasta el video renderizado (vertical 1080×1920, 30 fps).

Nació de hacer a **Gonza Benítez**, el protagonista de la serie "30 días para conseguir laburo" (@en30diass), donde el público vota por comentarios qué arreglar cada día. La skill junta todo lo que se aprendió en ese proceso para no repetirlo con cada personaje nuevo: entrevista, rig 2D, guion, voz, sonido, subtítulos, HUD y render con [HyperFrames](https://hyperframes.heygen.com) (HTML + SVG + GSAP).

Está escrita **en español rioplatense (voseo)** y habla con su autor ("Nico"): es una skill con opiniones, no un framework neutro. Mirá la sección [Adaptala a tu máquina](#adaptala-a-tu-máquina).

## Qué hace

Siete fases, cada una con un "salió bien si" comprobable:

| # | Fase | Qué se hace |
|---|---|---|
| 1 | Entrevista y referencias | Preguntas una por una, pedido de ejemplos y análisis de cuentas de referencia sin iniciar sesión |
| 2 | Personaje y rig | 3 propuestas en HTML, rig SVG con jerarquía de partes y pivotes, IK en brazos, expresiones, formas de boca para lip-sync, poses, giro de cabeza, variables CSS para las "mejoras" por episodio, ficha, hoja de render y logo |
| 3 | Guion | Tabla de escenas con tiempos, líneas de voz, cambios de rig, chistes marcados (A) fuertes y (B) a validar, caption |
| 4 | Voz | ElevenLabs, voz guía gratis de Windows (SAPI) o voz propia; ranking objetivo de tomas con Whisper, tono y ritmo |
| 5 | Producción | Un proyecto HyperFrames por episodio; importación de voces, subtítulos cinéticos, HUD, retimeo, `check`, `snapshot`, `render` |
| 6 | Sonido | ~40 efectos sintetizados con ffmpeg; música solo con OK explícito |
| 7 | Entrega | Render a `Terminados/`, documentación de la versión; nada se publica ni se manda solo |

Además trae las reglas de formato Reels 9:16 (zonas seguras), las reglas de seguridad, una lista de lecciones y gotchas, y un `flujo-episodio.md` para producir un episodio paso a paso.

## Instalación

Clonás el repo y copiás la carpeta `crear-serie-animada` donde Claude Code busca skills.

**Global** (todos tus proyectos):

```bash
git clone https://github.com/aritzbl/animated-skill.git
cp -r animated-skill/crear-serie-animada ~/.claude/skills/
```

En PowerShell:

```powershell
git clone https://github.com/aritzbl/animated-skill.git
Copy-Item -Recurse animated-skill\crear-serie-animada "$env:USERPROFILE\.claude\skills\"
```

**Solo un proyecto:** copiala a `<tu-proyecto>/.claude/skills/crear-serie-animada/`.

Reiniciá Claude Code y comprobá que aparece: escribí `/crear-serie-animada` o simplemente pedí lo que querés ("quiero armar una serie animada con un personaje nuevo"). El `description` de la skill tiene las palabras gatillo (serie animada, reel animado, rig 2D, voz de personaje, episodio nuevo, HUD de días...), así que se activa sola.

## Requisitos

La skill no instala nada por su cuenta: te dice qué falta y te pide permiso.

| Qué | Para qué | Notas |
|---|---|---|
| **Claude Code** | correr la skill | |
| **Node.js 22** | scripts del pipeline y HyperFrames | |
| **HyperFrames 0.9.30** | render del video | versión fija; el `package-lock.json` está en `templates/serie/` (`npm ci`) |
| **ffmpeg y ffprobe** | efectos de sonido, nivelación y medición de audio | |
| **Python 3.13 + Whisper `small`** | tiempos por palabra de las voces | versiones fijas en `templates/serie/requirements-pinned.txt` (numba, numpy, openai-whisper, tiktoken, torch, yt-dlp); corre sin red una vez descargado el modelo |
| **Windows + PowerShell** | voz guía gratis (`System.Speech`) | lo demás es multiplataforma en principio, pero solo se probó en Windows 11 |
| *(opcional)* cuenta de **ElevenLabs** | voz final | plan gratis: 10.000 caracteres por mes y sin licencia comercial |
| *(opcional)* **Playwright MCP** | mirar cuentas de referencia sin iniciar sesión | |

## Cómo se usa

### Serie nueva

Pedíselo a Claude: "quiero armar una serie animada, el protagonista es ...". La skill entrevista una pregunta por vez, arma un brief (`Guiones/brief-serie.md`) y avanza por las fases pidiendo tu OK en las creativas. También podés crear la estructura a mano:

```bash
node crear-serie-animada/templates/crear-serie.mjs \
  --destino "/ruta/a/mi-serie" --serie "Nombre de la serie" --cuenta @micuenta --personaje "Nombre"
```

Crea la carpeta de la serie (rig del personaje, `episodio-01`, guiones, herramientas de voz, bocetos, logo) y se niega a pisar una carpeta con contenido. **No instala ni descarga nada**: después instalás HyperFrames con `npm ci` y preparás Whisper cuando quieras.

### Episodio nuevo en una serie que ya existe

```bash
node crear-serie-animada/templates/crear-episodio.mjs --serie "/ruta/a/mi-serie" --numero 02 [--desde episodio-01]
```

Después se sigue `references/flujo-episodio.md`: guion → voz guía → escenas → importar voz → cuadros → render → entrega → voz final y retimeo. Para dejar que Claude lo recorra solo hasta un final comprobable podés usar `/goal` con el bloque que está al final de ese archivo.

### Qué se crea

```
mi-serie/
├── personaje/          rig 2D (SVG + API en JS), hojas de personaje
├── episodio-NN/        un proyecto HyperFrames por episodio (escenas, HUD, build/ con el pipeline)
├── Guiones/            brief, guiones, descripciones, voces/
├── Referencias/        capturas y análisis de cuentas de referencia
├── Terminados/         renders finales
├── tts-eleven/         script de ElevenLabs y líneas de cada episodio
├── voz-herramientas/   voz guía de Windows, ranking de tomas
└── bocetos/ · logo/
```

## Contenido del repo

```
crear-serie-animada/
├── SKILL.md                    punto de entrada: fases, reglas duras, rutas
├── references/                 una guía por fase (entrevista, rig, guion, voces, pipeline,
│                               sonido, formato Reels, seguridad, lecciones) + flujo-episodio.md
└── templates/                  scaffolds y plantillas parametrizadas (ver templates/README.md)
    ├── crear-serie.mjs · crear-episodio.mjs
    ├── serie/                  personaje/, tts-eleven/, voz-herramientas/, bocetos/, logo/, Guiones/
    └── episodio/               index.html, compositions/, build/ (pipeline), assets/helpers.js
```

## Adaptala a tu máquina

La skill quedó con las rutas y preferencias de su autor. Antes de usarla en serio, buscá y cambiá:

- **`SKILL.md` → "Rutas y comandos conocidos"** (y `references/05-pipeline-produccion.md`): las rutas de ffmpeg y del Python con Whisper son de la máquina original (`C:\Users\nicol\...`). Lo mismo en `templates/serie/voz-herramientas/medir_impulsos.py` (constante `FF`).
- **Regla de carpetas:** la skill trabaja solo dentro de `...\Animaciones` y nunca escribe en OneDrive. `crear-serie.mjs` y `crear-episodio.mjs` se niegan a escribir en una ruta con "OneDrive" y avisan si el destino no está en `Animaciones`. Si no querés esa regla, sacala de `SKILL.md`, `references/08-seguridad-y-reglas.md` y de los dos scripts.
- **Quién habla:** los textos se dirigen a "Nico" y usan voseo rioplatense. Cambialo si trabajás en otro dialecto.
- **Ejemplos de Gonza:** las guías citan decisiones reales de esa serie (el porqué de cada regla). Los templates, en cambio, no tienen nada de Gonza.

## Seguridad

- **Las claves no se suben ni se pegan en el chat.** Las de ElevenLabs van en un `.env` de la serie (copiado de `.env.example`), que está en el `.gitignore` de la plantilla. `generar.mjs` lo lee solo, nunca imprime los valores, y la skill le indica a Claude que no lo abra ni lo lea.
- Nada global, versiones fijas y telemetría apagada (`DO_NOT_TRACK=1 HYPERFRAMES_NO_AUTO_INSTALL=1 HYPERFRAMES_NO_UPDATE_CHECK=1`).
- Hay comandos que la skill nunca corre: `hyperframes skills`, `hyperframes skills update`, `npx skills add`, `hyperframes events`.
- Pregunta antes de descargar videos, imágenes, fuentes o música, y antes de publicar o mandar nada.
- Pide un veredicto de seguridad antes de instalar o correr código de terceros. Las reglas completas están en `crear-serie-animada/references/08-seguridad-y-reglas.md`.

## Qué está probado

Probado de punta a punta con una serie de prueba (Windows 11, Node 22, Python 3.13, HyperFrames 0.9.30, ffmpeg 8.1): creación de la serie y del episodio, efectos de sonido, voz guía de Windows, importación de voces con Whisper, alineación de subtítulos, `hyperframes check` (0 errores), `snapshot` y `render` 1080×1920 a 30 fps, hojas del personaje y página de bocetos. Todos los `.mjs` pasan `node --check`.

No se pudo probar: audio y movimiento (solo se miraron cuadros y mediciones, nadie escuchó los efectos sintetizados ni las voces elegidas por ranking), Kokoro, Piper y `edge-tts`. El script de ElevenLabs se usó con la API real en los episodios de Gonza; la versión de la skill solo cambia nombres y se probó con `--probar`, sin llamar a la API.

## Licencias y terceros

- Este repositorio **todavía no declara una licencia**.
- Incluye la tipografía **Inter** (licencia OFL, texto en `templates/serie/personaje/assets/fonts/OFL-Inter.txt`).
- HyperFrames, GSAP, Whisper, ffmpeg y demás dependencias **no se incluyen**: tienen sus propias licencias y se instalan aparte.
- ElevenLabs: el plan gratis no incluye licencia comercial; revisá sus términos vigentes antes de publicar con monetización.
- `edge-tts` es un uso no oficial de un servicio de Microsoft, con términos y licencia comercial dudosos; la skill lo documenta pero recomienda otras opciones para publicar.
