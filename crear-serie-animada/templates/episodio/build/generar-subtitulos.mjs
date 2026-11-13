// Genera compositions/subt.html (tarjetas cinéticas) a partir de build/tiempos.json.
// Uso (desde la carpeta del episodio):  node build/generar-subtitulos.mjs
// Necesita assets/sfx/tick1..3.wav (los hace build/sonidos.mjs).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(raiz, "build", "tiempos.json"), "utf8"));
const inicio = Object.fromEntries(T.voces.map((v) => [v.id, v.inicio]));
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---- estilo de las tarjetas (cambiar acá, no en el HTML generado)
const TINTA = "#262033";   // contorno
const NUMERO = "#F4B63A";  // clase "n": números destacados
const CLAVE = "#FF4B55";   // clase "k": palabra clave
// zona segura Reels: las tarjetas van en y 1088 a 1332 (ver references/07-formato-reels.md)
const TOP = 1088, ALTO = 244;

function tamano(texto) {
  const n = texto.length;
  if (n <= 9) return 140;
  if (n <= 14) return 118;
  return 98; // en dos renglones
}
// parte en dos renglones balanceados si el texto es largo
function renglones(pal) {
  const total = pal.map((p) => p[0]).join(" ").length;
  if (total <= 15) return [pal];
  let mejor = 1, dif = 1e9, acum = 0;
  for (let i = 0; i < pal.length - 1; i++) {
    acum += pal[i][0].length + 1;
    const d = Math.abs(acum - (total - acum));
    if (d < dif) { dif = d; mejor = i + 1; }
  }
  return [pal.slice(0, mejor), pal.slice(mejor)];
}

const grupos = T.tarjetas.map((c, i) => {
  const t0 = r3(inicio[c.voz] + c.t0);
  const dur = r3(Math.max(0.3, c.t1 - c.t0));
  const texto = c.pal.map((p) => p[0]).join(" ");
  if (c.pal.length > 4 || texto.length > 26) console.warn(`AVISO: la tarjeta ${i + 1} ("${texto}") es larga: partila en tarjetas de 1 a 3 palabras (una de 4 renglones tapó al personaje).`);
  const html = renglones(c.pal)
    .map((ren) => ren.map((p) => `<span${p[1] ? ` class="${p[1]}"` : ""}>${p[0]}</span>`).join(" "))
    .join("<br />");
  return { id: `s${String(i + 1).padStart(2, "0")}`, t0, dur, size: c.punch ? tamano(texto) + (texto.length >= 9 ? 0 : 26) : tamano(texto), html, punch: !!c.punch, voz: c.voz };
});

const marcado = grupos
  .map(
    (g) => `      <div id="${g.id}" class="g clip" data-start="${g.t0}" data-duration="${g.dur}" data-track-index="${1 + T.voces.findIndex((v) => v.id === g.voz)}">
        <div class="t" style="font-size:${g.size}px">${g.html}</div>
      </div>`
  )
  .join("\n");

// un tic suave por tarjeta (tres sonidos que rotan para que no se repita el mismo)
const ticks = grupos
  .map((g, i) => `      <audio id="${g.id}-tic" class="clip" src="assets/sfx/tick${(i % 3) + 1}.wav" data-start="${g.t0}" data-duration="0.06" data-track-index="${3000 + i}" data-volume="0.3" data-hf-media-start-basis="local"></audio>`)
  .join("\n");

const guion = grupos
  .map((g) =>
    g.punch
      ? `    tl.fromTo("#${g.id} .t", { scale: 0.5, opacity: 0, rotation: -4 }, { scale: 1.12, opacity: 1, rotation: 1.5, duration: 0.16, ease: "back.out(2.6)" }, ${g.t0});
    tl.to("#${g.id} .t", { scale: 1, rotation: 0, duration: 0.18, ease: "sine.out" }, ${r3(g.t0 + 0.16)});`
      : `    tl.fromTo("#${g.id} .t", { scale: 0.62, opacity: 0, y: 26 }, { scale: 1, opacity: 1, y: 0, duration: 0.15, ease: "back.out(2.2)" }, ${g.t0});`
  )
  .join("\n");

const html = `<template>
  <style>
    @font-face { font-family: "Fuente"; font-weight: 700; src: url("assets/fonts/Fuente-700.woff2") format("woff2"); }
    #root { position: absolute; inset: 0; font-family: "Fuente", sans-serif; }
    #root .g { position: absolute; left: 0; right: 0; top: ${TOP}px; height: ${ALTO}px; display: flex; align-items: center; justify-content: center; text-align: center; }
    #root .t { display: block; width: 980px; font-weight: 700; color: #fff; line-height: 1.02; letter-spacing: -1px;
      -webkit-text-stroke: 16px ${TINTA}; paint-order: stroke fill; text-shadow: 0 10px 0 ${TINTA}; }
    #root .n { color: ${NUMERO}; }
    #root .k { color: ${CLAVE}; }
  </style>
  <div id="root" data-composition-id="subt" data-width="1080" data-height="1920">
${ticks}
${marcado}
  </div>
  <script>
    // GENERADO por build/generar-subtitulos.mjs desde build/tiempos.json. No editar a mano.
    const tl = gsap.timeline({ paused: true });
${guion}
    window.__timelines = window.__timelines || {};
    window.__timelines["subt"] = tl;
  </script>
</template>
`;
writeFileSync(join(raiz, "compositions", "subt.html"), html, "utf8");
if (grupos.length) console.log(`subt.html OK: ${grupos.length} tarjetas, ${grupos[0].t0} s a ${r3(grupos[grupos.length - 1].t0 + grupos[grupos.length - 1].dur)} s`);
else console.log("subt.html OK: 0 tarjetas (todavía no hay tarjetas en build/tiempos.json)");
