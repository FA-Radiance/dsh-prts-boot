# -*- coding: utf-8 -*-
"""Loopable version of splash_bgm.wav: keep full track (ends are ~silent, loop is seamless),
normalize, tiny fades to kill clicks."""
import sys, subprocess
import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = r"D:\文件\deepseek-harness\default-workspace\dsh-prts-boot\.work\splash_bgm.wav"
DST = r"D:\文件\deepseek-harness\default-workspace\dsh-prts-boot\.work\bgm_loop.wav"

raw = subprocess.run(
    [r"D:\RVC20240604Nvidia\ffmpeg.exe", "-hide_banner", "-i", SRC,
     "-f", "s16le", "-ac", "1", "-ar", "22050", "-"],
    capture_output=True).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
sr = 22050
n = len(x)

# 60ms equal-power fades at both ends
f = int(sr * 0.06)
w = np.linspace(0, np.pi/2, f)
x[:f] *= np.sin(w)
x[-f:] *= np.sin(w[::-1])

peak = np.abs(x).max() or 1.0
x = x / peak * 0.84  # -1.5 dBFS

out = np.clip(x * 32767, -32768, 32767).astype(np.int16)
p = subprocess.Popen(
    [r"D:\RVC20240604Nvidia\ffmpeg.exe", "-hide_banner", "-y",
     "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "-",
     "-c:a", "pcm_s16le", DST],
    stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
p.communicate(out.tobytes())
print(f"wrote {DST} dur={n/sr:.3f}s peak={float(np.abs(x).max()):.3f}")
