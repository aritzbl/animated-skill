"""Mide un audio con las mismas métricas que usé en el reel de referencia.
Uso: python -I medir_voz.py <ffmpeg.exe> <audio1> [audio2 ...]
Con varios audios, los concatena (en el orden dado) y mide el conjunto.
"""
import math
import subprocess
import sys

import numpy as np

SR = 48000
HOP = int(SR * 0.04)  # 40 ms
WIN = 2048


def cargar(ffmpeg, ruta):
    p = subprocess.run(
        [ffmpeg, "-v", "error", "-i", ruta, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    )
    return np.frombuffer(p.stdout, dtype=np.float32)


def f0_frame(b, rms):
    if rms < 0.01:
        return 0.0
    x = b[:1024].astype(np.float64)
    e0 = float(np.dot(x, x))
    if e0 <= 0:
        return 0.0
    lmin, lmax = SR // 400, SR // 70
    best, bl = 0.0, 0
    # autocorrelación normalizada, igual que en el navegador
    for l in range(lmin, lmax + 1):
        y = b[l:l + 1024].astype(np.float64)
        e1 = float(np.dot(y, y))
        c = float(np.dot(x, y)) / math.sqrt(e0 * e1 + 1e-12)
        if c > best:
            best, bl = c, l
    return SR / bl if best > 0.6 else 0.0


def q(a, p):
    s = sorted(a)
    return s[min(len(s) - 1, int(p * len(s)))]


def db(x):
    return 20 * math.log10(max(x, 1e-5))


def medir(sig):
    n = (len(sig) - WIN) // HOP
    t = [i * HOP / SR for i in range(n)]
    rms, f0 = [], []
    for i in range(n):
        b = sig[i * HOP:i * HOP + WIN]
        r = float(np.sqrt(np.mean(b.astype(np.float64) ** 2)))
        rms.append(r)
        f0.append(f0_frame(b, r))
    p90, p50, p10 = q(rms, .9), q(rms, .5), q(rms, .1)
    act = [x > 0.35 * p90 for x in rms]
    sm = [(rms[max(i - 1, 0)] + rms[i] + rms[min(i + 1, n - 1)]) / 3 for i in range(n)]
    peaks = []
    for i in range(2, n - 2):
        if sm[i] > 0.4 * p90 and sm[i] >= sm[i - 1] and sm[i] > sm[i + 1] and sm[i] >= sm[i - 2] and sm[i] > sm[i + 2]:
            if not peaks or t[i] - peaks[-1] > 0.12:
                peaks.append(t[i])
    pausas, run, t0 = [], 0, 0.0
    for i in range(n):
        if not act[i]:
            if not run:
                t0 = t[i]
            run += 1
        else:
            if run and t[i] - t0 >= 0.25:
                pausas.append(t[i] - t0)
            run = 0
    voiced = [f0[i] for i in range(n) if 75 <= f0[i] <= 350 and rms[i] > 0.35 * p90]
    st = [12 * math.log2(h / 150) for h in voiced]
    dur = t[-1] - t[0]
    m = sum(st) / len(st)
    sd = math.sqrt(sum((x - m) ** 2 for x in st) / len(st))
    return {
        "duracion_s": round(dur, 1),
        "volumen_dB_p10/p50/p90": [round(db(p10), 1), round(db(p50), 1), round(db(p90), 1)],
        "volumen_rango_p10_p90": round(db(p90) - db(p10), 1),
        "habla_activa_pct": round(100 * sum(act) / n),
        "picos_por_seg": round(len(peaks) / dur, 2),
        "pausas_250ms_o_mas": len(pausas),
        "pausas_prom_s": round(sum(pausas) / len(pausas), 2) if pausas else 0,
        "f0_cuadros": len(voiced),
        "f0_mediana_Hz": round(q(voiced, .5)),
        "f0_p10_p90_Hz": [round(q(voiced, .1)), round(q(voiced, .9))],
        "f0_rango_semitonos": round(12 * math.log2(q(voiced, .9) / q(voiced, .1)), 1),
        "f0_desvio_semitonos": round(sd, 2),
    }


if __name__ == "__main__":
    ff = sys.argv[1]
    partes = [cargar(ff, r) for r in sys.argv[2:]]
    gap = np.zeros(int(SR * 0.4), dtype=np.float32)
    sig = np.concatenate([x for p in partes for x in (p, gap)])
    for k, v in medir(sig).items():
        print(f"{k}: {v}")
