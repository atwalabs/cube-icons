// Copies the engine and icon library into the skill folder, so skill/cube-icons is complete on its own,
// and rebuilds llms-full.txt (the skill and its references as one file, for AI tools that read the site).
// Run after changing cubes.js, icons.js or anything in skill/:  node scripts/build-skill.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skill = join(root, "skill", "cube-icons");
const assets = join(skill, "assets");
mkdirSync(assets, { recursive: true });
for (const file of ["cubes.js", "icons.js"]) copyFileSync(join(root, file), join(assets, file));
console.log("Copied cubes.js and icons.js into skill/cube-icons/assets");

const read = (p) => readFileSync(join(skill, p), "utf8").replace(/^---[\s\S]*?---\s*/, "").trim();
const full = [
  "# Cube Icons: full reference for AI tools",
  "> Everything an AI assistant needs to add Cube Icons to a web page: the Claude skill's instructions, the API and the recipes. Site: https://cube-icons.attwa.me. Source: https://github.com/atwalabs/cube-icons (MIT).",
  read("SKILL.md"),
  read("references/api.md"),
  read("references/recipes.md"),
].join("\n\n") + "\n";
writeFileSync(join(root, "llms-full.txt"), full);
console.log("Wrote llms-full.txt");
