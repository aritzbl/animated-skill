# Cuenta "impulsos" de alta frecuencia (clics y crepitaciones) por segundo con señal en tomas de voz o en una mezcla.
# Sirve para descartar tomas de ElevenLabs con artefactos que el ranking de texto/tono/ritmo no ve.
# Referencia (Día 3, 2026-11-12): con las voces del Día 1 y 2 salían 0,8 a 1,3 por segundo; la toma de 05-voto con 3,6 por segundo era la peor.
# Es una medida aproximada, no un oído: sirve para comparar tomas de la MISMA línea (las de menos impulsos primero).
# Uso:  <python del venv> -I voz-herramientas/medir_impulsos.py toma1.mp3 toma2.mp3 ...   (ffmpeg en la ruta FF de abajo; ajustala)
import subprocess, sys, numpy as np

FF = "C:/Users/nicol/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe"
SR = 48000

def leer(path, hp=3000):
    p = subprocess.run([FF, "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-af", f"highpass=f={hp}", "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(p.stdout, dtype=np.float32).astype(np.float64)

def impulsos(path):
    x = leer(path)
    n = len(x)
    f = SR // 500            # tramos de 2 ms
    k = n // f
    e = (x[: k * f].reshape(k, f) ** 2).mean(axis=1) + 1e-14
    edb = 10 * np.log10(e)
    # mediana móvil de 100 ms (50 tramos) como "fondo" local
    from numpy.lib.stride_tricks import sliding_window_view
    w = 51
    pad = np.pad(edb, (w // 2, w // 2), mode="edge")
    med = np.median(sliding_window_view(pad, w), axis=1)
    # impulso: un tramo de 2 ms que sale 18 dB sobre el fondo y supera -45 dBFS (HF), con vecinos (±6 ms) mucho más bajos
    vecino = np.maximum(np.roll(edb, 3), np.roll(edb, -3))
    imp = (edb - med > 18) & (edb > -45) & (edb - vecino > 6)
    seg = np.sum(edb > -60) * 0.002
    return int(imp.sum()), seg

if __name__ == "__main__":
    for p in sys.argv[1:]:
        c, seg = impulsos(p)
        nom = p.replace("\\", "/").split("/")[-1][:38]
        print(f"{nom.ljust(38)} impulsos HF {c:4d} en {seg:5.1f} s con señal -> {c / max(seg, 0.1):5.2f} por s")
