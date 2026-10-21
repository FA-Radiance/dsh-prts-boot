import sys, io, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import numpy as np
from faster_whisper import WhisperModel

FFMPEG = r"D:\RVC20240604Nvidia\ffmpeg.exe"

def wav_to_np(path):
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

model = WhisperModel("medium", device="cpu", compute_type="int8")
for path in sys.argv[1:]:
    audio = wav_to_np(path)
    segs, info = model.transcribe(audio, language="zh", beam_size=1, temperature=0.0,
                                  condition_on_previous_text=False, without_timestamps=False,
                                  no_speech_threshold=0.9, compression_ratio_threshold=2.4,
                                  log_prob_threshold=-1.0)
    print(f"== {path}")
    for s in segs:
        print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()} (avg_logprob={s.avg_logprob:.2f} ns={s.no_speech_prob:.2f})")
