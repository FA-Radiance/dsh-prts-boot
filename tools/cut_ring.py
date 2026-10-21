"""Extract ONLY the red rhombus ring (outline strokes) from the wallpaper frames.

Usage: python cut_ring.py <frame.png> <out.png>
- 560x560 crop at (1280,720)
- alpha = edge magnitude of luminance (Sobel), thresholded, blurred
- RGB kept as-is so the ring keeps its original colours
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)
L = 0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2]

CX, CY, HALF = 1280, 720, 280
crop = a[CY - HALF:CY + HALF, CX - HALF:CX + HALF]
lc = L[CY - HALF:CY + HALF, CX - HALF:CX + HALF]

# Sobel gradients
gy, gx = np.gradient(lc)
mag = np.sqrt(gx ** 2 + gy ** 2)

# keep the strongest ~6% edges, then dilate a touch
thr = np.percentile(mag, 94)
mask = mag >= thr
pad = np.pad(mask, 1, mode='constant')
dil = np.zeros_like(pad)
dil[:-1, :] |= pad[1:, :]
dil[1:, :] |= pad[:-1, :]
dil[:, :-1] |= pad[:, 1:]
dil[:, 1:] |= pad[:, :-1]
mask = dil[1:-1, 1:-1]

# centre-bias: zero anything outside the rhombus zone (diamond distance 0.9)
ys, xs = np.mgrid[0:mask.shape[0], 0:mask.shape[1]]
d = (np.abs(xs - (mask.shape[1] - 1) / 2) + np.abs(ys - (mask.shape[0] - 1) / 2)) / (0.5 * mask.shape[1])
mask = mask & (d <= 0.95)

alpha = (mask.astype(np.uint8) * 255)
out_a = np.dstack([crop.astype(np.uint8), alpha])
img = Image.fromarray(out_a, "RGBA")
# soften the ring alpha
img = img.filter(ImageFilter.GaussianBlur(0.8))
img.save(out)
print(out, "alpha>0 px:", int((alpha > 0).sum()))
