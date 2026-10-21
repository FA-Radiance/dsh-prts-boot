"""Crop Priestess art to a chest-up bust and export a pure silhouette PNG.

Input:  preview/assets/prts_npc083.png  (1024x1024, transparent bg expected)
Output: preview/assets/prts_npc083_bust.png        (chest-up crop, original art)
        preview/assets/prts_npc083_silhouette.png  (black silhouette, feathered alpha)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "preview" / "assets"
SRC = ASSETS / "prts_npc083.png"


def main():
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    a = np.asarray(img)[:, :, 3].astype(np.float32)
    ys, xs = np.where(a > 16)
    if len(xs) == 0:
        print("no opaque pixels found", flush=True)
        return 1
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    print(f"image {w}x{h} bbox=({x0},{y0})-({x1},{y1}) {bw}x{bh}", flush=True)

    # chest-up = top ~42% of the character's bounding box, with side margin
    bust_h = int(bh * 0.42)
    pad = int(bw * 0.10)
    bx0 = max(0, x0 - pad)
    bx1 = min(w, x1 + pad)
    by0 = y0
    by1 = min(h, y0 + bust_h)
    bust = img.crop((bx0, by0, bx1, by1))
    bust.save(ASSETS / "prts_npc083_bust.png")
    print(f"bust crop ({bx0},{by0})-({bx1},{by1}) -> prts_npc083_bust.png", flush=True)

    # silhouette: black where alpha, feathered edge, faint teal rim
    arr = np.asarray(bust).astype(np.float32)
    alpha = arr[:, :, 3:4] / 255.0
    edge = np.asarray(bust.split()[3].filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255.0
    edge = edge[:, :, None]
    rim = np.clip(edge - alpha, 0, 1)          # glow just outside the shape
    r = 53 * rim * 0.9 + 17 * alpha * 0.12
    g = 162 * rim * 0.9 + 17 * alpha * 0.12
    b = 160 * rim * 0.9 + 16 * alpha * 0.12
    rgb = np.concatenate([r, g, b], axis=-1)
    out = np.concatenate([rgb, alpha * 255], axis=-1).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(ASSETS / "prts_npc083_silhouette.png")
    print("silhouette -> prts_npc083_silhouette.png", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
