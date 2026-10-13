#!/usr/bin/env python3
"""Genera assets/ui/icons.png: hoja de iconos UI 4x4 (celdas 32px, arte 16x16 x2)
con el mismo estilo pixel y paleta del juego. Reproducible, sin dependencias externas salvo Pillow.
Orden de iconos (indice): 0 mochila, 1 arbol, 2 mision, 3 mapa, 4 pausa, 5 atacar,
6 interactuar, 7 esperar, 8 curar, 9 habilidad, 10 oro, 11 fragmento, 12 ajustes,
13 grieta, 14 cerrar, 15 corazon."""
from PIL import Image, ImageDraw

CELL = 32
COLS = ROWS = 4
INK = (13, 20, 34, 255)
GOLD = (242, 193, 78, 255)
GOLD_D = (178, 128, 42, 255)
TEAL = (87, 230, 184, 255)
TEAL_D = (35, 148, 116, 255)
BLUE = (143, 195, 255, 255)
STEEL = (203, 219, 238, 255)
STEEL_D = (122, 143, 168, 255)
RED = (231, 126, 142, 255)
RED_D = (168, 62, 82, 255)
PAPER = (243, 226, 187, 255)
PAPER_D = (196, 164, 108, 255)
LEATHER = (154, 107, 67, 255)
LEATHER_D = (99, 66, 38, 255)
SKIN = (240, 198, 152, 255)


def canvas():
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def backpack(d):
    d.rectangle([4, 3, 11, 4], fill=LEATHER_D)                 # asa superior
    d.rectangle([3, 5, 12, 14], fill=LEATHER, outline=INK)      # cuerpo
    d.rectangle([3, 5, 12, 8], fill=LEATHER_D)                  # solapa
    d.rectangle([5, 10, 10, 14], fill=LEATHER_D, outline=INK)   # bolsillo
    d.rectangle([7, 8, 8, 10], fill=GOLD)                       # hebilla
    d.rectangle([3, 9, 3, 12], fill=GOLD_D); d.rectangle([12, 9, 12, 12], fill=GOLD_D)


def skill_tree(d):
    d.rectangle([7, 10, 8, 14], fill=LEATHER_D)                 # tronco
    d.line([7, 11, 4, 8], fill=LEATHER_D); d.line([8, 11, 11, 8], fill=LEATHER_D)
    for cx, cy in [(4, 5), (11, 5), (7, 2)]:                    # nodos
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=TEAL_D, outline=INK)
    d.line([5, 6, 6, 4], fill=TEAL_D); d.line([10, 6, 9, 4], fill=TEAL_D); d.line([7, 4, 7, 5], fill=TEAL_D)
    for cx, cy in [(4, 5), (11, 5), (7, 2)]:
        d.ellipse([cx - 1, cy - 1, cx + 1, cy + 1], fill=GOLD)


def quest(d):
    d.rectangle([3, 3, 12, 13], fill=PAPER, outline=PAPER_D)    # pergamino
    d.rectangle([2, 2, 13, 4], fill=PAPER_D)                    # rollo sup.
    d.rectangle([2, 12, 13, 14], fill=PAPER_D)                  # rollo inf.
    d.rectangle([7, 6, 8, 10], fill=RED_D)                      # !
    d.point([7, 12], fill=RED_D); d.point([8, 12], fill=RED_D); d.point([7, 11], fill=RED_D); d.point([8, 11], fill=RED_D)


def map_icon(d):
    d.rectangle([2, 4, 13, 12], fill=PAPER, outline=PAPER_D)
    d.line([5, 4, 5, 12], fill=PAPER_D); d.line([10, 4, 10, 12], fill=PAPER_D)  # pliegues
    for x, y in [(3, 10), (4, 9), (6, 8), (7, 7), (8, 6)]:     # ruta
        d.point([x, y], fill=TEAL_D); d.point([x + 1, y], fill=TEAL_D)
    d.line([11, 9, 13, 11], fill=RED_D); d.line([13, 9, 11, 11], fill=RED_D)   # X


def pause(d):
    d.rounded_rectangle([2, 2, 13, 13], 3, fill=(28, 42, 66, 255), outline=BLUE)
    d.rectangle([5, 5, 6, 10], fill=GOLD); d.rectangle([9, 5, 10, 10], fill=GOLD)


