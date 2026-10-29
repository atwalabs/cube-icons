---
name: cube-icons
description: Add animated pixel icons built from 3D cubes to a web page, using the dependency-free Cube Icons engine (a 2D canvas, no WebGL). Cubes fly in to build the icon, settle, and fly apart; there are 61 ready icons, eleven looks (flat, soft, clay, candy, paper, outline, pixel, glass, neon, wire, holo), scroll-driven building, explode, magnet and morph effects, and a pixel-text font. Use this when someone wants voxel, pixel, 3D-cube or "Minecraft-style" animated icons, a menu where hovering builds an object, an animated empty state, loader, hero or feature-card illustration, scroll-assembled visuals, or a small custom pixel icon drawn and dropped into a site. Works in plain HTML, React/Next.js, Vue, Svelte, Framer, Webflow and WordPress.
license: MIT
metadata:
  author: Atwa
  version: "1.0.0"
  homepage: https://cube-icons.attwa.me
  repository: https://github.com/atwalabs/cube-icons
---

# Cube Icons

Cube Icons renders small pixel drawings as 3D cubes on a `<canvas>`. Each coloured pixel becomes a short stack of cubes. The engine is `assets/cubes.js` (about 9 KB gzipped, no dependencies) and the icon library is `assets/icons.js`. Everything runs in the browser.

## Workflow

1. **Place it.** Decide what the icon does: builds on hover (menus, buttons, cards), builds on scroll (sections, heroes), shows once (empty states, loaders), or follows the pointer (magnet). Keep the real text in HTML next to the canvas.
2. **Install.** Copy `assets/cubes.js` and `assets/icons.js` into the project's static folder and load them with two `<script>` tags, `icons.js` first. Or load them from the CDN: `https://cdn.jsdelivr.net/gh/atwalabs/cube-icons@1.0.0/icons.js` and `.../cubes.js`. In frameworks, load them in the browser only (see `references/recipes.md`, "Frameworks").
3. **Pick or draw the icon.** Use a built-in name when one fits (list below). Otherwise draw one as rows of palette keys, following "Drawing an icon" below.
4. **Write the code.** Make a stage on a sized canvas, then call `show`, `scroll`, `build`, `sequence` or `explode`. Start from the matching recipe in `references/recipes.md`.
5. **Finish.** Give the canvas a CSS width and height, add `role="img"` and an `aria-label` (or `aria-hidden="true"` if decorative), run hover effects on keyboard focus too, and call `stage.destroy()` when a component unmounts.

## The minimum

```html
<canvas id="hero-icon" style="width:360px;height:280px" role="img" aria-label="A rocket"></canvas>
<script src="icons.js"></script>
<script src="cubes.js"></script>
<script>
  const stage = CubeIcons.stage(document.getElementById("hero-icon"), { look: "soft" });
  stage.show("rocket");
</script>
```

## Built-in icons

close, bolt, sword, briefcase, person, phone, browser, envelope, chart, terminal, heart, star, rocket, bulb, camera, gamepad, music, globe, lock, folder, coffee, chat, clock, check, search, download, cursor, home, bell, gear, calendar, pin, wifi, battery, play, arrow, trash, pencil, code, key, bag, cart, gift, trophy, diamond, crown, book, headphones, umbrella, flag, sun, moon, cloud, tree, leaf, fire, planet, sparkle, smile, ghost, robot.

## Drawing an icon

An icon is an array of equal-length strings, read top to bottom like a picture. Each character is a palette key; `.` is empty.

| Key | Colour | Key | Colour |
|---|---|---|---|
| `B` | cobalt blue | `G` | green |
| `W` | paper white | `P` | lilac |
| `K` | grey | `C` | cyan |
| `L` | light grey | `M` | pink |
| `D` | near black | `N` | brown |
| `R` | red | `O` | orange |
| `Y` | yellow | | |

Rules that make icons read well:

