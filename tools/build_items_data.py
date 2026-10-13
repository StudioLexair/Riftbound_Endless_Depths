#!/usr/bin/env python3
"""Regenera el catalogo de objetos de data/content.js con el diseno nuevo:
60 armas, 60 armaduras, 20 amuletos, 20 collares, 20 anillos, 20 reliquias y 20 pociones.
Ids i0..i219 en ese orden. El campo sprite es el indice en assets/items.png."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "data" / "content.js"
raw = path.read_text(encoding="utf-8")
data = json.loads(raw[raw.index("=") + 1:].strip().rstrip(";"))

EFFECT_DESC = {
    "burn": "Puede quemar al golpear.", "poison": "Puede envenenar al golpear.",
    "bleed": "Puede hacer sangrar al golpear.", "freeze": "Puede congelar al golpear.",
    "stun": "Puede aturdir al golpear.", "leech": "Roba salud al golpear.",
    "pierce": "Parte del dano ignora la defensa.", "chain": "Puede encadenar rayos al golpear.",
    "crit": "Aumenta el dano critico.", "execute": "Remata enemigos debilitados.",
    "guard": "Puede bloquear parte del dano.", "thorns": "Devuelve dano al atacante.",
    "evade": "Mejora la evasion.", "regen": "Regeneracion pasiva aumentada.",
    "shield": "Genera escudo al recibir golpes.", "mana": "Recupera energia al golpear.",
    "gold": "Aumenta el oro obtenido.", "range": "Aumenta el alcance.",
    "reach": "Aumenta el alcance.", "summon": "Refuerza a los aliados invocados.",
}

MATERIALS = ["de roble", "de hierro", "de acero", "de bronce", "de plata", "de oro",
             "de cristal", "de obsidiana", "de esencia estelar", "rúnica"]
EPITHETS = ["del alba", "del eco", "de la grieta", "del vigilante", "de ceniza",
            "de mareas", "del juramento", "de la vigilia", "del abismo", "primigenia"]
items = []


def add(name, slot, weapon, effect, stats, price, desc, **extra):
    n = len(items)
    if slot in ("weapon", "armor"): req = 1 + (n % 10) * 2
    elif slot in ("amulet", "necklace", "ring"): req = 2 + (n % 20) // 2
    elif slot == "relic": req = 5 + (n % 20) // 2
    else: req = 0
    it = {"id": f"i{n}", "name": name, "slot": slot, "weapon": weapon,
          "effect": effect, "stats": stats, "price": price, "sprite": n, "desc": desc, "req": req}
    it.update(extra)
    items.append(it)


# ---------- 60 ARMAS: 6 tipos x 10 materiales ----------
W_TYPES = [("Espada", 3.0), ("Hacha", 3.6), ("Arco", 2.6), ("Bastón", 2.8), ("Daga", 2.2), ("Lanza", 3.2)]
W_EFFECTS = ["burn", "bleed", "freeze", "stun", "leech", "pierce", "chain", "crit", "execute", "poison"]
for si, (wname, base) in enumerate(W_TYPES):
    for tier in range(10):
        atk = round(base + tier * 0.9, 1)
        stats = {"attack": atk}
        sec = (si + tier) % 4
        if sec == 0: stats["crit"] = round(0.04 + tier * 0.006, 3)
        elif sec == 1: stats["defense"] = 1 + tier // 4
        elif sec == 2: stats["resource"] = 4 + tier * 2
        else: stats["evasion"] = round(0.02 + tier * 0.004, 3)
        eff = W_EFFECTS[(si * 3 + tier) % 10]
        add(f"{wname} {MATERIALS[tier]} {EPITHETS[(si + tier) % 10]}", "weapon", wname, eff,
            stats, 24 + tier * 14 + si * 3, f"{EFFECT_DESC[eff]} Forjada {MATERIALS[tier]}.")

# ---------- 60 ARMADURAS: 6 tipos x 10 materiales ----------
A_TYPES = ["Coraza", "Cota", "Túnica", "Arnés", "Manto", "Escamas"]
A_EFFECTS = ["guard", "thorns", "evade", "regen", "shield", "mana"]
for si, aname in enumerate(A_TYPES):
    for tier in range(10):
        stats = {"hp": 6 + tier * 3, "defense": 1 + round(tier * 0.7)}
        if si % 3 == 1: stats["resource"] = 3 + tier * 2
        if si % 3 == 2: stats["evasion"] = round(0.02 + tier * 0.004, 3)
        eff = A_EFFECTS[(si + tier) % 6]
        add(f"{aname} {MATERIALS[tier]} {EPITHETS[(si * 2 + tier) % 10]}", "armor", "", eff,
            stats, 26 + tier * 15 + si * 3, f"{EFFECT_DESC[eff]} Tejida {MATERIALS[tier]}.")

# ---------- joyas y reliquias ----------
GEMS = ["jade", "ónix", "ámbar", "turquesa", "rubí", "zafiro", "esmeralda", "amatista",
        "ópalo", "topacio", "granate", "perla", "coral", "lapislázuli", "hematita",
        "cuarzo rosa", "ojo de tigre", "aguamarina", "citrino", "obsidiana"]
for i, gem in enumerate(GEMS):  # amuletos: energia y efectos de apoyo
    stats = {"resource": 6 + i // 2}
    if i % 3 == 0: stats["regen"] = round(0.15 + i * 0.01, 2)
    if i % 3 == 1: stats["crit"] = round(0.03 + i * 0.002, 3)
    if i % 3 == 2: stats["hp"] = 5 + i // 2
    eff = ["mana", "regen", "shield", "crit", "evade", "gold"][i % 6]
    add(f"Amuleto de {gem} {EPITHETS[i % 10]}", "amulet", "", eff, stats, 90 + i * 6,
        f"{EFFECT_DESC[eff]} Gema de {gem} engarzada a mano.")
for i, gem in enumerate(GEMS):  # collares: mixtos
    stats = {"hp": 5 + i // 2, "defense": 1 + i // 7}
    if i % 2: stats["resource"] = 4 + i // 3
    eff = ["gold", "mana", "leech", "guard", "summon", "range"][i % 6]
    add(f"Collar de {gem} {EPITHETS[(i + 4) % 10]}", "necklace", "", eff, stats, 95 + i * 6,
        f"{EFFECT_DESC[eff]} Cadena fina con dije de {gem}.")
for i, gem in enumerate(GEMS):  # anillos: ofensivos
    stats = {"crit": round(0.03 + i * 0.003, 3)}
    if i % 2: stats["attack"] = round(0.8 + i * 0.12, 1)
    else: stats["evasion"] = round(0.02 + i * 0.002, 3)
    eff = ["crit", "evade", "execute", "pierce", "leech", "gold"][i % 6]
    add(f"Anillo de {gem} {EPITHETS[(i + 7) % 10]}", "ring", "", eff, stats, 85 + i * 6,
        f"{EFFECT_DESC[eff]} Aro grabado con {gem} pulida.")

RELICS = ["Ojo del Abismo", "Cáliz de Ceniza", "Libro de Ecos", "Vela Perpetua", "Máscara del Vacío",
          "Orbe de Mareas", "Campana de Hueso", "Llave de la Primera Puerta", "Pluma de Fénix",
          "Corazón de Cristal", "Espejo Roto", "Brasero de Almas", "Semilla Primigenia", "Dado del Destino",
          "Flauta de Piedra", "Mapa Viviente", "Reloj de Arena Negra", "Diente de Dragón",
          "Ancla en Miniatura", "Corona Partida"]
R_EFFECTS = ["summon", "leech", "mana", "shield", "evade", "chain", "gold", "regen", "execute", "guard",
             "crit", "thorns", "range", "pierce", "burn", "freeze", "poison", "bleed", "stun", "mana"]
for i, name in enumerate(RELICS):
    stats = {"hp": 4 + i // 3, "attack": round(0.6 + i * 0.1, 1), "resource": 4 + i // 2}
    eff = R_EFFECTS[i]
    add(name, "relic", "", eff, stats, 160 + i * 10,
        f"{EFFECT_DESC[eff]} Reliquia anterior a la grieta; aún recuerda su poder.")

# ---------- 20 POCIONES ----------
POTIONS = [
    ("Tónico carmesí", "heal", 0.35, "Restaura el 35% de la salud máxima."),
    ("Tónico carmesí mayor", "heal", 0.55, "Restaura el 55% de la salud máxima."),
    ("Elixir de vida", "heal", 0.8, "Restaura el 80% de la salud máxima."),
    ("Ampolla de primeros auxilios", "heal", 0.25, "Restaura el 25% de la salud máxima."),
    ("Esencia de corazón de dragón", "heal", 1.0, "Restaura toda la salud."),
    ("Frasco de maná azul", "resource", 0.6, "Restaura el 60% de la energía."),
    ("Frasco de maná profundo", "resource", 0.85, "Restaura el 85% de la energía."),
    ("Ampolla de chispa", "resource", 0.4, "Restaura el 40% de la energía."),
    ("Elixir de la grieta", "resource", 1.0, "Restaura toda la energía."),
    ("Antídoto universal", "cleanse", None, "Elimina todos los estados alterados."),
    ("Purga de plata", "cleanse", None, "Limpia venenos, quemaduras y maldiciones."),
    ("Bálsamo regenerador", "regen", None, "Regenera salud durante 8 turnos."),
    ("Ungüento de corteza viva", "regen", None, "Regenera salud durante 8 turnos."),
    ("Savia de Bosque de Vidrio", "regen", None, "Regenera salud durante 8 turnos."),
    ("Pluma de retorno", "return", None, "Te devuelve al inicio del sector."),
    ("Brújula de escape", "return", None, "Te devuelve al inicio del sector."),
    ("Bomba de ceniza", "bomb", None, "Daña a los enemigos en un radio de tres."),
    ("Frasco explosivo de alquimista", "bomb", None, "Daña a los enemigos en un radio de tres."),
    ("Granada de luz", "bomb", None, "Daña a los enemigos en un radio de tres."),
    ("Elixir mixto de Liria", "heal", 0.45, "Restaura el 45% de la salud máxima."),
]
for name, eff, amount, desc in POTIONS:
    extra = {"amount": amount} if amount else {}
    price = 18 + (int(amount * 40) if amount else 12)
    add(name, "consumable", "", eff, {}, price, desc, **extra)

assert len(items) == 220, len(items)
assert len({i["name"] for i in items}) == 220, "nombres duplicados"
data["items"] = items
path.write_text("export const DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
from collections import Counter
print("OK catalogo:", Counter(i["slot"] for i in items), "total", len(items))
