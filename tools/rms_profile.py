import sys, io, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import numpy as np

FFMPEG = r"D:\RVC20240604Nvidia\ffmpeg.exe"
raw = subprocess.run([FFMPEG, "-v", "error", "-i", sys.argv[1], "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
sr = 16000
win = int(0.1 * sr)
for t0 in np.arange(4.0, 24.0, 0.25):
    i = int(t0 * sr)
    seg = x[i:i+win]
    rms = np.sqrt((seg**2).mean()) if len(seg) else 0
    bar = "#" * int(rms * 400)
    print(f"{t0:6.2f}s {rms:7.4f} {bar}")
