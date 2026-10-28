# Cube Icons recipes

Each recipe assumes `icons.js` and `cubes.js` are loaded, in that order. Give every canvas a CSS width and height.

## Contents

- Menu hover
- Button hover
- Empty state
- Loading with progress
- Morph sequence
- Click to explode
- Cursor magnet
- Text in cubes
- Feature cards
- Scroll sections
- One brand colour
- Frameworks: a shared loader, React / Next.js, Vue / Nuxt, Svelte, Framer, Webflow, WordPress

## Menu hover

Nothing shows until a link is hovered; each link builds its own object.

```html
<nav class="menu">
  <ul id="menu">
    <li><a href="/" data-icon="home">Home</a></li>
    <li><a href="/work" data-icon="briefcase">Work</a></li>
    <li><a href="/shop" data-icon="bag">Shop</a></li>
    <li><a href="/contact" data-icon="envelope">Contact</a></li>
  </ul>
  <canvas id="menu-cubes" style="width:100%;height:320px" aria-hidden="true"></canvas>
</nav>
<script>
  const stage = CubeIcons.stage(document.getElementById("menu-cubes"), { from: "below" });
  const menu = document.getElementById("menu");
  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("pointerenter", () => stage.show(a.dataset.icon));
    a.addEventListener("focus", () => stage.show(a.dataset.icon));
  });
  menu.addEventListener("pointerleave", () => stage.clear());
</script>
```

## Button hover

The icon sits in the button; hovering knocks its cubes loose and they settle back.

```html
<button class="cube-btn"><canvas style="width:56px;height:44px" aria-hidden="true"></canvas>Download</button>
<script>
  document.querySelectorAll(".cube-btn").forEach((btn) => {
    const s = CubeIcons.stage(btn.querySelector("canvas"), { tilt: false, max: 260, duration: 450 });
    s.show("download");
    btn.addEventListener("pointerenter", () => s.explode(null, null, 3));
    btn.addEventListener("focus", () => s.explode(null, null, 3));
  });
</script>
```

## Empty state

Builds once half of it is in view.

```html
<div class="empty">
  <canvas id="empty-cubes" style="width:100%;height:180px" role="img" aria-label="A friendly ghost"></canvas>
  <h3>Nothing here yet</h3>
  <p>Your saved items will show up here.</p>
</div>
<script>
  const stage = CubeIcons.stage(document.getElementById("empty-cubes"), { from: "below", tilt: false });
  CubeIcons.scroll(stage, "ghost", { mode: "trigger" });
</script>
```

## Loading with progress

`build()` takes 0–1; call it as progress arrives, then swap to a tick.

```js
const stage = CubeIcons.stage(canvas, { tilt: false });
function onProgress(p) {            // p from 0 to 1
  if (p < 1) stage.build("rocket", p);
  else stage.show("check");
}
```

## Menu reveal with glow (burst, scatter, float)

A full-screen menu: the hero object bursts toward the viewer, the page blurs, and loose glowing cubes gather beside the links, taking each link's shape on hover.

```js
const look = { look: "soft", tint: "#3cff3c", glow: 0.8, float: 0.6, gap: 0.04 };
const hero = CubeIcons.stage(heroCanvas, { ...look, x: 0.72 });
const menu = CubeIcons.stage(menuCanvas, look);
hero.show("rocket");

menuButton.addEventListener("click", () => {
  hero.burst();                                 // rushes at the viewer and fades
  page.classList.add("menu-open");              // CSS: blur the page, fade the menu in
  menu.scatter(90, { icon: "rocket" });         // loose cubes...
  setTimeout(() => menu.show("rocket"), 350);   // ...gather into the object
});
links.forEach((a) => a.addEventListener("pointerenter", () => menu.show(a.dataset.icon)));
```

Pair glow with a dark page; `tint` gives the one-colour neon-sign feel.

## Floating cubes

```js
const stage = CubeIcons.stage(canvas, { look: "soft", tint: "#3cff3c", glow: 0.8, float: 0.7 });
stage.scatter(140, { icon: "bolt" });           // loose cubes drift across the section
button.addEventListener("click", () => stage.show("bolt"));   // they gather, and keep floating
```

## Morph sequence

```js
CubeIcons.sequence(CubeIcons.stage(canvas), ["home", "bag", "cart", "gift", "trophy"], { every: 1800 });
```

## Click to explode

```js
const stage = CubeIcons.stage(canvas, { tilt: false });
stage.show("star");
canvas.addEventListener("click", (e) => stage.explode(e.clientX, e.clientY));
```

## Cursor magnet

```js
CubeIcons.stage(canvas, { magnet: 1.6, tilt: false }).show("smile");
```

## Text in cubes

```js
stage.show(CubeIcons.text("Hello", { color: "B" }));   // "\n" for more lines
```

Give text a wide canvas: each letter is about 5 cells wide plus a space.

