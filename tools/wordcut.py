"""Transcribe a region of the reference audio with WORD timestamps, and print the
per-100ms RMS profile around the speech so cuts can be placed exactly at word
boundaries."""
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
WORK = HERE.parent / ".work"
REF = WORK / "prts_boot_ref.wav"
SR = 16000


def wav_to_f32(path: Path, ffmpeg: str = "ffmpeg") -> np.ndarray:
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / "a.raw"
        subprocess.run(
            [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(path),
             "-f", "s16le", "-ac", "1", "-ar", str(SR), str(raw)],
            check=True,
        )
        data = np.frombuffer(raw.read_bytes(), dtype="<i2").astype(np.float32) / 32768.0
    return data


def rms_profile(x: np.ndarray, t0: float, t1: float, win_ms: int = 100, hop_ms: int = 50):
    win, hop = int(SR * win_ms / 1000), int(SR * hop_ms / 1000)
    out = []
    for i in range(int(t0 * SR), int(t1 * SR) - win, hop):
        seg = x[i:i + win]
        r = float(np.sqrt(np.mean(seg ** 2)))
        out.append((i / SR, r))
    return out


def main():
    ffmpeg = sys.argv[1] if len(sys.argv) > 1 else "ffmpeg"
    t0 = float(sys.argv[2]) if len(sys.argv) > 2 else 15.0
    t1 = float(sys.argv[3]) if len(sys.argv) > 3 else 21.0
    x = wav_to_f32(REF, ffmpeg)
    print(f"=== RMS profile {t0}-{t1}s (100ms win / 50ms hop) ===")
    for t, r in rms_profile(x, t0, t1):
        db = 20 * np.log10(max(r, 1e-6))
        bar = "#" * int(max(0.0, min(60.0, (db + 60) * 1.2)))
        print(f"{t:7.2f}s {db:7.2f}dB {bar}")
    # word timestamps via whisper medium (numpy in, bypasses broken PyAV)
    from faster_whisper import WhisperModel
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    seg, info = model.transcribe(
        x, language="en", word_timestamps=True, vad_filter=False,
        condition_on_previous_text=False, no_speech_threshold=0.9,
    )
    print(f"=== words (lang={info.language} p={info.language_probability:.2f}) ===")
    for s in seg:
        print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}")
        for w in s.words:
            print(f"    {w.start:6.2f}-{w.end:6.2f} {w.word}")


if __name__ == "__main__":
    main()
