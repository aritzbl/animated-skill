// Trae las voces elegidas al episodio: recorta los silencios de los bordes, nivela el volumen a -16 LUFS,
// las guarda en assets/voz/ y saca el tiempo de cada palabra con Whisper (build/voz-palabras.json).
// Después aplica build/correcciones-voz.json (arreglos manuales que sobreviven a cada reimportación) y escribe
// assets/voz-palabras.js (lo lee Hab.hablaLinea para mover la boca sin copiar números a mano).
//
// Uso (desde la carpeta del episodio):
//   node build/importar-voces.mjs "<ruta a ffmpeg.exe>" "<ruta al python del venv con whisper>"
//
// Entrada:  build/tomas-elegidas.json  { "_carpeta": "ep-01-guia", "01-gancho": "01-gancho-con-t2", ... }
//           las tomas viven en <serie>/Guiones/voces/<_carpeta>/<toma>.mp3
// Salida:   assets/voz/<línea>.mp3, build/voz-palabras.json, assets/voz-palabras.js
// Todo es local: ffmpeg y Whisper corren en esta máquina, sin red (HF_HUB_OFFLINE=1, DO_NOT_TRACK=1).
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ffmpeg = process.argv[2], python = process.argv[3];
if (!ffmpeg || !python) { console.error('Uso: node build/importar-voces.mjs "<ffmpeg.exe>" "<python.exe>"'); process.exit(1); }
const elegidas = JSON.parse(readFileSync(join(raiz, "build", "tomas-elegidas.json"), "utf8"));
if (!elegidas._carpeta) { console.error('Falta "_carpeta" en build/tomas-elegidas.json (subcarpeta de Guiones/voces/ con las tomas).'); process.exit(1); }
const carpetaTomas = resolve(raiz, "..", "Guiones", "voces", elegidas._carpeta);
const destino = join(raiz, "assets", "voz");
const tmp = join(raiz, "build", "whisper");
mkdirSync(destino, { recursive: true });
mkdirSync(tmp, { recursive: true });

