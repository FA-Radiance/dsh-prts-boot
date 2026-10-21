"""Final asset cuts for v17 photo-based mock.

Usage: python cut_v17.py
- light_rhombus.png / dark_rhombus.png : 760x760 @ video centre (1280,720)
- light_logo.png   / dark_logo.png   : 240x220 @ (1280,1250), luminance alpha
  (dark: bright glyph on dark -> alpha=L ; light: dark glyph on light -> alpha=255-L)
"""
import os

import numpy as np
from PIL import Image

WORK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".work", "v17")
WORK = os.path.normpath(WORK)

def load(name):
    return Image.open(os.path.join(WORK, name)).convert("RGB")

# ---- rhombus crops: 640x640 centred at (1280,720), diamond alpha baked in ----
RH_CX, RH_CY, RH_HALF = 1280, 720, 320
for tag, fname in [("light", "frame_light.png"), ("dark", "frame_dark.png")]:
    im = load(fname)
    W, H = im.size
    crop = im.crop((RH_CX - RH_HALF, RH_CY - RH_HALF, RH_CX + RH_HALF, RH_CY + RH_HALF))
    a = np.asarray(crop).astype(np.uint8)
    hh, ww = a.shape[:2]
    ys, xs = np.mgrid[0:hh, 0:ww]
    # L1 diamond distance: |x-cx|/a + |y-cy|/a, feather 0.78 -> 1.0
    d = (np.abs(xs - (ww - 1) / 2) + np.abs(ys - (hh - 1) / 2)) / (0.5 * ww)
    alpha = np.clip((1.0 - d) / 0.22, 0, 1)
    alpha = (alpha * 255).astype(np.uint8)
    out = np.dstack([a, alpha])
    Image.fromarray(out, "RGBA").save(os.path.join(WORK, tag + "_rhombus.png"))
    print(tag, "rhombus", crop.size, "alpha>0 px:", int((alpha > 0).sum()))

# ---- logo crops: 240x220 centred at (1280,1250), alpha from luminance ----
for tag, fname, invert in [("light", "frame_light.png", True), ("dark", "frame_dark.png", False)]:
    im = load(fname)
    a = np.asarray(im).astype(np.float32)
    L = 0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2]
    cx, cy = 1280, 1250
    x0, x1 = cx - 120, cx + 120
    y0, y1 = cy - 110, cy + 110
    sub = a[y0:y1, x0:x1]
    lsub = L[y0:y1, x0:x1]
    if invert:
        alpha = np.clip((150 - lsub) * 3.2, 0, 255).astype(np.uint8)
    else:
        alpha = np.clip((lsub - 60) * 3.2, 0, 255).astype(np.uint8)
    # centre-bias: zero alpha outside central 80% to kill stray neighbours
    ys, xs = np.mgrid[0:alpha.shape[0], 0:alpha.shape[1]]
    cyy, cxx = alpha.shape[0] / 2, alpha.shape[1] / 2
    dist = np.sqrt(((ys - cyy) / (0.95 * cyy)) ** 2 + ((xs - cxx) / (0.95 * cxx)) ** 2)
    alpha[dist > 1] = 0
    out = np.dstack([sub.astype(np.uint8), alpha])
    Image.fromarray(out, "RGBA").save(os.path.join(WORK, tag + "_logo.png"))
    print(tag, "logo", out.shape, "alpha>0 px:", int((alpha > 0).sum()))
