// Escribe las etiquetas <audio> de los efectos en cada escena a partir de build/sonido.json.
// Uso (desde la carpeta del episodio):  node build/colocar-sonidos.mjs
// Cada composición (escN o hud) lleva entre estas marcas su bloque generado, que se reescribe cada vez:
//   <!-- SONIDO:INICIO --> ... <!-- SONIDO:FIN -->
// Si la composición todavía no tiene las marcas, las inserta justo después de <div id="root" ...>.
import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const S = JSON.parse(readFileSync(join(raiz, "build", "sonido.json"), "utf8"));
const r3 = (x) => Math.round(x * 1000) / 1000;
const duracion = (nombre) => {
  const ruta = join(raiz, "assets", "sfx", nombre + ".wav");
  if (!existsSync(ruta)) throw new Error(`No existe assets/sfx/${nombre}.wav (corré node build/sonidos.mjs "<ffmpeg>")`);
  return r3((statSync(ruta).size - 44) / 96000); // 48 kHz mono 16 bits
};

// una franja de pistas por escena (escN -> N*100) para que el lint no vea solapes entre escenas distintas; hud aparte
const franja = (comp) => { const m = /^esc(\d+)$/.exec(comp); return m ? parseInt(m[1], 10) * 100 : 5000; };
let total = 0;
for (const [comp, lista] of Object.entries(S)) {
  if (comp.startsWith("_")) continue;
  const tags = [];
  let n = 0;
  for (const e of lista) {
    const reps = e.n || 1;
    for (let k = 0; k < reps; k++) {
      n++;
      const t = r3(e.t + k * (e.cada || 0));
      const d = e.d != null ? e.d : duracion(e.s);
      tags.push(`    <audio id="${comp}-a${String(n).padStart(2, "0")}" class="clip" src="assets/sfx/${e.s}.wav" data-start="${t}" data-duration="${d}" data-track-index="${franja(comp) + n}" data-volume="${e.v}" data-hf-media-start-basis="local"></audio>`);
    }
  }
  const bloque = `    <!-- SONIDO:INICIO (generado por build/colocar-sonidos.mjs) -->\n${tags.join("\n")}\n    <!-- SONIDO:FIN -->`;
  const ruta = join(raiz, "compositions", comp + ".html");
  let html = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
  const a = html.indexOf("<!-- SONIDO:INICIO"), b = html.indexOf("<!-- SONIDO:FIN -->");
  if (a >= 0 && b > a) {
    const ini = html.lastIndexOf("\n", a) + 1; // empieza al principio del renglón de la marca
    html = html.slice(0, ini) + bloque + html.slice(b + "<!-- SONIDO:FIN -->".length);
  } else {
    const m = /<div id="root"[^>]*>\n/.exec(html);
    if (!m) throw new Error("no encontré el div #root en " + comp);
    const pos = m.index + m[0].length;
    html = html.slice(0, pos) + bloque + "\n" + html.slice(pos);
  }
  writeFileSync(ruta, html, "utf8");
  total += tags.length;
  console.log(`${comp}: ${tags.length} sonidos`);
}
console.log("total", total);
