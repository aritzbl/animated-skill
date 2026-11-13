# Fase 3 · Guion por episodio

Objetivo: un guion en `<serie>\Guiones\ep-NN.md` (plantilla `templates\serie\Guiones\plantilla-guion.md`) que Nico aprobó, con **tabla de escenas con tiempos, líneas de voz, cambios de rig, caption y decisiones abiertas**. Modelos reales: `Guiones\dia-01.md` y `Guiones\dia-02.md` del proyecto de Gonza (solo lectura).

## Qué lleva el guion

1. **Encabezado:** serie, protagonista, formato Reels 9:16, estado (versión del guion, qué render existe), resultado del voto anterior **dicho por Nico** (ver abajo).
2. **En una línea:** qué pasa y qué cambia en el personaje.
3. **Tono y reglas heredadas:** humor, quién habla (una sola voz es lo más barato: los demás personajes con **burbujas de texto**; la mamá de Gonza nunca se ve ni habla, solo burbujas, sombra y cucharón), pedidos anteriores vigentes (sin música, sin accesorio X). Marcá los chistes **(A)** fuerte o **(B)** a validar: un (B) se saca sin romper nada.
4. **HUD:** de qué número a qué número baja el contador y en qué palabra; en qué escena sube la barra y cuánto.
5. **Tabla de escenas:** `# | tiempo | escena | qué pasa`, con la **voz literal** entre comillas y los cambios de rig (`Personaje.mejoraTo(...)`, poses, expresiones).
6. **Voces:** tabla `archivo | texto` (de ahí sale `tts-eleven\lineas-ep-NN.json`).
7. **Qué falta**, **caption propuesta (sin publicar)** y **decisiones abiertas** numeradas.
8. **Historial de cambios pedidos** (v1 → v2 → v3) con fecha y qué se sacó o agregó. Es la memoria de por qué el guion es como es.

## Estructura de un episodio de serie con votación

- **Gancho 0 a 6 s con estacas desde el cuadro uno** (patrón del género, ver `Referencias\analisis-30diaspara.md`): HUD fijo, cartel DÍA N, personaje grande y centrado, subtítulos cinéticos de 1 a 3 palabras, y **el resultado del voto anterior** ("Ayer votaron, y ganó el pelo"). Si hay comentarios reales del público, tarjetas con su texto (sin usuario).
- **Desarrollo:** las escenas de "arreglo" que cumplen lo votado. Cada una con una acción visible y un remate.
- **Resultado:** ANTES / DESPUÉS, la barra del HUD sube, la mejora se aplica en cámara con `mejoraTo`.
- **Voto:** dos opciones de una palabra ("¿REMERA o OJERAS?"), cartel "COMENTÁ UNA PALABRA".
- **Cierre:** nota "MAÑANA: ¿A o B?" + contador + barra.
- **Duración:** el género hace 92 a 134 s (promedio ~110). Gonza hizo 55 s el Día 1 y 54 s el Día 2; recomendá 75 a 100 s cuando hay escenas de arreglo. Estimá a **2,6 palabras por segundo más pausas**, pero sabé que la voz dinámica real sale más rápida que la estimación (se estimaban 65 a 70 s y salieron 51).
- **Una voz por episodio:** 3 a 7 líneas de voz de 30 a 150 caracteres. Las escenas sin voz van solo con efectos (la del corte de pelo, por ejemplo).

## El humor lo juzga Nico

- **Si un chiste no es claramente bueno, ofrecé una alternativa o sacalo.** Nico dijo "es malísimo" del chiste del auto del Día 1 y se sacó; "no es gran chiste" de la escena de la mamá del Día 2 y se sacó. No defiendas un chiste flojo.
- **No repitas chistes** entre episodios (la "semifinal" se repetía y se sacó).
- Tono: **perdedor querible, nunca asqueroso** (el agua del desagüe es gris claro, sin mugre explícita). Humor cotidiano, con el dialecto del brief (en Argentina: voseo, "laburo").
- Los chistes en la voz tienen que sonar bien **dichos**. Leé en voz alta mentalmente cada línea; los remates van en la última palabra.
- Marcá en el guion qué chistes son (A) y cuáles (B) y pedile que valide los (B).

## Reglas de contenido

- **Nunca se inventan comentarios del público ni números de votos.** Si el resultado del voto no está, **preguntalo**: "¿qué ganó y querés mostrar números?". Nico dijo "no importa por cuánto": si no lo pide, no se muestran números. Si faltan comentarios reales, el hueco queda anotado en "Qué falta".
- La **barra del HUD**: proponé una curva (en Gonza, 4% por cada arreglo de aspecto y más por cada skill, para llegar cerca de 100% en el día 30) y que Nico la apruebe. **El nombre de la barra lo decide él** (LABURO, ADULTÓMETRO...).
- Mantené la **coherencia con el arco**: la mejora de cada episodio sale de la tabla `MEJORAS` (y si el público votó otra cosa, se edita el `dia` de la tabla).
- Si un pedido rompe el arco (el peinado pasó del Día 9 al Día 2 junto con el corte), avisale a Nico qué queda libre.
- El personaje no usa el accesorio donde no pega (Nico pidió sacar el mate en baño, corte y votación del Día 2: `Personaje.BASE_VARS["--acc-identidad"] = 0` en `assets\helpers.js` del episodio).

## Descripción y caption

- **Caption propuesta** dentro del guion y **descripción** aparte (`Guiones\ep-NN-descripcion.md`, plantilla incluida): empieza con "Día N de TOTAL" y un emoji, resume con humor, termina con la pregunta ("¿A o B? Comentá una palabra. Lo más votado se arregla en el Día N+1") y 3 a 5 hashtags (#serieanimada #animacion #humorargentino).
- Si lo pide para copiar, **pegalo también en el chat**.
- **No se publica ni se manda nada**. La publicación la hace Nico.

## Pedir los datos que faltan
Antes de escribir un guion con votación pedí: **qué ganó**, **comentarios reales** (opcionales), **cuántos días van** y si hay **pedidos nuevos** (cosas que quiere sacar o sumar). Si Nico no contesta algo, el guion sale igual con el hueco marcado.

## Salió bien si
- El guion tiene tabla de escenas con tiempos, voces literales, HUD y caption, y **cada chiste marcado (A) o (B)**.
- Nico lo aprobó **en el chat** (o pidió cambios, que se registraron en el historial y se aplicaron).
- No hay datos inventados (números de votos, comentarios).
- Las líneas de voz están separadas por nombre (`01-gancho`, `02-...`) y la suma de caracteres entra en el presupuesto de la voz elegida (plan gratis de ElevenLabs: 10.000 por mes; un episodio con 5 líneas usa unos 400 a 450 caracteres por toma, 1.700 con 2 tomas × 2 variantes).
