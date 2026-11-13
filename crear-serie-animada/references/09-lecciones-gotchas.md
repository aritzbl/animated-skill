# Lecciones y gotchas

Cosas que ya costaron tiempo en la serie de Gonza. Cada una tiene el **porqué** para que sepas cuándo aplica y cuándo no.

## Rig y GSAP

- **Las manos IK llevadas a la línea media quedan DETRÁS de la cabeza.** La cabeza se dibuja después de los brazos en la jerarquía. Usá objetivos **a los costados** de la cara: `Hab.brazo("i", 112, 130, -1)` y `Hab.brazo("d", 288, 130, 1)` (bend −1 la i, +1 la d). Un peine o tijera que quede tapado ahí es aceptable.
- **`svgOrigin` es en coordenadas GLOBALES del SVG**, no locales. Un grupo espejado (`scaleX: -1`) necesita el origen **espejado** también, si no rota alrededor de un punto equivocado.
- **`fromTo` con `x`/`y` necesita los dos extremos** completos; con solo `from` GSAP mezcla con valores viejos y el elemento salta.
- **Números que ruedan** (contador, reloj): ease `steps(n)`; con `sine` se ven números intermedios ilegibles.
- **Se pueden tweenear variables CSS** (`--corte-d`: 1 → 0) para animar una capa del rig por lados (el corte del pelo por izquierda y derecha). `Personaje.mejoraTo` hace lo mismo con la tabla `MEJORAS`.
- **Utensilios en las manos:** inyectalos dentro de `mano-d` / `mano-i` del rig (con JS desde la escena: `part(p, "mano-d").appendChild(...)`) para que **giren con el brazo**. Si los ponés en el host, flotan.
- **`poseTo` resetea TODAS las articulaciones al descanso** (más lo que diga la pose). Si tweeneás la `cabeza` por afuera y después llamás `poseTo`, se pelean. Meté la inclinación de cabeza **dentro de la pose** (`Hab.pose("sentado", { cabeza: { y: 17, rotation: -4 } }, ...)`).
- **Reposo de la cabeza:** con postura 1 (encorvado) es `y = 14`; sentado, `y = 17`. Si definís poses a mano con `cabeza.y`, sumale la postura.
- **El prop de identidad vuelve a la mano en `parado`** (`PROP_DEFAULT`). Si no pega en un episodio, apagá la variable: `Personaje.BASE_VARS["--acc-identidad"] = 0` en `assets\helpers.js` de ese episodio (el rig y los otros episodios no cambian). Si no, las poses "parado" se lo devuelven.
- **Sin `Math.random`, `Date.now` ni `repeat: -1`** (el render busca cuadros en cualquier orden: tiene que ser determinista). Idle con ciclos explícitos.
- **Postura:** se suma a cualquier pose y `mejoraTo` la anima; armá la línea de tiempo en orden cronológico.
- **Mezclar poses:** `Hab.pose(base, ...extras)` hace merge profundo; los últimos pisan. Los brazos se pisan a nivel de articulación.

## HyperFrames y render

