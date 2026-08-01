"""Generate the TravelHomes brand asset set from the delivered "Final Logo" files.

Source of truth: "Final Logo/Big Black BG.png" (white artwork on pure black, 2000x1066).
Its luminance IS a clean alpha mask (86% pure 0 / 6% pure 255 / 2% antialiasing), so every
colour variant below is one recolour of the same mask -> all variants stay pixel-aligned.

Outputs -> apps/web/public/brand/
"""
import os
from collections import deque

import numpy as np
from PIL import Image, ImageOps, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "Final Logo", "Big Black BG.png")
OUT = os.path.join(ROOT, "apps", "web", "public", "brand")

TEAL = (59, 217, 217)     # #3BD9D9 - brand teal, sampled from "TH Logo.png" swatch
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
TONES = {"color": TEAL, "black": BLACK, "white": WHITE}

os.makedirs(OUT, exist_ok=True)

# ── master mask ───────────────────────────────────────────────────────────────
# crop 5px off the right edge first: the source has a 1px grey artefact stripe at x=1999
src = Image.open(SRC).convert("RGB").crop((0, 0, 1995, 1066))
mask = ImageOps.grayscale(src)
mask = mask.crop(mask.point(lambda v: 255 if v > 10 else 0).getbbox())
MW, MH = mask.size
print(f"master mask {MW}x{MH}")

# ── shape bands (empty-row scan of the master: 533-536 and 670-710) ──────────
def tight(box):
    """Crop to `box` then shrink to the artwork's own bounding box."""
    piece = mask.crop(box)
    return piece.crop(piece.getbbox())

art = {
    "stacked": mask,                       # mark over TRAVEL HOMES over tagline
    "mark": tight((0, 0, MW, 533)),        # caravan + mountains + trees
    "wordmark": tight((0, 537, MW, MH)),   # TRAVEL HOMES + tagline
    "name": tight((0, 537, MW, 670)),      # TRAVEL HOMES only
}