- **8–16 columns wide, 6–14 rows tall.** Every row the same length. Bigger loses the chunky look; a stage holds 900 cubes (cells × depth) by default.
- **Silhouette first.** Make the outline recognisable in one colour before adding detail; check it at a glance by reading the rows.
- **Outline and fill:** a darker or contrasting outline (`K`, `D`) around a fill colour, then one accent detail (a gold clasp, a red flag, a blue window).
- **Symmetry** for objects that are symmetric (trophies, bells, faces): mirror each row.
- **Avoid single isolated cells** except for deliberate details like eyes or sparkles.
- To place it by name, add it to the library: `Object.assign(window.CUBE_ICONS, { badge: [...] })`. Or pass the rows straight to `stage.show(rows)`.
- **Own colours:** an icon can carry extra palette keys as `{ colors: { a: "#eb234f", b: "#79a93e" }, rows: ["..aa..", "bbbbbb"] }`. Use lowercase letters for them. Prefer the built-in palette unless the brief needs exact colours.

Example (a coffee cup):

```js
coffee: [
  "..W..W.....",
  "...W..W....",
  "...........",
  "KKKKKKKKK..",
  "KWWWWWWWKKK",
  "KWWWWWWWK.K",
  "KWWWWWWWKKK",
  "KWWWWWWWK..",
  ".KKKKKKK...",
],
```

For words, use `CubeIcons.text("Hello", { color: "B" })`: a 5-row pixel font with A–Z, 0–9 and `. , : ! ? - + ' & /`.

## Options that matter most

```js
CubeIcons.stage(canvas, {
  look: "soft",      // flat (default) · soft · clay · candy · paper · outline · pixel · glass · neon · wire · holo
  view: "front",     // front (default) · iso
  depth: 2,          // cubes deep, 1–5
  gap: 0.06,         // space between cubes, 0–0.4
  tint: null,        // one brand ink, e.g. "#2f3cff": every colour redrawn in its shades
  ease: "expo",      // expo (default, soft landing) · cubic · back · elastic · linear
  duration: 700,     // ms per cube flight
  stagger: 260,      // ms of random delay per cube
  spin: 0.25,        // turns while flying
  from: "auto",      // auto · below · above · left · right · center
  magnet: 0,         // cubes near the pointer pop forward (try 1.5)
  glow: 0,           // bloom around the cubes, 0–1 (great with tint on dark pages)
  float: 0,          // idle motion, 0–1: the icon sways and bobs, loose cubes drift
  tilt: true,        // depth leans with the mouse
});
```

Match the look to the page: `soft`, `clay`, `candy`, `paper` and `outline` suit light pages; `glass`, `neon` and `holo` suit dark ones; `wire` with a light `tint` suits dark or coloured sections; `pixel` is flat retro pixel art anywhere. Full option and API tables are in `references/api.md`.

## Methods

- `stage.show(icon)`: build an icon (a name or rows). Showing a different icon morphs into it.
- `stage.clear()`: fly apart and fade.
- `stage.build(icon, progress)`: part-built, 0–1, bottom row first. Drive it from scroll, upload progress, timers.
- `stage.explode(clientX?, clientY?)`: knock cubes loose; they settle back.
- `stage.burst()`: the cubes rush toward the viewer and fade (menu or page transitions).
- `stage.scatter(count, { icon })`: loose cubes across the canvas; a later `show()` gathers them into the icon.
- `stage.set(options)`, `stage.destroy()`.
- `CubeIcons.scroll(stage, icon, { mode: "scrub" | "trigger" })`, `CubeIcons.sequence(stage, icons, { every })`, `CubeIcons.still(canvas, icon, options)` for static thumbnails.

## Common mistakes

- **No canvas size.** The canvas needs a CSS width and height, or it renders 0 pixels tall.
- **Script order.** Load `icons.js` before calling `show()` with a name, and `cubes.js` before calling `CubeIcons`.
- **Server rendering.** Never touch `CubeIcons` at module top level in Next.js, Nuxt or SvelteKit; create stages in an effect or mount hook.
- **Too many cubes.** A 20×20 icon at depth 3 is 1,200 cubes; lower depth, draw smaller, or raise `max`.
- **Hover only.** Also trigger on `focus` so keyboard users see the effect.

## References

- `references/recipes.md`: copy-ready code for menus, buttons, empty states, loaders, morph sequences, explode, magnet, text, feature cards, scroll sections, and every framework.
- `references/api.md`: every option, method and helper, with defaults.
- `assets/cubes.js`, `assets/icons.js`: the engine and icon library to copy into the project.
