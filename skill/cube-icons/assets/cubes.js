/*
 * Cube Icons v1.0.0: pixel drawings built from 3D cubes that fly in, settle and fly apart.
 * MIT licence. No dependencies; works from file://. Docs: docs.html. Inspired by the menu on sparkk.fr.
 *
 *   const stage = CubeIcons.stage(canvas, { view: "front", depth: 2 });
 *   stage.show("briefcase");          // a name from CUBE_ICONS, or an array of rows
 *   stage.clear();                    // the cubes fly off and fade
 *   stage.set({ view: "iso" });       // change options live
 *   stage.build("rocket", 0.5);       // half built: 0 is scattered, 1 is whole
 *   stage.explode(e.clientX, e.clientY); // knock the cubes away from a point; they settle back
 *   CubeIcons.scroll(stage, "rocket"); // build and scatter it as the page scrolls
 *   CubeIcons.sequence(stage, ["home", "bag", "gift"]); // one icon after another
 *   CubeIcons.text("HELLO");          // rows for a word, in a 5-row pixel font
 *   CubeIcons.still(canvas, "heart"); // draw once, no animation (thumbnails)
 *
 * An icon is an array of equal-length strings; each character is a palette key ("." = empty). Rows read top to
 * bottom as you'd draw them. Every drawn pixel becomes `depth` cubes deep.
 */
