# {{PERSONAJE}}: ficha del personaje

Protagonista de la serie "{{SERIE}}". Rig 2D por piezas en un solo SVG (`rig/personaje.svg`), animado con GSAP dentro de HyperFrames.
La API completa del rig (poses, expresiones, bocas, mejoras, caminata...) está documentada en la skill: `references/02-personaje-y-rig.md`.

## Quién es

- **Nombre:** …
- **Edad y situación:** …
- **Personalidad y manías:** …
- **Defectos visibles (lo que se arregla de a poco):** …
- **Accesorio identitario:** … (en el rig: `prop-mano` / `prop-sorbo`, variable `--acc-identidad`)
- **Diseño original, por qué se distingue de las cuentas de referencia:** … (qué se cambió a propósito: color de la ropa, silueta, accesorios)
- **Cómo cambia de un episodio al siguiente:** ver la tabla `Personaje.MEJORAS` en `assets/personaje.js` y `compositions/hoja-mejoras.html`.

## Colores

| Variable CSS | Hex | Uso |
|---|---|---|
| `--p-ink` | `#262033` | contorno y pupilas |
| `--p-skin` | … | piel |
| `--p-hair` | … | pelo |
| `--p-shirt` | … | remera |
| `--p-pants` | … | pantalón |
| `--p-shoes` | … | zapatillas |
| `--p-acento` | … | accesorio, manchas |
| `--p-mugre` | … | ojeras, granos, rubor |

Más el blanco puro (`#fff`) de ojos y dientes. `--p-acento2` (corbata, birome) arranca igual que `--p-acento`.

## Proporciones (las del rig base)

- Lienzo del rig: `viewBox 0 0 400 640`. Suelo en y = 596. Centro del cuerpo en x = 200.
- Cabeza: elipse de 124 × 116 (rx 62, ry 58), centro (200, 150).
- Torso de y 218 a 414. Cadera y 408, rodilla y 480, tobillo y 548.
- Brazo: hombro (152, 240) o (248, 240), codo a 56 de distancia, mano a 80 más. **Si cambiás estas medidas, cambiá también `ARM` en `assets/personaje.js` (la cinemática inversa las usa).**
- Contorno: 6 en formas grandes, 4 en detalles.

## Convenciones

- **izq / der = lado de la PANTALLA**, no del personaje.
- Ángulos en grados, positivo = sentido horario.
- Cada articulación tiene `data-pivot="x y"` con su pivote, en coordenadas del SVG. `Personaje.mount` lo aplica con `svgOrigin` de GSAP (coordenadas GLOBALES del SVG).

## Archivos

| Archivo | Para qué |
|---|---|
| `rig/personaje.svg` | el rig (única fuente) |
| `rig/build.mjs` | convierte el SVG en `assets/personaje-markup.js` (`node rig/build.mjs`) |
| `assets/personaje.js` | API |
| `assets/personaje.css` | paleta y variables de cada mejora |
| `compositions/hoja.html` | hoja de personaje (se renderiza con `-c`) |
| `compositions/hoja-mejoras.html` | las mejoras, antes y después |
| `index.html` | prueba de animación corta |
