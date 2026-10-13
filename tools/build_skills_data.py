#!/usr/bin/env python3
"""Amplia cada clase a 12 habilidades activas (3 originales + 9 del banco) en data/content.js.
Las pasivas NO van aqui: son los rangos 12, 13 y 14 del arbol (fuerza, defensa, regeneracion)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "data" / "content.js"
raw = path.read_text(encoding="utf-8")
data = json.loads(raw[raw.index("=") + 1:].strip().rstrip(";"))

KIND_DESC = {
    "bolt": "Golpea al enemigo visible más cercano con daño aumentado.",
    "sweep": "Daña a los enemigos en las casillas cercanas.",
    "dash": "Avanza hasta tres casillas, golpeando al objetivo.",
    "shield": "Escudo temporal y defensa reforzada.",
    "freeze": "Congela a los enemigos cercanos.",
    "heal": "Recupera salud y aplica regeneración.",
    "poison": "Daña y envenena al objetivo.",
    "bleed": "Daña y hace sangrar al objetivo.",
    "evade": "Evasión temporal; limpia la debilidad.",
    "drain": "Daña al objetivo y roba salud.",
    "blood": "Sacrifica salud a cambio de poder.",
    "summon": "Invoca un eco aliado temporal.",
    "burn": "Daña y quema al objetivo.",
    "nova": "Explosión en área que puede quemar.",
    "resource": "Recupera energía y gana potencia.",
}

EXTRA = {
    "Vanguard": [("Corte cruzado", "sweep"), ("Muralla viviente", "shield"), ("Carga de ariete", "dash"),
                 ("Golpe sísmico", "sweep"), ("Juramento de hierro", "shield"), ("Filo vengador", "bleed"),
                 ("Avance implacable", "dash"), ("Rompefilas", "bolt"), ("Último bastión", "shield")],
    "Arcanist": [("Dardo arcano", "bolt"), ("Orbe de escarcha", "freeze"), ("Descarga en cadena", "bolt"),
                 ("Prisión de hielo", "freeze"), ("Transfusión", "heal"), ("Pulso abisal", "bolt"),
                 ("Nova gélida", "nova"), ("Mente clara", "resource"), ("Singularidad", "nova")],
    "Ranger": [("Flecha doble", "bolt"), ("Trampa de espinas", "poison"), ("Lluvia de flechas", "sweep"),
               ("Tiro certero", "bolt"), ("Retirada ágil", "dash"), ("Marca del cazador", "bleed"),
               ("Emboscada", "evade"), ("Flecha helada", "freeze"), ("Ojo de halcón", "resource")],
    "Shadow": [("Danza de dagas", "sweep"), ("Corte fantasma", "bolt"), ("Velo mayor", "evade"),
               ("Drenaje de sombras", "drain"), ("Emboscada letal", "bleed"), ("Paso entre mundos", "dash"),
               ("Marca mortal", "bleed"), ("Espejismo", "evade"), ("Guillotina umbría", "bolt")],
    "Bloodbound": [("Latigazo carmesí", "bleed"), ("Sorbo vital", "drain"), ("Frenesí", "blood"),
                   ("Marea de sangre", "sweep"), ("Corazón ardiente", "heal"), ("Pacto mayor", "blood"),
                   ("Desgarro", "bleed"), ("Éxtasis rojo", "resource"), ("Sacrificio final", "nova")],
    "Summoner": [("Doble eco", "summon"), ("Aullido espectral", "sweep"), ("Muro de ánimas", "shield"),
                 ("Toque del más allá", "drain"), ("Legión breve", "summon"), ("Sanación compartida", "heal"),
                 ("Explosión etérea", "nova"), ("Canalización", "resource"), ("Avatar de la grieta", "summon")],
    "Pyromancer": [("Llama viva", "burn"), ("Cometa", "bolt"), ("Muro de fuego", "nova"),
                   ("Corazón de magma", "resource"), ("Lluvia de brasas", "sweep"), ("Inmolación", "blood"),
                   ("Fénix menor", "heal"), ("Erupción", "nova"), ("Sol en miniatura", "burn")],
}

for cls in data["classes"]:
    extra = EXTRA[cls["id"]]
    assert len(cls["skills"]) == 3, cls["id"]
    for j, (name, kind) in enumerate(extra):
        cls["skills"].append({
            "id": f"{cls['id']}{j + 3}", "name": name, "kind": kind,
            "cost": 5 + ((j * 2) % 9), "cooldown": 4 + (j % 5),
            "desc": KIND_DESC[kind],
        })
    assert len(cls["skills"]) == 12

path.write_text("export const DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print("OK habilidades por clase:", [len(c["skills"]) for c in data["classes"]])
