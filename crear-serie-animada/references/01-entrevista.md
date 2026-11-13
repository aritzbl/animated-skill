# Fase 1 · Entrevista y referencias

Objetivo: salir de esta fase con un **brief de la serie** escrito (`Guiones\brief-serie.md`, plantilla en `templates\serie\Guiones\brief-serie.md`) que Nico confirmó. Todo lo que viene después (personaje, guion, voz, HUD) sale de ese brief. Si no está claro, se rehace trabajo caro: un rig entero o un episodio renderizado.

## Cómo entrevistar

- **Una pregunta por vez.** Nico contesta mejor con una decisión chica que con un formulario de doce campos. Si dos preguntas dependen una de la otra, la segunda espera.
- **`AskUserQuestion` cuando las opciones son cerradas** (2 a 4 opciones, la recomendada primero con "(Recomendada)"): formato, duración, plataforma, nivel de humor, qué voz usar. Pregunta abierta en texto cuando la respuesta es creativa (nombre, defectos, accesorio).
- Proponé siempre un **default razonable** y decilo ("si no te importa, uso Reels 9:16 1080×1920 a 30 fps"). Preguntar lo que tiene un default convencional es hacerle perder tiempo.
- Después de cada bloque, **resumí en 2 o 3 líneas** lo entendido y pedí confirmación antes de seguir.
- Nada inventado: si Nico no sabe algo (por ejemplo cuántos días, nombre de la cuenta), se anota "pendiente" y se sigue.
- Escribí las respuestas en el brief a medida que las confirma. El brief es el contrato.

## Bloques de preguntas (en este orden)

### A · Narrativa y formato
1. ¿Qué tipo de contenido es? Serie por días con votación del público (el caso de "30 días para conseguir laburo"), one-shot, serie sin votación, anuncio. *Cambia todo el guion: una serie por días necesita HUD, contador y gancho con resultado del voto anterior.*
2. Plataforma y formato. **Default: Reels 9:16, 1080×1920, 30 fps, H.264 + AAC** (ver `07-formato-reels.md`). Si es otra plataforma, rehacer las zonas seguras.
3. Duración por episodio. Referencia del género: 92 a 134 s; el primer episodio de Gonza duró 55 s. Recomendá 75 a 100 s cuando hay escenas de "arreglo".
4. Cantidad de episodios o días y premisa en una línea ("tiene 30 días para…").
5. Tono de humor y dialecto (ej. humor cotidiano argentino con voseo; perdedor querible, nunca asqueroso). Esto después guía el guion y la voz.

### B · Mecánica con la audiencia
6. ¿El público decide? Cómo: votos por comentarios de una palabra, binario ("A o B"), "lo más votado se arregla en el día siguiente".
7. HUD: contador de días, barra de progreso (¿cómo se llama? Nico decide el nombre: pasó por ADULTÓMETRO y volvió a LABURO), cartel DÍA N, usuario de la cuenta. Preguntá el **nombre de la cuenta** (ej. `@en30diass`).
8. ¿Se muestran comentarios reales del público? Si sí, los pega él (solo texto, sin usuario). **Nunca se inventan comentarios ni números de votos**; pedírselos.

### C · Protagonista
9. Especie, edad, situación y personalidad (en una frase).
10. **Defectos** visibles y de conducta (los que se van a arreglar de a poco).
11. **Accesorio identitario** (el mate de Gonza): un objeto que lo distingue y que puede llevar en la mano.
12. Cómo habla (voz masculina/femenina, edad aparente, ritmo). Se usa en la fase de voces.

### D · Arco de mejoras
13. ¿Qué cambia en el personaje episodio a episodio? Armá con él una tabla **estilo `Personaje.MEJORAS`**: id, episodio, tipo, nombre, qué cambia.
    - **estética** (se ve en el cuerpo: pelo, remera, ojeras, granos, zapatillas),
    - **hábito** (algo que hace o lleva: deja los auriculares, se endereza),
    - **skill** (accesorio de lo aprendido: anteojos, credencial, reloj).
    Gonza tiene 18 mejoras repartidas en 30 días: aspecto primero (días 2 a 12), skills después (14 a 30). Aclarale que **el día es solo el valor por defecto: se mueve según lo que vote el público**.
