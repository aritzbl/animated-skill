# {{SERIE}} ({{CUENTA}})

Serie animada 2D de Instagram: protagonista **{{PERSONAJE}}**. Hecha con HyperFrames (HTML/SVG/GSAP) + voz + sonido, siguiendo la skill `crear-serie-animada`.
Creada el {{FECHA}}. Formato **Reels 9:16, 1080×1920, 30 fps**.

## Carpetas

| Carpeta | Qué hay |
|---|---|
| `personaje/` | proyecto del rig (`rig/personaje.svg` es la fuente; `assets/personaje.js` es la API; hojas de personaje en `compositions/`) |
| `episodio-NN/` | un proyecto HyperFrames por episodio (se crea con `crear-episodio.mjs`; cada uno lleva su `LEEME.md`) |
| `Guiones/` | guion y descripción de cada episodio; `Guiones/voces/<episodio>-<guia|eleven>/` = tomas de voz |
| `Referencias/` | capturas y análisis de cuentas de referencia |
| `Terminados/` | renders finales (`ep-NN-vX.Y-<voz>.mp4`) |
| `tts-eleven/` | script de ElevenLabs (lee las claves del `.env`) + líneas de cada episodio |
| `voz-herramientas/` | voz guía de Windows, medición y ranking de tomas |
| `bocetos/`, `logo/` | propuestas de personaje y logo de la cuenta |

## Reglas fijas (resumen; el detalle está en la skill, `references/08-seguridad-y-reglas.md`)

- Trabajar solo dentro de esta carpeta de la serie. Nunca escribir en OneDrive.
- Nada global, versiones fijas, telemetría apagada: `DO_NOT_TRACK=1 HYPERFRAMES_NO_AUTO_INSTALL=1 HYPERFRAMES_NO_UPDATE_CHECK=1`.
- Nunca correr `hyperframes skills`, `hyperframes skills update`, `npx skills add` ni `hyperframes events`.
- No crear cuentas ni manejar claves. No descargar nada (videos, imágenes, fuentes, música) sin OK explícito por archivo.
- No publicar ni mandar nada sin preguntar. Nunca agregar coautoría de Claude en commits.

## Estado de la serie

(Se completa a medida que se producen episodios: versión terminada de cada uno, decisiones del usuario, pendientes.)
