#!/usr/bin/env python3
"""
Genera los assets derivados de Pixel Crawler (Anokolisa) para Riftbound.

Uso:
    python3 tools/build_crawler_assets.py "/ruta/al/Pixel Crawler - Free Pack"

Salidas (en assets/sprites/):
    atlas.png         512x896, celdas 32x32, 16 columnas.
                      Capas de animacion: indice = capa*112 + id (capas 0..3, ids 0..48).
                      Los objetos (ids 49..108) reutilizan el atlas original a 2x.
    biome-tiles.png   128x384, celdas 32x32: 4 variantes x (6 biomas x suelo/muro).
    props.png         256x64, celdas 32x32: 16 props decorativos.
    crawler-manifest.json  Procedencia y correspondencias.

Licencia del pack (terminos del autor): uso en cualquier proyecto, tambien
comercial; no vender los assets como producto en si; credito apreciado.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "sprites"
CELL = 32
COLS = 16


def fit_frame(sheet: Image.Image, frame_w: int, frame_i: int) -> Image.Image:
    """Recorta un frame, lo ajusta por su bbox alfa y lo centra abajo en 32x32."""
    frame = sheet.crop((frame_i * frame_w, 0, frame_i * frame_w + frame_w, sheet.height))
    bbox = frame.getchannel("A").getbbox()
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    if not bbox:
        return cell
    art = frame.crop(bbox)
    scale = min(30 / art.height, 28 / art.width, 1.0)
    if scale < 1.0:
        art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), Image.NEAREST)
    cell.alpha_composite(art, ((CELL - art.width) // 2, CELL - art.height))
    return cell


def tint(img: Image.Image, rgb) -> Image.Image:
    r, g, b = (min(255, int(c)) for c in rgb)
    px = img.load()
    out = img.copy()
    op = out.load()
    for y in range(img.height):
        for x in range(img.width):
            pr, pg, pb, pa = px[x, y]
            if pa:
                op[x, y] = (pr * r // 128, pg * g // 128, pb * b // 128, pa)
    return out


def load_frames(pack: Path, rel: str):
    sheet = Image.open(pack / rel).convert("RGBA")
    frame_w = 32 if sheet.width % 32 == 0 and sheet.height == 32 else 64
    return [fit_frame(sheet, frame_w, i) for i in range(sheet.width // frame_w)]


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    pack = Path(sys.argv[1])
    old_atlas = Image.open(ROOT / "tools" / "atlas_original_16.png").convert("RGBA")  # nunca leer el atlas generado: corromperia los objetos al regenerar

    knight = load_frames(pack, "Entities/Npc's/Knight/Idle/Idle-Sheet.png")
    wizzard = load_frames(pack, "Entities/Npc's/Wizzard/Idle/Idle-Sheet.png")
    rogue = load_frames(pack, "Entities/Npc's/Rogue/Idle/Idle-Sheet.png")
    peasant = load_frames(pack, "Entities/Npc's/Citizen_F/Peasant_A/Idle/Idle-Sheet.png")
    tavern = load_frames(pack, "Entities/Npc's/Citizen_F/Tavern_A/Idle/Idle_Side-Sheet.png")
    sk_base = load_frames(pack, "Entities/Mobs/Skeleton Crew/Skeleton - Base/Idle/Idle-Sheet.png")
    sk_mage = load_frames(pack, "Entities/Mobs/Skeleton Crew/Skeleton - Mage/Idle/Idle-Sheet.png")
    sk_rogue = load_frames(pack, "Entities/Mobs/Skeleton Crew/Skeleton - Rogue/Idle/Idle-Sheet.png")
    sk_war = load_frames(pack, "Entities/Mobs/Skeleton Crew/Skeleton - Warrior/Idle/Idle-Sheet.png")
    orc = load_frames(pack, "Entities/Mobs/Orc Crew/Orc/Idle/Idle-Sheet.png")
    orc_rogue = load_frames(pack, "Entities/Mobs/Orc Crew/Orc - Rogue/Idle/Idle-Sheet.png")
    orc_shaman = load_frames(pack, "Entities/Mobs/Orc Crew/Orc - Shaman/Idle/Idle-Sheet.png")
    orc_war = load_frames(pack, "Entities/Mobs/Orc Crew/Orc - Warrior/Idle/Idle-Sheet.png")

    def T(frames, rgb):
        return [tint(f, rgb) for f in frames]

    classes = [knight, wizzard, T(rogue, (110, 150, 100)), T(rogue, (80, 70, 120)),
               T(orc_war, (170, 90, 90)), T(sk_mage, (100, 170, 160)), T(wizzard, (175, 105, 65))]
    bases = [sk_base, orc, sk_war, orc_rogue, sk_mage, orc_shaman, sk_rogue, orc_war]
    biome_tints = [(110, 150, 110), (125, 118, 150), (150, 132, 98), (105, 132, 165),
                   (165, 105, 92), (138, 112, 168)]
    enemies = [T(bases[i % 8], biome_tints[i // 5]) for i in range(30)]
    boss_bases = [orc_war, sk_war, orc_war, sk_mage, orc_war, sk_war]
    bosses = [T(boss_bases[b], tuple(min(255, int(c * 1.25)) for c in biome_tints[b])) for b in range(6)]
    npcs = [peasant, knight, wizzard, T(peasant, (150, 128, 96)), tavern, T(rogue, (80, 70, 120))]

    entity_frames = classes + enemies + bosses + npcs  # indices 0..48
    atlas = Image.new("RGBA", (512, 896), (0, 0, 0, 0))
    for layer in range(4):
        for eid, frames in enumerate(entity_frames):
            frame = frames[layer % len(frames)]
            atlas.alpha_composite(frame, ((eid % COLS) * CELL, (layer * 7 + eid // COLS) * CELL))
    for item_id in range(49, 109):  # objetos: atlas original a 2x
        old = old_atlas.crop(((item_id % 16) * 16, (item_id // 16) * 16,
                              (item_id % 16) * 16 + 16, (item_id // 16) * 16 + 16))
        atlas.alpha_composite(old.resize((32, 32), Image.NEAREST),
                              ((item_id % COLS) * CELL, (item_id // COLS) * CELL))
    OUT.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT / "atlas.png")

    # --- Tiles por bioma desde Dungeon_Tiles (suelo teja + muro ladrillo, tenidos) ---
    dungeon = Image.open(pack / "Environment/Tilesets/Dungeon_Tiles.png").convert("RGBA")
    floor_base = (80, 16)  # teja de suelo limpia de Dungeon_Tiles
    wall_base = (16, 16)   # ladrillo limpio, sin franja brillante
    variant_light = [1.0, 0.93, 1.07, 0.88]
    biome_colors = [((36, 59, 52), (51, 95, 73)), ((50, 48, 64), (101, 96, 119)),
                    ((68, 60, 50), (160, 139, 96)), ((37, 45, 67), (65, 89, 128)),
                    ((63, 44, 48), (133, 83, 90)), ((38, 30, 59), (98, 68, 132))]
    tiles = Image.new("RGBA", (128, 384), (0, 0, 0, 0))
    for b, (fc, wc) in enumerate(biome_colors):
        for v, k in enumerate(variant_light):
            t = tint(dungeon.crop((*floor_base, floor_base[0] + 16, floor_base[1] + 16)).resize((32, 32), Image.NEAREST), tuple(min(255, int(c * 3 * k)) for c in fc))
            tiles.alpha_composite(t, (v * 32, b * 64))
            t = tint(dungeon.crop((*wall_base, wall_base[0] + 16, wall_base[1] + 16)).resize((32, 32), Image.NEAREST), tuple(min(255, int(c * 2.2 * k)) for c in wc))
            tiles.alpha_composite(t, (v * 32, b * 64 + 32))
    tiles.save(OUT / "biome-tiles.png")

    # --- Props decorativos ---
    props_src = Image.open(pack / "Environment/Props/Static/Dungeon_Props.png").convert("RGBA")
    veg = Image.open(pack / "Environment/Props/Static/Vegetation.png").convert("RGBA")
    prop_defs = [
        (props_src, (64, 48, 16, 16)), (props_src, (62, 62, 18, 26)), (props_src, (80, 62, 18, 26)),
        (props_src, (98, 62, 18, 26)), (props_src, (110, 8, 20, 28)), (props_src, (64, 64, 16, 32)),
        (props_src, (48, 48, 16, 16)), (veg, (0, 32, 32, 32)), (veg, (64, 64, 32, 32)),
        (veg, (128, 64, 32, 64)), (veg, (0, 224, 32, 32)), (veg, (128, 160, 32, 32)),
        (props_src, (0, 80, 64, 16)), (props_src, (96, 8, 16, 24)),
        (dungeon, (128, 80, 32, 32)), (dungeon, (128, 112, 32, 32)),
    ]
    props = Image.new("RGBA", (256, 64), (0, 0, 0, 0))
    for i, (src, (x, y, w, h)) in enumerate(prop_defs):
        art = src.crop((x, y, x + w, y + h))
        bbox = art.getchannel("A").getbbox()
        if bbox:
            art = art.crop(bbox)
        scale = min(30 / art.height, 30 / art.width, 2.0)
        art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), Image.NEAREST)
        props.alpha_composite(art, ((i % 8) * 32 + (32 - art.width) // 2, (i // 8) * 32 + (32 - art.height)))
    props.save(OUT / "props.png")

    (ROOT / "tools" / "crawler-manifest.json").write_text(json.dumps({
        "source": "Pixel Crawler - Free Pack 2.11 by Anokolisa (itch.io)",
        "terms": "Uso en cualquier proyecto incl. comercial; no vender los assets como producto; credito apreciado.",
        "atlas": "celdas 32x32; animacion: indice = capa*112 + id para ids 0..48 (4 capas idle)",
        "clases": ["Knight", "Wizzard", "Rogue", "Rogue oscuro", "Orc Warrior rojo", "Skeleton Mage teal", "Wizzard igneo"],
        "enemigos": "8 bases Skeleton/Orc x tinte de bioma (30 combinaciones)",
        "jefes": "Orc/Skeleton Warrior/Mage con tinte reforzado por bioma",
        "tiles": "Dungeon_Tiles de Pixel Crawler tenidos con los colores de cada bioma de Riftbound",
        "props": "Dungeon_Props + Vegetation de Pixel Crawler",
    }, indent=2, ensure_ascii=False))
    print("OK atlas/biome-tiles/props generados en", OUT)


if __name__ == "__main__":
    main()
