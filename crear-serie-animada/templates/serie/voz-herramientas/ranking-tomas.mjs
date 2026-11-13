// Ranking OBJETIVO de las tomas de voz: texto correcto (Whisper), dinámica del tono y ritmo. No escucha nada.
// Sirve para preseleccionar; la última palabra la tiene el oído de quien usa la voz (si no se puede oír, decirlo).
//
// Uso:  node voz-herramientas/ranking-tomas.mjs <carpeta-de-análisis> <archivo de líneas .json>
//   (la carpeta de análisis sale de analizar-tomas.mjs: tiene metricas.json y whisper/)
// Las tomas se llaman <id-de-línea>-<sin|con>-t<N>.mp3 (como las deja tts-eleven/generar.mjs).
//
// Puntos por toma = 3 x parecido del texto con lo esperado
//                 + dinámica del tono (rango en semitonos / 14, tope 1, + 0,5 x desvío / 5)
//                 + ritmo (0,5 si habla entre 2,6 y 4,2 palabras/s)
//                 + 0,5 x (duración de la más corta / duración de la toma)   -> premia lo rápido
// Lección de la serie: la voz tiene que ser DINÁMICA (sube y baja, remata en la palabra clave), no lenta y grave.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const [dir, archLineas] = process.argv.slice(2);
if (!dir || !archLineas) { console.error("Uso: node voz-herramientas/ranking-tomas.mjs <carpeta-de-análisis> <líneas.json>"); process.exit(1); }
const lineas = JSON.parse(readFileSync(archLineas, "utf8"));
const met = JSON.parse(readFileSync(join(dir, "metricas.json"), "utf8"));
const wdir = join(dir, "whisper");

// números a palabras (0 a 999), para que "29" y "veintinueve" cuenten como lo mismo
const U = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidos", "veintitres", "veinticuatro", "veinticinco", "veintiseis", "veintisiete", "veintiocho", "veintinueve"];
const D = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const C = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
const numPal = (n) => (n < 30 ? U[n] : n < 100 ? (n % 10 ? `${D[Math.floor(n / 10)]} y ${U[n % 10]}` : D[Math.floor(n / 10)]) : n === 100 ? "cien" : n < 1000 ? `${C[Math.floor(n / 100)]}${n % 100 ? " " + numPal(n % 100) : ""}` : String(n));
function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\[[^\]]*\]/g, " ")
    .replace(/[^a-z0-9ñ ]/g, " ").split(/\s+/).filter(Boolean).flatMap((w) => (/^\d+$/.test(w) ? numPal(parseInt(w, 10)).split(" ") : [w]));
}
function lev(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

const filas = [];
for (const [archivo, m] of Object.entries(met)) {
  const mt = /^(.+)-(sin|con)-t(\d+)\.mp3$/.exec(archivo);
  if (!mt) continue;
  const [, id, v, t] = mt;
  const l = lineas.find((x) => x.id === id);
  if (!l) continue;
  let j;
  try { j = JSON.parse(readFileSync(join(wdir, archivo.replace(/\.mp3$/, ".json")), "utf8")); } catch { continue; }
  const pal = j.segments.flatMap((s) => s.words || []);
  const texto = pal.map((w) => w.word).join(" ");
  const esperado = norm(l.sin), hablado = norm(texto);
  const sim = 1 - lev(esperado, hablado) / Math.max(esperado.length, hablado.length, 1);
  const ini = pal.length ? pal[0].start : 0, fin = pal.length ? pal[pal.length - 1].end : 0;
  const vel = pal.length / Math.max(0.3, fin - ini);
  filas.push({ id, nombre: archivo.replace(/\.mp3$/, ""), v, t, dur: m.dur_real, sim, vel, rango: m.f0_rango_semitonos, desv: m.f0_desvio_semitonos, mediana: m.f0_mediana_Hz, ini, fin, texto: texto.trim() });
}
for (const l of lineas) {
  const g = filas.filter((f) => f.id === l.id);
  if (!g.length) { console.log(`\n== ${l.id}: sin tomas analizadas`); continue; }
  const durMin = Math.min(...g.map((f) => f.dur));
  for (const f of g) {
    const dina = Math.min((f.rango || 0) / 14, 1) + 0.5 * Math.min((f.desv || 0) / 5, 1);
    const ritmo = f.vel >= 2.6 && f.vel <= 4.2 ? 0.5 : 0.5 - Math.min(Math.abs(f.vel - 3.4) / 3, 0.5);
    f.puntos = 3 * f.sim + dina + ritmo + 0.5 * (durMin / f.dur);
  }
  g.sort((a, b) => b.puntos - a.puntos);
  console.log(`\n== ${l.id}  (esperado: ${l.sin.slice(0, 60)}${l.sin.length > 60 ? "..." : ""})`);
  for (const f of g) console.log(`  ${f === g[0] ? "★" : " "} ${f.nombre.padEnd(28)} pts ${f.puntos.toFixed(2)} | texto ${(f.sim * 100).toFixed(0)}% | ${f.dur.toFixed(2)} s | ${f.vel.toFixed(1)} pal/s | tono ${f.mediana} Hz, rango ${f.rango} st, desvío ${f.desv} | voz de ${f.ini.toFixed(2)} a ${f.fin.toFixed(2)}`);
  if (g[0].sim < 0.9) console.log(`     OJO transcripción de la primera: "${g[0].texto}" (Whisper puede equivocarse con números y nombres propios; revisar a mano)`);
}
console.log("\nRanking objetivo (Whisper + tono + ritmo). NO es de oído: lo tiene que oír una persona antes de dar la toma por buena.");