def attack(d):
    d.line([4, 12, 10, 6], fill=STEEL_D, width=2)               # hoja
    d.polygon([(9, 3), (12, 2), (11, 6), (8, 6)], fill=STEEL, outline=STEEL_D)  # punta
    d.line([4, 9, 7, 12], fill=GOLD, width=2)                   # guarda
    d.line([3, 13, 5, 11], fill=LEATHER_D, width=2)             # mango
    d.point([3, 13], fill=GOLD)


def interact(d):
    d.rectangle([3, 2, 12, 7], fill=SKIN, outline=INK)          # dedos unidos
    d.line([6, 2, 6, 7], fill=INK); d.line([9, 2, 9, 7], fill=INK)
    d.rectangle([3, 7, 13, 14], fill=SKIN, outline=INK)         # palma
    d.rectangle([13, 9, 15, 12], fill=SKIN, outline=INK)        # pulgar
    d.line([5, 11, 11, 11], fill=PAPER_D)
    for x, y in [(1, 1), (14, 1)]:                              # destellos
        d.point([x, y], fill=GOLD); d.point([x, y - 1], fill=GOLD); d.point([x, y + 1], fill=GOLD)


def wait(d):
    d.rectangle([4, 2, 11, 3], fill=GOLD_D); d.rectangle([4, 12, 11, 13], fill=GOLD_D)
    d.line([5, 4, 10, 11], fill=BLUE); d.line([10, 4, 5, 11], fill=BLUE)
    d.polygon([(6, 5), (9, 5), (7, 7)], fill=TEAL)              # arena arriba
    d.polygon([(6, 11), (9, 11), (7, 8)], fill=TEAL)            # arena abajo


def heal(d):
    d.rectangle([7, 2, 8, 4], fill=PAPER_D)                     # corcho
    d.rectangle([6, 4, 9, 6], fill=STEEL_D)                     # cuello
    d.ellipse([4, 6, 11, 14], fill=(70, 30, 44, 255), outline=STEEL_D)  # frasco
    d.ellipse([5, 9, 10, 13], fill=RED)                         # pocion
    d.point([6, 8], fill=PAPER); d.point([7, 7], fill=PAPER)


def skill(d):
    pts = [(8, 1), (9, 6), (14, 6), (10, 9), (12, 14), (8, 11), (4, 14), (6, 9), (2, 6), (7, 6)]
    d.polygon(pts, fill=GOLD, outline=GOLD_D)
    d.point([8, 8], fill=PAPER)


def coin(d):
    d.ellipse([3, 3, 12, 12], fill=GOLD, outline=GOLD_D)
    d.ellipse([5, 5, 10, 10], outline=GOLD_D)
    d.point([7, 7], fill=GOLD_D); d.point([8, 8], fill=GOLD_D)


def shard(d):
    d.polygon([(8, 1), (12, 6), (8, 14), (4, 6)], fill=TEAL, outline=TEAL_D)
    d.line([8, 1, 8, 14], fill=TEAL_D); d.line([4, 6, 12, 6], fill=TEAL_D)
    d.point([7, 4], fill=(220, 255, 244, 255))


def settings(d):
    for x, y in [(7, 1), (11, 3), (13, 7), (11, 11), (7, 13), (3, 11), (1, 7), (3, 3)]:
        d.rectangle([x - 1, y - 1, x + 1, y + 1], fill=STEEL_D)
    d.ellipse([4, 4, 11, 11], fill=STEEL, outline=STEEL_D)
    d.ellipse([6, 6, 9, 9], fill=INK)


def rift(d):
    d.polygon([(8, 1), (13, 8), (8, 15), (3, 8)], outline=TEAL, width=2)
    d.polygon([(8, 4), (11, 8), (8, 12), (5, 8)], fill=TEAL_D)


def close(d):
    d.line([4, 4, 11, 11], fill=RED, width=2); d.line([11, 4, 4, 11], fill=RED, width=2)


def heart(d):
    d.ellipse([3, 3, 7, 7], fill=RED); d.ellipse([8, 3, 12, 7], fill=RED)
    d.polygon([(3, 6), (12, 6), (7, 13)], fill=RED)
    d.point([5, 5], fill=PAPER)


ICONS = [backpack, skill_tree, quest, map_icon, pause, attack, interact, wait,
         heal, skill, coin, shard, settings, rift, close, heart]

sheet = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
for i, fn in enumerate(ICONS):
    img, d = canvas()
    fn(d)
    img = img.resize((CELL, CELL), Image.NEAREST)
    sheet.paste(img, ((i % COLS) * CELL, (i // COLS) * CELL), img)
out = "assets/ui/icons.png"
sheet.save(out)
print("OK", out, sheet.size, "iconos:", len(ICONS))
