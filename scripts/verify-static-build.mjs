import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const docs = path.join(root, "docs");
const indexPath = path.join(docs, "index.html");

function exists(rel) {
  return fs.existsSync(path.join(docs, rel));
}

assert.ok(fs.existsSync(indexPath), "docs/index.html should exist after build");
assert.ok(exists(".nojekyll"), "docs/.nojekyll should be present for GitHub Pages");
assert.ok(exists("THIRD_PARTY_NOTICES.md"), "third-party notices should be copied to docs");
assert.ok(!fs.existsSync(path.join(docs, "vendor")), "docs/vendor should not exist after Vite migration");
assert.ok(!fs.existsSync(path.join(docs, "app(backup).jsx")), "backup app file should not be published");

const html = fs.readFileSync(indexPath, "utf8");

assert.ok(!html.includes("text/babel"), "built HTML should not depend on browser Babel");
assert.ok(!html.includes("/src/main.tsx"), "built HTML should not reference source entry directly");
assert.ok(!html.includes("vendor/react"), "built HTML should not reference vendored React runtime");

const refs = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+href="([^"]+)"/g),
].map((m) => m[1]);

assert.ok(refs.length >= 2, "built HTML should reference bundled JS and CSS assets");

for (const ref of refs) {
  assert.ok(ref.startsWith("./assets/"), `asset reference should be relative: ${ref}`);
  const rel = ref.replace(/^\.\//, "");
  assert.ok(exists(rel), `referenced asset should exist: ${ref}`);
}

const assetFiles = fs.readdirSync(path.join(docs, "assets"));
assert.ok(assetFiles.some((name) => name.endsWith(".js")), "docs/assets should include JS bundles");
assert.ok(assetFiles.some((name) => name.endsWith(".css")), "docs/assets should include CSS bundle");

console.log("static build checks passed");
