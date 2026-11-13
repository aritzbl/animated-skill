# tts-eleven: tomas de la voz del personaje con la API de ElevenLabs

Un solo archivo, `generar.mjs`, sin dependencias (usa el `fetch` de Node 22). Lee los textos de un archivo de líneas (`lineas-ep-01.json`: cada línea tiene una versión sin etiquetas y otra con etiquetas de emoción) y deja los MP3 en `..\Guiones\voces\ep-01-eleven\` (el nombre sale del archivo de líneas).

## Seguridad

- La clave (`ELEVENLABS_API_KEY`) y los IDs de voz (`ELEVENLABS_VOICE_ID`, `ELEVENLABS_VOICE_ID_<NOMBRE>`) se leen de un archivo **`.env`** (copiá `.env.example` de la raíz de la serie a `.env` y completalo en tu editor) o, si preferís, del entorno de la terminal (tiene prioridad). Nunca por argumento (así no quedan en el historial) y el script nunca imprime los valores. `.env` está en `.gitignore`.
- Claude puede correr el script, pero **no abre, lee ni imprime el `.env`**: `--probar` dice si cada variable está cargada o falta, sin mostrar valores.
- El único destino de red es `api.elevenlabs.io` (o `--base`). Manda el texto de las líneas.
- No pegues la clave en el chat. Si podés, creá una clave limitada a texto a voz.
- Plan gratis: 10.000 caracteres por mes y **sin licencia comercial** (según la ayuda oficial de ElevenLabs; revisá los términos vigentes). Con monetización o publicidad, pasá a un plan con licencia comercial antes de publicar.

## Uso

```powershell
cd "<carpeta de la serie>"
node tts-eleven/generar.mjs --lineas lineas-ep-01.json --probar     # no manda nada: muestra qué haría y cuántos caracteres gasta
node tts-eleven/generar.mjs --lineas lineas-ep-01.json --tomas 2    # genera 2 tomas por línea y variante
```

Cuando escuches los audios (o corras el ranking objetivo de `voz-herramientas\`), elegí una toma por línea y el script las copia con el nombre que usa el episodio:

```powershell
node tts-eleven/generar.mjs --lineas lineas-ep-01.json --elegir 01-gancho-con-t2,02-voto-sin-t1
```

## Opciones

| Opción | Qué hace |
|---|---|
| `--lineas` | Archivo de líneas del episodio (por defecto `lineas-ep-01.json`). |
| `--modelo` | Modelo de ElevenLabs. Por defecto `eleven_v3`. Con modelos que no usan etiquetas (`eleven_multilingual_v2`, `eleven_flash_v2_5`) solo genera la versión sin etiquetas. |
| `--variantes sin,con` | Qué versiones de cada línea generar. |
| `--solo 01-gancho,05-voto` | Solo algunas líneas. |
| `--tomas N` | Tomas por línea y variante (cada una con su propia semilla, así salen distintas). |
| `--stability`, `--similitud`, `--estilo`, `--velocidad` | Ajustes de la voz (por defecto 0,35, 0,75 y 0,45; la velocidad no se manda salvo que la pongas). Estabilidad baja = más movimiento de tono. |
| `--sin-ajustes` | No manda ajustes: usa los guardados en la voz. Sirve si la API rechaza alguno (error 422). |
| `--forzar` | Rehace los audios que ya existen. Sin esto los saltea, para no gastar caracteres. |
| `--salida`, `--formato`, `--base` | Carpeta de salida, formato (`mp3_44100_128` por defecto) y servidor. |

## Qué se probó y qué no

Se probó contra un servidor falso local con una clave inventada (sin clave, generar, reintento ante un 429, salteo de lo que ya existe, error 422 y 401 con mensaje claro, y que la clave no aparece en ninguna salida). **No se probó contra ElevenLabs real**: si un modelo o un ajuste no es aceptado, el script muestra el mensaje de la API y qué probar. Las etiquetas de emoción entre corchetes (`[excited]`, `[sighs]`, `[sarcastic]`…) son una propuesta sin verificar: solo las usan los modelos v3/v4.
