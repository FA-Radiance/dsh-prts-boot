"""Compute a spectral match curve: real game voice vs raw TTS.

Averages the log-magnitude spectrum of the reference (real PRTS clips) and of
the raw (unfiltered) TTS clips, then derives a per-band gain table so TTS can
be shaped toward the real voice. Also can compare two single files.

Usage:
  eqmatch.py <ffmpeg> [--ref <file>...] [--tts <file>...]
Prints a firequalizer gain_entry string + a superequalizer 18-band string.
"""
import subprocess
import sys
import tempfile
from argparse import ArgumentParser
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
WORK = HERE.parent / ".work"


def to_f32(path: Path, ffmpeg: str, sr: int = 16000) -> np.ndarray:
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / "a.raw"
        subprocess.run(
            [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(path),
             "-f", "s16le", "-ac", "1", "-ar", str(sr), str(raw)],
            check=True,
        )
        data = np.frombuffer(raw.read_bytes(), dtype="<i2").astype(np.float32) / 32768.0
    return data


def band_spectrum(x: np.ndarray, sr: int, nfft: int = 1024, hop: int = 512):
    """Average log-magnitude spectrum over voiced (energetic) frames."""
    n = len(x) // hop - 1
    win = np.hanning(nfft)
    frames = []
    for i in range(n):
        seg = x[i * hop:i * hop + nfft]
        if len(seg) < nfft:
            break
        rms = float(np.sqrt(np.mean(seg ** 2)))
        if rms < 0.004:  # skip near-silence
            continue
        frames.append(np.abs(np.fft.rfft(seg * win)))
    if not frames:
        return None
    mag = np.mean(np.stack(frames), axis=0)
    freqs = np.fft.rfftfreq(nfft, 1.0 / sr)
    return freqs, mag


def log_bands(freqs: np.ndarray, mag: np.ndarray, n_bands: int = 36,
              f_lo: float = 120.0, f_hi: float = 8000.0):
    edges = np.geomspace(f_lo, f_hi, n_bands + 1)
    out = []
    for k in range(n_bands):
        m = (freqs >= edges[k]) & (freqs < edges[k + 1])
        if not m.any():
            continue
        c = (edges[k] + edges[k + 1]) / 2
        out.append((c, float(np.mean(mag[m]))))
    return out


def smooth_db(db: list[float], half: int = 2) -> list[float]:
    arr = np.array(db)
    ker = np.ones(2 * half + 1) / (2 * half + 1)
    return list(np.convolve(arr, ker, mode="same"))


def main() -> int:
    ap = ArgumentParser()
    ap.add_argument("ffmpeg")
    ap.add_argument("--ref", nargs="+", default=[
        str(WORK / "real_login.wav"),
        str(WORK / "real_boot.wav"),
        str(WORK / "real_level.wav"),
    ])
    ap.add_argument("--tts", nargs="+", default=[
        str(HERE.parent / "assets" / "voice" / "_raw" / "denied.mp3"),
        str(HERE.parent / "assets" / "voice" / "_raw" / "prts-reveal.mp3"),
    ])
    args = ap.parse_args()

    ref_mags, tts_mags = [], []
    for f in args.ref:
        x = to_f32(Path(f), args.ffmpeg)
        spec = band_spectrum(x, 16000)
        if spec:
            ref_mags.append(spec)
    for f in args.tts:
        x = to_f32(Path(f), args.ffmpeg)
        spec = band_spectrum(x, 16000)
        if spec:
            tts_mags.append(spec)

    freqs = ref_mags[0][0]
    ref_avg = np.mean(np.stack([m for _, m in ref_mags]), axis=0)
    tts_avg = np.mean(np.stack([m for _, m in tts_mags]), axis=0)

    ref_b = log_bands(freqs, ref_avg)
    tts_b = log_bands(freqs, tts_avg)
    gains = []
    for (cf, r), (_, t) in zip(ref_b, tts_b):
        g = 20 * np.log10(max(r, 1e-9) / max(t, 1e-9))
        gains.append(float(np.clip(g, -12.0, 12.0)))

    gs = smooth_db(gains)
    centers = [c for c, _ in ref_b]
    print("=== bands (center Hz : gain dB) ===")
    for c, g in zip(centers, gs):
        print(f"{c:8.1f} : {g:+6.1f}")
    entries = ";".join(f"entry({c:.0f},{g:.1f})" for c, g in zip(centers, gs))
    print("\nfirequalizer:")
    print(f"firequalizer=gain_entry='{entries}'")
    return 0


if __name__ == "__main__":
    sys.exit(main())
