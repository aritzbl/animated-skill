// Crea la carpeta de una serie nueva a partir de templates/serie (y su primer episodio con crear-episodio.mjs).
// Uso:
//   node crear-serie.mjs --destino <carpeta nueva> --serie "Nombre de la serie" --cuenta @cuenta --personaje "Nombre"
//   (--sin-episodio para no crear episodio-01)
// La carpeta destino tiene que no existir o estar vacía, no puede estar en OneDrive, y conviene que esté dentro de
// C:\Users\nicol\Desktop\Proyectos\Animaciones (si no, avisa). No instala ni descarga NADA: después hay que
// (con permiso del usuario) instalar HyperFrames 0.9.30 con `npm ci` y, si hace falta Whisper, preparar el venv (ver references/05).
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const o = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith("--")) { console.error("argumento raro: " + a); process.exit(1); }
  if (a === "--sin-episodio") o["sin-episodio"] = true; else o[a.slice(2)] = process.argv[++i];
}
const fallar = (m) => { console.error("ERROR: " + m); process.exit(1); };
if (!o.destino || !o.serie || !o.cuenta || !o.personaje) fallar('Uso: node crear-serie.mjs --destino <carpeta> --serie "Nombre de la serie" --cuenta @cuenta --personaje "Nombre"');
const destino = resolve(o.destino);
if (/onedrive/i.test(destino)) fallar("El destino está dentro de OneDrive: las series se trabajan fuera de OneDrive.");
if (!/[\\/]Animaciones([\\/]|$)/i.test(destino)) console.warn("AVISO: el destino no está dentro de ...\\Animaciones. Las reglas de esta máquina piden trabajar solo ahí; confirmalo con el usuario.");
if (existsSync(destino) && readdirSync(destino).length) fallar(destino + " ya existe y no está vacía: no se pisa nada.");

const slug = o.serie.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "serie-animada";
const fecha = new Date().toISOString();
const reemplazos = { "{{SERIE}}": o.serie, "{{CUENTA}}": o.cuenta, "{{PERSONAJE}}": o.personaje, "{{FECHA}}": fecha, "{{SLUG}}": slug };

mkdirSync(destino, { recursive: true });
cpSync(join(aqui, "serie"), destino, { recursive: true });
for (const d of ["Guiones/voces", "Referencias", "Terminados"]) mkdirSync(join(destino, d), { recursive: true });

(function recorrer(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (n !== "fonts") recorrer(p); continue; }
    if (!/\.(md|json|html)$/i.test(n) || n === "package-lock.json") continue;
    let t = readFileSync(p, "utf8");
    for (const [k, v] of Object.entries(reemplazos)) t = t.split(k).join(v);
    writeFileSync(p, t, "utf8");
  }
})(destino);
// el lock conserva sus hashes: solo se le pone el nombre de la serie
const lockRuta = join(destino, "package-lock.json");
const lock = JSON.parse(readFileSync(lockRuta, "utf8"));
lock.name = slug; if (lock.packages && lock.packages[""]) lock.packages[""].name = slug;
writeFileSync(lockRuta, JSON.stringify(lock, null, 2) + "\n", "utf8");
// el markup del rig se regenera desde el SVG (por si el SVG de la plantilla se editó)
execFileSync(process.execPath, [join(destino, "personaje", "rig", "build.mjs")], { stdio: "inherit" });

console.log("Serie creada en " + destino);
if (!o["sin-episodio"]) execFileSync(process.execPath, [join(aqui, "crear-episodio.mjs"), "--serie", destino, "--numero", "01"], { stdio: "inherit" });
console.log(`
Siguiente:
  1. HyperFrames 0.9.30 (pedir permiso al usuario, una de dos):
     a) sin red: copiar la carpeta node_modules de una serie que ya lo tenga instalado (mismas versiones y hashes que el lock);
     b) con red: en ${destino} correr  npm ci  (instala solo lo que dice package-lock.json).
  2. Whisper: reusar el python de un venv existente (ruta en references/05-pipeline-produccion.md) o crear uno con requirements-pinned.txt (descarga paquetes: pedir permiso).
  3. Variables en cada terminal:  DO_NOT_TRACK=1 HYPERFRAMES_NO_AUTO_INSTALL=1 HYPERFRAMES_NO_UPDATE_CHECK=1
`);
