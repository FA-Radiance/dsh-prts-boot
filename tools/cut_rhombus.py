"""Extract ONLY the red rhombus body (filled diamond, no outline strokes).

Usage: python cut_rhombus.py <frame.png> <out.png> <dark|light>
- 560x560 crop at (1280,720)
- alpha = red-dominant pixels (the rhombus body), blurred, centre-biased
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

src, out, mode = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)
R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
L = 0.299 * R + 0.587 * G + 0.114 * B

CX, CY, HALF = 1280, 720, 280
crop = a[CY - HALF:CY + HALF, CX - HALF:CX + HALF].astype(np.uint8)
Rc = R[CY - HALF:CY + HALF, CX - HALF:CX + HALF]
Gc = G[CY - HALF:CY + HALF, CX - HALF:CX + HALF]
Bc = B[CY - HALF:CY + HALF, CX - HALF:CX + HALF]
Lc = L[CY - HALF:CY + HALF, CX - HALF:CX + HALF]

if mode == "dark":
    # small glowing pink-red rhombus at centre (exclude the big white outline)
    mask = (Rc > 100) & (Rc - Gc > 10) & (Rc - Bc > 10) & (Lc > 90)
else:
    # small dark red rhombus at centre (exclude outline fragments)
    mask = (Rc > 100) & (Rc - Gc > 28) & (Rc - Bc > 28) & (Lc < 165)

# centre-bias: keep only the rhombus zone
ys, xs = np.mgrid[0:mask.shape[0], 0:mask.shape[1]]
d = (np.abs(xs - (mask.shape[1] - 1) / 2) + np.abs(ys - (mask.shape[0] - 1) / 2)) / (0.5 * mask.shape[1])
mask = mask & (d <= 0.45)

if not mask.any():
    print("EMPTY MASK")
    sys.exit(1)
my, mx = np.nonzero(mask)
print("mask bbox:", mx.min(), my.min(), mx.max(), my.max(),
      "count:", len(mx), "centre:", (mx.min() + mx.max()) // 2, (my.min() + my.max()) // 2)

alpha = (mask.astype(np.uint8) * 255)
out_a = np.dstack([crop, alpha])
img = Image.fromarray(out_a, "RGBA")
img = img.filter(ImageFilter.GaussianBlur(1.2))
img.save(out)
print(out, "alpha>0 px:", int((alpha > 0).sum()))
