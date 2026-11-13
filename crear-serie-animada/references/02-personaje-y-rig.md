# Fase 2 · Creación del personaje y del rig 2D

Objetivo: pasar del brief a un **personaje animable** en `<serie>\personaje\`: 3 propuestas → una elegida → rig SVG con jerarquía de partes y pivotes → expresiones, bocas, poses, giro de cabeza, variables CSS para las mejoras → ficha, hoja de render y logo. Todo parte de `templates\serie\personaje\` (ya generalizado: sin nombres de Gonza).

> El rig base **no es un personaje terminado**: es el esqueleto probado con el que se hizo a Gonza, con una paleta neutra. Si lo dejás tal cual, el personaje nuevo se va a parecer a Gonza. El dibujo (silueta, cara, pelo, ropa) hay que rehacerlo; la **estructura** (ids, pivotes, jerarquía) se conserva porque la API depende de ella.

## 1. Tres propuestas en una página HTML

1. Usá `<serie>\bocetos\propuestas.html` (viene de `templates\serie\bocetos\propuestas.html` al crear la serie con `crear-serie.mjs`).
2. Reemplazá los 3 dibujos `<svg viewBox="0 0 400 640">` por tres propuestas **distintas en silueta**, no solo en color (Gonza: A "La Pera", B "El Signo de Pregunta", C "El Cabezón"). Usá las clases de la página (`.s`, `.t`, `.skin`, `.shirt`, `.l-ink`...) y una paleta propia por tarjeta (`.pA`, `.pB`, `.pC`: 8 colores + blanco).
3. En cada tarjeta escribí: qué lo distingue, defectos y manías, accesorio identitario y **riesgo de parecerse a** una referencia (ver regla "no parecerse" en `01-entrevista.md`).
4. Sacá una captura (Chrome headless de HyperFrames o Playwright con el archivo local, sin servidor: es una página sin dependencias) y mostrásela a Nico (`SendUserFile` con `display: "render"`). Que elija una, o pida mezclar.
5. Con el elegido, **volvé a confirmar**: nombre, edad, paleta final, accesorio.

## 2. Armar el rig SVG

Fuente única: `personaje\rig\personaje.svg`. Después de cualquier cambio: `node rig/build.mjs` (desde `personaje\`) regenera `assets\personaje-markup.js`. **No se edita el markup a mano.**

### Reglas de dibujo
- Lienzo `viewBox="0 0 400 640"`. Suelo en y = 596. Centro del cuerpo en x = 200.
- Cabeza: elipse de centro (200, 150), rx 62, ry 58. Torso y 218 a 414. Cadera y 408, rodilla y 480, tobillo y 548. Brazo: hombro (152, 240) / (248, 240), codo a 56 de distancia, mano a 80 más.
- Contorno `stroke-width` 6 en formas grandes y 4 en detalles. Colores **solo** por variables (`--p-ink`, `--p-skin`, `--p-hair`, `--p-shirt`, `--p-pants`, `--p-shoes`, `--p-acento`, `--p-mugre`) más blanco puro: así cambian por episodio sin redibujar.
- **Si cambiás las proporciones** (otro largo de brazo, otra altura de hombro) tenés que cambiar también `ARM` en `assets\personaje.js` (`S` hombro, `E` codo, `H` mano de cada lado) y los `data-pivot` del SVG: la cinemática inversa los usa. Si no, las manos no llegan adonde se les pide.
- Cada articulación lleva `data-pivot="x y"` (coordenadas del SVG). `Personaje.mount` lo aplica con `svgOrigin` de GSAP.

### Jerarquía (cada sangría hereda el movimiento del padre)
```
mundo                    traslado y escala del personaje entero (pivote en los pies)
  sombra
  silla                  prop, solo en la pose "sentado"
  cuerpo                 pelvis: sube, baja y se balancea (pivote en la cadera)
    pierna-i             cadera y muslo (pivote en la cadera)
      pierna-i-inf       pantorrilla (pivote en la rodilla)
        pie-i            zapatilla (pivote en el tobillo)
      muslo-i            forma del muslo, se achata para el escorzo al sentarse
    pierna-d ...         igual: pierna-d-inf, pie-d, muslo-d
    torso                inclinación del torso (pivote en la cadera)
      respira            respiración: escala del pecho
        (manchas de la ropa: clases mancha-1, mancha-2, mancha-3)
        acc-cuello, acc-corbata, acc-credencial     accesorios de skills
        prop-manos       prop, solo en "sentado" (joystick de ejemplo)
        brazo-i          hombro (pivote en el hombro)
          antebrazo-i    codo (pivote en el codo)
            reloj        accesorio
            mano-i       muñeca (pivote en la muñeca)
              dedo-i     índice, solo para señalar
        brazo-d          igual: antebrazo-d, mano-d (con dedo-d y prop-mano, el prop de identidad)
        habito           objeto del hábito (auriculares de ejemplo), se apaga con --acc-habito
        cabeza           pivote en la base del cuello
          oreja-i, oreja-d, birome (accesorio), craneo
          cara           para el giro 3/4
            ojo-i, ojo-d             cada uno con pupila-i/d y parpado-i/d
            ceja-i, ceja-d, nariz
            rubor
            boca         8 formas: boca-cerrada, boca-abierta, boca-ancha, boca-redonda,
                         boca-triste, boca-ladeada, boca-temblor, boca-enojo
          prop-sorbo     el prop llevado a la boca (solo en las poses "sorbo" y "sentado-sorbo")
          anteojos (accesorio)
          pelo           pelo-despeinado-atras, pelo-base, mechon, pelo-peinado, pelo-despeinado-frente, pelo-sucio