# ── horizontal lockup: mark left, wordmark right, optically centred ──────────
# Header/sidebar rows are wide and short; the stacked lockup puts the wordmark at
# ~17% of the total height, which is illegible below ~64px. Composing the same two
# pieces side by side triples the wordmark's rendered size at equal height.
mk, wm = art["mark"], art["wordmark"]
wm_h = round(mk.size[1] * 0.55)
wm_w = round(wm.size[0] * wm_h / wm.size[1])
wm_r = wm.resize((wm_w, wm_h), Image.LANCZOS)
gap = round(mk.size[0] * 0.06)
h_canvas = Image.new("L", (mk.size[0] + gap + wm_w, mk.size[1]), 0)
h_canvas.paste(mk, (0, 0))
h_canvas.paste(wm_r, (mk.size[0] + gap, (mk.size[1] - wm_h) // 2))
art["horizontal"] = h_canvas


# ── caravan-only silhouette, for icon sizes where the full mark turns to mush ─
def caravan_only(m):
    """The caravan body + wheel, with the mountain/tree line-work dropped.

    The mark's own bounding box is 1029x533 and the caravan sits at (282,183)-(821,488);
    cropping that window leaves only a few mountain fragments in the top corners, which
    are separate connected components, so keeping the two large blobs clears them.
    """
    crop = m.crop((272, 178, 832, 533))
    on = np.array(crop) > 100
    H, W = on.shape
    seen = np.zeros((H, W), bool)
    keep = np.zeros((H, W), bool)
    for sy in range(H):
        for sx in range(W):
            if not on[sy, sx] or seen[sy, sx]:
                continue
            q, cells = deque([(sy, sx)]), []
            seen[sy, sx] = True
            while q:
                cy, cx = q.popleft()
                cells.append((cy, cx))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and on[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            q.append((ny, nx))
            if len(cells) > 2000:  # body ~147k px, wheel ~4.8k px, fragments <200 px
                for cy, cx in cells:
                    keep[cy, cx] = True
    out = Image.fromarray((np.array(crop) * keep).astype(np.uint8))
    return out.crop(out.getbbox())


art["caravan"] = caravan_only(art["mark"])

for k, v in art.items():
    print(f"  {k:11s} {v.size[0]}x{v.size[1]}  aspect {v.size[0] / v.size[1]:.3f}")

# ── emit recoloured variants ─────────────────────────────────────────────────
# Heights are ~3x the largest on-screen use so they stay crisp on retina.
HEIGHTS = {
    "stacked": 360,
    "horizontal": 180,
    "mark": 240,
    "wordmark": 180,
    "name": 120,
    "caravan": 200,
}
written = []


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, "PNG", optimize=True)
    written.append((name, os.path.getsize(path)))


for shape, m in art.items():
    h = HEIGHTS[shape]
    w = round(m.size[0] * h / m.size[1])
    a = m.resize((w, h), Image.LANCZOS)
    for tone, rgb in TONES.items():
        img = Image.new("RGBA", (w, h), rgb + (0,))
        img.putalpha(a)
        save(img, f"logo-{shape}-{tone}.png")

# ── app icons: black artwork on a rounded brand-teal tile ────────────────────
# Matches the delivered on-teal treatment ("Small Blue BG.png" / "Travelhomes
# Caravan.png"): black art on #3BD9D9. Black-on-teal is ~14:1, so it survives 32px.
def tile(size, shape="mark", pad=0.12, radius=0.22):
    m = art[shape]
    inner = round(size * (1 - pad * 2))
    scale = min(inner / m.size[0], inner / m.size[1])
    w, h = max(1, round(m.size[0] * scale)), max(1, round(m.size[1] * scale))
    a = m.resize((w, h), Image.LANCZOS)

    art_layer = Image.new("RGBA", (size, size), BLACK + (0,))
    alpha = Image.new("L", (size, size), 0)
    alpha.paste(a, ((size - w) // 2, (size - h) // 2))
    art_layer.putalpha(alpha)

    bg = Image.new("RGBA", (size, size), TEAL + (255,))
    bg.alpha_composite(art_layer)

    # rounded corners (supersampled so the radius stays smooth at 32px)
    ss = 4
    corner = Image.new("L", (size * ss, size * ss), 0)
    ImageDraw.Draw(corner).rounded_rectangle(
        (0, 0, size * ss - 1, size * ss - 1), radius=round(size * ss * radius), fill=255
    )
    bg.putalpha(corner.resize((size, size), Image.LANCZOS))
    return bg


# Large icons keep the full mark; small ones drop to the caravan so the tab icon
# stays a recognisable silhouette instead of a smudge.
for s in (512, 192, 180):
    save(tile(s), f"icon-{s}.png")
for s in (64, 48, 32):
    save(tile(s, shape="caravan", pad=0.16), f"icon-{s}.png")

# multi-resolution favicon.ico for the browser tab / bookmarks bar
ico = tile(256, shape="caravan", pad=0.16)
ico.save(os.path.join(OUT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
written.append(("favicon.ico", os.path.getsize(os.path.join(OUT, "favicon.ico"))))

# ── social preview: 1200x630, black lockup on brand teal ─────────────────────
og = Image.new("RGBA", (1200, 630), TEAL + (255,))
m = art["stacked"]
h = 430
w = round(m.size[0] * h / m.size[1])
a = m.resize((w, h), Image.LANCZOS)
layer = Image.new("RGBA", (1200, 630), BLACK + (0,))
al = Image.new("L", (1200, 630), 0)
al.paste(a, ((1200 - w) // 2, (630 - h) // 2))
layer.putalpha(al)
og.alpha_composite(layer)
save(og.convert("RGB"), "og-image.png")

print(f"\n{len(written)} files -> {OUT}")
total = 0
for n, b in written:
    total += b
    print(f"  {n:26s} {b/1024:7.1f} KB")
print(f"  {'TOTAL':26s} {total/1024:7.1f} KB")
