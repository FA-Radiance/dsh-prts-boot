"""Probe wallpaper frames: red-dominant pixel distribution + centre luminance.
Usage: python probe_frame.py <frame.png> [--mode dark|light]"""
import sys

import numpy as np
from PIL import Image

MODE = sys.argv[3] if len(sys.argv) > 3 else "dark"
im = Image.open(sys.argv[1]).convert("RGB")
W, H = im.size
a = np.asarray(im).astype(np.int16)
R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
L = 0.299 * R + 0.587 * G + 0.114 * B
print("size:", W, H)
print("centre L:", round(float(L[H // 2, W // 2]), 1),
      "RGB:", a[H // 2, W // 2].tolist())

if MODE == "dark":
    red = (R > 130) & (R - G > 30) & (R - B > 30)
else:
    red = (R > 110) & (R - G > 25) & (R - B > 25) & (L < 215)

# red density in a coarse grid (8x8 blocks)
for by in range(8):
    row = []
    for bx in range(8):
        blk = red[by * H // 8:(by + 1) * H // 8, bx * W // 8:(bx + 1) * W // 8]
        row.append(int(blk.sum()))
    print("row", by, row)

# centre window red bbox
w = red[int(H * 0.3):int(H * 0.8), int(W * 0.3):int(W * 0.7)]
ys, xs = np.nonzero(w)
if len(xs):
    print("centre-window red bbox:", int(W * 0.3) + xs.min(), int(H * 0.3) + ys.min(),
          int(W * 0.3) + xs.max(), int(H * 0.3) + ys.max(),
          "count:", len(xs))
else:
    print("no red in centre window")

# luminance profile through centre: vertical + horizontal every 80px
print("vert L @x=1280:", [round(float(L[y, 1280]), 0) for y in range(0, H, 180)])
print("horiz L @y=720:", [round(float(L[720, x]), 0) for x in range(0, W, 160)])
