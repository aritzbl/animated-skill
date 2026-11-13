// Exporta el logo a PNG con el Chrome headless que ya baja HyperFrames (sin red, sin descargas).
// Uso (desde la carpeta del proyecto, con el servidor local andando):
//   node logo/exportar.mjs [url]
import puppeteer from "puppeteer-core";
import { homedir } from "node:os";
import { join } from "node:path";
import { readdirSync, existsSync } from "node:fs";

const base = join(homedir(), ".cache", "hyperframes", "chrome", "chrome-headless-shell");
const ver = readdirSync(base).sort().pop();
const exe = join(base, ver, "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!existsSync(exe)) throw new Error("No encuentro chrome-headless-shell en " + exe);

const url = process.argv[2] || "http://127.0.0.1:8765/logo/index.html";
const out = new URL("./", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1").replace(/%20/g, " ");

const browser = await puppeteer.launch({ executablePath: exe, headless: true });
try {
  async function foto(nombre, { size = 1024, dsf = 1, css = "" } = {}) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: dsf });
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction("window.__listo === true");
    if (css) await page.addStyleTag({ content: css });
    await page.screenshot({ path: join(out, nombre), type: "png", clip: { x: 0, y: 0, width: 1024, height: 1024 } });
    await page.close();
    console.log("ok", nombre);
  }
  await foto("logo-1024.png");
  await foto("prueba-110px.png", { dsf: 110 / 1024 });
  await foto("prueba-circulo.png", {
    css: "html,body{background:#8a8a8a !important} #logo{clip-path:circle(512px at 512px 512px)}",
  });
} finally {
  await browser.close();
}
