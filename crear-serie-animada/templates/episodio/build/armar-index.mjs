// Escribe en index.html las escenas y las voces a partir de build/escenas.json y build/tiempos.json.
// Así cambiar la duración de una escena o el inicio de una voz es editar un JSON, no el HTML.
// Uso (desde la carpeta del episodio):  node build/armar-index.mjs
//
// build/escenas.json:  { "duracion": 12.5, "hud": true,
//                        "escenas": [ { "id": "esc1", "inicio": 0, "dur": 6 }, { "id": "esc2", "inicio": 6, "dur": 6.5 } ] }
// Reescribe SOLO lo que está entre estas marcas de index.html (y data-duration del #root):
//   <!-- ESCENAS:INICIO --> ... <!-- ESCENAS:FIN -->   escenas, subtítulos y HUD
//   <!-- VOCES:INICIO -->   ... <!-- VOCES:FIN -->     un <audio> por voz de tiempos.json
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const E = JSON.parse(readFileSync(join(raiz, "build", "escenas.json"), "utf8"));
const T = JSON.parse(readFileSync(join(raiz, "build", "tiempos.json"), "utf8"));
const r3 = (x) => Math.round(x * 1000) / 1000;
const dur = r3(E.duracion);

// consistencia: las escenas tienen que cubrir 0 a duracion sin huecos ni solapes
let fin = 0;
for (const e of E.escenas) {
  if (Math.abs(e.inicio - fin) > 0.001) console.warn(`AVISO: ${e.id} arranca en ${e.inicio} pero la anterior termina en ${r3(fin)} (hueco o solape).`);
  fin = e.inicio + e.dur;
}
if (Math.abs(fin - dur) > 0.001) console.warn(`AVISO: las escenas terminan en ${r3(fin)} pero "duracion" es ${dur}.`);
for (const v of T.voces) if (v.inicio + v.dur > dur + 0.001) console.warn(`AVISO: la voz ${v.id} termina en ${r3(v.inicio + v.dur)}, después del final del episodio (${dur}).`);

const escenas = E.escenas.map((e, i) =>
  `      <div id="${e.id}" class="esc clip" data-composition-id="${e.id}" data-composition-src="compositions/${e.id}.html"
           data-start="${r3(e.inicio)}" data-duration="${r3(e.dur)}" data-track-index="${i + 1}" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`).join("\n");
const subt = `      <div id="subt" class="esc clip" data-composition-id="subt" data-composition-src="compositions/subt.html"
           data-start="0" data-duration="${dur}" data-track-index="40" data-track-kind="captions" data-width="1080" data-height="1920"></div>`;
const hud = E.hud === false ? "" : `\n      <div id="hud" class="esc clip" data-composition-id="hud" data-composition-src="compositions/hud.html"
           data-start="0" data-duration="${dur}" data-track-index="41" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`;
const voces = T.voces.map((v, i) =>
  `      <audio id="${v.id}" class="clip" src="${v.archivo}" data-start="${r3(v.inicio)}" data-duration="${r3(v.dur)}" data-track-index="${20 + i}" data-volume="1"></audio>`).join("\n");

function reemplazar(html, marca, bloque) {
  const a = html.indexOf(`<!-- ${marca}:INICIO`), b = html.indexOf(`<!-- ${marca}:FIN -->`);
  if (a < 0 || b < a) throw new Error(`index.html no tiene las marcas ${marca}:INICIO / ${marca}:FIN`);
  const ini = html.lastIndexOf("\n", a) + 1;
  return html.slice(0, ini) + `      <!-- ${marca}:INICIO (generado por build/armar-index.mjs) -->\n${bloque}\n      <!-- ${marca}:FIN -->` + html.slice(b + `<!-- ${marca}:FIN -->`.length);
}
const ruta = join(raiz, "index.html");
let html = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
html = reemplazar(html, "ESCENAS", `${escenas}\n${subt}${hud}`);
html = reemplazar(html, "VOCES", voces || "      <!-- (todavía no hay voces en build/tiempos.json) -->");
html = html.replace(/(<div id="root"[^>]*data-duration=")[\d.]+(")/, `$1${dur}$2`);
writeFileSync(ruta, html, "utf8");
// assets/episodio-tiempos.js: lo leen las escenas (Hab.hablaLinea) para saber cuándo arranca cada voz respecto de su escena,
// así al retimear la voz la boca se corre sola.
const EP = {
  duracion: dur,
  voces: Object.fromEntries(T.voces.map((v) => [v.linea || v.id, { inicio: r3(v.inicio), dur: r3(v.dur) }])),
  escenas: Object.fromEntries(E.escenas.map((e) => [e.id, r3(e.inicio)])),
};
writeFileSync(join(raiz, "assets", "episodio-tiempos.js"), "// GENERADO por build/armar-index.mjs. No editar a mano.\nwindow.EP = " + JSON.stringify(EP) + ";\n", "utf8");
console.log(`index.html OK: ${E.escenas.length} escenas, ${T.voces.length} voces, ${dur} s (y assets/episodio-tiempos.js)`);