(function () {
  const PALETTE = {
    B: "rgb(47,60,255)", // cobalt
    W: "rgb(241,239,234)", // paper
    K: "rgb(92,92,104)", // frame grey
    D: "rgb(40,40,46)", // dark
    R: "rgb(214,48,58)",
    O: "rgb(255,140,50)",
    Y: "rgb(255,196,60)",
    G: "rgb(64,190,120)",
    P: "rgb(187,175,254)",
    C: "rgb(80,200,255)",
    L: "rgb(178,178,188)", // light grey
    M: "rgb(255,112,170)", // pink
    N: "rgb(150,98,60)", // brown
  };

  // every option, with its default; still() uses the same ones
  const DEFAULTS = {
    view: "front", // "front" or "iso"
    depth: 2, // cubes deep, 1–5
    size: "auto", // pixels per cube, or "auto" to fit the canvas
    look: "flat", // one of LOOKS: flat, soft, clay, candy, paper, outline, pixel, glass, neon, wire, holo
    gap: 0, // space between cubes, 0–0.4 of a cube
    shadow: undefined, // a contact shadow under the icon; on by default for soft, clay and candy
    from: "auto", // where hidden cubes fly in from: "auto", "below", "above", "left", "right" or "center"
    magnet: 0, // how far cubes near the pointer pop toward you, in cubes (try 1.5)
    glow: 0, // bloom: soft light around the cubes, 0–1 (neon glows by default)
    float: 0, // idle motion, 0–1: the built icon sways and bobs, loose cubes from scatter() drift
    tilt: true, // the depth leans with the mouse
    duration: 700, // ms each cube takes to fly to its spot
    ease: "expo", // the flight's curve, one of EASES: expo (a fast start and a long soft landing), cubic, back, elastic, linear
    stagger: 260, // up to this many ms of random delay per cube, so they don't all leave at once
    spin: 0.25, // how far cubes turn while they fly, in turns; they always land square
    max: 900, // cube pool
    palette: PALETTE,
    tint: null, // one ink: every colour redrawn in shades of this one (light stays light), e.g. "#2f3cff"
    x: 0.5, // where the icon sits in the canvas, 0–1
    y: 0.5,
  };

  /** [r, g, b] from "rgb(r,g,b)", "#rgb" or "#rrggbb". */
  function parse(col) {
    if (col[0] !== "#") return col.match(/\d+/g).slice(0, 3).map(Number);
    const h = col.length === 4 ? [...col.slice(1)].map((x) => x + x).join("") : col.slice(1, 7);
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  // push a colour away from grey by `sat`, then scale its brightness by `bright`
  const vivid = (c, sat, bright) => { const g = (c[0] + c[1] + c[2]) / 3; return c.map((v) => (g + (v - g) * sat) * bright); };
  const css = (c) => `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(",")})`;
  const shades = new Map();
  /** Every face colour a cube can need, worked out once per colour. */
  function shade(col) {
    let s = shades.get(col);
    if (!s) {
      const c = parse(col), k = (f) => c.map((v) => v * f);
      s = {
        top: css(k(1.2)), front: css(c), side: css(k(0.62)),
        // soft: highlights lean warm, shade leans cool, and each front face gets a lit and a shaded bevel
        softTop: css(mix(k(1.14), [255, 246, 228], 0.2)), softSide: css(mix(k(0.58), [24, 28, 80], 0.2)),
        hi: css(mix(c, [255, 255, 255], 0.34)), lo: css(mix(k(0.72), [16, 18, 50], 0.22)),
        line: css(mix(k(0.32), [0, 0, 0], 0.35)),
        // clay: pastel and matte; neon: a dark body with a bright edge
        clayFront: css(mix(c, [255, 255, 255], 0.28)), clayTop: css(mix(c, [255, 250, 240], 0.55)), claySide: css(mix(mix(c, [255, 255, 255], 0.28).map((v) => v * 0.8), [60, 50, 90], 0.12)),
        dark: css(mix(c, [6, 6, 10], 0.84)), glow: css(mix(c, [255, 255, 255], 0.18)),
        // candy: more saturated and a touch brighter; paper: flat card stock
        candy: css(vivid(c, 1.4, 1.06)), candyTop: css(mix(vivid(c, 1.3, 1.06), [255, 255, 255], 0.38)), candySide: css(vivid(c, 1.4, 0.68)),
        paper: css(mix(c, [250, 246, 238], 0.1)),
        lum: (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255,
      };
      shades.set(col, s);
    }
    return s;
  }

  /**
   * The palette to draw with: o.palette plus an icon's own colours (extra), and with o.tint every colour mapped by
   * its lightness onto that one ink.
   */
  function paletteOf(o, extra) {
    const base = extra ? { ...o.palette, ...extra } : o.palette;
    if (!o.tint) return base;
    // light parts stay clearly the ink's colour rather than washing out to white
    const t = parse(o.tint), dark = mix(t, [0, 0, 0], 0.58), light = mix(t, [255, 255, 255], 0.42);
    return Object.fromEntries(Object.entries(base).map(([key, col]) => {
      const [r, g, b] = parse(col);
      return [key, css(mix(dark, light, (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255))];
    }));
  }

  /**
   * An icon is a name from CUBE_ICONS, an array of rows, or { rows, colors } where colors adds its own palette keys
   * (lowercase letters by convention), e.g. { colors: { a: "#ff4d8d" }, rows: ["aa..", ...] }.
   */
  const lookup = (icon) => (typeof icon === "string" ? (window.CUBE_ICONS || {})[icon] : icon);
  const resolve = (icon) => { const v = lookup(icon); return Array.isArray(v) ? v : v && Array.isArray(v.rows) ? v.rows : null; };
  const colorsOf = (icon) => { const v = lookup(icon); return v && !Array.isArray(v) && v.colors ? v.colors : null; };

  function voxels(icon, depth, palette) {
    const rows = resolve(icon);
    if (!rows || !rows.length) return [];
    palette = { ...(colorsOf(icon) || {}), ...palette };
    const out = [], h = rows.length, w = Math.max(...rows.map((r) => r.length));
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const col = palette[ch];
        if (!col) return;
        for (let d = 0; d < depth; d++) out.push({ x: x - (w - 1) / 2, y: d, z: h - 1 - y - (h - 1) / 2, col });
      }),
    );
    return out;
  }

  // easing curves for a flight, p from 0 to 1; expo matches the long soft landing of GSAP's expo.out
  const EASES = {
    expo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    cubic: (p) => 1 - Math.pow(1 - p, 3),
    back: (p) => 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2),
    elastic: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    linear: (p) => p,
  };
  // a colour part-way between two; steps of 4 keep the face-colour cache small while colours blend
  const blend = (a, b, t) => css(mix(a, b, t).map((v) => Math.round(v / 4) * 4));

  // py: the depth a cube is drawn at, which the magnet pulls forward
  const depthOf = (c) => (c.py ?? c.y);

  const path = (g, p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); };
  const fill = (g, color, p) => { g.fillStyle = color; path(g, p); g.fill(); };
  const stroke = (g, color, width, p) => { g.strokeStyle = color; g.lineWidth = width; g.lineJoin = "round"; path(g, p); g.stroke(); };
  // the front face as a rectangle; flat colour bleeds half a pixel so neighbours meet without hairline seams
  const frontRect = (g, color, f, bleed) => { g.fillStyle = color; g.fillRect(f.x - bleed, f.y - bleed, f.z + bleed * 2, f.z + bleed * 2); };

  /**
   * The looks. Each paints one cube from its faces: f.top, f.side and f.front are corner lists; in the front view
   * f.x, f.y (top-left of the front face) and f.z (its size) are set too; f.edge is the top's front edge, for rims.
   */
  const LOOKS = {
    flat(g, s, f) {
      fill(g, s.top, f.top); fill(g, s.side, f.side);
      if (f.x != null) frontRect(g, s.front, f, 0.5); else fill(g, s.front, f.front);
    },
    soft(g, s, f) {
      fill(g, s.softTop, f.top); fill(g, s.softSide, f.side);
      if (f.x == null) { fill(g, s.front, f.front); g.strokeStyle = s.hi; g.lineWidth = Math.max(1, f.size * 0.08); g.beginPath(); g.moveTo(f.edge[0], f.edge[1]); g.lineTo(f.edge[2], f.edge[3]); g.lineTo(f.edge[4], f.edge[5]); g.stroke(); return; }
      frontRect(g, s.front, f, 0.5);
      const b = Math.max(1, f.z * 0.13);
      g.fillStyle = s.hi; g.fillRect(f.x, f.y, f.z, b); g.fillRect(f.x, f.y, b, f.z);
      g.fillStyle = s.lo; g.fillRect(f.x, f.y + f.z - b, f.z, b); g.fillRect(f.x + f.z - b, f.y, b, f.z);
    },
    clay(g, s, f) {
      fill(g, s.clayTop, f.top); fill(g, s.claySide, f.side);
      if (f.x == null) return fill(g, s.clayFront, f.front);
      g.fillStyle = s.clayFront; g.beginPath();
      if (g.roundRect) g.roundRect(f.x, f.y, f.z, f.z, f.z * 0.28); else g.rect(f.x, f.y, f.z, f.z);
      g.fill();
    },
    outline(g, s, f) {
      const w = Math.max(1, f.size * 0.07);
      for (const [color, p] of [[s.top, f.top], [s.side, f.side], [s.front, f.front]]) { fill(g, color, p); stroke(g, s.line, w, p); }
    },
    glass(g, s, f) {
      const a = g.globalAlpha;
      g.globalAlpha = a * 0.5; fill(g, s.hi, f.top);
      g.globalAlpha = a * 0.28; fill(g, s.side, f.side);
      g.globalAlpha = a * 0.32; fill(g, s.front, f.front);
      g.globalAlpha = a * 0.9;
      for (const p of [f.top, f.side, f.front]) stroke(g, s.hi, 1, p);
      g.globalAlpha = a;
    },
    neon(g, s, f) {
      const w = Math.max(1, f.size * 0.07);
      for (const p of [f.top, f.side, f.front]) { fill(g, s.dark, p); stroke(g, s.glow, w, p); }
    },
    candy(g, s, f) {
      fill(g, s.candyTop, f.top); fill(g, s.candySide, f.side);
      if (f.x != null) frontRect(g, s.candy, f, 0.5); else fill(g, s.candy, f.front);
      // a glossy highlight near the top-left of the face that faces you
      const a = g.globalAlpha;
      g.globalAlpha = a * 0.6; g.fillStyle = "#fff"; g.beginPath();
      if (f.x != null) { if (g.roundRect) g.roundRect(f.x + f.z * 0.14, f.y + f.z * 0.13, f.z * 0.36, f.z * 0.17, f.z * 0.085); else g.rect(f.x + f.z * 0.14, f.y + f.z * 0.13, f.z * 0.36, f.z * 0.17); }
      else { const cx = (f.top[0] + f.top[4]) / 2, cy = (f.top[1] + f.top[5]) / 2; g.ellipse(cx - f.size * 0.12, cy, f.size * 0.2, f.size * 0.09, -0.5, 0, Math.PI * 2); }
      g.fill(); g.globalAlpha = a;
    },
    // paper: flat cut-outs; under() lays every cube's shadow first, so shadows fall only outside the shape
    paper: Object.assign((g, s, f) => {
      if (f.x != null) frontRect(g, s.paper, f, 0.5); else fill(g, s.paper, f.outline);
    }, {
      under(g, s, f) {
        const a = g.globalAlpha, o = f.size * 0.12;
        g.globalAlpha = a * 0.2; g.fillStyle = "#000";
        if (f.x != null) g.fillRect(f.x + o * 0.6, f.y + o, f.z, f.z); else { g.save(); g.translate(o * 0.4, o); fill(g, "#000", f.outline); g.restore(); }
        g.globalAlpha = a;
      },
    }),
    // pixel: flat 2D pixel art, the front layer only
    pixel(g, s, f) {
      if (f.layer > 0) return;
      if (f.x != null) frontRect(g, s.front, f, 0.5); else fill(g, s.front, f.outline);
    },
    // holo: the hue shifts across the icon (and while cubes fly); each colour's lightness keeps the detail
    holo(g, s, f) {
      const hue = (((f.c.x * 11 + f.c.z * 8) % 360) + 560) % 360, l = 34 + s.lum * 42;
      fill(g, `hsl(${hue} 92% ${Math.min(92, l + 20)}%)`, f.top); fill(g, `hsl(${hue + 24} 80% ${l - 16}%)`, f.side);
      const front = `hsl(${hue + 12} 86% ${l}%)`;
      if (f.x != null) frontRect(g, front, f, 0.5); else fill(g, front, f.front);
    },
    wire(g, s, f) {
      const a = g.globalAlpha, w = Math.max(1, f.size * 0.05);
      g.globalAlpha = a * 0.08; fill(g, s.front, f.front); g.globalAlpha = a;
      for (const p of [f.top, f.side, f.front]) stroke(g, s.front, w, p);
    },
  };

  /** Draw one cube. L is the frame's layout (see layout()). */
  function drawCube(g, c, L, paint = LOOKS[L.look] || LOOKS.flat) {
    const S = L.S, z = S * (1 - L.gap), y = depthOf(c), turn = c.r || 0, size = c.k ?? 1, layer = Math.round(c.ty ?? c.y);
    // where it's drawn: its position plus any float drift
    const X = c.x + (c.fx || 0), Z = c.z + (c.fz || 0);
    // a cube in flight turns about its own middle, and can be drawn bigger or smaller (burst, scatter)
    const spun = (cx, cy, draw) => {
      if (!turn && size === 1) return draw();
      g.save(); g.translate(cx, cy); g.rotate(turn); g.scale(size, size); g.translate(-cx, -cy); draw(); g.restore();
    };
    if (L.view === "iso") {
      // the hexagon is centred on (px, py), so a gap just draws it smaller
      const px = L.ox + (X - y) * S * 0.866, py = L.oy + (X + y) * S * 0.5 - Z * S, h = z * 0.866;
      return spun(px, py, () => paint(g, shade(c.col), {
        size: z, c, layer,
        outline: [px, py - z, px + h, py - z / 2, px + h, py + z / 2, px, py + z, px - h, py + z / 2, px - h, py - z / 2],
        top: [px, py - z, px + h, py - z / 2, px, py, px - h, py - z / 2],
        front: [px - h, py - z / 2, px, py, px, py + z, px - h, py + z / 2],
        side: [px + h, py - z / 2, px, py, px, py + z, px + h, py + z / 2],
        edge: [px - h, py - z / 2, px, py, px + h, py - z / 2],
      }));
    }
    // front: the drawing faces you square-on, depth shows as a slanted side; a gap shrinks it about its centre
    const k = 1 - L.gap, dx = L.ddx * k, dy = L.ddy * k;
    const x0 = L.ox + X * S + y * L.ddx + (S - z + L.ddx - dx) / 2, y0 = L.oy - Z * S + y * L.ddy - (S - z) / 2 + (L.ddy - dy) / 2;
    spun(x0 + (z + dx) / 2, y0 + (dy - z) / 2, () => paint(g, shade(c.col), {
      size: z, x: x0, y: y0 - z, z, c, layer,
      top: [x0, y0 - z, x0 + z, y0 - z, x0 + z + dx, y0 - z + dy, x0 + dx, y0 - z + dy],
      side: [x0 + z, y0 - z, x0 + z + dx, y0 - z + dy, x0 + z + dx, y0 + dy, x0 + z, y0],
      front: [x0, y0 - z, x0 + z, y0 - z, x0 + z, y0, x0, y0],
    }));
  }

  /**
   * Bloom: blurred copies of the frame added on top, a wide soft one and a tight bright one, at strength 0–1.
   * Skipped where canvas filters aren't supported.
   */
  function glow(g, canvas, S, strength) {
    if (!("filter" in g) || strength <= 0) return;
    const px = S * Math.min(2, devicePixelRatio || 1);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "lighter";
    g.filter = `blur(${Math.max(3, px * 1.6)}px)`; g.globalAlpha = 0.55 * strength; g.drawImage(canvas, 0, 0);
    g.filter = `blur(${Math.max(2, px * 0.45)}px)`; g.globalAlpha = 0.8 * strength; g.drawImage(canvas, 0, 0);
    g.restore();
  }
  const glowOf = (o) => o.glow || (o.look === "neon" ? 0.75 : 0);

  // back to front; positions round to a quarter cube so cubes a hair off their spot still draw in grid order
  const r4 = (v) => Math.round(v * 4);
  const order = (view) =>
    view === "iso"
      ? (p, q) => r4(p.x + depthOf(p)) - r4(q.x + depthOf(q)) || r4(p.z) - r4(q.z) || p.x - q.x
      : (p, q) => r4(depthOf(q)) - r4(depthOf(p)) || r4(p.z) - r4(q.z) || p.x - q.x;

  /** Size a cube so the icon fits the canvas with some air. */
  function fitSize(rows, W, H, depth, view) {
    const w = Math.max(1, ...rows.map((r) => r.length)), h = Math.max(1, rows.length);
    if (view === "iso") return Math.max(3, Math.min(W / ((w + depth) * 0.866 * 1.25), H / ((h + (w + depth) * 0.5) * 1.2)));
    return Math.max(3, Math.min(W / (w + depth * 0.5 + 2), H / (h + depth * 0.4 + 2)));
  }

  /** Cube size, depth slant and origin for one frame. tilt is the pointer's lean, each -0.5–0.5. */
  function layout(W, H, rows, o, tilt) {
    const S = o.size === "auto" ? fitSize(rows || ["................"], W, H, o.depth, o.view) : o.size;
    const ddx = S * (0.42 + tilt[0] * 0.3), ddy = -S * (0.34 + tilt[1] * 0.2), front = o.view !== "iso";
    return {
      view: o.view, look: o.look, gap: Math.min(0.6, Math.max(0, o.gap)), S, ddx, ddy,
      ox: W * o.x - (front ? S / 2 + (o.depth * ddx) / 2 : 0),
      oy: H * o.y + (front ? S / 2 - (o.depth * ddy) / 2 : 0),
    };
  }

  /** A soft shadow on the ground under the icon's settled spots, at strength a (0–1). */
  function drawShadow(g, spots, L, a) {
    if (a < 0.02 || !spots.length) return;
    let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const t of spots) {
      const iso = L.view === "iso";
      const x = iso ? L.ox + (t.x - t.y) * L.S * 0.866 : L.ox + t.x * L.S + t.y * L.ddx + L.S / 2;
      const y = iso ? L.oy + (t.x + t.y) * L.S * 0.5 - t.z * L.S + L.S : L.oy - t.z * L.S + t.y * L.ddy;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
    const rx = (x1 - x0) / 2 + L.S * 1.4, ry = L.S * 0.7 + rx * 0.1;
    g.save();
    g.translate((x0 + x1) / 2, y1 + L.S * 0.4); g.scale(rx, ry);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, `rgba(0,0,0,${0.36 * a})`); gr.addColorStop(0.55, `rgba(0,0,0,${0.14 * a})`); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  const wantsShadow = (o) => o.shadow ?? (o.look === "soft" || o.look === "clay" || o.look === "candy");
  /** Draw a sorted list of cubes in a look, with its under-layer first if it has one. */
  function paintAll(g, list, L, alpha) {
    const look = LOOKS[L.look] || LOOKS.flat;
    for (const pass of look.under ? [look.under, look] : [look])
      for (const c of list) { if (alpha) g.globalAlpha = Math.min(1, c.a); drawCube(g, c, L, pass); }
    g.globalAlpha = 1;
  }

  function stage(canvas, options = {}) {
    if (shades.size > 6000) shades.clear();
    const o = Object.assign({}, DEFAULTS, options);
    const g = canvas.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // shape: the last icon shown, which keeps sizing the cubes while they fly apart after clear()
    // spots: where that icon's cubes sit when built, for the shadow
    // progress: how far build() has assembled the current icon (null after show() or clear())
    // L: the last frame's layout, so explode() and the magnet can turn page points into cube positions
    let cubes = [], current = null, shape = null, spots = [], progress = null, plan = null, L = null;
    let raf = 0, mx = 0.5, my = 0.5, inside = false, onScreen = true, lit = false, warned = false;

    // each cube keeps one scatter offset for build(), so scrubbing back and forth doesn't jitter
    const pool = () => {
      while (cubes.length < o.max) cubes.push({ x: (Math.random() - 0.5) * 60, y: 0, z: -40, tx: 0, ty: 0, tz: -40, a: 0, ta: 0, col: o.palette.B, r: 0, k: 1, at: null, m: 0, ph: Math.random() * 6.28, sx: (Math.random() - 0.5) * 50, sy: (Math.random() - 0.5) * 16, sz: -20 - Math.random() * 25 });
    };
    pool();

    function prepare(icon) {
      current = icon;
      if (typeof icon === "string" && !resolve(icon)) console.warn(`CubeIcons: there's no icon called "${icon}". Check the name, and that icons.js loaded before you called show().`);
      shape = resolve(icon) || shape;
      pool();
      const v = voxels(icon, o.depth, paletteOf(o, colorsOf(icon)));
      if (v.length > cubes.length && !warned) {
        warned = true;
        console.warn(`CubeIcons: this icon needs ${v.length} cubes but the pool holds ${cubes.length}, so some won't show. Raise \`max\` or draw it smaller.`);
      }
      spots = v.slice(0, cubes.length);
      return v;
    }

    // a hidden cube starts its flight from the `from` side, lined up with the spot it's flying to
    function launch(c, t) {
      if (o.from === "auto") return;
      const j = () => (Math.random() - 0.5) * 6;
      const at = { below: [t.x + j(), -30 + j()], above: [t.x + j(), 30 + j()], left: [-40 + j(), t.z + j()], right: [40 + j(), t.z + j()], center: [j() / 4, j() / 4] }[o.from];
      if (at) { c.x = at[0]; c.y = t.y; c.z = at[1]; }
    }
    const turns = (k = 1) => (reduce ? 0 : (Math.random() - 0.5) * 2 * o.spin * Math.PI * 2 * k);
    const later = (ms) => (reduce ? 0 : Math.random() * ms);
    const headed = (c, t) => c.tx === t.x && c.ty === t.y && c.tz === t.z && c.ta === t.a && (!t.col || c.col1 === t.col);

    /**
     * Send a cube to t = { x, y, z, a, col } after `delay` ms. It flies from wherever it is now, with the stage's
     * duration and ease (or opts.dur), turning to opts.r (square, 0, unless it's leaving). opts.then chains a second
     * flight. t.k is the size to end at (1 by default); opts.late fades it out only near the end (burst); opts.loose
     * marks it as drifting (scatter). A cube already headed to the same place is left alone.
     */
    function aim(c, t, delay = 0, opts = {}) {
      if (!opts.then && headed(c, t)) return;
      if (t.col && t.col !== c.col) {
        if (c.a < 0.05) { c.col = t.col; c.c0 = null; } else { c.c0 = parse(c.col); c.c1 = parse(t.col); }
      } else c.c0 = null;
      Object.assign(c, { x0: c.x, y0: c.y, z0: c.z, a0: c.a, r0: c.r, k0: c.k, tk: t.k ?? 1, tx: t.x, ty: t.y, tz: t.z, ta: t.a, tr: opts.r ?? 0, col1: t.col || c.col, at: performance.now() + delay, dur: opts.dur ?? o.duration, then: opts.then || null, late: !!opts.late, loose: !!opts.loose });
      start();
    }

    function show(icon) {
      progress = null;
      const v = prepare(icon);
      cubes.forEach((c, i) => {
        const t = v[i];
        if (t) {
          const spot = { x: t.x, y: t.y, z: t.z, a: 1, col: t.col };
          if (headed(c, spot)) return;
          // hidden cubes start from the `from` side, already turned, and land square
          if (c.a < 0.05) { launch(c, t); c.r = turns(); }
          aim(c, spot, later(o.stagger));
        } else if (c.ta > 0 || c.a > 0) aim(c, { x: (Math.random() - 0.5) * 90, y: (Math.random() - 0.5) * 20, z: -60, a: 0 }, later(o.stagger * 0.5), { r: c.r + turns() });
      });
    }
    /** Assemble part of an icon: 0 is all scattered, 1 is built. Cubes land bottom row first, a little shuffled. */
    function build(icon, p) {
      if (!plan || plan.icon !== icon || plan.depth !== o.depth || plan.palette !== o.palette || plan.tint !== o.tint) {
        const v = prepare(icon), n = Math.max(1, v.length);
        const rank = [];
        v.map((t, i) => [t.z + Math.random() * 2.5, i]).sort((a, b) => a[0] - b[0]).forEach(([, i], r) => (rank[i] = (r + 1) / n));
        plan = { icon, depth: o.depth, palette: o.palette, tint: o.tint, v, rank };
      } else current = icon;
      progress = p = Math.min(1, Math.max(0, p));
      // scrolling calls this often; a shorter flight keeps the cubes close behind the scroll
      const dur = o.duration * 0.6;
      cubes.forEach((c, i) => {
        const t = plan.v[i];
        if (!t) { if (c.ta > 0) aim(c, { x: c.x, y: c.y, z: c.z, a: 0 }, 0, { dur }); }
        else if (plan.rank[i] <= p) aim(c, { x: t.x, y: t.y, z: t.z, a: 1, col: t.col }, 0, { dur });
        else aim(c, { x: t.x + c.sx, y: t.y + c.sy, z: t.z + c.sz, a: 0, col: t.col }, 0, { dur, r: c.sx * 0.2 * o.spin });
      });
    }
    function clear() {
      current = null;
      progress = null;
      cubes.forEach((c) => { if (c.ta > 0 || c.a > 0) aim(c, { x: c.x + (Math.random() - 0.5) * 40, y: c.y, z: c.z - 20 - Math.random() * 20, a: 0 }, later(Math.min(o.stagger, 160)), { r: c.r + turns() }); });
    }

    /**
     * The cubes rush toward you, growing and fading: a page-transition burst. Nothing is shown afterwards.
     * opts: force (how far and how big, 1), dur (ms, 1.3 × duration).
     */
    function burst(opts = {}) {
      const force = opts.force ?? 1, dur = opts.dur ?? o.duration * 1.3;
      current = null; progress = null;
      cubes.forEach((c) => {
        if (!(c.ta > 0 || c.a > 0)) return;
        const ang = Math.atan2(c.z, c.x) + (Math.random() - 0.5) * 0.9, dist = (8 + Math.random() * 22) * force;
        aim(c, { x: c.x + Math.cos(ang) * dist, y: c.y - 2 - Math.random() * 6, z: c.z + Math.sin(ang) * dist, a: 0, k: 1.8 + Math.random() * 3.2 * force }, later(Math.min(o.stagger, 120)), { dur, r: c.r + turns(1.5), late: true });
      });
    }
    /**
     * Loose cubes spread across the whole canvas, turned every which way; with float they drift. show() then
     * gathers them into an icon. count (120), opts: icon (the icon they'll gather into, so cubes are sized for it),
     * color (a colour; the palette's B by default), alpha [min, max], size [min, max].
     */
    function scatter(count = 120, opts = {}) {
      const alpha = opts.alpha || [0.35, 0.95], size = opts.size || [0.45, 1.1];
      current = null; progress = null;
      if (opts.icon) shape = resolve(opts.icon) || shape;
      if (!shape) shape = Array(12).fill("................");
      pool();
      const W = canvas.clientWidth || 300, H = canvas.clientHeight || 150;
      const S = o.size === "auto" ? fitSize(shape, W, H, o.depth, o.view) : o.size, hw = W / S / 2 + 1, hh = H / S / 2 + 1;
      const col = opts.color || paletteOf(o).B, rnd = (r) => r[0] + Math.random() * (r[1] - r[0]);
      cubes.forEach((c, i) => {
        if (i < count) {
          const t = { x: (Math.random() - 0.5) * 2 * hw, y: (Math.random() - 0.5) * 6, z: (Math.random() - 0.5) * 2 * hh, a: rnd(alpha), k: rnd(size), col };
          if (c.a < 0.05) { c.x = t.x + (Math.random() - 0.5) * 8; c.z = t.z - 6 - Math.random() * 8; c.col = col; }
          aim(c, t, later(o.stagger * 2), { r: turns(2), loose: true });
        } else if (c.ta > 0 || c.a > 0) aim(c, { x: c.x, y: c.y, z: c.z - 10, a: 0 }, later(o.stagger), { r: c.r + turns() });
      });
    }

    /** A point in the canvas (CSS pixels) as a cube position on the icon's front layer. */
    function toCube(px, py) {
      if (L.view === "iso") { const x = (px - L.ox) / (L.S * 0.866); return [x, (x * L.S * 0.5 - (py - L.oy)) / L.S]; }
      return [(px - L.ox) / L.S - 0.5, (L.oy - py) / L.S - 0.5];
    }
    /** Knock the built cubes away from a point on the page (or the icon's middle); they settle back on their own. */
    function explode(clientX, clientY, force = 6) {
      if (!L || reduce) return;
      let cx = 0, cz = 0;
      if (clientX != null) { const r = canvas.getBoundingClientRect(); [cx, cz] = toCube(clientX - r.left, clientY - r.top); }
      for (const c of cubes) {
        if (c.ta < 1) continue;
        const dx = c.x - cx, dz = c.z - cz, d = Math.hypot(dx, dz) || 1, f = force * Math.max(0.2, 1.2 - d / 10) * (0.6 + Math.random() * 0.8);
        // out fast, then back home with the stage's own flight
        const home = { x: c.tx, y: c.ty, z: c.tz, a: 1, col: c.col1 || c.col };
        aim(c, { x: c.x + (dx / d) * f, y: c.y - Math.random() * f * 0.5, z: c.z + (dz / d) * f, a: 1 }, 0, { dur: Math.max(120, o.duration * 0.3), r: turns(0.5), then: home });
      }
    }

    function frame() {
      raf = 0;
      if (!onScreen) return;
      const dpr = Math.min(2, devicePixelRatio || 1), W = canvas.clientWidth, H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
      // clear in device pixels: at fractional scaling (125%, 150%) W × dpr isn't whole, and clearing in CSS pixels
      // would leave the last row and column uncleared, so passing cubes would smear a line along the edge
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const now = performance.now(), ease = EASES[o.ease] || EASES.expo, fl = reduce ? 0 : o.float, t = now / 1000;
      // float: the whole icon sways a little, as if hanging in the air
      const tilt = o.tilt ? [mx - 0.5, my - 0.5] : [0, 0];
      if (fl) { tilt[0] += Math.sin(t * 0.55) * 0.35 * fl; tilt[1] += Math.sin(t * 0.42 + 1) * 0.25 * fl; }
      L = layout(W, H, shape, o, tilt);
      const pull = o.magnet && inside && !reduce, [gx, gz] = pull ? toCube(mx * W, my * H) : [0, 0];
      let moving = false, built = 0;
      cubes.forEach((c, i) => {
        // each cube in flight: how far through its tween it is, by the clock, so every screen runs at the same pace
        if (c.at !== null) {
          moving = true;
          if (now >= c.at) {
            const p = reduce || c.dur <= 0 ? 1 : Math.min(1, (now - c.at) / c.dur), e = ease(p);
            c.x = c.x0 + (c.tx - c.x0) * e; c.y = c.y0 + (c.ty - c.y0) * e; c.z = c.z0 + (c.tz - c.z0) * e;
            c.a = Math.min(1, Math.max(0, c.a0 + (c.ta - c.a0) * (c.late ? p * p * p : Math.min(1, e))));
            c.r = c.r0 + (c.tr - c.r0) * e;
            c.k = c.k0 + (c.tk - c.k0) * e;
            if (c.c0) c.col = p >= 1 ? c.col1 : blend(c.c0, c.c1, Math.min(1, e));
            if (p >= 1) {
              c.at = null; c.c0 = null; c.col = c.col1;
              if (c.a === 0) c.r = 0;
              if (c.then) { const next = c.then; c.then = null; aim(c, next, 0, { then: null }); }
            }
          }
        }
        // the magnet: cubes within a few cubes of the pointer ease toward you, and back when it leaves
        const goal = pull && c.ta > 0 ? o.magnet * Math.max(0, 1 - Math.hypot(c.x - gx, c.z - gz) / 3.5) : 0;
        if (goal || c.m) { c.m += (goal - c.m) * 0.25; if (Math.abs(goal - c.m) > 0.01) moving = true; else c.m = goal; }
        c.py = c.y - c.m;
        // float: built cubes bob together; loose ones drift on their own slow paths
        if (fl && c.a > 0.02) {
          if (c.loose) { c.fx = Math.sin(t * 0.45 + c.ph) * 1.4 * fl; c.fz = Math.cos(t * 0.38 + c.ph * 1.3) * 1.4 * fl; }
          else { c.fx = 0; c.fz = Math.sin(t * 1.2) * 0.3 * fl; }
          moving = true;
        } else c.fx = c.fz = 0;
        if (i < spots.length) built += Math.min(1, c.a);
      });
      if (wantsShadow(o)) drawShadow(g, spots, L, built / Math.max(1, spots.length));
      const vis = cubes.filter((c) => c.a > 0.02).sort(order(o.view));
      paintAll(g, vis, L, true);
      if (vis.length) glow(g, canvas, L.S, glowOf(o));
      lit = vis.length > 0;
      if (moving) start();
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    // once the cubes settle, tilt and the magnet redraw only when the pointer moves and there's something to move
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height;
      inside = mx >= 0 && mx <= 1 && my >= 0 && my <= 1;
      if ((o.tilt || o.magnet) && lit) start();
    };
    const onLeave = () => { inside = false; if (o.magnet) start(); };
    addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    // off-screen the stage pauses mid-flight and picks up where it left off when it scrolls back in
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) start(); });
    const ro = new ResizeObserver(start);
    io.observe(canvas); ro.observe(canvas);
    return {
      canvas, show, build, clear, explode, burst, scatter,
      /** Change options live. Depth, palette, tint and pool size rebuild the icon; the rest just redraw. */
      set(next) {
        const rebuild = ["depth", "palette", "tint", "max"].some((key) => key in next && next[key] !== o[key]);
        Object.assign(o, next);
        if (!current || !rebuild) start();
        else if (progress == null) show(current);
        else build(current, progress);
      },
      get options() { return { ...o }; },
      destroy() { cancelAnimationFrame(raf); removeEventListener("pointermove", onMove); document.documentElement.removeEventListener("pointerleave", onLeave); io.disconnect(); ro.disconnect(); },
    };
  }

  /** Draw an icon once, settled (for thumbnails and static use). Takes the same options as stage(). */
  function still(canvas, icon, options = {}) {
    const o = Object.assign({}, DEFAULTS, options);
    const g = canvas.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rows = resolve(icon);
    if (!rows) return;
    const L = layout(W, H, rows, o, [0, 0]), v = voxels(icon, o.depth, paletteOf(o, colorsOf(icon)));
    if (wantsShadow(o)) drawShadow(g, v, L, 1);
    paintAll(g, v.sort(order(o.view)), L, false);
    glow(g, canvas, L.S, glowOf(o));
  }

  /**
   * Tie a stage to the page's scroll. Returns { destroy }.
   *   mode "scrub"   (default) the build follows the scroll: cubes land as the target nears the middle of the screen
   *                  and scatter again as it moves away, in both directions.
   *   mode "trigger" the whole icon flies in once half the target is in view, and flies apart when it leaves.
   * target is the element to watch (the stage's canvas by default). For scrub, hold is how far (in screen heights)
   * the target's centre can be from the screen's centre and still be fully built, and range is the distance over
   * which it comes apart after that.
   */
  function scroll(st, icon, options = {}) {
    const o = Object.assign({ mode: "scrub", target: st.canvas, hold: 0.15, range: 0.4 }, options);
    if (o.mode === "trigger") {
      let shown = false;
      const io = new IntersectionObserver(([e]) => {
        const inView = e.intersectionRatio >= 0.5;
        if (inView !== shown) { shown = inView; if (inView) st.show(icon); else st.clear(); }
      }, { threshold: [0, 0.5] });
      io.observe(o.target);
      return { destroy: () => io.disconnect() };
    }
    let raf = 0, last = -1;
    const update = () => {
      raf = 0;
      const r = o.target.getBoundingClientRect(), vh = innerHeight;
      const off = Math.abs(r.top + r.height / 2 - vh / 2) / vh;
      const p = Math.min(1, Math.max(0, (o.hold + o.range - off) / o.range));
      if (p !== last) { last = p; st.build(icon, p); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();
    return { destroy() { cancelAnimationFrame(raf); removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); } };
  }

  /** Show icons one after another, every `every` ms; the cubes fly from one to the next. Returns { destroy }. */
  function sequence(st, icons, options = {}) {
    const { every = 2000 } = options;
    let i = 0;
    st.show(icons[0]);
    const id = setInterval(() => st.show(icons[(i = (i + 1) % icons.length)]), every);
    return { destroy: () => clearInterval(id) };
  }

  // a 5-row pixel font for text(): A–Z, 0–9 and a little punctuation; "#" is filled
  const FONT = {
    A: ".###. #...# ##### #...# #...#", B: "####. #...# ####. #...# ####.", C: ".#### #.... #.... #.... .####",
    D: "####. #...# #...# #...# ####.", E: "##### #.... ####. #.... #####", F: "##### #.... ####. #.... #....",
    G: ".#### #.... #..## #...# .####", H: "#...# #...# ##### #...# #...#", I: "### .#. .#. .#. ###",
    J: "..### ...#. ...#. #..#. .##..", K: "#..# #.#. ##.. #.#. #..#", L: "#... #... #... #... ####",
    M: "#...# ##.## #.#.# #...# #...#", N: "#...# ##..# #.#.# #..## #...#", O: ".###. #...# #...# #...# .###.",
    P: "####. #...# ####. #.... #....", Q: ".###. #...# #.#.# #..#. .##.#", R: "####. #...# ####. #..#. #...#",
    S: ".#### #.... .###. ....# ####.", T: "##### ..#.. ..#.. ..#.. ..#..", U: "#...# #...# #...# #...# .###.",
    V: "#...# #...# #...# .#.#. ..#..", W: "#...# #...# #.#.# ##.## #...#", X: "#...# .#.#. ..#.. .#.#. #...#",
    Y: "#...# .#.#. ..#.. ..#.. ..#..", Z: "##### ...#. ..#.. .#... #####",
    0: ".###. #..## #.#.# ##..# .###.", 1: ".#. ##. .#. .#. ###", 2: "####. ....# .###. #.... #####",
    3: "####. ....# .###. ....# ####.", 4: "#..#. #..#. ##### ...#. ...#.", 5: "##### #.... ####. ....# ####.",
    6: ".###. #.... ####. #...# .###.", 7: "##### ....# ...#. ..#.. ..#..", 8: ".###. #...# .###. #...# .###.",
    9: ".###. #...# .#### ....# .###.", " ": "... ... ... ... ...", "!": "# # # . #", "?": ".###. #...# ..##. ..... ..#..",
    ".": ". . . . #", ",": ". . . # #", ":": ". # . # .", "-": "... ... ### ... ...", "+": "... .#. ### .#. ...",
    "'": "# # . . .", "&": ".#.. #.#. .#.# #.#. .#.#", "/": "....# ...#. ..#.. .#... #....",
  };
  /**
   * Rows for a word or a few lines ("\n"), ready for show(). Letters A–Z, 0–9 and . , : ! ? - + ' & /;
   * anything else becomes a space. Options: color (a palette key, "B"), spacing (columns between letters, 1),
   * line (rows between lines, 1).
   */
  function text(str, options = {}) {
    const { color = "B", spacing = 1, line = 1 } = options;
    const lines = String(str).toUpperCase().split("\n").map((ln) => {
      const rows = ["", "", "", "", ""];
      [...ln].forEach((ch, i) => {
        const glyph = (FONT[ch] || FONT[" "]).split(" ");
        rows.forEach((_, r) => (rows[r] += (i ? ".".repeat(spacing) : "") + glyph[r].replace(/#/g, color)));
      });
      return rows;
    });
    const w = Math.max(...lines.map((l) => l[0].length));
    return lines.flatMap((l, i) => [...(i ? Array(line).fill("") : []), ...l]).map((r) => r.padEnd(w, "."));
  }

  window.CubeIcons = { version: "1.0.0", stage, still, scroll, sequence, text, voxels, PALETTE, DEFAULTS, LOOKS: Object.keys(LOOKS), EASES: Object.keys(EASES) };
})();
