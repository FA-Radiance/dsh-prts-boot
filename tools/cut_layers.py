"""Cut the red rhombus + bottom logo glyph out of the wallpaper frames.

Usage: python cut_layers.py <frame.png> <out_prefix> [--mode dark|light]
Writes <out_prefix>_rhombus.png, <out_prefix>_logo.png and prints
geometry JSON (rhombus bbox + video-space centre; logo bbox).
"""
import json
import sys

import numpy as np
from PIL import Image

MODE = sys.argv[4] if len(sys.argv) > 4 else "dark"
src = sys.argv[1]
prefix = sys.argv[2]

im = Image.open(src).convert("RGB")
W, H = im.size
a = np.asarray(im).astype(np.int16)
L = 0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2]

# ---- centre rhombus: search a centre window, luminance contrast ----
w0x, w1x = int(W * 0.30), int(W * 0.70)
w0y, w1y = int(H * 0.28), int(H * 0.78)
win = L[w0y:w1y, w0x:w1x]
if MODE == "dark":
    # glowing core on dark bg
    thr = float(np.median(win)) + 22
    mask = win > thr
else:
    # dark core on light bg
    thr = float(np.median(win)) - 22
    mask = win < thr

# keep the largest blob only (row/col density pruning, two passes)
for _ in range(3):
    rowkeep = mask.sum(axis=1) >= max(2, mask.sum(axis=1).max() * 0.25)
    colkeep = mask.sum(axis=0) >= max(2, mask.sum(axis=0).max() * 0.25)
    mask = mask[rowkeep][:, colkeep]
    if not mask.any():
        print("EMPTY MASK")
        sys.exit(1)

ys, xs = np.nonzero(mask)
x0, x1 = w0x + xs.min(), w0x + xs.max()
y0, y1 = w0y + ys.min(), w0y + ys.max()
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
half = int(max(x1 - x0, y1 - y0) * 0.72)
bx0, bx1 = max(0, int(cx - half)), min(W, int(cx + half))
by0, by1 = max(0, int(cy - half)), min(H, int(cy + half))
crop = im.crop((bx0, by0, bx1, by1))
crop.save(prefix + "_rhombus.png")
sub = a[by0:by1, bx0:bx1].reshape(-1, 3)
mean = sub.mean(axis=0)
print("rhombus bbox:", bx0, by0, bx1, by1,
      "size:", crop.size, "centre:", round(cx), round(cy),
      "meanRGB:", [round(v, 1) for v in mean])

# ---- bottom-centre logo glyph ----
ox0, ox1 = int(W * 0.30), int(W * 0.70)
oy0, oy1 = int(H * 0.80), int(H * 0.96)
reg = L[oy0:oy1, ox0:ox1]
if MODE == "dark":
    mask2 = reg > 85
else:
    mask2 = reg < 118
rows = mask2.any(axis=1)
cols = mask2.any(axis=0)
if rows.any() and cols.any():
    ry = np.nonzero(rows)[0]
    cxr = np.nonzero(cols)[0]
else:
    print("NO LOGO GLYPH")
    sys.exit(2)
pad = 8
lx0 = max(0, ox0 + cxr.min() - pad)
lx1 = min(W, ox0 + cxr.max() + pad + 1)
ly0 = max(0, oy0 + ry.min() - pad)
ly1 = min(H, oy0 + ry.max() + pad + 1)
crop2 = im.crop((lx0, ly0, lx1, ly1))
crop2.save(prefix + "_logo.png")
print("logo bbox:", lx0, ly0, lx1, ly1, "size:", crop2.size)
print(json.dumps({"rhombus": [bx0, by0, bx1, by1, round(cx), round(cy)],
                  "logo": [lx0, ly0, lx1, ly1]}))
