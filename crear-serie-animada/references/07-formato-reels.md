# Formato Reels 9:16 y zonas seguras

Pedido de Nico el 2026-11-11: **todo video de la serie se arma y se exporta para Reels**. Se publican como Reels de Instagram; otra proporción se recorta o queda con barras y se pierde el efecto del género (personaje grande y centrado, HUD arriba).

## Especificación
**Vertical 9:16, 1080×1920 px, 30 fps, H.264 + AAC.**
- Raíz del proyecto: `data-width="1080" data-height="1920"` y `data-resolution="portrait"` en `<html>`; cada escena también.
- Excepción: el **logo de perfil** es cuadrado (1024 px, se recorta en círculo) y no es un video.

## Zonas seguras (las que se usan desde el Día 1)

| Zona | Valor | Qué va |
|---|---|---|
| **y 0 a 168** | **vacío** | Nada importante: la interfaz de Instagram lo tapa. |
| y 186 en adelante | HUD | Pastilla de días (y 192, alto 82), barra de progreso (y 186, alto 92), cartel DÍA N (y 300, alto 112), usuario (y 322). |
| **y 168 a 1330** | texto y elementos clave | Todo lo que hay que leer o ver. |
| **y 1088 a 1332** | subtítulos cinéticos | Tarjetas centradas, 980 px de ancho máximo. |
| **> y 1332** | interfaz (el ~20% inferior) | Nada importante. **Ojo:** en el Día 2 el cartel "COMENTÁ UNA PALABRA" se puso en y 1352 a 1448 (y la plantilla `esc2.html` lo copia), o sea por debajo de esta zona. Nadie verificó cómo lo tapa la interfaz de Instagram: si es importante que se lea, subilo (y ~1240) o consultalo con Nico. |
| **borde derecho de la mitad inferior** | libre | Botones de Instagram (me gusta, comentar, compartir). Las tarjetas de opciones van a los costados, no pegadas a la derecha abajo. |

- **Portada:** la grilla del perfil recorta el centro, así que la cara del personaje y el cartel DÍA N van **al centro**. Comprobar el recorte en la app: no está verificado.
- El personaje se monta grande y centrado, recortado a la cadera por el límite inferior (host de 680×1088 en left 200, top 560).

## Subtítulos
- **Tarjetas de 1 a 3 palabras y una o dos líneas (~12 caracteres por línea).** Una tarjeta de 4 líneas tapó al personaje y Nico se quejó. `generar-subtitulos.mjs` avisa cuando una tarjeta tiene más de 4 palabras o 26 caracteres.
- Tamaño por largo del texto: ≤ 9 car. 140 px, ≤ 14 car. 118 px, más 98 px (dos renglones); `punch` suma 26 px.
- Blanco con contorno oscuro (16 px) y sombra. Números en amarillo (`n`), palabra clave en rojo (`k`). Cambian justo en la palabra que dice la voz.
- Fuente local (`assets\fonts\Fuente-700.woff2`, Inter OFL copiada de HyperFrames): no se descarga nada.

## HUD (género "serie con votación")
Pastilla oscura con calendario y "N DÍAS" (número en amarillo), barra de progreso con porcentaje, cartel amarillo "DÍA N" inclinado unos 3° (visible desde el segundo 0: sirve de miniatura), usuario de la cuenta. La interfaz de Instagram tapa el 20% de abajo. Configuración por episodio en el objeto `HUD` de `compositions\hud.html`.

## Verificación antes de entregar
- `ffprobe`: **1080×1920**, 30/1, h264 + aac.
- `hyperframes check`: **0 errores**.
- Mirar los cuadros del `snapshot` con las zonas en la cabeza: nada sobre y < 168, subtítulos entre 1088 y 1332, nada importante en el borde derecho de abajo.
