#!/usr/bin/env python3
"""
Generates the PWA icons into public/icons/: Plusi, the app's character (the
plus sign with a face), on the teal accent. No text, no fonts, so it stays
legible at 48px on an iPad home screen.
Re-run after changing the design:  python3 scripts/icons/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[2] / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

BG = (47, 143, 131)         # --color-accent (middle band)
PLUS = (255, 248, 238)      # --color-bg
FACE = (58, 47, 42)         # --color-text
CHEEK = (255, 213, 194)
SCALE = 4                   # draw big, then downsample for smooth edges


def draw_icon(size: int, maskable: bool) -> Image.Image:
    s = size * SCALE
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(s * (0.0 if maskable else 0.22))
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=BG)

    # Plusi's geometry from the SVG (viewBox 120): arms from 22 to 98, width 34.
    # Maskable icons keep everything inside the central 80%.
    u = s / 120 * (0.78 if maskable else 0.92)
    off = (s - 120 * u) / 2

    def p(x: float, y: float) -> tuple[float, float]:
        return (off + x * u, off + y * u)

    w = 34 * u
    d.line([p(60, 22), p(60, 98)], fill=PLUS, width=int(w), joint="curve")
    d.line([p(22, 60), p(98, 60)], fill=PLUS, width=int(w), joint="curve")
    for cx, cy in [(60, 22), (60, 98), (22, 60), (98, 60)]:
        x, y = p(cx, cy)
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=PLUS)

    def dot(cx: float, cy: float, r: float, color) -> None:
        x, y = p(cx, cy)
        d.ellipse([x - r * u, y - r * u, x + r * u, y + r * u], fill=color)

    dot(49, 55, 6.5, (255, 255, 255))
    dot(71, 55, 6.5, (255, 255, 255))
    dot(50.5, 56, 3.2, FACE)
    dot(72.5, 56, 3.2, FACE)
    dot(42, 64, 3.5, CHEEK)
    dot(78, 64, 3.5, CHEEK)
    # Smile: an arc of the circle through (51,68), (60,72), (69,68).
    x0, y0 = p(51, 63)
    x1, y1 = p(69, 73)
    d.arc([x0, y0, x1, y1], start=20, end=160, fill=FACE, width=int(3.5 * u))

    return img.resize((size, size), Image.LANCZOS)


def save(name: str, size: int, maskable: bool = False) -> None:
    draw_icon(size, maskable).save(OUT / name, "PNG", optimize=True)


save("icon-192.png", 192)
save("icon-512.png", 512)
save("icon-512-maskable.png", 512, maskable=True)
save("apple-touch-icon.png", 180, maskable=True)  # iOS applies its own rounding
print(f"icons written to {OUT}")
