# RIFTBOUND: ENDLESS DEPTHS

Entrega de un proyecto estático de RPG roguelike por turnos, sin dependencias externas ni backend. No es un servicio alojado. No se ha publicado una URL ni ejecutado una validación de jugabilidad en navegador en el entorno de creación.

## Abrir el paquete

El archivo `index.html` es la entrada del juego; necesita HTTP/HTTPS, no funciona por doble clic como archivo local. Se incluye un servidor local sin dependencias de Python: `PLAY_WINDOWS.bat`, `PLAY_MAC_LINUX.sh` o `python3 serve.py`. Requiere Python 3 instalado. Abre el navegador automáticamente en localhost:8080. Esto es únicamente ejecución local y no equivale a publicación.

Para Android y una URL pública instalable, la carpeta es desplegable sin compilación en un alojamiento estático HTTPS. Se incluye configuración para Netlify y `.nojekyll` para GitHub Pages, pero no se han configurado cuentas ni efectuado un despliegue. Chrome permite ofrecer instalación cuando se cumplen sus requisitos; en iOS la opción suele ser añadir a pantalla de inicio desde Safari. La instalación no se verificó.

## Contenido implementado en código

- Siete clases: Vanguard, Arcanist, Ranger, Shadow, Bloodbound, Summoner, Pyromancer. Tres disponibles al inicio; otras se desbloquean por bajas históricas. Estadísticas, crecimiento, arma preferida, 21 habilidades activas y pasivos específicos.
- Seis biomas, cada uno con geometría de tiles propia dibujada en Canvas, atmósfera, melodía, peligros, cinco enemigos y un jefe.
- Treinta enemigos con roles cuerpo a cuerpo, a distancia, caster, tanque, asesino, soporte e invocador. Un mismo enemigo puede combinar rasgos de su bioma y rol. BFS para navegación local, línea de visión, apoyo, retirada y convocación.
- Seis guardianes con patrones de casillas telegrafiados; segunda fase por debajo de 45% HP. Los ataques marcados se resuelven en la siguiente acción del jefe, no en tiempo real.
- Combate por acciones: mover, atacar, habilidad, objeto, interacción y esperar. Acciones inválidas de movimiento no consumen turno; equipar, comprar y vender sí. Consultar el mapa o menús no consume turnos. Velocidad regula frecuencia de actuación enemiga.
- Estados: fuego, veneno, sangrado, escarcha, aturdimiento, debilidad y regeneración; también guardia, evasión y refuerzo.
- 60 objetos base: 18 armas, 18 armaduras, 18 accesorios y seis consumibles. Rarezas común, inusual, rara, épica, legendaria y mítica; potencia escala por sector. Efectos de combate, atributos y preferencias de armas.
- Mochila de 60 entradas, recoger, equipar, comparar, tirar, consumir y vender al comerciante. Los consumibles no se apilan en esta versión.
- XP, niveles, puntos y árbol de seis ramas por clase: tres activas y tres pasivas, rango máximo cinco. Es un árbol compacto de ramas independientes, no una red de nodos con prerequisitos.
- Ocho misiones por run, siete tipos de evento con dos opciones y seis NPCs con compra/venta, curación, forja, entrenamiento, guía y conversión de moneda a metaprogreso.
- CLASSIC: una resurrección por run, con pérdida de la mitad del oro. HARDCORE: muerte definitiva de la run. Siempre se conserva metaprogreso.
- 34 logros con recompensas; historial de personajes, fragmentos, desbloqueos, mejora permanente de salud y clasificación local con 30 resultados.
- IndexedDB con versión 1, validación y backup del save anterior. Datos de ajustes, run, seed, inventario y metaprogreso guardados juntos. Rechaza versiones futuras desconocidas; no existen versiones antiguas reales que migrar todavía.
- Service worker, manifest y dos iconos. Todo el runtime local se precachea. Sin red tras la instalación de caché, en condiciones admitidas por el navegador.
- Controles táctiles con Pointer Events (equivalentes unificados de touch/mouse), repetición del D-Pad, cancelación y swipe opcional. No depende de hover ni del teclado. Botones separados de habilidades y curación.
- Menús, ajustes de sonido, volumen, vibración, reducción de efectos, calidad, escala UI; confirmación de eliminación; tutorial breve integrado en mensajes.
- Sprites originales locales, logo SVG y sonidos sintetizados. Sin emojis ni recursos externos.

## Estructura y generación

`src/core`, `src/game`, `src/world`, `src/input`, `src/ui`, `src/audio`, `src/save`, `data`, `assets`, `tests`.

Cada sector usa nueve piezas/salas de formas y tamaños variables, conectadas por corredores y conexiones alternativas. La seed y profundidad determinan el contenido. Al cruzar el portal solo se conserva el sector activo: consumo de memoria acotado; no se almacena un mundo infinito completo. No hay regreso a sectores anteriores. No es un sistema de chunks espaciales continuamente visibles alrededor del jugador; el streaming ocurre al cambiar de sector.

El avance puede continuar generando sectores. Los seis biomas reaparecen en ciclos con aumento de dificultad; las piezas y encuentros se regeneran, no se utiliza un mapa único. La repetición de categorías sigue existiendo: no debe confundirse generación interminable con contenido narrativo infinito.

## Límites de esta entrega

No se hizo investigación por Internet, evaluación legal de nombres ni publicación. No se ejecutó JavaScript en el entorno de creación, ni pruebas físicas Android/iOS, FPS, instalación, persistencia o audio. La entrega no equivale a un producto de producción certificado ni cumple de forma verificada todo el alcance solicitado. `VALIDATION.md` indica las comprobaciones efectivamente realizadas y `tests/` contiene pruebas de motor que sí pueden ejecutarse en navegador al servir el paquete.

El mensaje del usuario terminó truncado en el apartado 52. No se han inventado requisitos posteriores. No hay servidor, Supabase, pagos, multijugador, traducciones adicionales, prestigio, animaciones dibujadas frame a frame o una garantía de balance. El audio es síntesis chiptune sencilla, no una banda sonora grabada. Las habitaciones secretas se representan como eventos y no como un subsistema de paredes ocultas. Los desbloqueos actuales cubren clases y habilidades, no bloqueos independientes de todos los biomas y objetos.

## Controles de escritorio

WASD/flechas: moverse. Espacio: ataque. E: interactuar. Q: esperar. 1/2/3: habilidades. I: mochila. K: árbol. M: mapa. Esc: pausa.

## Privacidad y extensibilidad

No se envían datos del jugador. No hay trackers ni CDN. El ranking vive en `meta.records`; puede conectarse después a un backend usando un adaptador independiente, pero no se proporciona seguridad antitrampas o integración online. El guardado validado evita muchas corrupciones; no impide que el propietario del navegador altere su propio juego mediante herramientas de desarrollo.

Licencia y recursos: `LICENSE` y `ASSET_LICENSES.md`.
