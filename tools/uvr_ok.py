"""UVR5 HP5 separation of the login-success segment for bgm-ok (instrumental)."""
import os
import sys

ROOT = r"D:\RVC1006Nvidia"
sys.path.insert(0, ROOT)
os.chdir(ROOT)

# Load .env explicitly (uvr() reads os.getenv("weight_uvr5_root")).
with open(os.path.join(ROOT, ".env"), encoding="utf-8") as fh:
    for raw in fh:
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())

from infer.modules.uvr5.modules import uvr  # noqa: E402

BASE = r"D:\文件\deepseek-harness\default-workspace\dsh-prts-boot\.work\uvr_ok_out"
inp = r"D:\文件\deepseek-harness\default-workspace\dsh-prts-boot\.work\uvr_ok_in"
out_v = os.path.join(BASE, "vocal")
out_i = os.path.join(BASE, "inst")
for m in (out_v, out_i):
    os.makedirs(m, exist_ok=True)

n = 0
for msg in uvr("HP5_only_main_vocal", inp, out_v, [], out_i, 10, "wav"):
    n += 1
    if n % 25 == 0:
        print(str(msg)[:120], flush=True)
print("uvr done, messages:", n, flush=True)
print("inst dir:", os.listdir(out_i), flush=True)
