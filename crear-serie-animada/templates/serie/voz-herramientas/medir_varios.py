"""Mide cada audio por separado con las métricas de medir_voz.py. Uso: python -I medir_varios.py <ffmpeg> <salida.json> <audio1> ..."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402
import medir_voz as mv  # noqa: E402

ff, salida, archivos = sys.argv[1], sys.argv[2], sys.argv[3:]
res = {}
for ruta in archivos:
    sig = mv.cargar(ff, ruta)
    try:
        m = mv.medir(sig)
    except Exception as e:  # clips muy cortos
        m = {"error": str(e)}
    m["dur_real"] = round(len(sig) / mv.SR, 2)
    res[os.path.basename(ruta)] = m
    print(os.path.basename(ruta), m.get("f0_rango_semitonos"), m.get("f0_desvio_semitonos"), flush=True)
with open(salida, "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False, indent=1)