- **`multiple_root_compositions`:** un `hoja.html` en la raíz del proyecto lo provoca. Las hojas viven en `compositions\` y se renderizan con `-c compositions/hoja.html`.
- **Render sin `--quiet`.** Una vez falló sin mensaje con `--quiet` y anduvo sin él.
- **Fuentes:** siempre `@font-face` local con un nombre propio (`"Fuente"`). Si no, HyperFrames baja Google Fonts a `~/.cache/hyperframes/fonts` al renderizar **cualquier** texto, incluso con `sans-serif`.
- **`check` y falsos positivos** (`rotation_pivot_drift`, `off_pivot_rotation`, "film's last line"): son del rig/medición, no errores. Los que sí hay que arreglar: contraste (< 3:1), `line_unread` (el último cartel ≥ 2 s), audio inexistente, solapes de pista.
- **`snapshot --at` fuera de orden coincide con el MP4** (PSNR 42 dB medido en el Día 1): se puede confiar en los cuadros para revisar tiempos.
- `.hyperframes\video-state.json` guarda rutas absolutas viejas si el proyecto se mudó: es estado regenerable, no se toca.
- El **Playwright MCP** solo guarda archivos bajo la carpeta vieja de OneDrive; para exportar imágenes en la carpeta nueva, scripts con `puppeteer-core` (como `logo\exportar.mjs`).
- `hyperframes init` y otros comandos pueden sugerir `skills update`: **ignorar**.

## Voz y Whisper

- **Whisper adelanta palabras después de una pausa y a veces inventa una palabra final** ("siglo"). Corregí con `correcciones-voz.json` y afiná inicios con la energía (ver `05-pipeline-produccion.md`).
- **Whisper lee mal números y nombres propios** ("Día cero", "treinta días" con voz sintética; "Gonzá"; "cuenta" por "cuento"). Corregí el texto a mano y conservá los tiempos. `alinear-tarjetas.mjs` deletrea los números para que "29" y "veintinueve" calcen.
- **Voz lenta y grave = "de un muerto".** Hacela dinámica (`04-voces.md`).
- **Las variantes con etiquetas de emoción** dan más movimiento de tono pero son más lentas y con pausas. Las etiquetas son una propuesta sin verificar.
- **Las variables de entorno de la terminal de Nico no las heredo yo** (viven solo en esa pestaña), y pedirle que las ponga en cada sesión no escala. Solución (2026-11-12): un `.env` en la raíz de la serie que `generar.mjs` carga solo; yo corro el script sin ver los valores.
- **Un cambio de texto implica regenerar la voz.** Gonza pasó de 30 a 28 años para no repetir el 30 de los días, y la voz grabada ya decía "treinta años": hubo que regenerar el gancho. **Cerrá los datos duros (edad, plazo, nombres) antes de generar voces** y avisá que regenerar gasta caracteres.
- Con voz guía (SAPI) las tarjetas de interjecciones ("Ahhh") no las reconoce Whisper: marcalas `"fijo": true`.
- **De la voz guía a ElevenLabs cambia el largo del episodio** (Día 3: de 64,3 a 72,15 s) y hay que retimear escena por escena: ver el final de `04-voces.md`. `analizar-tomas.mjs` necesita `medir_varios.py` y `medir_voz.py` al lado o falla sin explicación.

## Proceso y colaboración

- **Subtítulos de 4 líneas** tapan al personaje → partí en tarjetas de 1 a 3 palabras.
- **El silencio se nota** (27,7 s de 51,4 s sin sonido en una v0.2): ambiente + efectos en todas las escenas.
- **Mezcla de sonido (Nico, Día 3, 2026-11-12: "se escucha un ruido estático de fondo y los efectos están muy fuertes").** Los efectos sintetizados con ffmpeg salían con pico cerca de 0 dBFS (toc-iman -0,9, click -1, apagón -1,9) y la voz, nivelada a -16 LUFS, picos de unos -3: los efectos competían con ella. Y el ambiente (`amb-noche`, `amb-manana`, ruido filtrado) sonaba a estática. Regla: **sin ambiente de ruido sintetizado** (si se quiere ambiente, que sea tonal y muy bajo, y que Nico lo apruebe de oído) y **todo efecto con pico efectivo (pico del wav + 20 log10 del volumen de `sonido.json`) de -14 dBFS o menos**; medilo con `ffmpeg -i x.wav -af volumedetect -f null -` (`max_volume`). Un script que baje cada cue 8 dB con ese tope lo arregla de una vez. Antes de renderizar, calculá la tabla de picos efectivos de todos los cues. No puedo oír el resultado: avisalo y pedile que lo escuche.
- **Ruidos raros en un episodio nuevo:** antes de tocar la mezcla, medí por separado (voces crudas, voces importadas, efectos, mezcla final). Si la mezcla se parece a la del episodio anterior en las métricas pero Nico oye algo raro, armá pistas `solo voces` y `solo efectos` (mismas posiciones y volúmenes) y pedile que diga cuál tiene el ruido. Ver el final de `04-voces.md`.
- **Los chistes flojos se sacan** y no se repiten entre episodios.
- **Las decisiones cambian y se registran con fecha**: el nombre de la barra del HUD fue ADULTÓMETRO y volvió a LABURO; una versión de la memoria decía lo contrario. Anotá **la última decisión, con fecha y quién la pidió**, y quitá la vieja del encabezado para no mezclar.
- **Un pedido "para copiar" se pega también en el chat.**
- **Verificá lo que dijo la memoria antes de recomendarlo** (rutas, archivos, flags): puede haber cambiado.
- **Evitar parecerse a la referencia** (remera verde → lavanda → roja; auriculares naranja → ámbar). Revisar el parecido en cada rediseño.
- **Una mejora que se mueve de día** (el peinado pasó del Día 9 al Día 2) deja un hueco en la tabla: avisalo.
- **El plazo de los textos de pantalla (≥ 2 s para el último cartel)** lo mide `check`.

## Estado de verificación de esta skill (lo que NO se probó)

Para ser honestos con Nico sobre qué está probado y qué no (ver el informe final):
- Probado de punta a punta con una serie de prueba (ya borrada): `crear-serie.mjs`, `crear-episodio.mjs`, `sonidos.mjs`, `armar-index.mjs`, `generar-subtitulos.mjs`, `colocar-sonidos.mjs`, voz guía SAPI, `importar-voces.mjs` con Whisper, `afinar-inicios.mjs` (+ persistencia en `correcciones-voz.json`), `alinear-tarjetas.mjs` con números, `hyperframes check`, `snapshot` y `render` (1080×1920, 30 fps), hojas del personaje, página de bocetos.
- También probado: `generar.mjs --probar` (sin red ni claves) y `analizar-tomas.mjs` + `ranking-tomas.mjs` sobre la voz guía (texto 100%, los números "28" y "30" bien deletreados).
- **No probado:** `generar.mjs` contra ElevenLabs real (solo `--probar` y, en el Día 1, un servidor falso), `analizar-tomas.mjs` / `ranking-tomas.mjs` sobre tomas reales de ElevenLabs (la lógica es la de los Días 1 y 2, reescrita), `logo\exportar.mjs` con la versión paramétrica (necesita servidor local), Kokoro/Piper/`edge-tts`, y todo lo que dependa de **escuchar** o **ver movimiento**.

## Segundo personaje en la misma escena (mamá de Gonza, 2026-11-11)

- **Los estilos de un SVG inline valen para toda la página.** Si el rig nuevo usa `.k`, `.f-skin`, etc., pisa los de Gonza. Prefijá todas las clases (`.mk`, `.mf-skin`...) y las variables CSS (`--m-*`), y usá otro uid (`m1...`, Gonza `g1...`) y otro global (`window.Mama`, `MAMA_MARKUP`).
- **Un `<style>` o una etiqueta escrita dentro de un comentario CSS de un SVG inline rompe el árbol:** el personaje no se dibuja y no hay ningún error. Los comentarios del `<style>` van sin ángulos.
- **Props que giran con el brazo:** dibujalos "colgando" de la mano en reposo (a lo largo del antebrazo) y con el brazo arriba quedan parados. Si tienen que quedar derechos (taza), ponelos en un grupo propio con pivote en la mano y compensá la rotación en la pose (`-(brazo + antebrazo)`).
- **IK con la mano arriba del hombro:** invertí el `bend` del brazo (el d usa +1 para que el codo quede afuera y abajo); con la mano abajo, el d usa -1.
- **Giro 3/4:** las mejillas y el resto de la cara se corren y se salen de la cabeza; metela en un grupo con `clip-path` de la elipse de la cabeza (un grupo que NO se mueva).
- Para depurar sin red: abrir la página con puppeteer-core (el Chrome de HyperFrames), servir gsap desde `node_modules\hyperframes\dist\vendor\npm` y mostrar `pageerror`; la composición tiene que estar en la raíz del proyecto para que `assets/...` resuelva.

## Piso, profundidad y fondo (Día 3, 2026-11-12; lo vio Nico en el v0.1, yo no)

- **Un personaje "flota" si sus pies quedan por encima de la línea pared/piso** (o de la mesa que tapa el piso). Antes de dar por buena una escena con personaje de pie, medí en un cuadro: la base de los zapatos tiene que estar **por debajo** de esa línea (en una escena con piso visible, unos 30 a 50 px más abajo) o directamente **tapada** por un mueble. Si el piso lo tapa un escritorio de frente, poné al personaje **antes del escritorio en el DOM** y bajalo hasta que el mueble le tape los pies.
- **Profundidad por base, no por tamaño:** lo que está más lejos tiene la base más arriba. Un personaje dibujado delante de la cama con la base más arriba que la cama parece pararse sobre la manta. Corrélo hasta que los pies caigan en el piso, fuera del borde del mueble (acepto que el borde de la pantalla le recorte la capa), y ajustá el alcance de los brazos.
- **Cosas en una superficie** (mate sobre el escritorio): la base tiene que caer **dentro** de la franja de la superficie, no encima. Y no las pongas donde después va a pararse alguien: se dibuja el mueble delante y la cosa tapa al personaje.
- **Fondo con ventana:** todo lo que esté "afuera" (sol, luna) va con `clip-path` al vidrio y el marco se dibuja **después**. Un círculo sin recortar se sale por el marco.
- **Revisar el fondo contra la puerta y los carteles que aparecen después:** un objeto de pared (la tele) que queda en el mismo rango de x que la puerta se tapa cuando la hoja se dibuja encima. Mirá un cuadro con todo abierto.
- **Un cambio de línea de voz mueve todo lo que sigue:** si agregás una palabra a una línea (Nico pidió "irse a dormir temprano"), regenerá solo esa voz (JSON temporal con una línea), reimportá, y corré con un nodo los `data-start` de las escenas, los `inicio` de las voces, el HUD y `sonido.json`; los tiempos dentro de cada escena posterior no cambian porque son locales.
- **Carteles de presentación:** si entran con una escena corta, que **viajen con el personaje** (misma `x`) así se leen ≥ 1,7 s (`line_unread`).
