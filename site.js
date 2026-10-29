/*
 * The Cube Icons website's shared parts: the header, the footer, copy buttons on code blocks, and the release
 * settings below. Only the site pages use this file; the engine (cubes.js) doesn't need it.
 */
(function () {
  // ---- release settings: set `owner` to the GitHub account that hosts the repo, and every link and CDN URL follows
  const owner = "atwalabs";
  const version = "1.0.0";
  const SITE = {
    name: "Cube Icons",
    version,
    repo: `https://github.com/${owner}/cube-icons`,
    cdn: `https://cdn.jsdelivr.net/gh/${owner}/cube-icons@${version}/`,
    published: owner !== "YOUR-GITHUB-NAME",
  };
  window.SITE = SITE;

  // icons saved in the editor's "My icons" live in this browser; add them to the library on every page
  try {
    const mine = JSON.parse(localStorage.getItem("cubeicons:mine") || "{}");
    if (window.CUBE_ICONS) Object.assign(window.CUBE_ICONS, mine);
    SITE.mine = Object.keys(mine);
  } catch { SITE.mine = []; }

  // visit counts: Vercel Web Analytics, served by Vercel itself (no cookies); skipped when the pages are opened as files
  if (location.protocol.startsWith("http")) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    const va = document.createElement("script");
    va.defer = true; va.src = "/_vercel/insights/script.js";
    document.head.append(va);
  }

  const PAGES = [
    ["index.html", "Playground"],
    ["docs.html", "Docs"],
    ["examples.html", "Recipes"],
    ["editor.html", "Editor"],
    ["pro.html", "Pro"],
  ];
  const here = location.pathname.split("/").pop() || "index.html";

  const css = `
  .site-head { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin: 0 0 22px; padding-bottom: 14px; border-bottom: 1px solid var(--line, rgba(127,127,127,.25)); font: 500 12px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: .06em; text-transform: uppercase; }
  .site-head .brand { display: flex; align-items: center; gap: 8px; color: inherit; text-decoration: none; font-size: 13px; letter-spacing: .02em; }
  .site-head .brand i { width: 14px; height: 14px; display: inline-block; background: #2f3cff; box-shadow: 3px -3px 0 #8d97ff; }
  .site-head nav { display: flex; gap: 4px; flex-wrap: wrap; flex: 1; }
  .site-head nav a { color: inherit; opacity: .62; text-decoration: none; padding: 7px 9px; border-radius: 6px; }
  .site-head nav a:hover { opacity: 1; background: rgba(127,127,127,.12); }
  .site-head nav a[aria-current="page"] { opacity: 1; background: rgba(127,127,127,.16); }
  .site-head .ver { opacity: .55; }
  .site-head .gh { color: inherit; text-decoration: none; border: 1px solid var(--line, rgba(127,127,127,.3)); padding: 7px 10px; border-radius: 6px; }
  .site-head .menu { display: none; align-items: center; gap: 8px; font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit; background: none; border: 1px solid var(--line, rgba(127,127,127,.3)); padding: 7px 10px; border-radius: 6px; cursor: pointer; }
  .site-head .menu b { display: grid; gap: 3px; width: 12px; }
  .site-head .menu b::before, .site-head .menu b::after { content: ""; height: 1.5px; background: currentColor; transition: transform .2s; }
  .site-head.open .menu b::before { transform: translateY(2.25px) rotate(45deg); }
  .site-head.open .menu b::after { transform: translateY(-2.25px) rotate(-45deg); }
  /* phones: brand, GitHub and a menu button on one row; the pages open underneath */
  @media (max-width: 720px) {
    .site-head { gap: 8px; }
    .site-head .brand { margin-right: auto; }
    .site-head .ver { display: none; }
    .site-head .menu { display: inline-flex; }
    .site-head nav { display: none; order: 9; flex: 1 0 100%; flex-direction: column; gap: 2px; padding-top: 8px; }
    .site-head.open nav { display: flex; }
    .site-head nav a { padding: 12px 10px; font-size: 13px; }
  }
  .site-foot { margin-top: 56px; padding-top: 18px; border-top: 1px solid var(--line, rgba(127,127,127,.25)); display: flex; gap: 8px 18px; flex-wrap: wrap; font: 12px/1.6 "Geist Mono", ui-monospace, monospace; opacity: .7; }
  .site-foot a { color: inherit; }
  .copy-wrap { position: relative; min-width: 0; max-width: 100%; }
  .copy-wrap > pre { padding-top: 38px !important; }
  .copy-btn { position: absolute; top: 8px; right: 8px; font: 500 10px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: .06em; text-transform: uppercase; padding: 6px 8px; border-radius: 5px; cursor: pointer; color: inherit; background: rgba(127,127,127,.18); border: 1px solid rgba(127,127,127,.3); }
  .copy-btn:hover { background: rgba(127,127,127,.3); }
  .site-head a:focus-visible, .site-head button:focus-visible, .copy-btn:focus-visible { outline: 2px solid #8d97ff; outline-offset: 2px; }`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);

  const head = document.createElement("header");
  head.className = "site-head";
  head.innerHTML = `<a class="brand" href="index.html"><i aria-hidden="true"></i>${SITE.name}</a>
    <nav aria-label="Site" id="site-nav">${PAGES.map(([href, label]) => `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
    <span class="ver">v${version}</span><a class="gh" href="${SITE.repo}">GitHub</a>
    <button class="menu" type="button" aria-expanded="false" aria-controls="site-nav"><b aria-hidden="true"></b>Menu</button>`;
  document.body.prepend(head);
  const toggle = head.querySelector(".menu");
  toggle.addEventListener("click", () => toggle.setAttribute("aria-expanded", head.classList.toggle("open")));

  const foot = document.createElement("footer");
  foot.className = "site-foot";
  foot.innerHTML = `<span>${SITE.name} v${version}</span><span>Free and open source, MIT licence</span><a href="docs.html">Docs</a><a href="${SITE.repo}">GitHub</a><a href="pro.html">Pro</a><a href="llms.txt">llms.txt</a><a href="privacy.html">Privacy</a><span>Inspired by the menu on <a href="https://sparkk.fr">sparkk.fr</a></span>`;
  document.body.append(foot);

  // any <pre data-copy> gets a copy button; {{cdn}} in a code block becomes the CDN base URL
  function copyable(pre) {
    if (pre.parentElement.classList.contains("copy-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "copy-wrap";
    pre.replaceWith(wrap); wrap.append(pre);
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "copy-btn"; btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(pre.textContent); btn.textContent = "Copied"; }
      catch { getSelection().selectAllChildren(pre); btn.textContent = "Selected"; }
      setTimeout(() => (btn.textContent = "Copy"), 1400);
    });
    wrap.append(btn);
  }
  SITE.fill = (root = document) => {
    root.querySelectorAll("pre").forEach((pre) => { if (pre.textContent.includes("{{cdn}}")) pre.textContent = pre.textContent.replaceAll("{{cdn}}", SITE.cdn); });
    root.querySelectorAll("pre[data-copy]").forEach(copyable);
  };
  SITE.fill();
})();
