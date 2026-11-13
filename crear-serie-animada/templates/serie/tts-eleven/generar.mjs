// Genera tomas de la voz del personaje con la API de ElevenLabs y las deja en Guiones\voces\<episodio>-eleven\ (ej. ep-01-eleven).
//
// La clave y los IDs de voz se leen de un archivo .env (en la raíz del proyecto o en tts-eleven/; copiá .env.example a .env y completalo)
// o, si preferís, de variables de entorno de la terminal (las de la terminal tienen prioridad). Nunca por argumento, para que no queden
// en el historial, y el script NUNCA imprime los valores. No manda nada a ningún otro lado que no sea api.elevenlabs.io.
//
//   .env:   ELEVENLABS_API_KEY=...   ELEVENLABS_VOICE_ID=...   ELEVENLABS_VOICE_ID_MAMA=...
//   (o en la terminal: $env:ELEVENLABS_API_KEY = "..."  solo vale en esa ventana)
//   node tts-eleven/generar.mjs --lineas lineas-ep-01.json --probar    # no manda nada: muestra qué mandaría y cuántos caracteres gasta
//   node tts-eleven/generar.mjs --lineas lineas-ep-01.json --tomas 2  # genera 2 tomas por línea y por variante (sin y con etiquetas)
//   node tts-eleven/generar.mjs --lineas lineas-ep-01.json --elegir 01-gancho-con-t2,02-voto-sin-t1   # copia las elegidas como 01-gancho.mp3, etc.
//
// Opciones: --modelo (eleven_v3 por defecto) --variantes sin,con --solo 01-gancho,05-voto --tomas N
//           --stability 0.35 --similitud 0.75 --estilo 0.45 --velocidad 1.1 --sin-ajustes --salida <carpeta>
//           --formato mp3_44100_128 --forzar --base https://api.elevenlabs.io
//           --lineas lineas-ep-02.json   (archivo de líneas del episodio; las tomas salen a Guiones\voces\ep-02-eleven\; por defecto lineas-ep-01.json)
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const proyecto = resolve(aqui, "..");

