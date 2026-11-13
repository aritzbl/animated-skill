// Genera assets/personaje-markup.js a partir de rig/personaje.svg (una sola fuente de verdad).
// Uso (desde la carpeta personaje): node rig/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(aqui, "personaje.svg"), "utf8").trim();
const salida = join(aqui, "..", "assets", "personaje-markup.js");
const cuerpo =
  "// GENERADO por rig/build.mjs a partir de rig/personaje.svg. No editar a mano.\n" +
  "window.PERSONAJE_MARKUP = " + JSON.stringify(svg) + ";\n";
writeFileSync(salida, cuerpo, "utf8");
console.log("OK", salida, svg.length, "caracteres");