## Feature cards

One stage per card, isometric and soft, built on hover or focus.

```html
<div class="feature" tabindex="0" data-icon="rocket">
  <canvas style="width:100%;height:190px" aria-hidden="true"></canvas>
  <h3>Fast</h3><p>Ships in a day.</p>
</div>
<script>
  document.querySelectorAll(".feature").forEach((card) => {
    const s = CubeIcons.stage(card.querySelector("canvas"), { view: "iso", look: "soft", depth: 1, tilt: false, max: 400 });
    const on = () => s.show(card.dataset.icon), off = () => s.clear();
    card.addEventListener("pointerenter", on); card.addEventListener("focusin", on);
    card.addEventListener("pointerleave", off); card.addEventListener("focusout", off);
  });
</script>
```

## Scroll sections

`scrub` ties the build to the scroll position (bottom row first) and takes it apart again as the section leaves; `trigger` flies the whole icon in at half in view.

```js
document.querySelectorAll("[data-cube]").forEach((canvas) => {
  const stage = CubeIcons.stage(canvas, { tilt: false });
  CubeIcons.scroll(stage, canvas.dataset.cube);                 // scrub
  // CubeIcons.scroll(stage, canvas.dataset.cube, { mode: "trigger" });
});
```

Options: `target` (the element to time by; defaults to the canvas), `hold` (0.15: how far from mid-screen, in screen heights, it stays whole), `range` (0.4: how far after that it takes to come apart).

## One brand colour

```js
CubeIcons.stage(canvas, { tint: "#ff4d8d" });                                   // every colour in shades of one ink
CubeIcons.stage(canvas, { palette: { ...CubeIcons.PALETTE, B: "#ff4d8d" } });   // just swap blue
```

## Frameworks

### A shared loader

Load the scripts once, in order, in the browser. Point `BASE` at wherever the two files are served (for example `/vendor/cube-icons/`).

```js
// cube-icons.js
const BASE = "/vendor/cube-icons/";
let loading;
export function loadCubeIcons() {
  if (window.CubeIcons) return Promise.resolve(window.CubeIcons);
  loading ??= Promise.all(["icons.js", "cubes.js"].map((file) => new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = BASE + file; s.async = false; s.onload = resolve; s.onerror = reject;
    document.head.append(s);
  }))).then(() => window.CubeIcons);
  return loading;
}
```

### React / Next.js

```jsx
"use client";
import { useEffect, useRef } from "react";
import { loadCubeIcons } from "./cube-icons";

export function CubeIcon({ icon = "rocket", options = {}, label, style }) {
  const ref = useRef(null);
  const opts = JSON.stringify(options);
  useEffect(() => {
    let stage, cancelled = false;
    loadCubeIcons().then((CubeIcons) => {
      if (cancelled) return;
      stage = CubeIcons.stage(ref.current, JSON.parse(opts));
      stage.show(icon);
    });
    return () => { cancelled = true; stage?.destroy(); };
  }, [icon, opts]);
  return <canvas ref={ref} role="img" aria-label={label ?? icon} style={{ width: "100%", height: 280, ...style }} />;
}
```

### Vue / Nuxt

```vue
<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import { loadCubeIcons } from "./cube-icons";
const props = defineProps({ icon: { type: String, default: "rocket" }, options: Object, label: String });
const el = ref(null);
let stage;
onMounted(async () => { const CubeIcons = await loadCubeIcons(); stage = CubeIcons.stage(el.value, props.options); stage.show(props.icon); });
onBeforeUnmount(() => stage?.destroy());
</script>
<template><canvas ref="el" role="img" :aria-label="label ?? icon" style="width:100%;height:280px" /></template>
```

In Nuxt, wrap the component in `<ClientOnly>`.

### Svelte

```svelte
<script>
  import { onMount } from "svelte";
  import { loadCubeIcons } from "./cube-icons";
  export let icon = "rocket", options = {}, label = icon;
  let el;
  onMount(() => { let stage; loadCubeIcons().then((C) => { stage = C.stage(el, options); stage.show(icon); }); return () => stage?.destroy(); });
</script>
<canvas bind:this={el} role="img" aria-label={label} style="width:100%;height:280px"></canvas>
```

### Framer

Insert → Utility → Embed, set to HTML, and paste a complete snippet (canvas, both scripts, and the call). For a reusable code component, use the React component above.

### Webflow

Add the two script tags in Page or Site settings → Custom code → Before `</body>`. Then an Embed element:

```html
<canvas id="cube" style="width:100%;height:280px" aria-label="A rocket"></canvas>
<script>addEventListener("load", () => CubeIcons.stage(document.getElementById("cube")).show("rocket"));</script>
```

### WordPress

A Custom HTML block with a complete snippet. If a security plugin strips scripts, add the two script tags in the theme's footer settings instead.