const OBJETIVO_LUFS = -16;
const BORDES = "silenceremove=start_periods=1:start_duration=0:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-48dB,areverse";
const run = (args) => execFileSync(ffmpeg, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const stderrDe = (args) => spawnSync(ffmpeg, args, { encoding: "utf8" }).stderr || "";   // ffmpeg escribe su informe en stderr

const resultado = {};
for (const [id, toma] of Object.entries(elegidas)) {
  if (id.startsWith("_")) continue;
  const directa = join(carpetaTomas, id + ".mp3");
  const origen = existsSync(directa) ? directa : join(carpetaTomas, toma + ".mp3");
  if (!existsSync(origen)) { console.error(`NO EXISTE ${origen}`); process.exit(1); }
  // 1) recortar bordes y medir
  const limpio = join(tmp, id + "-limpio.wav");
  run(["-v", "error", "-y", "-i", origen, "-af", BORDES, "-ac", "1", "-ar", "44100", limpio]);
  const med = stderrDe(["-hide_banner", "-nostats", "-i", limpio, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  let m = [...med.matchAll(/\bI:\s+(-?[\d.]+) LUFS/g)].pop();
  let lufs = m ? parseFloat(m[1]) : OBJETIVO_LUFS;
  if (lufs < -60) {
    // ebur128 necesita al menos 0,4 s: en una línea más corta mide -70. Se repite rellenando con silencio (medida aproximada).
    const med2 = stderrDe(["-hide_banner", "-nostats", "-i", limpio, "-af", "apad=whole_dur=1.2,ebur128=peak=true", "-f", "null", "-"]);
    m = [...med2.matchAll(/\bI:\s+(-?[\d.]+) LUFS/g)].pop();
    lufs = m && parseFloat(m[1]) > -60 ? parseFloat(m[1]) + 3 : OBJETIVO_LUFS;   // +3 dB: el relleno diluye la medida
    console.log("    (línea muy corta: medida con relleno de silencio, aproximada)");
  }
  // 2) compresor suave (baja los picos sin recortar), ganancia a -16 LUFS y guardar.
  //    Antes se usaba ganancia + alimiter=limit=0.9: con tomas de ElevenLabs de nivel bajo (RMS -20 dB) la ganancia
  //    llevaba los picos a 0 dBFS, el limitador trabajaba a fondo y la voz salía con clics y asperezas (Día 3, 2026-11-12).
  //    Ahora el pico final queda siempre en -1,5 dBFS o menos y no hace falta limitador.
  const comprimido = join(tmp, id + "-comp.wav");
  run(["-v", "error", "-y", "-i", limpio, "-af", "acompressor=threshold=0.18:ratio=3:attack=4:release=60:knee=4:makeup=1", "-ac", "1", "-ar", "44100", comprimido]);
  const med3 = stderrDe(["-hide_banner", "-nostats", "-i", comprimido, "-af", "apad=whole_dur=1.2,ebur128=peak=true", "-f", "null", "-"]);
  const mp = [...med3.matchAll(/\bPeak:\s+(-?[\d.]+) dBFS/g)].pop();
  const picoComp = mp ? parseFloat(mp[1]) : 0;
  // la ganancia se calcula con la sonoridad DESPUÉS del compresor (en las líneas cortas y fuertes, como las de la mamá, baja varios dB) y no deja pasar de -1,5 dBFS
  const medC = stderrDe(["-hide_banner", "-nostats", "-i", comprimido, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const mc = [...medC.matchAll(/\bI:\s+(-?[\d.]+) LUFS/g)].pop();
  let lufsC = mc ? parseFloat(mc[1]) : lufs;
  if (lufsC < -60) {   // línea de menos de 0,4 s: se mide rellenando con silencio (aproximado, +3 dB)
    const mc2 = [...stderrDe(["-hide_banner", "-nostats", "-i", comprimido, "-af", "apad=whole_dur=1.2,ebur128=peak=true", "-f", "null", "-"]).matchAll(/\bI:\s+(-?[\d.]+) LUFS/g)].pop();
    lufsC = mc2 && parseFloat(mc2[1]) > -60 ? parseFloat(mc2[1]) + 3 : lufs;
  }
  const ganancia = Math.max(-12, Math.min(18, Math.min(OBJETIVO_LUFS - lufsC, -1.5 - picoComp)));
  const final = join(destino, id + ".mp3");
  run(["-v", "error", "-y", "-i", comprimido, "-af", `volume=${ganancia.toFixed(2)}dB`, "-ac", "1", "-ar", "44100", "-b:a", "192k", final]);
  resultado[id] = { toma: existsSync(directa) ? id : toma, origen: origen.split(/[\\/]/).pop(), lufs_original: lufs, ganancia_dB: +ganancia.toFixed(2), pico_final_dBFS: +(picoComp + ganancia).toFixed(1) };
  console.log(`OK  ${id}  <- ${resultado[id].origen}  (${lufs.toFixed(1)} LUFS, ganancia ${ganancia.toFixed(1)} dB, pico ${(picoComp + ganancia).toFixed(1)} dBFS)`);
}

if (process.env.SIN_WHISPER) { console.log("SIN_WHISPER: solo se reescribieron los audios; build/voz-palabras.json queda como estaba."); process.exit(0); }
// 3) Whisper: tiempos por palabra de lo que quedó en assets/voz
const ids = Object.keys(resultado);
if (!ids.length) { console.error("No hay líneas en build/tomas-elegidas.json"); process.exit(1); }
const archivos = ids.map((id) => join(destino, id + ".mp3"));
const binFfmpeg = dirname(ffmpeg);
const sep = process.platform === "win32" ? ";" : ":";
const env = { ...process.env, PATH: binFfmpeg + sep + process.env.PATH, HF_HUB_OFFLINE: "1", DO_NOT_TRACK: "1" };
console.log("Whisper (tarda un rato)...");
execFileSync(python, ["-I", "-m", "whisper", ...archivos, "--model", "small", "--language", "es", "--fp16", "False", "--word_timestamps", "True", "--output_format", "json", "--output_dir", tmp, "--verbose", "False"], { env, stdio: ["ignore", "ignore", "ignore"] });

// correcciones manuales (build/correcciones-voz.json):
//   { "03-cierre": { "texto": "Limpio. Cortado.", "quitar": ["siglo"], "renombrar": { "Nombré": "Nombre" }, "ini": { "Cortado.": 1.02 } } }
//   quitar: palabras que Whisper inventó (se sacan las que coinciden, de atrás para adelante, una vez cada una)
//   renombrar: texto mal reconocido -> texto correcto (no cambia los tiempos)
//   ini: segundo en que realmente arranca esa palabra (si se repite, "palabra#2" para la segunda aparición)
let correcciones = {};
const archCorr = join(raiz, "build", "correcciones-voz.json");
if (existsSync(archCorr)) correcciones = JSON.parse(readFileSync(archCorr, "utf8"));
const palabras = {};
for (const id of ids) {
  const j = JSON.parse(readFileSync(join(tmp, id + ".json"), "utf8"));
  let pal = j.segments.flatMap((s) => s.words || []).map((w) => ({ t: w.word.trim(), ini: +w.start.toFixed(3), fin: +w.end.toFixed(3) }));
  let texto = j.text.trim();
  const c = correcciones[id];
  if (c) {
    for (const q of c.quitar || []) { const i = pal.map((p) => p.t.replace(/[.,;:!?¿¡]/g, "").toLowerCase()).lastIndexOf(q.toLowerCase()); if (i >= 0) pal.splice(i, 1); else console.log(`  (corrección: no encontré "${q}" para quitar en ${id})`); }
    for (const [de, a] of Object.entries(c.renombrar || {})) pal.forEach((p) => { if (p.t === de) p.t = a; });
    for (const [clave, seg] of Object.entries(c.ini || {})) {
      const [pt, n] = clave.split("#"); let k = 0;
      const i = pal.findIndex((p) => p.t === pt && ++k === (n ? +n : 1));
      if (i >= 0) pal[i].ini = seg; else console.log(`  (corrección: no encontré "${clave}" para ajustar el inicio en ${id})`);
    }
    texto = c.texto || pal.map((p) => p.t).join(" ");
  }
  const dur = +parseFloat(execFileSync(join(binFfmpeg, process.platform === "win32" ? "ffprobe.exe" : "ffprobe"), ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(destino, id + ".mp3")], { encoding: "utf8" })).toFixed(2);
  palabras[id] = { dur, texto, palabras: pal, ...resultado[id] };
  console.log(`${id}: ${dur} s | ${pal.map((p) => `${p.t}[${p.ini}-${p.fin}]`).join(" ")}`);
}
writeFileSync(join(raiz, "build", "voz-palabras.json"), JSON.stringify(palabras, null, 1), "utf8");
// el mismo contenido para las escenas (window.VOZ_PALABRAS): solo línea -> [[ini, fin], ...] y duración
const paraEscenas = Object.fromEntries(Object.entries(palabras).map(([id, l]) => [id, { dur: l.dur, p: l.palabras.map((p) => [p.ini, p.fin]) }]));
writeFileSync(join(raiz, "assets", "voz-palabras.js"), "// GENERADO por build/importar-voces.mjs. No editar a mano.\nwindow.VOZ_PALABRAS = " + JSON.stringify(paraEscenas) + ";\n", "utf8");
console.log("Guardado build/voz-palabras.json y assets/voz-palabras.js. Siguiente: node build/afinar-inicios.mjs (opcional) y node build/alinear-tarjetas.mjs");
