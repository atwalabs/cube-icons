// Copies the engine and icon library into the skill folder, so skill/cube-icons is complete on its own.
// Run after changing cubes.js or icons.js:  node scripts/build-skill.mjs
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "skill", "cube-icons", "assets");
mkdirSync(assets, { recursive: true });
for (const file of ["cubes.js", "icons.js"]) copyFileSync(join(root, file), join(assets, file));
console.log("Copied cubes.js and icons.js into skill/cube-icons/assets");
