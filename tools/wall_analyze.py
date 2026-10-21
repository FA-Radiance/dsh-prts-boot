"""Analyse wallpaper frames to infer the PRTS dynamic-wallpaper aesthetic.

For each frame: mean luminance (light/dark mode), dominant hues, radial
luminance profile (is there a central core?), edge density (line-art feel),
and where the bright energy sits (centroid). Prints a compact report.
"""
import glob
import sys

import numpy as np
from PIL import Image

WORK = r"D:\文件\deepseek-harness\default-workspace\dsh-prts-boot\.work"


def analyze(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    a = np.asarray(im, dtype=np.float32)
    lum = 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]
    lum8 = (lum / 255.0 * 255).astype(np.uint8)
    # radial profile: mean luminance in 10 concentric annuli around center
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2
    r = np.sqrt(((xs - cx) / cx) ** 2 + ((ys - cy) / cy) ** 2)  # 0..~1.4
    bands = []
    for i in range(8):
        lo, hi = i / 6.0, (i + 1) / 6.0
        m = (r >= lo) & (r < hi)
        bands.append(round(float(lum[m].mean()), 1) if m.any() else 0.0)
    # centroid of brightness
    total = lum.sum()
    bx = float((lum * xs).sum() / total)
    by = float((lum * ys).sum() / total)
    # edge density (line-art): horizontal+vertical gradients
    gx = np.abs(np.diff(lum, axis=1))
    gy = np.abs(np.diff(lum, axis=0))
    edge = float((gx > 28).mean() + (gy > 28).mean())
    # dominant hues of saturated pixels
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx = r.max(axis=2) if False else np.maximum.reduce([r, g, b])
    mn = np.minimum.reduce([r, g, b])
    sat = (mx - mn) / (mx + 1e-4)
    chroma_mask = (sat > 0.35) & (lum > 30)
    hues = np.zeros(12)
    if chroma_mask.any():
        rr, gg, bb = r[chroma_mask], g[chroma_mask], b[chroma_mask]
        hsv = np.stack([rr, gg, bb], axis=-1)
        mxx = hsv.max(axis=-1)
        mnn = hsv.min(axis=-1)
        hh = np.zeros_like(mxx)
        d = mxx - mnn
        m = d > 0
        hh[m] = np.where(
            mxx[m] == rr[m], ((gg[m] - bb[m]) / d[m]) % 6, np.where(mxx[m] == gg[m], (bb[m] - rr[m]) / d[m] + 2, (rr[m] - gg[m]) / d[m] + 4)
        ) * 60
        hues, _ = np.histogram(hh, bins=12, range=(0, 360))
    return {
        "size": f"{w}x{h}",
        "meanL": round(float(lum.mean()), 1),
        "p50L": round(float(np.percentile(lum, 50)), 1),
        "bright%": round(float((lum > 128).mean() * 100), 1),
        "bands": bands,
        "centroid": (round(float(bx / w), 3), round(float(by / h), 3)),
        "edge": round(edge, 4),
        "hues": [int(x) for x in hues],
    }


def main():
    paths = sorted(glob.glob(WORK + r"\wall_f_*.png"))
    for p in paths:
        r = analyze(p)
        print(
            p.split("\\")[-1],
            f"L={r['meanL']:>6} p50={r['p50L']:>6} bright={r['bright%']:>5}%",
            f"bands={r['bands']}",
            f"cent=({r['centroid'][0]},{r['centroid'][1]}) edge={r['edge']}",
            f"hues={r['hues']}",
        )


if __name__ == "__main__":
    sys.exit(main())
