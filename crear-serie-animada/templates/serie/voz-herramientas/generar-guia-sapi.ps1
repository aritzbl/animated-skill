# Voz guía de Windows (System.Speech / SAPI): se genera LOCAL, sin red y sin instalar nada.
# Sirve SOLO para fijar el formato y los tiempos del episodio antes de tener la voz final.
# Lee las líneas de un JSON de líneas (el mismo que usa tts-eleven\generar.mjs; usa el campo "sin") y deja un MP3 por línea.
#
# Uso (PowerShell, desde la carpeta de la serie):
#   powershell -NoProfile -ExecutionPolicy Bypass -File voz-herramientas\generar-guia-sapi.ps1 `
#       -Lineas tts-eleven\lineas-ep-01.json -Salida Guiones\voces\ep-01-guia -Ffmpeg "<ruta a ffmpeg.exe>"
#   ... -ListarVoces        # muestra las voces instaladas (Sabina es-MX suele venir con Windows)
#
# Pausas: "..." o "…" en el texto = pausa de 350 ms; después de cada . ! ? se mete una pausa corta de 100 ms.
# La voz guía es robótica: no sirve para juzgar el humor ni la entonación. Avisalo siempre.
param(
  [string]$Lineas,
  [string]$Salida,
  [string]$Ffmpeg,
  [string]$Voz = "Microsoft Sabina Desktop",
  [string]$VozMama = "Microsoft Helena Desktop",   # lineas con "voz": "mama" en el JSON
  [int]$Velocidad = 1,
  [switch]$ListarVoces
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
if ($ListarVoces) {
  $s.GetInstalledVoices() | ForEach-Object { $v = $_.VoiceInfo; "{0}  ({1}, {2})" -f $v.Name, $v.Culture, $v.Gender }
  $s.Dispose(); exit 0
}
if (-not $Lineas -or -not $Salida -or -not $Ffmpeg) { throw "Faltan parámetros: -Lineas, -Salida y -Ffmpeg (o usá -ListarVoces)." }
if (-not (Test-Path $Ffmpeg)) { throw "No existe ffmpeg en $Ffmpeg" }
New-Item -ItemType Directory -Force -Path $Salida | Out-Null
$datos = Get-Content -Raw -Encoding UTF8 $Lineas | ConvertFrom-Json
$s.Rate = $Velocidad
foreach ($l in $datos) {
  if ($l.voz -eq "mama") { $s.SelectVoice($VozMama); $lang = "es-ES" } else { $s.SelectVoice($Voz); $lang = "es-MX" }
  $texto = [System.Security.SecurityElement]::Escape([string]$l.sin)
  $texto = $texto -replace '\s*(\.\.\.|…)\s*', '<break time="350ms"/>'
  $texto = $texto -replace '([.!?])\s+', '$1<break time="100ms"/>'
  $ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="' + $lang + '">' + $texto + '</speak>'
  $wav = Join-Path $Salida ($l.id + ".wav")
  $mp3 = Join-Path $Salida ($l.id + ".mp3")
  $s.SetOutputToWaveFile($wav)
  $s.SpeakSsml($ssml)
  $s.SetOutputToNull()
  & $Ffmpeg -v error -y -i $wav -c:a libmp3lame -q:a 3 $mp3
  Remove-Item $wav
  Write-Output ("OK  {0}" -f $mp3)
}
$s.Dispose()