14. ¿Cuál es el estado final (último episodio)? Sirve para dibujar el accesorio de cada skill.

### E · Estilo de arte
15. Estilo 2D: **recorte plano, trazo oscuro grueso (6 y 4 px), paleta corta (8 colores + blanco)**. Si quiere otro estilo (acuarela, pixel art), avisá que el rig base y los templates están hechos para el plano con contorno; cambiar el estilo es trabajo nuevo.
16. Colores prohibidos o preferidos; qué NO debe parecerse a las referencias.

### F · Referencias (pedirlas siempre)
17. Pedile **ejemplos de lo que quiere**: reels, fotos, capturas, links de cuentas de referencia, personajes que le gusten. Si no tiene, que describa la sensación que busca. No empieces el personaje sin esto: es lo que más acerca el primer boceto a lo que Nico imagina.

## Analizar las referencias

Qué se hizo con @mati.glowup, @nacho.glowup y @30.diaspara (ver el análisis en `Referencias\analisis-30diaspara.md`):

1. **Playwright sin iniciar sesión.** Navegá a la cuenta o al reel. Solo cerrá el cartel de registro de Instagram (la X). No inicies sesión, no aceptes nada más, no hagas clic en seguir ni en nada que modifique la cuenta de Nico.
2. **Capturas de cuadros** a `Referencias\` con el tiempo en el nombre (`<cuenta>-t0.3.png`, `-t1.5.png`, `-t3.png`): sirven para mirar el gancho (0,3 / 1,5 / 3 s) y la estructura. También una "hoja" con varios cuadros juntos. Son solo referencia, no se resube nada.
3. **Análisis escrito** con la plantilla `templates\serie\Referencias\plantilla-analisis.md`: cuenta, duración de los episodios, el gancho de los primeros 3 a 6 s, la mecánica de votación, y las tres listas **tomamos / no copiamos / riesgo**.
4. **`yt-dlp` solo para metadata** (`--skip-download` o `--dump-json`), sin `--cookies-from-browser` y sin descargar el video. Está en el venv de la serie. Descargar un video, imagen, fuente o música **requiere OK explícito de Nico por archivo** (nombre, origen, tamaño).
5. Para medir el **audio** de una referencia sin descargar: WebAudio sobre el video en reproducción dentro del navegador (así se midió el tono, el movimiento y las pausas de la voz de @30.diaspara: ver `04-voces.md`).
6. Anotá lo que **no pudiste ver**: vistas, likes y resultados por video no aparecen sin sesión. Si Nico dice "fueron los de mejores resultados", es información suya, no verificada.

### Regla aprendida: no parecerse
Las cuentas de referencia usan un "set clásico" (auriculares al cuello, granos, remera manchada, silla gamer, remera celeste y blanca, verde oliva). Nico no quiere que el personaje se parezca demasiado:
- Gonza empezó con remera verde, pasó a lavanda y a pedido de Nico quedó **roja**; los auriculares pasaron de naranja a **amarillo ámbar** porque el naranja se perdía contra el rojo.
- Se distingue por la **silueta** (pera), el color, el accesorio propio (mate) y la **historia**.
- Hacé una lista "qué tiene la referencia / qué cambiamos a propósito" y ponela en la ficha. Si un rasgo del set clásico es necesario, cambiale al menos la forma y el color.

## Salió bien si
- Existe `Guiones\brief-serie.md` con los bloques A a F completos (o con "pendiente" explícito).
- Existe `Referencias\analisis-<cuenta>.md` por cada referencia mirada, con "tomamos / no copiamos / riesgo".
- Nico confirmó el resumen final del brief **en el chat** (no se da por confirmado por silencio).
- No se descargó nada ni se inició sesión en ningún sitio.
