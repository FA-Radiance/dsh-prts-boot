import sys, io, subprocess, tempfile, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import numpy as np
from faster_whisper import WhisperModel

FFMPEG = r"D:\RVC20240604Nvidia\ffmpeg.exe"

def wav_to_np(path):
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

model_size = sys.argv[1] if len(sys.argv) > 1 else "small"
model = WhisperModel(model_size, device="cpu", compute_type="int8")
for path in sys.argv[2:]:
    audio = wav_to_np(path)
    segments, info = model.transcribe(audio, language="zh", vad_filter=True, beam_size=5,
                                      initial_prompt="明日方舟游戏内PRTS系统语音，机械女声。")
    print(f"== {path} (lang={info.language} p={info.language_probability:.2f})")
    for s in segments:
        print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}")
