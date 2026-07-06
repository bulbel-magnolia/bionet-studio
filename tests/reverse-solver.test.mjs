// tests/reverse-solver.test.mjs
// ReverseSolver 回归测试：覆盖通用目标规格、候选求解和应用补丁。

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const sandbox = {
  window: {},
  console,
};

sandbox.window.I18n = {
  lang: "zh",
  t: (key) => ({
    low: "低",
    mid: "中",
    high: "高",
    off: "关",
    on: "开",
    outputsWord: "输出",
  })[key] || key,
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "src/legacy/sim.js"), "utf8"), sandbox, {
  filename: "sim.js",
});
vm.runInContext(fs.readFileSync(path.join(root, "src/legacy/model.js"), "utf8"), sandbox, {
  filename: "model.js",
});

const { Model, ReverseSolver } = sandbox.window;

assert.ok(Model, "window.Model should be available");
assert.ok(ReverseSolver, "window.ReverseSolver should be available");
assert.equal(typeof ReverseSolver.solve, "function", "ReverseSolver.solve should exist");

function runTest(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${name}: ${message}`);
    throw new Error(`[${name}] ${message}`, { cause: error });
  }
}

runTest("生成分类目标规格", () => {
  const project = Model.defaultProject();
  const spec = ReverseSolver.makeDefaultSpec(project, "classification");

  assert.equal(spec.objectiveType, "classification");
  assert.ok(spec.inputs.length >= 1, "spec should include input sensors");
  assert.ok(spec.rows.length >= 3, "classification spec should include target rows");
  assert.ok(spec.labels.length >= 2, "classification spec should include labels");
});

runTest("分类求解返回候选方案", () => {
  const project = Model.defaultProject();
  const spec = ReverseSolver.makeDefaultSpec(project, "classification");
  const result = ReverseSolver.solve(project, spec, { iterations: 80, topN: 3 });

  assert.equal(result.candidates.length, 3, "solver should return requested candidates");
  assert.ok(result.candidates[0].score > 0, "best candidate should have positive score");
  assert.ok(result.candidates[0].accuracy >= 0.5, "best candidate should fit at least half of target rows");
  assert.ok(result.diagnostics.variables.count > 0, "diagnostics should report optimized variables");
});

runTest("候选方案可以应用到项目", () => {
  const project = Model.defaultProject();
  const spec = ReverseSolver.makeDefaultSpec(project, "classification");
  const result = ReverseSolver.solve(project, spec, { iterations: 80, topN: 1 });
  const candidate = result.candidates[0];
  const applied = ReverseSolver.applyCandidate(project, candidate);

  assert.notEqual(applied, project, "applyCandidate should return a cloned project");
  assert.deepEqual(applied.meta.kind, "user", "applied example should become user project");
  assert.equal(applied.nodes.length, project.nodes.length, "node count should be preserved");
  assert.equal(applied.edges.length, project.edges.length, "edge count should be preserved");

  const readout = applied.readouts.find((r) => r.id === candidate.patch.readoutId);
  assert.ok(readout, "target readout should still exist");
  assert.deepEqual(
    readout.config.thresholds,
    candidate.patch.thresholds.map((x) => Math.round(x * 1000) / 1000),
    "classification thresholds should be applied",
  );
});

runTest("逻辑真值表目标可求解", () => {
  const logic = Model.EXAMPLES.find((example) => example.id === "and").make();
  const spec = ReverseSolver.makeDefaultSpec(logic, "truth");
  const result = ReverseSolver.solve(logic, spec, { iterations: 80, topN: 2 });

  assert.equal(spec.objectiveType, "truth");
  assert.ok(result.candidates[0].accuracy >= 0.5, "truth-table candidate should fit at least half of rows");
  assert.ok(Array.isArray(result.candidates[0].rows), "candidate should include row-level predictions");
});

console.log("reverse solver tests passed");
