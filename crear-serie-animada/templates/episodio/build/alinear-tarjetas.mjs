// Calcula los tiempos de cada tarjeta de subtítulo a partir de las palabras de Whisper (build/voz-palabras.json)
// y los escribe en build/tiempos.json (t0 / t1 relativos al audio de cada voz, y la duración de cada voz).
// Cada voz de tiempos.json dice a qué línea de voz-palabras.json corresponde con el campo "linea".
// Uso:  node build/alinear-tarjetas.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(raiz, "build", "tiempos.json"), "utf8"));
const P = JSON.parse(readFileSync(join(raiz, "build", "voz-palabras.json"), "utf8"));
const r3 = (x) => Math.round(x * 1000) / 1000;

// números a palabras (0 a 999.999): el guion escribe "29" y Whisper a veces escribe "veintinueve" (o al revés)
const U = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidos", "veintitres", "veinticuatro", "veinticinco", "veintiseis", "veintisiete", "veintiocho", "veintinueve"];
const D = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const C = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
function palabrasDe(n) {
  if (n < 30) return U[n];
  if (n < 100) { const u = n % 10; return u ? `${D[Math.floor(n / 10)]} y ${U[u]}` : D[Math.floor(n / 10)]; }
  if (n === 100) return "cien";
  if (n < 1000) { const r = n % 100; return r ? `${C[Math.floor(n / 100)]} ${palabrasDe(r)}` : C[Math.floor(n / 100)]; }
  if (n < 1000000) { const m = Math.floor(n / 1000), r = n % 1000, pre = m === 1 ? "mil" : `${palabrasDe(m)} mil`; return r ? `${pre} ${palabrasDe(r)}` : pre; }
  return String(n);
}
// una palabra del guion o de Whisper -> lista de "tokens" normalizados (sin tildes ni signos; los números se deletrean)
const sinTildes = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function tokens(s) {
  const limpio = sinTildes(s).replace(/[^a-z0-9ñ]/g, "");
  if (!limpio) return [];
  if (/^\d+$/.test(limpio)) return sinTildes(palabrasDe(parseInt(limpio, 10))).split(" ");
  return [limpio];
}

// alineación global entre tokens del guion (a) y de Whisper (b); devuelve para cada a[i] el índice en b, o -1
function alinear(a, b) {
  const m = a.length, n = b.length, INF = 1e9;
  const d = Array.from({ length: m + 1 }, () => Array(n + 1).fill(INF));
  const f = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  d[0][0] = 0;
  for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
    if (i < m && d[i][j] + 1 < d[i + 1][j]) { d[i + 1][j] = d[i][j] + 1; f[i + 1][j] = 1; }
    if (j < n && d[i][j] + 1 < d[i][j + 1]) { d[i][j + 1] = d[i][j] + 1; f[i][j + 1] = 2; }
    if (i < m && j < n) {
      const c = a[i] === b[j] ? 0 : (a[i].startsWith(b[j].slice(0, 3)) || b[j].startsWith(a[i].slice(0, 3)) ? 0.4 : 1.4);
      if (d[i][j] + c < d[i + 1][j + 1]) { d[i + 1][j + 1] = d[i][j] + c; f[i + 1][j + 1] = 3; }
    }
  }
  const mapa = Array(m).fill(-1);
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const p = f[i][j];
    if (p === 3) { mapa[i - 1] = j - 1; i--; j--; } else if (p === 1) { i--; } else { j--; }
  }
  return mapa;
}

