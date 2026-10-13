#!/usr/bin/env python3
"""Genera assets/items.png (220 iconos, rejilla 16x14, celdas 32px, arte 16x16 x2)
y assets/skills.png (21 iconos, rejilla 3x7) con la paleta y el estilo pixel del juego.
Cada objeto es distinto: la forma depende del tipo y el color del material/gema/frasco."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
INK = (13, 20, 34, 255)
GOLD = (242, 193, 78, 255); GOLD_D = (178, 128, 42, 255)
TEAL = (87, 230, 184, 255); PAPER = (243, 226, 187, 255)
# materiales de armas/armaduras por nivel: madera, hierro, acero, bronce, plata, oro, cristal, obsidiana, estelar, runico
MAT = [(140, 96, 58, 255), (150, 158, 170, 255), (203, 219, 238, 255), (198, 132, 74, 255),
       (226, 232, 240, 255), (242, 193, 78, 255), (87, 230, 184, 255), (92, 74, 128, 255),
       (120, 170, 255, 255), (240, 120, 90, 255)]
GEM = [(87, 200, 140, 255), (60, 60, 80, 255), (240, 170, 60, 255), (64, 224, 208, 255),
       (230, 60, 80, 255), (70, 110, 240, 255), (60, 220, 120, 255), (170, 90, 220, 255),
       (240, 230, 200, 255), (240, 190, 90, 255), (160, 40, 60, 255), (245, 240, 230, 255),
       (240, 110, 90, 255), (50, 90, 200, 255), (120, 50, 60, 255), (240, 150, 170, 255),
       (210, 110, 50, 255), (110, 220, 220, 255), (240, 220, 90, 255), (45, 45, 60, 255)]
LIQ = {"heal": (231, 90, 110, 255), "resource": (90, 150, 250, 255), "cleanse": (120, 230, 200, 255),
       "regen": (110, 220, 120, 255), "return": (180, 120, 240, 255), "bomb": (245, 150, 60, 255)}


def canvas():
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def sword(d, m, gem):
    d.polygon([(8, 1), (9, 3), (9, 10), (7, 10), (7, 3)], fill=m, outline=INK)
    d.line([5, 11, 11, 11], fill=GOLD_D, width=2)
    d.line([8, 12, 8, 14], fill=(99, 66, 38, 255), width=2); d.point([8, 15], fill=gem)


def axe(d, m, gem):
    d.line([6, 14, 9, 3], fill=(99, 66, 38, 255), width=2)
    d.polygon([(9, 2), (13, 3), (13, 6), (9, 6)], fill=m, outline=INK)
    d.polygon([(6, 4), (3, 5), (3, 8), (6, 8)], fill=m, outline=INK); d.point([9, 4], fill=gem)


def bow(d, m, gem):
    d.arc([3, 1, 12, 14], 300, 60, fill=m, width=2)
    d.line([10, 2, 10, 13], fill=PAPER)
    d.line([4, 7, 13, 7], fill=(203, 219, 238, 255), width=1); d.polygon([(13, 6), (15, 7), (13, 8)], fill=gem)


def staff(d, m, gem):
    d.line([6, 15, 8, 5], fill=(99, 66, 38, 255), width=2)
    d.ellipse([5, 1, 11, 6], fill=gem, outline=INK); d.point([8, 3], fill=(255, 255, 255, 255))


def dagger(d, m, gem):
    d.polygon([(9, 2), (10, 4), (8, 9), (6, 8)], fill=m, outline=INK)
    d.line([5, 9, 8, 12], fill=GOLD_D, width=2); d.line([4, 12, 6, 14], fill=(99, 66, 38, 255), width=2)


def spear(d, m, gem):
    d.line([5, 15, 9, 5], fill=(99, 66, 38, 255), width=2)
    d.polygon([(10, 1), (12, 3), (9, 6), (8, 4)], fill=m, outline=INK); d.point([10, 3], fill=gem)


def armor(d, m, trim, style):
    d.polygon([(5, 3), (11, 3), (12, 5), (11, 7), (11, 13), (5, 13), (5, 7), (4, 5)], fill=m, outline=INK)
    if style % 3 == 0: d.line([5, 8, 11, 8], fill=trim); d.line([8, 3, 8, 13], fill=trim)
    elif style % 3 == 1:
        for y in (6, 9, 12): d.line([5, y, 11, y], fill=trim)
    else: d.ellipse([6, 6, 10, 10], outline=trim)
    d.polygon([(6, 1), (10, 1), (11, 3), (5, 3)], fill=trim)


def amulet(d, gem, shape):
    d.arc([5, 1, 11, 6], 0, 180, fill=GOLD_D)
    if shape == 0: d.ellipse([6, 5, 10, 11], fill=gem, outline=INK)
    elif shape == 1: d.polygon([(8, 5), (11, 9), (8, 13), (5, 9)], fill=gem, outline=INK)
    elif shape == 2: d.polygon([(8, 5), (10, 9), (8, 13), (6, 9)], fill=gem, outline=INK)
    else: d.polygon([(8, 4), (9, 7), (12, 7), (9, 8), (10, 12), (8, 9), (6, 12), (7, 8), (4, 7), (7, 7)], fill=gem, outline=INK)
    d.point([7, 7], fill=(255, 255, 255, 255))


def necklace(d, gem, shape):
    d.arc([2, 0, 14, 9], 20, 160, fill=GOLD_D, width=2)
    d.line([8, 7, 8, 9], fill=GOLD_D)
    if shape % 2: d.polygon([(8, 9), (11, 12), (8, 15), (5, 12)], fill=gem, outline=INK)
    else: d.ellipse([5, 9, 11, 14], fill=gem, outline=INK)
    d.point([7, 11], fill=(255, 255, 255, 255))


def ring(d, metal, gem):
    d.ellipse([4, 6, 12, 14], outline=metal, width=2)
    d.ellipse([6, 2, 10, 6], fill=gem, outline=INK); d.point([7, 3], fill=(255, 255, 255, 255))


def relic(d, i):
    c1, c2 = GEM[i % 20], GEM[(i + 7) % 20]
    k = i % 8
    if k == 0: d.ellipse([4, 3, 12, 12], fill=c1, outline=INK); d.ellipse([6, 6, 10, 9], fill=INK)
    elif k == 1: d.rectangle([5, 3, 11, 13], fill=c1, outline=INK); d.line([8, 3, 8, 13], fill=INK)
    elif k == 2: d.polygon([(8, 2), (12, 6), (8, 14), (4, 6)], fill=c1, outline=INK); d.line([8, 2, 8, 14], fill=c2)
    elif k == 3: d.rectangle([6, 6, 10, 14], fill=PAPER, outline=INK); d.polygon([(8, 1), (10, 4), (8, 6), (6, 4)], fill=(245, 150, 60, 255))
    elif k == 4: d.ellipse([4, 4, 12, 13], fill=c1, outline=INK); d.point([6, 8], fill=INK); d.point([10, 8], fill=INK)
    elif k == 5: d.rectangle([5, 2, 11, 4], fill=GOLD_D); d.rectangle([5, 12, 11, 14], fill=GOLD_D); d.line([6, 4, 10, 12], fill=c1); d.line([10, 4, 6, 12], fill=c1)
    elif k == 6: d.ellipse([3, 3, 13, 13], outline=c1, width=2); d.ellipse([6, 6, 10, 10], fill=c2, outline=INK)
    else: d.polygon([(5, 13), (5, 5), (11, 3), (11, 7), (8, 8), (11, 10), (6, 13)], fill=c1, outline=INK)


def potion(d, eff, i):
    col = LIQ[eff]; shape = i % 4
    d.rectangle([7, 1, 9, 3], fill=(196, 164, 108, 255))
    if shape == 0: d.ellipse([4, 5, 12, 14], fill=(52, 66, 84, 255), outline=INK); d.ellipse([5, 8, 11, 13], fill=col)
    elif shape == 1: d.polygon([(6, 3), (10, 3), (12, 14), (4, 14)], fill=(52, 66, 84, 255), outline=INK); d.polygon([(6, 9), (10, 9), (11, 13), (5, 13)], fill=col)
    elif shape == 2: d.rectangle([5, 4, 11, 14], fill=(52, 66, 84, 255), outline=INK); d.rectangle([6, 9, 10, 13], fill=col)
    else: d.ellipse([5, 4, 11, 10], fill=(52, 66, 84, 255), outline=INK); d.rectangle([6, 10, 10, 14], fill=col, outline=INK)
    d.point([6, 7], fill=(230, 240, 250, 255))


raw = (ROOT / "data" / "content.js").read_text(encoding="utf-8")
data = json.loads(raw[raw.index("=") + 1:].strip().rstrip(";"))
items = data["items"]
W_DRAW = [sword, axe, bow, staff, dagger, spear]
sheet = Image.new("RGBA", (16 * 32, 14 * 32), (0, 0, 0, 0))
for it in items:
    img, d = canvas(); n = it["sprite"]
    if it["slot"] == "weapon":
        W_DRAW[(n // 10) % 6](d, MAT[n % 10], GEM[(n * 3) % 20])
    elif it["slot"] == "armor":
        armor(d, MAT[n % 10], GOLD if n % 10 >= 5 else (122, 143, 168, 255), (n // 10) % 6)
    elif it["slot"] == "amulet": amulet(d, GEM[n % 20], n % 4)
    elif it["slot"] == "necklace": necklace(d, GEM[(n + 5) % 20], n)
    elif it["slot"] == "ring": ring(d, MAT[n % 10], GEM[(n + 9) % 20])
    elif it["slot"] == "relic": relic(d, n)
    else: potion(d, it["effect"], n)
    img = img.resize((32, 32), Image.NEAREST)
    sheet.paste(img, ((n % 16) * 32, (n // 16) * 32), img)
sheet.save(ROOT / "assets" / "items.png")
print("OK items.png", sheet.size, len(items), "iconos")

# ---------- iconos de habilidades: rejilla 12 (habilidad) x 8 (7 clases + pasivas) ----------
CLASS_COL = [(150, 170, 200, 255), (120, 170, 255, 255), (140, 220, 140, 255), (200, 140, 220, 255),
             (235, 90, 100, 255), (150, 220, 220, 255), (250, 140, 70, 255)]


def badge(d, c):
    d.rounded_rectangle([1, 1, 14, 14], 3, fill=(16, 26, 44, 255), outline=c, width=1)


def sk_shield(d, c): d.polygon([(8, 3), (11, 4), (11, 8), (8, 13), (5, 8), (5, 4)], fill=c, outline=INK); d.line([8, 5, 8, 10], fill=INK)
def sk_sweep(d, c):
    for a in (-2, 0, 2): d.line([8, 12, 8 + a * 2, 4], fill=c, width=2)
    d.arc([3, 2, 13, 9], 180, 360, fill=GOLD, width=1)
def sk_dash(d, c): d.polygon([(4, 5), (9, 5), (12, 8), (9, 11), (4, 11), (6, 8)], fill=c, outline=INK)
def sk_bolt(d, c): d.polygon([(9, 2), (4, 9), (7, 9), (6, 14), (12, 6), (9, 6)], fill=c, outline=INK)
def sk_freeze(d, c):
    d.line([8, 3, 8, 13], fill=c, width=2); d.line([4, 5, 12, 11], fill=c, width=2); d.line([12, 5, 4, 11], fill=c, width=2)
def sk_heal(d, c): d.rectangle([7, 4, 9, 12], fill=c); d.rectangle([4, 6, 12, 9], fill=c)
def sk_poison(d, c): d.polygon([(8, 3), (11, 9), (10, 12), (6, 12), (5, 9)], fill=c, outline=INK); d.point([8, 10], fill=(255, 255, 255, 255))
def sk_bleed(d, c): d.polygon([(8, 2), (12, 8), (10, 13), (6, 13), (4, 8)], fill=(235, 90, 100, 255), outline=INK)
def sk_evade(d, c): d.arc([3, 3, 13, 13], 90, 330, fill=c, width=2); d.polygon([(11, 2), (14, 5), (10, 5)], fill=c)
def sk_drain(d, c):
    d.polygon([(8, 2), (12, 8), (10, 12), (6, 12), (4, 8)], fill=c, outline=INK)
    d.polygon([(8, 8), (9, 10), (8, 12), (7, 10)], fill=(235, 90, 100, 255))
def sk_blood(d, c): d.ellipse([3, 3, 8, 9], fill=c, outline=INK); d.ellipse([8, 7, 13, 13], fill=(235, 90, 100, 255), outline=INK)
def sk_summon(d, c): d.ellipse([4, 3, 12, 13], outline=c, width=2); d.ellipse([6, 6, 10, 10], fill=c)
def sk_burn(d, c):
    d.polygon([(8, 2), (11, 6), (12, 9), (11, 13), (5, 13), (4, 9), (6, 5)], fill=(250, 140, 70, 255), outline=INK)
    d.polygon([(8, 7), (10, 10), (8, 13), (6, 10)], fill=GOLD)
def sk_nova(d, c): d.ellipse([3, 3, 13, 13], outline=(250, 140, 70, 255), width=2); d.ellipse([6, 6, 10, 10], fill=GOLD, outline=INK)
def sk_resource(d, c):
    pts = [(8, 2), (9, 6), (13, 6), (10, 9), (11, 13), (8, 10), (5, 13), (6, 9), (3, 6), (7, 6)]
    d.polygon(pts, fill=c, outline=GOLD_D)

SK = {"shield": sk_shield, "sweep": sk_sweep, "dash": sk_dash, "bolt": sk_bolt, "freeze": sk_freeze,
      "heal": sk_heal, "poison": sk_poison, "bleed": sk_bleed, "evade": sk_evade, "drain": sk_drain,
      "blood": sk_blood, "summon": sk_summon, "burn": sk_burn, "nova": sk_nova, "resource": sk_resource}
skills_sheet = Image.new("RGBA", (12 * 32, 8 * 32), (0, 0, 0, 0))
for ci, cls in enumerate(data["classes"]):
    for si, sk in enumerate(cls["skills"]):
        img, d = canvas()
        badge(d, CLASS_COL[ci])
        SK[sk["kind"]](d, CLASS_COL[ci])
        img = img.resize((32, 32), Image.NEAREST)
        skills_sheet.paste(img, (si * 32, ci * 32), img)

def sk_pass_atk(d, c):
    d.polygon([(10, 3), (11, 4), (8, 10), (6, 9)], fill=(203, 219, 238, 255), outline=INK)
    d.line([5, 10, 8, 13], fill=GOLD_D, width=2)
def sk_pass_def(d, c): sk_shield(d, (190, 200, 215, 255))
def sk_pass_reg(d, c):
    d.ellipse([4, 4, 7, 7], fill=(231, 126, 142, 255)); d.ellipse([9, 4, 12, 7], fill=(231, 126, 142, 255))
    d.polygon([(4, 6), (12, 6), (8, 12)], fill=(231, 126, 142, 255))
for pi, fn in enumerate([sk_pass_atk, sk_pass_def, sk_pass_reg]):
    img, d = canvas(); badge(d, GOLD); fn(d, GOLD)
    img = img.resize((32, 32), Image.NEAREST)
    skills_sheet.paste(img, (pi * 32, 7 * 32), img)
skills_sheet.save(ROOT / "assets" / "skills.png")
print("OK skills.png", skills_sheet.size, "84 iconos")
