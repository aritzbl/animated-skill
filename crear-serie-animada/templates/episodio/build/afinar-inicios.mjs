// Afina el inicio de cada palabra con la energía real del audio.
// Por qué: Whisper a veces marca una palabra 0,2 a 0,5 s ANTES de que se oiga, sobre todo después de una pausa, y a veces
// inventa una palabra al final. Con la energía del audio (RMS cada 10 ms) se mueve el inicio a donde de verdad hay voz
// y se avisa de las palabras que caen en silencio (candidatas a ser inventadas).
//
// Uso (desde la carpeta del episodio):
//   node build/afinar-inicios.mjs "<ruta a ffmpeg.exe>"            # solo informa, no cambia nada
//   node build/afinar-inicios.mjs "<ruta a ffmpeg.exe>" --aplicar  # cambia voz-palabras.json / assets/voz-palabras.js
//                                                                    y lo anota en build/correcciones-voz.json
//                                                                    (así sobrevive a la próxima importación)
// Es una heurística: mirá el informe antes de aplicar. Las palabras "sin energía" NO se borran solas:
// si es una palabra inventada, agregala a "quitar" en build/correcciones-voz.json.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ffmpeg = process.argv[2];
const aplicar = process.argv.includes("--aplicar");
if (!ffmpeg || ffmpeg.startsWith("--")) { console.error('Uso: node build/afinar-inicios.mjs "<ffmpeg.exe>" [--aplicar]'); process.exit(1); }

const SR = 16000, PASO = 0.01;                 // ventana de 10 ms
const P = JSON.parse(readFileSync(join(raiz, "build", "voz-palabras.json"), "utf8"));
const archCorr = join(raiz, "build", "correcciones-voz.json");
const corr = existsSync(archCorr) ? JSON.parse(readFileSync(archCorr, "utf8")) : {};

function rmsCuadros(ruta) {
  const buf = execFileSync(ffmpeg, ["-v", "error", "-i", ruta, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  const f = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  const n = Math.floor(f.length / (SR * PASO)), out = new Array(n);
  for (let i = 0; i < n; i++) { let s = 0; const a = i * SR * PASO; for (let k = 0; k < SR * PASO; k++) s += f[a + k] * f[a + k]; out[i] = Math.sqrt(s / (SR * PASO)); }
  return out;
}
const cuantil = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

let cambios = 0, sospechosas = 0;
for (const [id, linea] of Object.entries(P)) {
  const ruta = join(raiz, "assets", "voz", id + ".mp3");
  if (!existsSync(ruta)) { console.log(`(sin audio para ${id})`); continue; }
  const r = rmsCuadros(ruta), umbral = cuantil(r, 0.9) * 0.1;      // 20 dB por debajo de la voz fuerte
  const visto = {};
  linea.palabras.forEach((w, i) => {
    visto[w.t] = (visto[w.t] || 0) + 1;
    const clave = visto[w.t] > 1 ? `${w.t}#${visto[w.t]}` : w.t;
    const a = Math.max(0, Math.floor(w.ini / PASO)), b = Math.min(r.length, Math.ceil(w.fin / PASO));
    let k = -1;
    for (let q = a; q + 2 < b; q++) if (r[q] > umbral && r[q + 1] > umbral && r[q + 2] > umbral) { k = q; break; }   // 30 ms seguidos con voz
    if (k < 0) { sospechosas++; console.log(`  ?? ${id}: "${w.t}" [${w.ini}-${w.fin}] no tiene energía de voz (¿inventada por Whisper?). Si sobra: "quitar": ["${w.t.replace(/[.,;:!?¿¡]/g, "")}"] en build/correcciones-voz.json`); return; }
    const nuevo = +Math.max(0, k * PASO - 0.03).toFixed(3);          // 30 ms de adelanto para que la boca y la tarjeta lleguen justo
    if (nuevo - w.ini >= 0.06 && nuevo < w.fin - 0.04) {
      console.log(`  ${id}: "${w.t}" ${w.ini} -> ${nuevo}  (+${(nuevo - w.ini).toFixed(2)} s)`);
      cambios++;
      if (aplicar) {
        w.ini_whisper = w.ini; w.ini = nuevo;
        corr[id] = corr[id] || {}; corr[id].ini = corr[id].ini || {}; corr[id].ini[clave] = nuevo;
      }
    }
  });
}
console.log(`${cambios} inicio(s) para mover, ${sospechosas} palabra(s) sin energía.`);
if (aplicar) {
  writeFileSync(join(raiz, "build", "voz-palabras.json"), JSON.stringify(P, null, 1), "utf8");
  const paraEscenas = Object.fromEntries(Object.entries(P).map(([id, l]) => [id, { dur: l.dur, p: l.palabras.map((p) => [p.ini, p.fin]) }]));
  writeFileSync(join(raiz, "assets", "voz-palabras.js"), "// GENERADO por build/importar-voces.mjs. No editar a mano.\nwindow.VOZ_PALABRAS = " + JSON.stringify(paraEscenas) + ";\n", "utf8");
  writeFileSync(archCorr, JSON.stringify(corr, null, 1), "utf8");
  console.log("Aplicado. Siguiente: node build/alinear-tarjetas.mjs");
} else if (cambios) console.log("No se cambió nada (falta --aplicar).");
