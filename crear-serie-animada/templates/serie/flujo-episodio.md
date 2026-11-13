# Flujo: producir un episodio de la serie

**Flujo:** de guion aprobado a render verificado en `Terminados\`.
**Objetivo:** un MP4 vertical 1080×1920 con voz, subtítulos, HUD y sonido, que `check` aprueba y Nico recibe con la lista de lo que no pude verificar.
**Nunca sin preguntarme: publicar, mandar, borrar, pagar** (y además: descargar, instalar, crear cuentas, tocar claves, escribir fuera de `Animaciones`).

Formato de cada paso: **Hace** / **Salió bien si** (comprobable) / **Si sale mal** (reintentar hasta N veces) / **Me pregunta si**. Al seguirlo, mostrá cada chequeo en la conversación y **nunca digas que comprobaste algo que no comprobaste**.

> Si el episodio tiene un final comprobable, se puede correr con `/goal` (ver el bloque al final). Si hay que esperar algo externo (que Nico genere las voces o vote), el flujo **se frena** en ese paso: no se espera con `/goal`.

---

### Paso 0 · Leer el contexto
- **Hace:** lee la memoria de la serie (historial y decisiones), `LEEME.md` del episodio anterior y el guion del episodio; confirma el número de episodio y qué ganó el voto.
- **Salió bien si:** puedo decir en una línea qué ganó, qué mejora toca, y qué pidió Nico por última vez.
- **Si sale mal:** (1 intento) busco en `Guiones\` y en el LEEME anterior; si falta el resultado del voto, no sigo.
- **Me pregunta si:** no sé qué ganó el voto, o hay pedidos que se contradicen (la última decisión gana, se lo confirmo).

### Paso 1 · Guion
- **Hace:** escribe `Guiones\ep-NN.md` con la plantilla (escenas con tiempos, voces literales, HUD, chistes (A)/(B), caption sin publicar, decisiones abiertas).
- **Salió bien si:** hay tabla de escenas, líneas de voz con nombre, cada chiste marcado, y **ningún dato inventado** (números de votos, comentarios).
- **Si sale mal:** hasta 2 rondas de cambios pedidos por Nico; cada una queda en el historial del guion.
- **Me pregunta si:** siempre, para que apruebe el guion y valide los (B). Sin su OK no se produce.

### Paso 2 · Líneas de voz y voz guía
- **Hace:** arma `tts-eleven\lineas-ep-NN.json` (con y sin etiquetas) y genera la **voz guía SAPI** con `voz-herramientas\generar-guia-sapi.ps1`.
- **Salió bien si:** hay un MP3 por línea en `Guiones\voces\ep-NN-guia\` y `--probar` muestra el gasto de caracteres.
- **Si sale mal:** (2 intentos) reviso el nombre de la voz con `-ListarVoces`; si falla, voy sin guía y lo digo.
- **Me pregunta si:** ya sé que voy a pedir voz final y hay que decidir ElevenLabs / propia / gratis (ver `04-voces.md`).

### Paso 3 · Episodio y escenas
- **Hace:** `crear-episodio.mjs --serie ... --numero NN [--desde ...]`; escribe `escN.html` de cada escena, configura el `HUD`, completa `sonido.json` y `escenas.json`.
- **Salió bien si:** `node build/armar-index.mjs` y `node build/generar-subtitulos.mjs` corren sin avisos y `hyperframes check` da **0 errores**.
- **Si sale mal:** hasta 3 ciclos check → corregir. Los falsos positivos conocidos (pivotes del rig, "film's last line") se anotan y se ignoran.
- **Me pregunta si:** una escena requiere un objeto que no existe en el rig (hay que dibujar arte nuevo) o algo que obligue a descargar.

### Paso 4 · Importar voz guía y alinear
- **Hace:** `importar-voces.mjs`, `afinar-inicios.mjs` (informe y `--aplicar` si el informe es razonable), `alinear-tarjetas.mjs`, ajusta `inicio` de las voces, `armar-index`, `generar-subtitulos`, `colocar-sonidos`.
- **Salió bien si:** el texto transcripto coincide con el guion (salvo correcciones registradas) y las tarjetas tienen `t0`/`t1` crecientes.
- **Si sale mal:** (2 intentos) corrijo con `correcciones-voz.json` (quitar palabras inventadas, renombrar) y reimporto.
- **Me pregunta si:** una línea no se reconoce y no sé si es la voz o el texto.

### Paso 5 · Mirar los cuadros
- **Hace:** `hyperframes snapshot --at ...` en los momentos clave y los **mira** (zonas seguras, subtítulos, HUD, personaje sin tapar).
- **Salió bien si:** nada sobre y < 168, subtítulos en y 1088 a 1332, nada importante en el borde derecho de abajo, tarjetas de 1 a 3 palabras.
- **Si sale mal:** hasta 3 ajustes y otra tanda de cuadros.
- **Me pregunta si:** un cambio de diseño que no pidió (cambiar de lugar un cartel) afecta algo que ya aprobó.

### Paso 6 · Render y medidas
- **Hace:** `hyperframes render -o renders/ep-NN-v0.1.mp4` (**sin `--quiet`**); mide con ffprobe, `ebur128` y `silencedetect`.
- **Salió bien si:** 1080×1920, 30 fps, H.264 + AAC, duración = `escenas.json`, loudness cerca de −14 LUFS, pico ≈ −1 dBFS, silencios largos solo en la cola.
- **Si sale mal:** (2 intentos) reintento sin `--quiet`; si falla igual, reporto el mensaje y paro.
- **Me pregunta si:** hay que bajar música o instalar algo para seguir.

### Paso 7 · Entrega (voz guía)
- **Hace:** copia a `Terminados\ep-NN-v0.1-voz-guia.mp4`, documenta la versión en el `LEEME.md` del episodio y en la memoria, y se lo manda a Nico con `SendUserFile`, diciendo **qué no pude verificar** (audio y movimiento).
- **Salió bien si:** el archivo existe en `Terminados\`, el LEEME lo registra y el mensaje trae medidas, lo que cambió y lo que falta.
- **Si sale mal:** reintento el envío una vez; si no, paso la ruta.
- **Me pregunta si:** siempre antes de pasar a la voz final: "¿te cierra el formato?".

### Paso 8 · Voz final y retimeo (frena acá hasta que Nico entregue las tomas)
- **Hace:** cuando Nico corre `generar.mjs` y avisa, corro `analizar-tomas.mjs` + `ranking-tomas.mjs`, elijo (diciendo que fue por métricas y que **no escucho**), pongo `_carpeta` y las tomas en `tomas-elegidas.json`, importo y recorro la **lista de retimeo** (`05-pipeline-produccion.md`).
- **Salió bien si:** `check` 0 errores con la voz nueva y los cuadros muestran gestos y carteles en las palabras correctas.
- **Si sale mal:** hasta 3 rondas de retimeo; si una toma suena mal para Nico, cambia la toma elegida y se repite.
- **Me pregunta si:** hay que regenerar una línea (gasta caracteres) o la voz elegida tiene un tono raro.

### Paso 9 · Render final y entrega
- **Hace:** render, medidas, `Terminados\ep-NN-vX.Y-elevenlabs.mp4` (o el nombre de la voz), LEEME y memoria, `SendUserFile`.
- **Salió bien si:** igual que el Paso 6 con la voz final, más "Nico escuchó o quedó dicho que no pude oír".
- **Si sale mal:** igual que el Paso 6.
- **Me pregunta si:** siempre antes de dar el episodio por terminado. **La publicación la hace Nico**: yo no publico ni mando nada.

---

## Bloque listo para `/goal` (la condición sale de los pasos 3 a 6; lo escribe Nico, yo no lo activo)

```
/goal Episodio NN renderizado: `npx --no-install hyperframes check` sale con 0 errores, `renders/ep-NN-v0.1.mp4` existe con ffprobe 1080x1920 a 30 fps y duración igual a build/escenas.json, y copiado a Terminados/. No modificar episodios anteriores, personaje/ ni Guiones/ de otros episodios. Mostrá en la conversación la salida de cada chequeo (check, ffprobe, ebur128). Frená después de 20 turnos o si hay que descargar, instalar o publicar algo.
```
Sugerí auto mode para que corra sin pedir permisos. `/goal` no sirve para esperar las voces de ElevenLabs ni el voto: el flujo se frena en el Paso 8 y se retoma cuando Nico avisa.
