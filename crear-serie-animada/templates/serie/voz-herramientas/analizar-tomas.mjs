// Analiza las tomas de voz de una carpeta: transcribe cada una con Whisper (texto + palabras) y mide el tono, el ritmo y las pausas.
// Todo local (ffmpeg + Whisper + numpy), sin red. Es incremental: lo que ya está analizado se saltea.
//
// Uso (desde la carpeta de la serie):
//   node voz-herramientas/analizar-tomas.mjs "<ffmpeg.exe>" "<python del venv con whisper>" Guiones/voces/ep-01-eleven voz-herramientas/analisis-ep-01
// Salida: <salida>/whisper/<toma>.json y <salida>/metricas.json
// Después: node voz-herramientas/ranking-tomas.mjs <salida> tts-eleven/lineas-ep-01.json
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const [ffmpeg, python, carpeta, salida] = process.argv.slice(2);
if (!ffmpeg || !python || !carpeta || !salida) { console.error('Uso: node voz-herramientas/analizar-tomas.mjs "<ffmpeg.exe>" "<python.exe>" <carpeta-de-tomas> <carpeta-de-salida>'); process.exit(1); }
const tomas = readdirSync(resolve(carpeta)).filter((f) => f.toLowerCase().endsWith(".mp3")).sort();
if (!tomas.length) { console.error("No hay .mp3 en " + carpeta); process.exit(1); }
const wdir = join(resolve(salida), "whisper");
mkdirSync(wdir, { recursive: true });

// 1) Whisper por palabra, solo las tomas que faltan
const pendientes = tomas.filter((f) => !existsSync(join(wdir, f.replace(/\.mp3$/i, ".json"))));
if (pendientes.length) {
  console.log(`Whisper sobre ${pendientes.length} toma(s) (tarda un rato)...`);
  const sep = process.platform === "win32" ? ";" : ":";
  const env = { ...process.env, PATH: dirname(ffmpeg) + sep + process.env.PATH, HF_HUB_OFFLINE: "1", DO_NOT_TRACK: "1" };
  execFileSync(python, ["-I", "-m", "whisper", ...pendientes.map((f) => join(resolve(carpeta), f)), "--model", "small", "--language", "es", "--fp16", "False", "--word_timestamps", "True", "--output_format", "json", "--output_dir", wdir, "--verbose", "False"], { env, stdio: ["ignore", "ignore", "inherit"] });
} else console.log("Whisper: todas las tomas ya estaban transcriptas.");

// 2) métricas de tono / ritmo / pausas (medir_varios.py)
console.log("Midiendo tono y ritmo...");
execFileSync(python, ["-I", join(aqui, "medir_varios.py"), ffmpeg, join(resolve(salida), "metricas.json"), ...tomas.map((f) => join(resolve(carpeta), f))], { stdio: "inherit" });
console.log("Listo. Siguiente: node voz-herramientas/ranking-tomas.mjs " + salida + " <archivo de líneas .json>");
