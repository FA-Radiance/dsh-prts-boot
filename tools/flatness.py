import sys, io, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import numpy as np

FFMPEG = r"D:\RVC20240604Nvidia\ffmpeg.exe"

def wav_to_np(path):
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

for path in sys.argv[1:]:
    x = wav_to_np(path)
    sr = 16000
    n = 1024
    hop = 512
    frames = [x[i:i+n] for i in range(0, len(x)-n, hop)]
    sfs, cents, rms = [], [], []
    for f in frames:
        w = f * np.hanning(n)
        S = np.abs(np.fft.rfft(w)) + 1e-12
        p = S / S.sum()
        sfs.append(np.exp((np.log(p) * p).sum()) / len(p))  # spectral flatness
        freqs = np.fft.rfftfreq(n, 1/sr)
        cents.append((np.log(freqs[1:]) * p[1:]).sum() / p[1:].sum())  # spectral centroid (log)
        rms.append(np.sqrt((f**2).mean()))
    sfs, cents, rms = map(np.array, (sfs, cents, rms))
    print(f"== {path}")
    print(f"  flatness: med={np.median(sfs):.3f} p25={np.percentile(sfs,25):.3f} p75={np.percentile(sfs,75):.3f}  (>0.1 通常=噪声/音乐成分多)")
    print(f"  centroid: med={np.exp(np.median(cents)):.0f}Hz p25={np.exp(np.percentile(cents,25)):.0f} p75={np.exp(np.percentile(cents,75)):.0f}")
    print(f"  rms: med={np.median(rms):.4f} max={rms.max():.4f}")