// ---- .env: se busca en tts-eleven/ y en la raíz del proyecto. Lo que ya esté en el entorno de la terminal no se pisa; los valores vacíos se ignoran.
for (const dir of [aqui, proyecto]) {
  const f = join(dir, ".env");
  if (!existsSync(f)) continue;
  for (const linea of readFileSync(f, "utf8").split(/\r?\n/)) {
    if (linea.trim().startsWith("#")) continue;
    const m = linea.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1); else v = v.replace(/\s+#.*$/, "");
    if (v && process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

// ---- argumentos
const BANDERAS = new Set(["probar", "forzar", "sin-ajustes"]);
const o = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith("--")) fallar(`argumento raro: ${a}`);
  const k = a.slice(2);
  if (BANDERAS.has(k)) o[k] = true;
  else o[k] = process.argv[++i];
}
function fallar(msg) { console.error("ERROR: " + msg); process.exit(1); }

const modelo = o.modelo || "eleven_v3";
const usaEtiquetas = /^eleven_v[34]/.test(modelo);
const variantes = (o.variantes || (usaEtiquetas ? "sin,con" : "sin")).split(",");
const tomas = parseInt(o.tomas || "2", 10);
const solo = o.solo ? new Set(o.solo.split(",")) : null;
// archivo de líneas del episodio (por defecto el 01) y carpeta de salida que sale de su nombre: lineas-ep-02.json -> ep-02-eleven
const archivoLineas = o.lineas || "lineas-ep-01.json";
const nombreEp = archivoLineas.replace(/^lineas-/, "").replace(/\.json$/, "");
const salida = resolve(o.salida || join(proyecto, "Guiones", "voces", nombreEp + "-eleven"));
const formato = o.formato || "mp3_44100_128";
const base = (o.base || "https://api.elevenlabs.io").replace(/\/$/, "");
mkdirSync(salida, { recursive: true });

// ---- elegir: copia las tomas elegidas con el nombre que usa el episodio
if (o.elegir) {
  for (const n of o.elegir.split(",")) {
    const origen = join(salida, n + ".mp3");
    if (!existsSync(origen)) fallar(`no existe ${origen}`);
    const destino = join(salida, n.replace(/-(sin|con)-t\d+$/, "") + ".mp3");
    copyFileSync(origen, destino);
    console.log(`OK  ${n}.mp3 -> ${destino.split(/[\\/]/).pop()}`);
  }
  process.exit(0);
}

// ---- qué se va a generar
const lineas = JSON.parse(readFileSync(join(aqui, archivoLineas), "utf8")).filter((l) => !solo || solo.has(l.id));
if (!lineas.length) fallar("ninguna línea coincide con --solo");
const trabajos = [];
lineas.forEach((l, li) => {
  for (const v of variantes) {
    if (!l[v]) continue;
    for (let t = 1; t <= tomas; t++) trabajos.push({ id: l.id, variante: v, toma: t, texto: l[v], seed: 1000 + li * 10 + t, voz: l.voz || "", ajustes: l.ajustes || null });
  }
});
// Una línea puede traer "voz": "mama" (otro personaje). Su ID se lee de ELEVENLABS_VOICE_ID_MAMA; sin "voz" usa ELEVENLABS_VOICE_ID.
const nombreVar = (v) => (v ? "ELEVENLABS_VOICE_ID_" + v.toUpperCase().replace(/[^A-Z0-9]/g, "_") : "ELEVENLABS_VOICE_ID");
const vocesUsadas = [...new Set(trabajos.map((j) => j.voz))];
const caracteres = trabajos.reduce((s, j) => s + j.texto.length, 0);

const ajustes = { stability: parseFloat(o.stability ?? "0.35"), similarity_boost: parseFloat(o.similitud ?? "0.75"), style: parseFloat(o.estilo ?? "0.45"), use_speaker_boost: true };
if (o.velocidad) ajustes.speed = parseFloat(o.velocidad);

console.log(`modelo ${modelo} | variantes ${variantes.join("+")} | ${tomas} toma(s) | ${trabajos.length} audios | ${caracteres} caracteres`);
if (!usaEtiquetas && o.variantes?.includes("con")) console.log("AVISO: este modelo no usa etiquetas entre corchetes; las leería o las ignoraría.");
if (o.probar) {
  for (const j of trabajos) console.log(`  ${j.id}-${j.variante}-t${j.toma}.mp3  (${j.texto.length} car., seed ${j.seed}, voz ${j.voz || "principal"})  ${j.texto.slice(0, 70)}${j.texto.length > 70 ? "…" : ""}`);
  console.log("Variables (solo si están o no; nunca el valor): " + ["ELEVENLABS_API_KEY", ...vocesUsadas.map(nombreVar)].map((n) => `${n}: ${process.env[n] ? "cargada" : "FALTA"}`).join(" | "));
  console.log(`Salida: ${salida}\nAjustes: ${o["sin-ajustes"] ? "los guardados en la voz" : JSON.stringify(ajustes)}\n(--probar: no se mandó nada)`);
  process.exit(0);
}

// ---- credenciales: del .env o del entorno de la terminal
const clave = process.env.ELEVENLABS_API_KEY;
if (!clave) fallar('falta ELEVENLABS_API_KEY: completala en el archivo .env (ELEVENLABS_API_KEY=...) o, en PowerShell, $env:ELEVENLABS_API_KEY = "tu clave"');
const voces = {};
for (const v of vocesUsadas) {
  const nombre = nombreVar(v);
  voces[v] = process.env[nombre];
  if (!voces[v]) fallar(`falta ${nombre}: completala en el archivo .env (${nombre}=el id de la voz) o, en PowerShell, $env:${nombre} = "el id de la voz"`);
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function pedir(j) {
  const voz = voces[j.voz];
  const cuerpo = { text: j.texto, model_id: modelo, seed: j.seed };
  if (!o["sin-ajustes"]) cuerpo.voice_settings = { ...ajustes, ...(j.ajustes || {}) };
  for (let intento = 1; intento <= 4; intento++) {
    let res;
    try {
      res = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(voz)}?output_format=${formato}`, {
        method: "POST",
        headers: { "xi-api-key": clave, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(120000),
      });
    } catch (e) {
      if (intento === 4) throw new Error("sin conexión con ElevenLabs: " + e.message);
      await espera(3000 * intento);
      continue;
    }
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const detalle = (await res.text()).slice(0, 500);
    if (res.status === 401) fallar("ElevenLabs rechazó la clave (401). Revisá ELEVENLABS_API_KEY y que tenga permiso de texto a voz.");
    if (res.status === 404) fallar("no existe esa voz o ese modelo (404). Revisá ELEVENLABS_VOICE_ID y --modelo. " + detalle);
    if (res.status === 422) fallar(`ElevenLabs no aceptó los parámetros (422): ${detalle}\nProbá con --sin-ajustes, o sacá --velocidad / cambiá --modelo.`);
    if ((res.status === 429 || res.status >= 500) && intento < 4) { await espera(5000 * intento); continue; }
    fallar(`ElevenLabs respondió ${res.status}: ${detalle}`);
  }
}

let hechos = 0, saltados = 0, gastados = 0;
for (const j of trabajos) {
  const archivo = join(salida, `${j.id}-${j.variante}-t${j.toma}.mp3`);
  if (existsSync(archivo) && !o.forzar) { saltados++; console.log(`--  ya existe ${archivo.split(/[\\/]/).pop()} (usá --forzar para rehacerlo)`); continue; }
  const audio = await pedir(j);
  writeFileSync(archivo, audio);
  hechos++; gastados += j.texto.length;
  console.log(`OK  ${archivo.split(/[\\/]/).pop()}  ${(audio.length / 1024).toFixed(0)} KB`);
}
console.log(`Listo: ${hechos} audios nuevos, ${saltados} ya existían, ${gastados} caracteres gastados. Carpeta: ${salida}`);
console.log("Escuchalos y elegí una toma por línea:  node tts-eleven/generar.mjs" + (o.lineas ? " --lineas " + o.lineas : "") + " --elegir " + lineas[0].id + "-con-t2," + (lineas[1] ? lineas[1].id + "-sin-t1," : "") + "...");
