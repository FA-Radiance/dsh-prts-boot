"""Deeper structure extraction from the reference wallpaper frames.

For one light frame and one dark frame:
  - locate the core (bright/dark blob around the frame centre),
  - measure the main separation ring radius/width (radial profile per sector),
  - measure outer luminous band radii,
  - sample hues along each ring at 16 angles,
  - count discrete bright fragments per angular sector (dissociation debris).
"""
import sys

import numpy as np
from PIL import Image

WORK = r"D:\文件\deepseek-harness\default-workspace\dsh-prts-boot\.work"


def load(path, down=1):
    im = Image.open(path).convert("RGB")
    if down > 1:
        im = im.resize((im.width // down, im.height // down))
    a = np.asarray(im, dtype=np.float32)
    lum = 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]
    return a, lum


def hue_map(a):
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx = np.maximum.reduce([r, g, b])
    mn = np.minimum.reduce([r, g, b])
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 12
    h[m] = np.where(
        mx[m] == r[m], ((g[m] - b[m]) / np.where(d[m] == 0, 1, d[m])) % 6,
        np.where(mx[m] == g[m], (b[m] - r[m]) / np.where(d[m] == 0, 1, d[m]) + 2,
                 (r[m] - g[m]) / np.where(d[m] == 0, 1, d[m]) + 4),
    ) * 60
    sat = d / (mx + 1e-4)
    return h, sat


def report(name, lum, hh, sat):
    H, W = lum.shape
    cy, cx = H / 2, W / 2
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    rr = np.sqrt(((xs - cx) / (W / 2)) ** 2 + ((ys - cy) / (H / 2)) ** 2)
    ang = np.arctan2(ys - cy, xs - cx)  # -pi..pi
    # radial profile at 64 rings
    edges = np.linspace(0, 1.41, 64)
    prof = np.array([float(lum[(rr >= edges[i]) & (rr < edges[i + 1])].mean()) for i in range(63)])
    print(f"[{name}] radial profile (63 bins):")
    print("  " + " ".join(f"{v:.0f}" for v in prof))
    # rings: find local minima/maxima
    extrema = []
    for i in range(1, 62):
        if prof[i] <= prof[i - 1] and prof[i] <= prof[i + 1] and prof[i] < np.median(prof):
            extrema.append((round(edges[i + 1], 3), "min", round(prof[i], 1)))
        if prof[i] >= prof[i - 1] and prof[i] >= prof[i + 1] and prof[i] > np.median(prof):
            extrema.append((round(edges[i + 1], 3), "max", round(prof[i], 1)))
    print("  extrema:", extrema[:14])
    # hue sampling along ring at 16 angles (16 x 12 bins)
    n_ang, n_hue = 16, 12
    hbins = np.zeros((n_ang, n_hue))
    cnt = np.zeros(n_ang)
    for i in range(n_ang):
        a0, a1 = -np.pi + i * 2 * np.pi / n_ang, -np.pi + (i + 1) * 2 * np.pi / n_ang
        m = (rr >= 0.16) & (rr < 0.9) & (ang >= a0) & (ang < a1) & (sat > 0.35) & (lum > 25)
        if m.any():
            hbins[i], _ = np.histogram(hh[m], bins=12, range=(0, 360))
            cnt[i] = m.sum()
    names = ["red", "org", "amb", "grn", "cgrn", "teal", "cyn", "sky", "blu", "vlt", "mag", "pnk"]
    print("  hue by sector (nonzero sectors only):")
    for i in range(n_ang):
        if cnt[i] > 40:
            top = np.argsort(hbins[i])[::-1][:3]
            deg = round(-180 + i * 360 / n_ang)
            print(f"    sector {i:2d} ({deg:+.0f}deg): " + ", ".join(f"{names[j]}:{int(hbins[i][j])}" for j in top))
    # fragments: bright blobs outside the core, per sector
    outer = (rr >= 0.22) & (lum > np.percentile(lum[(rr >= 0.22)], 96))
    for i in range(n_ang):
        a0, a1 = -np.pi + i * 2 * np.pi / n_ang, -np.pi + (i + 1) * 2 * np.pi / n_ang
        m = outer & (ang >= a0) & (ang < a1)
        if m.any():
            ys2, xs2 = np.nonzero(m)
            # crude connected-component count via grid clustering
            pts = np.stack([xs2, ys2], axis=1)
            comps = 0
            if len(pts) > 8:
                # greedy: sort by x, start new comp if gap > 12px
                pts = pts[np.argsort(pts[:, 0])]
                last = None
                for p in pts:
                    if last is None or abs(p[0] - last[0]) > 14 or abs(p[1] - last[1]) > 14:
                        comps += 1
                    last = p
            if comps:
                print(f"    frag sector {i:2d}: ~{comps} blobs ({len(pts)}px)")
    # core centroid (extreme-lum blob in centre region)
    core_zone = rr < 0.2
    cy2 = float((lum * (ys * core_zone)).sum() / max(1e-3, (lum * core_zone).sum()))
    cx2 = float((lum * (xs * core_zone)).sum() / max(1e-3, (lum * core_zone).sum()))
    print(f"  core lum centroid: ({cx2 / W:.3f}, {cy2 / H:.3f})")


def main():
    for tag, path in [("LIGHT f001", WORK + r"\wall_f_001.png"), ("DARK f012", WORK + r"\wall_f_012.png")]:
        a, lum = load(path, down=2)
        hh, sat = hue_map(a)
        report(tag, lum, hh, sat)
    return 0


if __name__ == "__main__":
    sys.exit(main())
