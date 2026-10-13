#!/usr/bin/env python3
"""Pixel Studio de Riftbound: pinta sprites por mapas de caracteres y los analiza.

Uso:
  python3 tools/pixel_studio.py brujo            -> genera assets/characters/brujo.png y su preview
  python3 tools/pixel_studio.py analizar RUTA    -> informe de frames/paleta + preview

Cada frame es un mapa de 16x16 caracteres; cada caracter es un color de la paleta.
Las piernas (filas 12-15) se componen por direccion y fase de paso (quieto/paso1/paso2),
y el ciclo exportado es [quieto, paso1, quieto, paso2] como en los RPG top-down clasicos.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CELL = 16

PALETTE = {
    ".": (0, 0, 0, 0),        # transparente
    "H": (20, 16, 28, 255),   # pelo negro
    "h": (43, 32, 61, 255),   # pelo luz
    "P": (232, 180, 140, 255),# piel
    "R": (255, 59, 78, 255),  # ojos rojos
    "V": (123, 63, 212, 255), # violeta
    "v": (66, 34, 112, 255),  # violeta oscuro
    "N": (23, 18, 33, 255),   # tunica negra
    "n": (38, 29, 56, 255),   # tunica luz
    "G": (242, 193, 78, 255), # dorado
    "B": (13, 10, 20, 255),   # botas
    "W": (107, 74, 47, 255),  # madera baston
    "L": (224, 107, 216, 255),# gema del baston
}

# ---- cuerpo (filas 0-11) por direccion ----
BODY = {
"abajo": [
"................",
".....HHHHHH.....",
"....HHHHHHHH....",
"....HHhhhhHH....",
"....HPPPPPPH....",
"....HPRPPRPH....",
"....HPPPPPPH....",
".....NNNNNN.....",
"....NNNVVNNNW...",
"....nNNVVNNWL...",
"...NNNNVVNNNW...",
"...NNNGGNNNNW...",
],
"arriba": [
"................",
".....HHHHHH.....",
"....HHHHHHHH....",
"....HHhhhhHH....",
"....HHHHHHHH....",
"....HHHHHHHH....",
"....HHHHHHHH....",
".....NNNNNN.....",
"....NNNVVNNNW...",
"....nNNVVNNWL...",
"...NNNNVVNNNW...",
"...NNNGGNNNNW...",
],
"izquierda": [
"................",
".....HHHHHH.....",
"....HHHHHHH.....",
"....HHhhHHH.....",
"....HPPPPPP.....",
"....RPPPPP......",
"....PPPPP.......",
".....NNNNN..W...",
"....NNNNNV.WL...",
"....NNNNNV..W...",
"...NNNNNN...W...",
"...NNNNN....W...",
],
"derecha": [
"................",
".....HHHHHH.....",
".....HHHHHHH....",
".....HHhhHHH....",
".....PPPPPPH....",
"......PPPPPR....",
".......PPPPP....",
"...W...NNNNN....",
"...LW.VNNNNN....",
"...W..VNNNNN....",
"...W..NNNNNN....",
"...W....NNNNN...",
],
}
# ---- piernas (filas 12-15): quieto, paso1, paso2 por direccion ----
LEGS = {
"abajo": {
 "quieto": ["....NNN..NNN....","....NNN..NNN....","....BB....BB....","...BBB....BBB..."],
 "paso1":  ["...NNN....NNN...","...NNN.....NNN..","..BBB.......BB..","..BB.........BBB"],
 "paso2":  ["....NNN..NNN....",".....NNN.NNN....","......BBB.BB....",".....BB....BBB.."],
},
"arriba": {
 "quieto": ["....NNN..NNN....","....NNN..NNN....","....BB....BB....","...BBB....BBB..."],
 "paso1":  ["...NNN....NNN...","...NNN.....NNN..","..BBB.......BB..","..BB.........BBB"],
 "paso2":  ["....NNN..NNN....",".....NNN.NNN....","......BBB.BB....",".....BB....BBB.."],
},
"izquierda": {
 "quieto": ["....NNNNNN......","....NNNNNN......",".....BB.BB......","....BBB.BBB....."],
 "paso1":  ["...NNNNNN.......","..NNNNNN........","..BBB..BB.......","..BB....BBB....."],
 "paso2":  [".....NNNNNN.....","......NNNNNN....",".......BB.BBB...","......BBB..BB..."],
},
"derecha": {
 "quieto": ["......NNNNNN....","......NNNNNN....","......BB.BB.....",".....BBB.BBB...."],
 "paso1":  [".......NNNNNN...","........NNNNNN..",".......BB..BBB..","......BBB..BB..."],
 "paso2":  [".....NNNNNN.....","....NNNNNN......","...BBB..BB......","....BB....BBB..."],
},
}
DIRECTIONS = ["abajo", "arriba", "izquierda", "derecha"]
CYCLE = ["quieto", "paso1", "quieto", "paso2"]


def frame_image(direction, phase):
    rows = BODY[direction] + LEGS[direction][phase]
    assert len(rows) == 16 and all(len(r) == 16 for r in rows), direction
    img = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            px[x, y] = PALETTE[ch]
    return img


def build_sheet():
    sheet = Image.new("RGBA", (CELL * 4, CELL * 4), (0, 0, 0, 0))
    for r, d in enumerate(DIRECTIONS):
        for c, ph in enumerate(CYCLE):
            sheet.paste(frame_image(d, ph), (c * CELL, r * CELL), frame_image(d, ph))
    return sheet


def preview(sheet, out):
    scale = 12
    bg = Image.new("RGBA", (sheet.width * scale + 20, sheet.height * scale + 20), (24, 33, 48, 255))
    big = sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST)
    bg.paste(big, (10, 10), big)
    # muestra en tamano de juego (24px) sobre suelo de bioma
    floor = Image.new("RGBA", (260, 70), (36, 59, 52, 255))
    for i, d in enumerate(DIRECTIONS):
        f = sheet.crop((0, DIRECTIONS.index(d) * CELL, CELL, DIRECTIONS.index(d) * CELL + CELL))
        f24 = f.resize((24, 24), Image.NEAREST)
        floor.paste(f24, (10 + i * 62, 8), f24)
        f48 = f.resize((48, 48), Image.NEAREST)
        floor.paste(f48, (10 + i * 62, 34), f48)
    combo = Image.new("RGBA", (max(bg.width, floor.width), bg.height + floor.height + 8), (16, 24, 40, 255))
    combo.paste(bg, (0, 0)); combo.paste(floor, (0, bg.height + 8))
    combo.convert("RGB").save(out, quality=90)
    return out


def analyze(path):
    sheet = Image.open(path).convert("RGBA")
    print(f"Hoja: {sheet.width}x{sheet.height} (celdas de {CELL})")
    cols, rows = sheet.width // CELL, sheet.height // CELL
    problems = 0
    for r in range(rows):
        for c in range(cols):
            f = sheet.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))
            px = list(f.getdata())
            solid = sum(1 for p in px if p[3] > 0)
            xs = [i % CELL for i, p in enumerate(px) if p[3] > 0]
            ys = [i // CELL for i, p in enumerate(px) if p[3] > 0]
            if solid == 0:
                print(f"  frame[{r}][{c}] VACIO"); problems += 1; continue
            cx = (min(xs) + max(xs)) / 2
            print(f"  frame[{r}][{c}] pixeles={solid:3d} ancho={max(xs)-min(xs)+1:2d} alto={max(ys)-min(ys)+1:2d} centro_x={cx:.1f}")
            if abs(cx - 7.5) > 2.5:
                print(f"    aviso: muy descentrado"); problems += 1
    colors = {p for p in sheet.getdata() if p[3] > 0}
    print(f"Paleta usada: {len(colors)} colores solidos")
    print("Problemas:", problems)
    return problems


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "analizar":
        sys.exit(1 if analyze(sys.argv[2]) else 0)
    sheet = build_sheet()
    out = ROOT / "assets" / "characters" / "brujo.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    pv = preview(sheet, "/home/user/analisis_sprites/brujo_preview.jpg")
    print("OK", out, sheet.size, "preview:", pv)
    analyze(str(out))
