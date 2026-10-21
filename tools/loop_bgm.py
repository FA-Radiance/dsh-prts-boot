"""Rebuild the two background-music assets.

- assets/voice/bgm.mp3    — boot bed: splash score, seamless circular loop
  (80 ms equal-power crossfade at the seam), ~-21.5 dB RMS. Played ONCE at
  the start of the gate (the client no longer loops it).
- assets/voice/bgm-ok.mp3 — login-success bed: the video's own post-login
  ambience (26.9-33.9 s of the 40 s boot animation), a speech-free music
  window of the same track, ~7 s with soft fades, ~-21.5 dB RMS. The grant
  voice plays over it (ducked), so no vocal ever collides with the bed.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / ".work" / "splash_bgm.wav"
OK_SRC = ROOT / ".work" / "bgm_ok_src.wav"
VOICE = ROOT / "assets" / "voice"

FFMPEG = os.environ.get(
    "FFMPEG",
    r"D:\RVC20240604Nvidia\ffmpeg.exe"
    if Path(r"D:\RVC20240604Nvidia\ffmpeg.exe").exists()
    else "ffmpeg",
)

SR = 48000
FADE = int(SR * 0.08)  # 80 ms circular crossfade
TARGET_DB = -21.5
PEAK_CEIL = 0.89

# Success bed: soft fade-in, longer fade-out, no trimming needed (7 s source).


def decode(path: Path) -> np.ndarray:
    p = subprocess.run(
        [FFMPEG, "-v", "error", "-i", str(path),
         "-f", "f32le", "-acodec", "pcm_f32le", "-ar", str(SR), "-ac", "1", "-"],
        capture_output=True, check=True,
    )
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def crossfade(x: np.ndarray) -> np.ndarray:
    """Circular equal-power crossfade so the tail flows into the head."""
    out = x.copy()
    w = np.sqrt(np.linspace(0.0, 1.0, FADE))
    inv = np.sqrt(1.0 - w * w)
    out[-FADE:] = out[-FADE:] * inv + x[:FADE] * w
    return out


def level_to(x: np.ndarray, target_db: float) -> tuple[np.ndarray, float]:
    peak = float(np.max(np.abs(x)))
    x = x * (PEAK_CEIL / peak) if peak > 0 else x
    mean_db = 20.0 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    gain = 10.0 ** ((target_db - mean_db) / 20.0)
    return (x * gain).astype(np.float32), mean_db


def fade(x: np.ndarray, fade_in: float, fade_out: float) -> np.ndarray:
    out = x.copy()
    n = len(out)
    n_in = min(n, int(fade_in * SR))
    n_out = min(n, int(fade_out * SR))
    if n_in > 0:
        out[:n_in] *= np.linspace(0.0, 1.0, n_in, dtype=np.float32)
    if n_out > 0:
        out[-n_out:] *= np.linspace(1.0, 0.0, n_out, dtype=np.float32)
    return out


def encode(x: np.ndarray, dst: Path, extra_af: str = "") -> None:
    tmp = dst.with_suffix(".tmp.wav")
    y = np.clip(x, -1.0, 1.0)
    with wave.open(str(tmp), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767.0).astype("<i2").tobytes())
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(tmp)]
    if extra_af:
        cmd += ["-af", extra_af]
    cmd += ["-codec:a", "libmp3lame", "-b:a", "64k", "-ar", str(SR), "-ac", "1", str(dst)]
    subprocess.run(cmd, check=True)
    tmp.unlink(missing_ok=True)


def update_manifest(entries: dict[str, str]) -> None:
    meta = VOICE / "lines.json"
    existing: dict = {}
    if meta.exists():
        try:
            existing = json.loads(meta.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}
    for name, desc in entries.items():
        existing[name] = {
            "text": desc,
            "file": f"{name}.mp3",
            "source": "game+synth" if name == "bgm-ok" else "game",
            "bytes": (VOICE / f"{name}.mp3").stat().st_size,
        }
    meta.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    if not SRC.exists():
        print(f"[bgm] missing {SRC}", file=sys.stderr)
        return 1
    x = decode(SRC)
    dur = len(x) / SR
    print(f"[bgm] decoded {dur:.3f} s @ {SR} Hz mono")

    base = crossfade(x)

    # --- bgm.mp3: boot bed, one pass, no chime ---
    bed, pre_db = level_to(base, TARGET_DB)
    VOICE.mkdir(parents=True, exist_ok=True)
    bed_dst = VOICE / "bgm.mp3"
    encode(bed, bed_dst)
    print(f"[bgm] bgm.mp3: mean {pre_db:.2f} -> {TARGET_DB:.2f} dB, {bed_dst.stat().st_size} bytes")

    # --- bgm-ok.mp3: speech-free ambience of the same track ---
    if not OK_SRC.exists():
        print(f"[bgm] missing {OK_SRC} (cut 26.9-33.9 s from prts_boot_audio.m4s)", file=sys.stderr)
        return 1
    ok_full = decode(OK_SRC)
    ok = fade(ok_full, 0.35, 1.6)
    ok, pre_ok_db = level_to(ok, TARGET_DB)
    ok_dst = VOICE / "bgm-ok.mp3"
    encode(ok, ok_dst)
    print(f"[bgm] bgm-ok.mp3: mean {pre_ok_db:.2f} -> {TARGET_DB:.2f} dB, {ok_dst.stat().st_size} bytes")

    update_manifest({
        "bgm": "Rhodes Island splash score (one pass, seamless)",
        "bgm-ok": "Login-success bed: speech-free ambience of the same score",
    })
    return 0


if __name__ == "__main__":
    sys.exit(main())