```
**Convención de lados:** `i` = izquierda de la **pantalla**, `d` = derecha de la pantalla (no del personaje). Ángulos en grados, positivo = sentido horario.

### Qué personalizar primero
1. Paleta en `assets\personaje.css` **y** el mismo valor de `--p-shirt`/`--p-pants`/`--p-shoes` en `BASE_VARS` de `personaje.js` (si no coinciden, `Personaje.look` pisa el CSS con el del JS).
2. Cabeza: pelo (`pelo-base` y capas), cejas, nariz, orejas. Es lo que más define al personaje.
3. Ropa: torso, mangas (`brazo-*` pinta con `l-shirt`), pantalón, zapatillas.
4. **Accesorio identitario:** reemplazá el dibujo de `prop-mano` (mano d) y de `prop-sorbo` (cara). El `prop-sorbo` incluye el círculo de la mano que sube a la boca.
5. Props de pose: `silla`, `prop-manos` (lo que sostiene sentado).
6. Capas de mejora: borrá las que no uses y dibujá las propias (ver abajo).

## 3. Capas de mejora (variables CSS) y la tabla `MEJORAS`

Una mejora cambia variables CSS; el rig no se redibuja. Para agregar una capa:
1. Dibujar un grupo en `personaje.svg` con una clase propia, `class="mi-capa"`, y en el `<style>` del SVG `.mi-capa { opacity: var(--mi-capa, 1); }`.
2. Declarar `--mi-capa: 1;` en `personaje.css`.
3. Declararla también en `BASE_VARS` de `personaje.js`.
4. Sumar una entrada a `MEJORAS`:
```js
{ id: "lava-pelo", dia: 2, tipo: "estética", nombre: "Se lava el pelo", vars: { "--pelo-sucio": 0 } }
```
`dia` = **número de episodio por defecto** en que ocurre; se mueve con lo que vote el público. `tipo` = `"estética"`, `"hábito"` o `"skill"`. Una mejora puede traer `postura` (1 = encorvado, 0 = derecho). Los valores admiten decimales (`--ojeras: 0.6`).

**Cómo diseñar el arco** (ver `01-entrevista.md`, bloque D): 18 cambios visibles en 30 días funcionaron bien (8 estéticos, 4 de hábito —un objeto y tres pasos de postura— y 6 skills). Primero el aspecto (los votos más fáciles de animar), después los hábitos, al final las skills. Los días sin cambio de look pueden mostrar una skill nueva sin marca en el cuerpo. Dejá huecos libres: si el público no vota algo, la tabla se reacomoda editando `dia`.

### Uso en una composición
```js
const p = Personaje.mount(host, { dia: 12 });                         // aplica todas las mejoras con dia <= 12
const q = Personaje.mount(host, { mejoras: ["lava-pelo", "birome"] }); // o una lista exacta
Personaje.look(p, 20);                                                 // cambia el estado de uno ya montado
Personaje.mejoraTo(tl, p, "lava-ropa", 4.0, 0.8);                      // anima la mejora en cámara (empieza a 4 s, dura 0,8 s)
Personaje.antesDe("lava-ropa"); Personaje.hasta("lava-ropa");          // listas de ids (para ANTES / DESPUÉS)
```
`mejoraTo` anima los números (las manchas se desvanecen) y cambia los colores a mitad de camino; funciona buscando tiempos en cualquier orden. La **postura** (`postura`) no es CSS: se suma a cualquier pose (con 1, la cabeza baja 14, se achata 5% y el torso baja 4%); `mejoraTo` la conserva en las poses que vienen después, así que armá la línea de tiempo en orden cronológico.

## 4. API del rig (`assets\personaje.js`)

```html
<link rel="stylesheet" href="assets/personaje.css" />
<script src="assets/personaje-markup.js"></script>
<script src="assets/personaje.js"></script>
<script>
  const tl = gsap.timeline({ paused: true });
  const p = Personaje.mount(document.getElementById("host"), { width: "680px", overflow: true, pose: "parado", expr: "neutro", dia: 1 });
  // ...animaciones sobre tl...
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
</script>
```
Opciones de `mount`: `uid`, `viewBox`, `width`, `height`, `overflow`, `pose`, `expr`, `boca`, `giro`, `dia` o `mejoras`. El `id` de cada pieza lleva un prefijo por instancia (se pueden montar varios personajes en la misma página); se la busca con `Personaje.part(p, "cabeza")` (atributo `data-part`).

| Qué | Cómo |
|---|---|
| **Expresiones** (6: `neutro`, `sorpresa`, `verguenza`, `bronca`, `cansado`, `orgulloso`) | `Personaje.exprSet(p, "bronca")` fija; `Personaje.exprTo(tl, p, "sorpresa", 1.2, 0.15)` anima. Se definen en `Personaje.EXPR` (`lid`, `lidRot`, `brow`, `pupil`, `eye`, `rubor`, `boca`). La boca cambia a mitad de la transición. |
| **Boca al hablar** (4 formas: `cerrada` M B P, `abierta` A, `ancha` E I, `redonda` O U) | `Personaje.bocaAt(tl, p, "abierta", 2.92)`. Las otras (`triste`, `ladeada`, `temblor`, `enojo`) las usan las expresiones. Para una línea de voz usá `Hab.hablaLinea(tl, p, "01-gancho", "esc1", "cerrada")` (usa los tiempos de Whisper). |
| **Parpadeo** | `Personaje.blink(tl, p, 3.1, Personaje.EXPR.neutro.lid)` (pasale el párpado de la expresión actual para que vuelva bien). |
| **Poses** (`parado`, `sentado`, `caminando`, `señalando`, `cabeza-entre-manos`, `saludo`, `sorbo`, `sentado-sorbo`) | `Personaje.poseSet(p, "sentado")` fija; `Personaje.poseTo(tl, p, "señalando", 2.0, 0.35, "back.out(1.4)")` anima. Una pose es `{ articulación: { x, y, rotation, scaleX, scaleY } }`; lo que no se nombra vuelve al descanso. |
| **Brazos por IK** | `Personaje.ik("d", x, y, bend)` da los ángulos para llevar el centro de la mano a (x, y); `bend` ±1 elige para qué lado dobla el codo. En episodios: `Hab.brazo("d", 288, 130, 1)` y `Hab.pose("parado", {...}, Hab.brazo(...))` arman una pose mezclada. |
| **Caminar** | `Personaje.walk(tl, p, t0, pasos, T, claveInicial)` encadena 4 claves de `Personaje.WALK` (cada una T/4) y devuelve el tiempo final. Andar con balanceo (waddle): la pierna que se levanta flexiona la rodilla; sin cruce de piernas. |
| **Saludo** | `poseTo(..., "saludo", ...)` y después `Personaje.wave(tl, p, t0, oscilaciones, periodo)`. |
| **Idle** | `Personaje.breathe(tl, p, 0, duracionTotal, 1.6)` (ciclos explícitos, sin repeat infinito). |
| **Giro de cabeza 3/4** | `Personaje.giroTo(tl, p, "tresCuartosD" \| "tresCuartosI" \| "frente", t, dur)`. Aproximado: la cara se corre y se achata y la oreja lejana desaparece; el cuerpo sigue de frente. Un perfil completo pide arte nuevo. |
| **Sorbo del prop** | `Personaje.sorbo(tl, p, t, hold)`: sube la mano a la boca, aguanta `hold` s y vuelve a la pose anterior (si estaba `sentado`, usa `sentado-sorbo`). |

Detalles de poses: `sentado` baja la pelvis 50, achata los muslos al 30% (escorzo) y prende `silla` y `prop-manos`. `señalando` prende `dedo-d`. En `parado` y `caminando` el prop de identidad está en la mano d; las poses que usan esa mano (`sentado`, `señalando`, `cabeza-entre-manos`, `saludo`) lo apagan.

### Límites conocidos
- Vistas de frente y 3/4 de cabeza; no hay perfil ni espalda. Las manos son círculos (sin dedos), salvo el índice de `señalando`.
- Para cruzar la pantalla caminando los pies no están clavados al piso: la velocidad se ajusta a ojo.
- La postura se ve de frente como cabeza hundida y hombros bajos.

## 5. Ficha, hoja de render y logo

- **Ficha** (`personaje\ficha.md`, plantilla incluida): quién es, colores, proporciones, qué se cambió para distinguirlo de las referencias.
- **Hoja de personaje** `compositions\hoja.html` (frente, 3/4, estado inicial y final, 6 expresiones, 4 bocas, paleta, 6 poses, 4 momentos del arco) y **hoja de mejoras** `compositions\hoja-mejoras.html` (antes y después de cada mejora; agregá el recorte de cada mejora nueva en `RECORTE`). Poné el nombre en `NOMBRE_PERSONAJE`. Se renderizan con `-c` (un `hoja.html` en la raíz da `multiple_root_compositions`):
  ```bash
  cd personaje
  npx --no-install hyperframes render -c compositions/hoja.html -o renders/hoja.mp4
  ```
  y se saca un cuadro con ffmpeg (`-ss 1 -frames:v 1`) para verla.
- **Logo de cuenta** `logo\index.html` (rig real, solo cabeza y hombros, texto grande arriba, insignia circular con aro): `python -m http.server 8765 --bind 127.0.0.1` desde la carpeta de la serie (pararlo después) y `node logo/exportar.mjs` (usa el Chrome headless de HyperFrames, sin red) deja `logo-1024.png`, `prueba-110px.png` y `prueba-circulo.png`. Parámetros por URL (`?txt=30&s=3.1&hy=545`). A 110 px un objeto chico se lee mal (el mate parecía una taza): agrandá el prop con `ms`. Si Nico pide un "prompt para el logo", pegalo **también en el chat**, no solo en un archivo.
- Nico aprobó el rig de Gonza con "Así está bien". Pedí esa aprobación explícita antes de producir episodios.

## Salió bien si
- `node rig/build.mjs` corre sin error y `hoja.mp4` se renderiza; en el cuadro se ven las 6 expresiones, las 4 bocas, las 6 poses y el antes/después del arco.
- Las manos IK llegan a donde se las manda y **no quedan detrás de la cabeza** (ver gotchas en `09-lecciones-gotchas.md`).
- La paleta de la hoja coincide con la de `personaje.css`; ninguna mejora de la tabla apunta a una variable inexistente.
- El personaje no se confunde con las referencias (lista "qué cambiamos a propósito" en la ficha).
- Nico dijo que sí al diseño **en el chat**.
