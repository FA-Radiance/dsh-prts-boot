"""Generate the PRTS boot/login voice lines.

Two sources:
- REAL game voice (the PRTS terminal itself, English machine voice) for the
  four signature moments: boot, identify, auth, granted-doctor. Clips are cut
  from the official boot/login sequence (video BV1FJ396JEqw) into .work/ and
  are only loudness-matched here.
- edge-tts (en-US-AriaNeural) for the remaining lines, shaped with ffmpeg to
  match the real PRTS voice acoustics (measured: F0 median ~222 Hz, dominant
  formant ~433 Hz, weak 1.5-4 kHz band, vocoder sparkle ~6 kHz).

Requirements: edge-tts (pip install edge-tts), ffmpeg on PATH or FFMPEG env.

Usage:  python tools/voice.py [--ffmpeg PATH] [--only id --only id ...]
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "voice"
WORK = ROOT / ".work"

VOICE = "en-US-AriaNeural"

# id: (text, rate)
LINES: dict[str, tuple[str, str]] = {
    "denied": ("Access denied. Please re-confirm your identity.", "-8%"),
    "welcome": ("PRTS at your service.", "-6%"),
    "locked": ("Access channel locked.", "-8%"),
    "granted-amiya": ("Identity verified. Welcome back, Amiya.", "-8%"),
    "granted-kaltsit": ("Identity verified. Welcome back, Doctor Kal'tsit.", "-8%"),
    "granted-prts": ("I have not forgotten you. Welcome back, Doctor.", "-8%"),
    "prts-reveal": ("Hidden archive detected. She is still watching.", "-6%"),
}

# Real game voice clips (cut beforehand into .work/, see .work/README-cuts.txt)
REAL: dict[str, tuple[str, str]] = {
    "boot": ("real_boot.wav", "Initializing, okay."),
    "identify": ("real_login.wav", "Please log in, Administrator."),
    "auth": ("real_level.wav", "Permission, level 8."),
    "granted-doctor": ("real_granted.wav", "Welcome back, Doctor."),
}

# Match the real PRTS voice: +0.5 st pitch (F0 -> ~222 Hz), formant emphasis,
# weak 1.5-4 kHz band, ~6 kHz vocoder sparkle, tight compressed dynamics.
# The last stage is a measured 36-band residual EQ (tools/eqmatch.py) that
# flattens the remaining spectral difference between processed TTS and the
# real game clips.
FILTER = (
    "aformat=sample_rates=44100,"
    "asetrate=44100*1.03,aresample=44100,atempo=1/1.03,"
    "equalizer=f=800:t=q:w=1.5:g=3,"
    "equalizer=f=2600:t=q:w=1.6:g=-5,"
    "equalizer=f=6000:t=q:w=0.9:g=6,"
    "firequalizer=gain_entry='"
    "entry(127,-3.2);entry(143,-4.8);entry(161,-6.6);entry(181,-8.2);entry(203,-6.5);"
    "entry(228,-3.4);entry(257,-2.4);entry(288,0.0);entry(324,1.8);entry(364,2.1);"
    "entry(409,1.3);entry(460,1.4);entry(517,-0.3);entry(581,-1.8);entry(652,-3.2);"
    "entry(733,-3.5);entry(824,-4.2);entry(926,-4.1);entry(1040,-4.4);entry(1169,-4.1);"
    "entry(1314,-5.5);entry(1476,-6.7);entry(1659,-7.2);entry(1864,-8.0);entry(2095,-8.4);"
    "entry(2354,-6.5);entry(2646,-3.6);entry(2973,-2.0);entry(3341,-2.3);entry(3754,-3.5);"
    "entry(4219,-4.8);entry(4741,-6.6);entry(5327,-8.0);entry(5986,-7.5);entry(6727,-5.4);"
    "entry(7560,-4.1)'"
    ","
    "acompressor=threshold=-22dB:ratio=3.5:attack=10:release=150:makeup=2,"
    "loudnorm=I=-18:TP=-2:LRA=9"
)

# granted-doctor is spoken softer than the other real lines: a gentle tilt
# (+5 dB at 3 kHz) keeps it bright and consistent after peak-normalisation.
GRANT_TILT = (
    "firequalizer=gain_entry='"
    "entry(180,0.5);entry(700,2.0);entry(1600,4.0);entry(3000,5.5);entry(6000,5.0);"
    "entry(7560,3.5)'"
)

# Continuous background bed (16 s loop, seamless: every tremolo period = 16 s)
# and a short hover blip. Both synthesised from scratch with ffmpeg lavfi.
SFX: dict[str, tuple[str, list[str]]] = {
    "ambience": (
        "console hum loop",
        [
            "-f", "lavfi", "-i", "sine=frequency=110:duration=10",
            "-f", "lavfi", "-i", "sine=frequency=220.4:duration=10",
            "-f", "lavfi", "-i", "sine=frequency=329.6:duration=10",
            "-f", "lavfi", "-i", "anoisesrc=color=pink:duration=10:amplitude=0.03",
            "-filter_complex",
            "[0]volume=0.56,tremolo=f=0.1:d=0.5[a];"
            "[1]volume=0.20,tremolo=f=0.1:d=0.6[b];"
            "[2]volume=0.096,tremolo=f=0.1:d=0.4[c];"
            "[3]lowpass=f=900,volume=0.32,tremolo=f=0.1:d=0.45[d];"
            "[a][b][c][d]amix=inputs=4,"
            "highpass=f=70,lowpass=f=1500,alimiter=limit=0.5",
        ],
    ),
    "hover": (
        "ui hover blip",
        [
            "-f", "lavfi", "-i", "sine=frequency=1180:duration=0.12",
            "-f", "lavfi", "-i", "sine=frequency=1760:duration=0.10",
            "-filter_complex",
            "[0]volume=1.2,afade=t=in:d=0.004,afade=t=out:st=0.02:d=0.10[a];"
            "[1]volume=0.56,afade=t=in:d=0.004,afade=t=out:st=0.03:d=0.07[b];"
            "[a][b]amix=inputs=2,"
            "highpass=f=300,alimiter=limit=0.6",
        ],
    ),
    "tick": (
        "typing key blip",
        [
            "-f", "lavfi", "-i", "sine=frequency=880:duration=0.035",
            "-filter_complex",
            "volume=0.5,afade=t=in:d=0.002,afade=t=out:st=0.012:d=0.023,"
            "highpass=f=400,alimiter=limit=0.35",
        ],
    ),
    "pick": (
        "selection confirm chirp",
        [
            "-f", "lavfi", "-i",
            "aevalsrc=sin(2*PI*(660+3666*t)*t)*0.08:d=0.09",
            "-filter_complex",
            "afade=t=in:d=0.004,afade=t=out:st=0.05:d=0.04,"
            "highpass=f=300,alimiter=limit=0.5",
        ],
    ),
}


def find_ffmpeg(explicit: str | None) -> str:
    for candidate in (explicit, os.environ.get("FFMPEG"), "ffmpeg"):
        if not candidate:
            continue
        exe = shutil.which(candidate) if candidate == "ffmpeg" else candidate
        if exe and Path(exe).exists():
            return exe
    raise SystemExit("ffmpeg not found: pass --ffmpeg or set FFMPEG")


async def synth(text: str, rate: str, raw: Path) -> None:
    import edge_tts  # imported late so --help works without the dependency

    await edge_tts.Communicate(text, VOICE, rate=rate).save(str(raw))


def encode(ffmpeg: str, src: Path, filters: str, dst: Path) -> None:
    subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
         "-af", filters, "-codec:a", "libmp3lame", "-b:a", "48k", "-ar", "44100",
         "-ac", "1", str(dst)],
        check=True,
    )


PRE = "highpass=f=120,afade=t=in:d=0.04,areverse,afade=t=in:d=0.06,areverse"


def encode_normalized(ffmpeg: str, src: Path, dst: Path, extra: str = "") -> None:
    """Peak-normalise a short clip to ~-2 dBTP (loudnorm is unreliable below ~3 s)."""
    pre = PRE if not extra else f"{PRE},{extra}"
    measure_af = f"{pre},loudnorm=I=-18:TP=-2:LRA=9:print_format=json"
    p1 = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(src), "-af", measure_af,
         "-f", "null", "-"],
        capture_output=True, text=True,
    )
    blob = p1.stderr
    i, j = blob.rfind("{"), blob.rfind("}")
    if i == -1 or j == -1 or j <= i:
        raise RuntimeError("loudnorm measure failed: " + blob[-400:])
    m = json.loads(blob[i:j + 1])
    gain = max(0.0, min(40.0, -2.0 - float(m["input_tp"])))
    apply_af = f"{pre},volume={gain:.1f}dB,alimiter=limit=-1.5dB"
    encode(ffmpeg, src, apply_af, dst)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default=None)
    parser.add_argument("--only", action="append", default=None, help="regenerate just these ids")
    args = parser.parse_args()

    ffmpeg = find_ffmpeg(args.ffmpeg)
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / "_raw"
    tmp.mkdir(exist_ok=True)

    manifest: dict[str, dict[str, object]] = {}

    for line_id, (wav, text) in REAL.items():
        if args.only and line_id not in args.only:
            continue
        src = WORK / wav
        if not src.exists():
            print(f"[voice] skip {line_id}: missing {src}", flush=True)
            continue
        dst = OUT / f"{line_id}.mp3"
        extra = GRANT_TILT if line_id == "granted-doctor" else ""
        print(f"[voice] {line_id}: REAL <- {wav} ({text})", flush=True)
        encode_normalized(ffmpeg, src, dst, extra)
        manifest[line_id] = {
            "text": text,
            "file": f"{line_id}.mp3",
            "source": "game",
            "bytes": dst.stat().st_size,
        }

    for line_id, (text, rate) in LINES.items():
        if args.only and line_id not in args.only:
            continue
        raw = tmp / f"{line_id}.mp3"
        dst = OUT / f"{line_id}.mp3"
        print(f"[voice] {line_id}: TTS <- {text}", flush=True)
        asyncio.run(synth(text, rate, raw))
        encode(ffmpeg, raw, FILTER, dst)
        manifest[line_id] = {
            "text": text,
            "file": f"{line_id}.mp3",
            "source": "tts",
            "bytes": dst.stat().st_size,
        }

    for sfx_id, (desc, lavfi_args) in SFX.items():
        if args.only and sfx_id not in args.only:
            continue
        dst = OUT / f"{sfx_id}.mp3"
        print(f"[voice] {sfx_id}: SFX <- {desc}", flush=True)
        subprocess.run(
            [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *lavfi_args,
             "-codec:a", "libmp3lame", "-b:a", "64k", "-ar", "44100", "-ac", "1",
             str(dst)],
            check=True,
        )
        manifest[sfx_id] = {
            "text": desc,
            "file": f"{sfx_id}.mp3",
            "source": "synth",
            "bytes": dst.stat().st_size,
        }

    existing = {}
    meta = OUT / "lines.json"
    if meta.exists():
        try:
            existing = json.loads(meta.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}
    existing.update(manifest)
    meta.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.rmtree(tmp, ignore_errors=True)
    total = sum(int(v.get("bytes", 0)) for v in existing.values())
    print(f"[voice] {len(existing)} lines, {total / 1024:.1f} KiB -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
