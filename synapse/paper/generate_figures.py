"""Generate Fig. 1 and Fig. 2 PNGs for SyNAPSE ICAMAC paper."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("pip install pillow")

OUT = Path(__file__).parent


def box(draw, xy, text, fill, font):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=8, fill=fill, outline="#333333", width=2)
    tw, th = draw.textbbox((0, 0), text, font=font)[2:]
    draw.text((x0 + (x1 - x0 - tw) / 2, y0 + (y1 - y0 - th) / 2), text, fill="#111111", font=font)


def arrow(draw, p0, p1):
    draw.line([p0, p1], fill="#333333", width=2)
    x1, y1 = p1
    if abs(p1[0] - p0[0]) > abs(p1[1] - p0[1]):
        sign = 1 if p1[0] > p0[0] else -1
        draw.polygon([(x1, y1), (x1 - 8 * sign, y1 - 5), (x1 - 8 * sign, y1 + 5)], fill="#333333")
    else:
        sign = 1 if p1[1] > p0[1] else -1
        draw.polygon([(x1, y1), (x1 - 5, y1 - 8 * sign), (x1 + 5, y1 - 8 * sign)], fill="#333333")


def fig1(path: Path):
    w, h = 820, 400
    img = Image.new("RGB", (w, h), "white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    font_s = font

    box(draw, (30, 150, 170, 230), "React SPA\n4 roles", "#D6E4FF", font_s)
    box(draw, (230, 130, 430, 250), "FastAPI\n44 REST + 2 WS", "#D9F2D9", font_s)
    box(draw, (500, 60, 650, 130), "DeepFace\n(in-proc)", "#FFE4C4", font_s)
    box(draw, (500, 150, 650, 220), "Ollama\nllama3", "#FFE4C4", font_s)
    box(draw, (500, 260, 700, 340), "SQLite\n21 tables\n(labels only)", "#E8E8E8", font_s)

    arrow(draw, (170, 190), (230, 190))
    draw.text((188, 172), "JWT", fill="#333333", font=font_s)
    arrow(draw, (430, 170), (500, 95))
    arrow(draw, (430, 190), (500, 185))
    arrow(draw, (430, 210), (500, 300))

    img.save(path)


def fig2(path: Path):
    w, h = 820, 360
    img = Image.new("RGB", (w, h), "white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()

    labels = ["Webcam", "Detect", "Log label", "Alert?"]
    xs = [40, 200, 360, 520]
    y = 80
    for i, (x, lab) in enumerate(zip(xs, labels)):
        box(draw, (x, y, x + 120, y + 50), lab, "#F0F0F0", font)
        if i < len(xs) - 1:
            arrow(draw, (x + 120, y + 25), (xs[i + 1], y + 25))

    box(draw, (200, 200, 320, 250), "Gen cards", "#E8F5E9", font)
    box(draw, (360, 200, 480, 250), "Select", "#E8F5E9", font)
    arrow(draw, (280, 130), (260, 200))
    arrow(draw, (320, 225), (360, 225))
    draw.text((540, 140), "WS if >= 0.35", fill="#333333", font=font)

    img.save(path)


if __name__ == "__main__":
    fig1(OUT / "fig1_architecture.png")
    fig2(OUT / "fig2_pipeline.png")
    print("Wrote", OUT / "fig1_architecture.png", OUT / "fig2_pipeline.png")
