# Episodio {{N}} de {{TOTAL}}: "TÍTULO DEL EPISODIO"

Serie: **{{SERIE}}** ({{CUENTA}}) · Protagonista: {{PERSONAJE}} (`personaje\`) · **Formato Reels 9:16, 1080×1920 px, 30 fps**
Estado: **guion v1, sin producir.** Nada publicado ni enviado fuera de esta carpeta.
Resultado del voto anterior (dicho por el usuario): **ganó ___.** No se inventan números ni comentarios: se pegan los reales o se deja el hueco.

## En una línea

Una frase: qué pasa en este episodio y qué cambia en el personaje.

## Tono y reglas heredadas

- Tono de humor y dialecto (ej. humor cotidiano argentino, con voseo). El personaje es un perdedor querible, nunca asqueroso.
- Quién habla y quién no (ej. una sola voz; los demás personajes con burbujas de texto).
- Cosas pedidas antes que siguen vigentes (sin música, sin accesorio X, etc.).
- Chistes: **(A)** fuerte, **(B)** a validar (se saca sin romper nada). El humor lo juzga el usuario: si un chiste no es claramente bueno, se ofrece alternativa o se saca.

## HUD (todo el episodio)

- Pastilla de días: de ___ a ___ (en qué palabra baja el contador).
- Barra "___": de ___% a ___% (en qué escena sube, cuánto).
- Cartel DÍA {{N}} visible desde el segundo 0 (sirve de miniatura). Usuario {{CUENTA}}.

## Escenas

| # | Tiempo | Escena | Qué pasa |
|---|---|---|---|
| 1 | 0 a ___ s | Gancho | Estacas en el cuadro uno: quién es, cuánto tiempo queda, resultado del voto. Voz: "…". |
| 2 | ___ a ___ s | … | … |
| N | ___ a ___ s | El voto | Dos opciones de una palabra. "Comenten una palabra." |
| N+1 | ___ a ___ s | Cierre | "Mañana: ¿A o B?" + contador + barra. |

Cambios de rig por escena: pose, expresión, `Personaje.mejoraTo(...)` (qué mejora se aplica en cámara y cuándo).

## Voces (líneas para el TTS, ~___ caracteres por toma)

| Archivo | Texto |
|---|---|
| `01-gancho` | "…" |
| `02-…` | "…" |

Las versiones con y sin etiquetas de emoción van en `tts-eleven\lineas-ep-{{NN}}.json`. Pausas con "..." (en voz guía de Windows = pausa de 350 ms).

## Qué falta

1. Comentarios reales del público para el gancho (solo texto, sin usuario). Si no hay, no se inventan.
2. OK del usuario al formato y a los chistes marcados (B).
3. Voz final y retimeo.
4. Música: sin OK para descargar nada.

## Caption propuesta (sin publicar)

> Día {{N}} de {{TOTAL}} 🧉 Resumen con humor del episodio. Pregunta final… ¿A o B? Comentá una palabra. Lo más votado se arregla en el Día {{N+1}}.
> #serieanimada #animacion #humor

No se publica ni se manda nada sin que el usuario lo apruebe.

## Decisiones abiertas

1. …
2. …
