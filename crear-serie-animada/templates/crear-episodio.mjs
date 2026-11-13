// Crea la carpeta de un episodio nuevo dentro de una serie, a partir de templates/episodio y del rig de <serie>/personaje.
// Uso:
//   node crear-episodio.mjs --serie <carpeta de la serie> --numero 02 [--desde episodio-01]
//     --desde: reusa del episodio anterior el HUD (compositions/hud.html) y los efectos ya sintetizados (assets/sfx); el resto sale de la plantilla.
// Qué hace: copia episodio/ de la plantilla, copia a assets/ el rig (personaje.js, personaje.css, personaje-markup.js) y las fuentes
// de <serie>/personaje/assets, y reemplaza {{NN}} y {{FECHA}}. No instala ni descarga nada, no escribe fuera de <serie>.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const o = {};
for (let i = 2; i < process.argv.length; i += 2) {
  if (!process.argv[i].startsWith("--")) { console.error("argumento raro: " + process.argv[i]); process.exit(1); }
  o[process.argv[i].slice(2)] = process.argv[i + 1];
}
const fallar = (m) => { console.error("ERROR: " + m); process.exit(1); };
if (!o.serie || !o.numero) fallar("Uso: node crear-episodio.mjs --serie <carpeta de la serie> --numero 02 [--desde episodio-01]");
const serie = resolve(o.serie);
if (/onedrive/i.test(serie)) fallar("La carpeta de la serie está dentro de OneDrive: esta serie se trabaja fuera de OneDrive (ver references/08-seguridad-y-reglas.md).");
const nn = String(o.numero).padStart(2, "0");
const destino = join(serie, "episodio-" + nn);
if (existsSync(destino)) fallar(destino + " ya existe: no se pisa. Elegí otro número.");
const rig = join(serie, "personaje", "assets");
if (!existsSync(join(rig, "personaje.js"))) fallar("No encuentro " + join(rig, "personaje.js") + ": --serie tiene que ser la carpeta de la serie (la que tiene personaje/).");

cpSync(join(aqui, "episodio"), destino, { recursive: true });
mkdirSync(join(destino, "assets", "fonts"), { recursive: true });
// el rig y las fuentes de la serie (copia: cada episodio queda congelado con el rig que tenía cuando se hizo)
for (const f of ["personaje.js", "personaje.css", "personaje-markup.js"]) cpSync(join(rig, f), join(destino, "assets", f));
cpSync(join(rig, "fonts"), join(destino, "assets", "fonts"), { recursive: true });
// carpetas de trabajo
for (const d of ["assets/voz", "assets/sfx", "renders"]) mkdirSync(join(destino, d), { recursive: true });

if (o.desde) {
  const prev = join(serie, o.desde);
  if (!existsSync(prev)) fallar("No existe " + prev);
  if (existsSync(join(prev, "compositions", "hud.html"))) cpSync(join(prev, "compositions", "hud.html"), join(destino, "compositions", "hud.html"));
  if (existsSync(join(prev, "assets", "sfx"))) cpSync(join(prev, "assets", "sfx"), join(destino, "assets", "sfx"), { recursive: true });
  console.log("Reusado de " + o.desde + ": hud.html y assets/sfx (revisá la configuración del HUD: días, barra y cartel).");
}

// placeholders en archivos de texto
const fecha = new Date().toISOString();
(function recorrer(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { recorrer(p); continue; }
    if (!/\.(md|json|html)$/i.test(n)) continue;
    const t = readFileSync(p, "utf8");
    if (t.includes("{{NN}}") || t.includes("{{FECHA}}")) writeFileSync(p, t.split("{{NN}}").join(nn).split("{{FECHA}}").join(fecha), "utf8");
  }
})(destino);
console.log("Episodio creado en " + destino);
console.log("Siguiente (desde esa carpeta): node build/sonidos.mjs \"<ffmpeg.exe>\"  y  node build/armar-index.mjs  (ver LEEME.md del episodio)");
