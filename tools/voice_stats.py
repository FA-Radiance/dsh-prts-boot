import sys, io, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import numpy as np

FFMPEG = r"D:\RVC20240604Nvidia\ffmpeg.exe"

def load(path):
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

def f0_stats(x, sr=16000, frame=40e-3, hop=20e-3):
    n, h = int(sr*frame), int(sr*hop)
    meds = []
    for i in range(0, len(x)-n, h):
        f = x[i:i+n] * np.hanning(n)
        ac = np.correlate(f, f, "full")[n-1:]
        ac[0] = 0
        lo, hi = int(sr/500), int(sr/60)
        if hi >= len(ac): hi = len(ac)-1
        seg = ac[lo:hi]
        if len(seg) == 0 or seg.max() < 0.3 * (ac[1:min(400,len(ac))].max() if len(ac)>1 else 1):
            continue
        lag = lo + seg.argmax()
        if ac[lag] > 0.25 * ac.max():
            meds.append(sr/lag)
    meds = np.array(meds)
    if len(meds):
        return dict(n=len(meds), median=float(np.median(meds)), mean=float(meds.mean()),
                    std=float(meds.std()), min=float(meds.min()), max=float(meds.max()))
    return dict(n=0)

def spectrum_peaks(x, sr=16000):
    S = np.abs(np.fft.rfft(x * np.hanning(len(x))))**2
    S = 10*np.log10(S + 1e-12)
    freqs = np.fft.rfftfreq(len(x), 1/sr)
    out = []
    for band, lo, hi in [("bass", 60, 300), ("f0", 150, 400), ("formant1", 400, 1500), ("high", 1500, 4000), ("air", 4000, 8000)]:
        m = (freqs >= lo) & (freqs <= hi)
        if m.any():
            pk = freqs[m][S[m].argmax()]
            out.append((band, round(float(pk)), round(float(S[m].max()), 1)))
    return out

for path in sys.argv[1:]:
    x = load(path)
    s = f0_stats(x)
    print(f"== {path}")
    print(f"  F0: {s}")
    print(f"  peaks: {spectrum_peaks(x)}")
