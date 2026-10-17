#!/usr/bin/env python3
"""
Generates the PWA icons into public/icons/.

The icon is deliberately simple (no text, no fonts): three warm counting dots
on a cream rounded square. It stays legible at 48px on an iPad home screen.
Re-run after changing the design:  python3 scripts/icons/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[2] / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

BG = (255, 248, 238)        # --color-bg
ACCENT = (232, 121, 58)     # young band accent
TEAL = (47, 143, 131)       # middle band accent
INDIGO = (91, 99, 214)      # older band accent


def draw_icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = 0 if maskable else int(size * 0.0)
    radius = int(size * (0.0 if maskable else 0.22))
    d.rounded_rectangle([pad, pad, size - pad - 1, size - pad - 1], radius=radius, fill=BG)

    # Safe zone for maskable icons is the inner 80%; keep everything inside it.
    cx = size / 2
    r = size * 0.11
    y_top = size * 0.36
    y_bot = size * 0.64
    gap = size * 0.26
    dots = [
        ((cx - gap, y_top), ACCENT),
        ((cx, y_top), TEAL),
        ((cx + gap, y_top), INDIGO),
        ((cx - gap / 2, y_bot), TEAL),
        ((cx + gap / 2, y_bot), ACCENT),
    ]
    for (x, y), color in dots:
        d.ellipse([x - r, y - r, x + r, y + r], fill=color)
    return img


def save(name: str, size: int, maskable: bool = False) -> None:
    draw_icon(size, maskable).save(OUT / name, "PNG", optimize=True)


save("icon-192.png", 192)
save("icon-512.png", 512)
save("icon-512-maskable.png", 512, maskable=True)
save("apple-touch-icon.png", 180, maskable=True)  # iOS applies its own rounding
print(f"icons written to {OUT}")