for (const v of T.voces) {
  const linea = P[v.linea];
  if (!linea) { console.log(`(sin voz nueva para ${v.id} -> "${v.linea}": se deja como estaba)`); continue; }
  v.dur = linea.dur;
  const tarjetas = T.tarjetas.filter((t) => t.voz === v.id);
  // palabras del guion en orden, cada una con sus tokens
  const guionPal = tarjetas.flatMap((t, k) => t.pal.map((p) => ({ k, tok: tokens(p[0]) })));
  const gTok = guionPal.flatMap((g, w) => g.tok.map((x) => ({ w, x })));
  const hTok = linea.palabras.flatMap((p, h) => tokens(p.t).map((x) => ({ h, x })));
  const mapa = alinear(gTok.map((g) => g.x), hTok.map((h) => h.x));
  // tiempo de inicio / fin de cada token del guion (si no calzó, se interpola con el vecino)
  const iniT = gTok.map((_, i) => (mapa[i] >= 0 ? linea.palabras[hTok[mapa[i]].h].ini : null));
  const finT = gTok.map((_, i) => (mapa[i] >= 0 ? linea.palabras[hTok[mapa[i]].h].fin : null));
  for (let i = 0; i < iniT.length; i++) if (iniT[i] == null) {
    let a = i - 1; while (a >= 0 && iniT[a] == null) a--;
    let b = i + 1; while (b < iniT.length && iniT[b] == null) b++;
    iniT[i] = a >= 0 ? finT[a] : 0; finT[i] = b < iniT.length ? iniT[b] : linea.dur;
  }
  // tiempos por palabra del guion (primer y último token); una palabra sin tokens (un guion largo "—") hereda la vecina
  const ini = guionPal.map((g, w) => { const i = gTok.findIndex((x) => x.w === w); return i >= 0 ? iniT[i] : null; });
  const fin = guionPal.map((g, w) => { let i = -1; gTok.forEach((x, n) => { if (x.w === w) i = n; }); return i >= 0 ? finT[i] : null; });
  for (let w = 0; w < ini.length; w++) if (ini[w] == null) { ini[w] = w > 0 ? fin[w - 1] : 0; fin[w] = ini[w]; }
  tarjetas.forEach((t, k) => {
    if (t.fijo) { console.log(`${v.id} #${k + 1}  ${t.t0.toFixed(2)}–${t.t1.toFixed(2)}  (fijo)  ${t.pal.map((p) => p[0]).join(" ")}`); return; }
    const idx = guionPal.map((g, w) => (g.k === k ? w : -1)).filter((w) => w >= 0);
    t.t0 = r3(k === 0 ? 0 : ini[idx[0]]);
    const ultima = k === tarjetas.length - 1;
    const sig = ultima ? null : ini[guionPal.findIndex((g) => g.k === k + 1)];
    // se cambia de tarjeta justo cuando arranca la siguiente; la última aguanta un poco más que su palabra final
    t.t1 = r3(ultima ? Math.max(fin[idx[idx.length - 1]] + 0.55, t.t0 + 0.9) : Math.max(sig, t.t0 + 0.35));
    console.log(`${v.id} #${k + 1}  ${t.t0.toFixed(2)}–${t.t1.toFixed(2)}  ${t.pal.map((p) => p[0]).join(" ")}`);
  });
}
// escritura compacta: una voz o una tarjeta por renglón, para poder leerlo y editarlo a mano
const pal = (p) => "[" + p.map((x) => "[" + x.map((s) => JSON.stringify(s)).join(", ") + "]").join(", ") + "]";
const salida = [
  "{",
  `  "_nota": ${JSON.stringify(T._nota)},`,
  '  "voces": [',
  T.voces.map((v) => `    { "id": "${v.id}", "linea": "${v.linea}", "archivo": "${v.archivo}", "inicio": ${v.inicio}, "dur": ${v.dur} }`).join(",\n"),
  "  ],",
  '  "tarjetas": [',
  T.tarjetas.map((t) => `    { "voz": "${t.voz}", "t0": ${t.t0}, "t1": ${t.t1},${t.punch ? ' "punch": true,' : ""}${t.fijo ? ' "fijo": true,' : ""} "pal": ${pal(t.pal)} }`).join(",\n"),
  "  ]",
  "}",
  "",
].join("\n");
writeFileSync(join(raiz, "build", "tiempos.json"), salida, "utf8");
console.log("tiempos.json actualizado. Siguiente: ajustar 'inicio' de cada voz y las escenas (build/escenas.json), y correr build/armar-index.mjs, build/generar-subtitulos.mjs");
