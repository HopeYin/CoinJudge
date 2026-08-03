# 生成 PWA 图标：把 public/icon.svg 的像素小怪兽用 Pillow 逐矩形复刻成 PNG
# （环境里没有 SVG 渲染器；图标本来就是纯矩形，直接照抄坐标最保真）
from PIL import Image, ImageDraw

W = 200  # 原 SVG 画布


def draw_icon(size: int) -> Image.Image:
    s = size / W
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def R(x, y, w, h, color):
        d.rectangle([round(x * s), round(y * s), round((x + w) * s) - 1, round((y + h) * s) - 1], fill=color)

    # 背景：圆角 + 上浅下深两色蓝
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=round(44 * s), fill="#5ba8f5")
    d.rounded_rectangle([0, 0, size - 1, round(100 * s) - 1], radius=round(44 * s), fill="#6db4f7")
    d.rectangle([0, round(56 * s), size - 1, round(100 * s) - 1], fill="#6db4f7")

    # 像素金币（右上）
    ring = [
        (124, 20), (132, 20), (140, 20), (148, 20),
        (116, 28), (156, 28),
        (112, 36), (160, 36),
        (112, 44), (160, 44),
        (112, 52), (160, 52),
        (116, 60), (156, 60),
        (124, 68), (132, 68), (140, 68), (148, 68),
    ]
    for x, y in ring:
        R(x, y, 8, 8, "#f9a825")
    R(124, 28, 32, 40, "#ffd54f")
    R(120, 36, 8, 24, "#ffd54f")
    R(152, 36, 8, 24, "#ffd54f")
    R(124, 28, 8, 8, "#fff9c4")
    R(132, 28, 8, 8, "#fff9c4")
    R(124, 36, 8, 8, "#fff9c4")
    R(132, 36, 8, 4, "#f57f17")
    R(128, 40, 16, 4, "#f57f17")
    R(132, 44, 8, 12, "#f57f17")
    R(128, 48, 16, 4, "#f57f17")

    # 像素小怪兽（左下）
    R(20, 108, 96, 72, "#ffffff")
    R(20, 108, 96, 8, "#f0f4ff")
    R(108, 116, 8, 64, "#dde4f0")
    R(20, 172, 96, 8, "#dde4f0")
    R(36, 124, 20, 20, "#1a1a1a")
    R(76, 124, 20, 20, "#1a1a1a")
    R(8, 132, 12, 12, "#ffffff")
    R(116, 132, 12, 12, "#ffffff")
    R(28, 180, 28, 16, "#ffffff")
    R(28, 180, 28, 6, "#dde4f0")
    R(80, 180, 28, 16, "#ffffff")
    R(80, 180, 28, 6, "#dde4f0")
    return img


for size, name in [(512, "pwa-512.png"), (192, "pwa-192.png"), (180, "apple-touch-icon.png")]:
    draw_icon(size).save(f"public/{name}")
    print(f"{name} {size}x{size} ok")
