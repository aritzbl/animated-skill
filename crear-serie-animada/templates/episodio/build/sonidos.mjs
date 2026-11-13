// Genera los efectos de sonido del episodio con ffmpeg (síntesis simple, sin descargar nada).
// Es una biblioteca: cada episodio puede agregar los suyos al final. El catálogo está en references/06-sonido.md.
// Uso:  node build/sonidos.mjs "<ruta a ffmpeg.exe>"      (escribe en assets/sfx/*.wav, 48 kHz mono)
// Todo es determinista salvo el ruido blanco de ffmpeg (random(0) con semilla fija), así que los archivos salen iguales cada vez.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ffmpeg = process.argv[2] || "ffmpeg";
const salida = join(raiz, "assets", "sfx");
mkdirSync(salida, { recursive: true });

const R = "(random(0)*2-1)"; // ruido blanco
function sintetizar(nombre, expr, dur, filtros) {
  const args = ["-v", "error", "-y", "-f", "lavfi", "-i", `aevalsrc='${expr}':s=48000:d=${dur}`, "-af", `${filtros},alimiter=limit=0.89`, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", join(salida, nombre + ".wav")];
  execFileSync(ffmpeg, args);
  console.log("OK  " + nombre + ".wav");
}

// golpe en madera: tono grave que cae + clic
const toc = (f0, f1) => `(0.9*sin(2*PI*(${f1}+${f0 - f1}*exp(-t*45))*t)+0.35*sin(2*PI*${f0 * 2.2}*t))*exp(-t*38)+0.5*${R}*exp(-t*300)`;
sintetizar("toc", toc(120, 70), 0.25, "lowpass=f=1800,volume=1.4");
sintetizar("toc-iman", toc(210, 120), 0.18, "lowpass=f=2600,volume=1.3");

// pop de burbuja
sintetizar("pop", "sin(2*PI*(420+1000*exp(-t*55))*t)*exp(-t*26)", 0.2, "volume=1.0");

// notificación de mensaje: dos notas cortas
sintetizar("ping", "if(lt(t,0.09),sin(2*PI*880*t)*exp(-t*16),sin(2*PI*1318*(t-0.09))*exp(-(t-0.09)*13))*0.7+0.15*if(lt(t,0.09),sin(2*PI*1760*t)*exp(-t*20),sin(2*PI*2636*(t-0.09))*exp(-(t-0.09)*18))", 0.55, "volume=1.0");

// ding de aviso (notificación, portal)
sintetizar("ding", "sin(2*PI*1568*t)*exp(-t*9)*0.6+sin(2*PI*2352*t)*exp(-t*14)*0.25", 0.7, "volume=1.0");

// whoosh: ruido con envolvente que sube y baja
sintetizar("whoosh", `${R}*0.7*sin(PI*t/0.5)^2`, 0.5, "highpass=f=350,lowpass=f=4200,volume=1.2");
sintetizar("whoosh-largo", `${R}*0.7*sin(PI*t/0.8)^2`, 0.8, "highpass=f=250,lowpass=f=3200,volume=1.2");

// golpe grave y sello
sintetizar("golpe", `sin(2*PI*(52+70*exp(-t*28))*t)*exp(-t*8)*1.0+0.4*${R}*exp(-t*70)`, 0.6, "lowpass=f=700,volume=1.5");
sintetizar("sello", `sin(2*PI*(48+90*exp(-t*26))*t)*exp(-t*9)*1.0+0.7*${R}*exp(-t*55)`, 0.55, "lowpass=f=1400,volume=1.5");
sintetizar("latido", "sin(2*PI*(58+40*exp(-t*20))*t)*exp(-t*14)*0.9", 0.4, "lowpass=f=300,volume=1.5");

// portazo: golpe, cuerpo de ruido y eco de pasillo
sintetizar("portazo", `sin(2*PI*(46+80*exp(-t*24))*t)*exp(-t*6)*1.0+0.8*${R}*exp(-t*16)`, 0.9, "lowpass=f=1500,aecho=0.8:0.7:70|140:0.35|0.2,volume=1.4");

// puerta que se abre: chirrido
sintetizar("puerta-abre", "0.5*sin(2*PI*(380+300*t+45*sin(2*PI*21*t))*t)*sin(PI*t/0.6)+0.15*" + R + "*sin(PI*t/0.6)", 0.6, "lowpass=f=2600,highpass=f=200,volume=0.9");

// pasos que se alejan
sintetizar("pasos", "sin(2*PI*85*t)*exp(-mod(t,0.3)*38)*(1-t/1.3)*0.9+0.3*" + R + "*exp(-mod(t,0.3)*90)*(1-t/1.3)", 1.2, "lowpass=f=420,volume=1.6");

// tic de tarjeta (tres variantes para no repetir el mismo)
for (const [i, f] of [[1, 1900], [2, 2200], [3, 2500]]) sintetizar("tick" + i, `sin(2*PI*${f}*t)*exp(-t*230)*0.6+0.35*${R}*exp(-t*600)`, 0.06, "highpass=f=900,volume=0.9");

// botones de un joystick
sintetizar("click1", `${R}*exp(-t*420)*0.8+sin(2*PI*3100*t)*exp(-t*500)*0.4`, 0.04, "highpass=f=1400");
sintetizar("click2", `${R}*exp(-t*380)*0.8+sin(2*PI*2600*t)*exp(-t*450)*0.4`, 0.04, "highpass=f=1200");

// lapicera escribiendo (tres largos)
for (const [n, d] of [["a", 0.5], ["b", 0.55], ["c", 0.35]]) {
  sintetizar("lapicera-" + n, `${R}*0.55*(0.5+0.5*sin(2*PI*(15+4*t)*t))*(0.6+0.4*sin(2*PI*3*t))*sin(PI*t/${d})`, d, "highpass=f=2200,lowpass=f=7000,volume=1.1");
}
// hoja que se desliza
sintetizar("papel", `${R}*0.7*sin(PI*t/0.45)^2*(0.7+0.3*sin(2*PI*30*t))`, 0.45, "highpass=f=500,lowpass=f=3500,volume=1.2");

// metal del cucharón
sintetizar("tin", "(sin(2*PI*1100*t)*exp(-t*18)+0.5*sin(2*PI*2750*t)*exp(-t*26))*0.8", 0.4, "volume=1.0");

// personaje: suspiro (soplido que sube y baja) y trago
sintetizar("suspiro", `${R}*0.8*sin(PI*pow(t/1.0,0.7))^2`, 1.0, "highpass=f=300,lowpass=f=1600,volume=1.3");
sintetizar("trago", "sin(2*PI*(280-170*t/0.3)*t)*exp(-t*9)*0.9+0.3*" + R + "*exp(-t*120)", 0.35, "lowpass=f=900,volume=1.3");

// reloj: tic-tac cada 0,5 s
sintetizar("reloj", "(sin(2*PI*(if(lt(mod(t,1),0.5),1800,1500))*t)*exp(-mod(t,0.5)*170)*0.7+0.4*" + R + "*exp(-mod(t,0.5)*400))", 1.6, "highpass=f=800,volume=0.9");

// ambiente de noche: zumbido grave de cuarto + tele con la hinchada que sube y baja + grillos lejanos
sintetizar("amb-noche",
  `0.25*${R}*(0.55+0.45*sin(2*PI*0.21*t))*(0.4+0.6*sin(2*PI*0.37*t+1)^2)+0.5*sin(2*PI*60*t)*0.1+0.045*sin(2*PI*4600*t)*gt(sin(2*PI*31*t),0.55)*gt(sin(2*PI*2.4*t),0.1)`,
  20, "lowpass=f=3200,highpass=f=60,volume=1.0");

// ---------- baño / mañana ----------
// ambiente de mañana: soplido suave de fondo y pajaritos lejanos
sintetizar("amb-manana",
  `0.1*${R}*(0.6+0.4*sin(2*PI*0.17*t))+0.09*sin(2*PI*(3400+900*sin(2*PI*18*t))*t)*gt(sin(2*PI*0.9*t),0.82)+0.07*sin(2*PI*(4100+700*sin(2*PI*23*t))*t)*gt(sin(2*PI*0.55*t+1),0.88)`,
  14, "lowpass=f=6000,highpass=f=120,volume=1.0");
// ronquido: dos soplidos graves
sintetizar("ronquido", `(0.55*${R}+0.5*sin(2*PI*95*t))*sin(PI*t/0.7)^2*lt(t,0.7)+(0.4*${R}+0.4*sin(2*PI*80*t))*sin(PI*(t-0.9)/0.6)^2*gt(t,0.9)*lt(t,1.5)`, 1.6, "lowpass=f=700,highpass=f=60,volume=1.2");
// gota de agua (cae y golpea) y gota de la canilla
sintetizar("plink", "sin(2*PI*(900+900*exp(-t*60))*t)*exp(-t*28)*0.9", 0.25, "volume=1.0");
sintetizar("goteo", "sin(2*PI*(700+600*exp(-t*50))*t)*exp(-t*20)*0.8", 0.3, "volume=1.0");
// ducha: agua corriendo (ruido con leve oleaje)
sintetizar("ducha", `${R}*0.55*(0.8+0.2*sin(2*PI*7*t))*(0.85+0.15*sin(2*PI*1.3*t))`, 9, "highpass=f=700,lowpass=f=7500,volume=1.2");
// champú que sale (soplido + burbuja grave)
sintetizar("pfff", `${R}*0.8*sin(PI*t/0.28)^2+0.4*sin(2*PI*(160+120*t)*t)*exp(-t*9)`, 0.3, "highpass=f=900,lowpass=f=5500,volume=1.1");
// espuma (burbujitas)
sintetizar("espuma", `${R}*exp(-t*38)*0.5+0.5*sin(2*PI*(320+700*t)*t)*exp(-t*28)`, 0.2, "highpass=f=250,lowpass=f=4500,volume=1.0");
// tijera: dos cortes metálicos seguidos
sintetizar("snip", `(${R}*exp(-t*520)*0.8+sin(2*PI*4300*t)*exp(-t*150)*0.55)+(${R}*exp(-(t-0.07)*520)*0.8+sin(2*PI*3600*(t-0.07))*exp(-(t-0.07)*150)*0.55)*gt(t,0.07)`, 0.22, "highpass=f=1500,volume=1.1");
// pelitos que caen
sintetizar("pelo-cae", `${R}*0.45*sin(PI*t/0.6)^2`, 0.6, "highpass=f=2500,lowpass=f=8000,volume=0.9");

// peine pasando por el pelo: ráfaga de dientes (ruido modulado a ~70 Hz)
sintetizar("peine", `${R}*0.6*(0.5+0.5*sin(2*PI*70*t))^3*sin(PI*t/0.3)`, 0.3, "highpass=f=3000,lowpass=f=9000,volume=1.0");
// toalla que se saca de un tirón
sintetizar("toalla", `${R}*0.6*sin(PI*t/0.35)^2*(0.6+0.4*sin(2*PI*40*t))`, 0.35, "highpass=f=300,lowpass=f=3000,volume=1.2");
// desagüe que se traga el agua
sintetizar("gorgoteo", "sin(2*PI*(200+150*sin(2*PI*9*t))*t)*(0.5+0.5*sin(2*PI*5*t))*exp(-t*1.4)*0.7", 0.9, "lowpass=f=900,volume=1.3");
// ducha cerrada: golpe de caño y cola de agua
sintetizar("agua-off", `sin(2*PI*(110-40*t)*t)*exp(-t*20)*0.8+${R}*exp(-t*30)*0.25`, 0.4, "lowpass=f=1400,volume=1.3");
// subida de la barra de progreso del HUD: arpegio corto
sintetizar("nivel", "(sin(2*PI*523*t)*lt(t,0.1)+sin(2*PI*659*(t-0.1))*gt(t,0.1)*lt(t,0.2)+sin(2*PI*784*(t-0.2))*gt(t,0.2)*lt(t,0.3)+sin(2*PI*1047*(t-0.3))*gt(t,0.3))*exp(-mod(t,0.1)*14)*0.5*exp(-t*2.2)", 0.9, "volume=1.2");
