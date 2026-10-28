# Cube Icons API

## Options

Pass to `CubeIcons.stage(canvas, options)` or `CubeIcons.still(canvas, icon, options)`; change later with `stage.set(options)`. Changing `depth`, `palette`, `tint` or `max` rebuilds the icon; everything else just redraws. `CubeIcons.DEFAULTS` holds the defaults.

| Option | Default | What it does |
|---|---|---|
| `look` | `"flat"` | One of `CubeIcons.LOOKS`: `flat`, `soft`, `clay`, `candy`, `paper`, `outline`, `pixel`, `glass`, `neon`, `wire`, `holo`. |
| `view` | `"front"` | `"front"` (square-on, depth as a slanted side) or `"iso"`. |
| `depth` | `2` | Cubes deep per pixel, 1–5. |
| `gap` | `0` | Space between cubes, 0–0.4 of a cube. |
| `tint` | `null` | One ink colour; every palette colour is redrawn in its shades by lightness. |
| `palette` | `PALETTE` | Colours by key, as `rgb()` or hex. |
| `shadow` | on for soft, clay and candy | Contact shadow under the icon; `true`/`false` forces it. |
| `duration` | `700` | Ms each cube's flight takes. |
| `ease` | `"expo"` | One of `CubeIcons.EASES`: `expo`, `cubic`, `back`, `elastic`, `linear`. |
| `stagger` | `260` | Up to this many ms of random delay per cube. |
| `spin` | `0.25` | Turns while flying; cubes always land square. |
| `from` | `"auto"` | Where hidden cubes start: `below`, `above`, `left`, `right`, `center`. |
| `magnet` | `0` | How far cubes near the pointer pop forward, in cubes. |
| `glow` | `0` | Bloom around the cubes, 0–1. Neon glows by default. |
| `float` | `0` | Idle motion, 0–1: the built icon sways and bobs; loose cubes from `scatter()` drift. |
| `tilt` | `true` | Depth leans with the mouse. |
| `size` | `"auto"` | Pixels per cube, or fit the canvas. |
| `x`, `y` | `0.5` | Where the icon sits in the canvas, 0–1. |
| `max` | `900` | Cubes the stage holds. |

## Stage methods

| Call | What it does |
|---|---|
| `stage.show(icon)` | Build an icon: a name from `CUBE_ICONS`, an array of rows, or `{ colors, rows }` with its own colour keys. A different icon morphs from the current one. |
| `stage.clear()` | Fly apart and fade. |
| `stage.build(icon, progress)` | Part-built, 0 scattered to 1 whole, bottom row first, slightly shuffled. Safe to call every frame. |
| `stage.explode(clientX?, clientY?, force = 6)` | Knock built cubes away from a page point (or the middle); they settle back. |
| `stage.burst({ force, dur })` | The cubes rush toward the viewer, growing and fading. Nothing is left showing. |
| `stage.scatter(count, { icon, color, alpha, size })` | Loose cubes across the canvas; a following `show()` gathers them. |
| `stage.set(options)` | Change options live. |
| `stage.options` | A copy of the current options. |
| `stage.canvas` | The canvas. |
| `stage.destroy()` | Stop drawing and remove listeners. |

## Helpers

| Call | Returns | What it does |
|---|---|---|
| `CubeIcons.scroll(stage, icon, { mode, target, hold, range })` | `{ destroy }` | `mode: "scrub"` (default) follows the scroll; `"trigger"` builds at half in view and clears when it leaves. |
| `CubeIcons.sequence(stage, icons, { every = 2000 })` | `{ destroy }` | Shows icons in turn. |
| `CubeIcons.text(str, { color = "B", spacing = 1, line = 1 })` | rows | 5-row pixel font: A–Z, 0–9, `. , : ! ? - + ' & /`; `\n` for lines. |
| `CubeIcons.still(canvas, icon, options)` | – | Draws once, settled. |
| `CubeIcons.voxels(icon, depth, palette)` | `[{ x, y, z, col }]` | Cube positions, for custom rendering. |
| `CubeIcons.PALETTE`, `DEFAULTS`, `LOOKS`, `EASES`, `version` | – | Built-in values. |

## Behaviour

- Draws only while something moves, when the pointer moves (tilt, magnet) and on resize; pauses while scrolled out of view.
- `prefers-reduced-motion: reduce` makes icons appear in place: no flight, spin or stagger.
- Device pixel ratio is capped at 2.
- Console warnings: an unknown icon name, and an icon that needs more cubes than `max`.
