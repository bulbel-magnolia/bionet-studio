// tests/sim.basic.test.mjs
// sim.js 基础回归测试：覆盖 Hill 响应、激活边、抑制边、classification、crossedTop 等核心行为。
// 运行方式：node tests/sim.basic.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// 获取当前测试文件路径。
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// sim.js 默认位于 src/legacy/sim.js。
// 如果你的 sim.js 路径不同，只需要修改这里。
const simPath = path.resolve(__dirname, "../src/legacy/sim.js");

// 创建浏览器环境模拟对象，因为 sim.js 通常通过 window.Sim 暴露 API。
const sandbox = {
  window: {},
  console,
};

// 提供最小 I18n mock，避免 sim.js 或相关逻辑读取翻译函数时报错。
sandbox.window.I18n = {
  t: (key) => key,
};

// 加载 sim.js 到 vm 环境。
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(simPath, "utf8"), sandbox, {
  filename: simPath,
});

const Sim = sandbox.window.Sim;

// 确认 Sim API 已正确挂载。
assert.ok(Sim, "window.Sim should be defined");
assert.equal(typeof Sim.run, "function", "Sim.run should exist");
assert.equal(typeof Sim.hill, "function", "Sim.hill should exist");
assert.equal(typeof Sim.classify, "function", "Sim.classify should exist");
assert.equal(typeof Sim.crossedTop, "function", "Sim.crossedTop should exist");
assert.equal(typeof Sim.channelFinal, "function", "Sim.channelFinal should exist");
assert.equal(typeof Sim.channelPeak, "function", "Sim.channelPeak should exist");

// 浮点数近似比较，避免小数计算误差导致测试误判。
function almostEqual(actual, expected, epsilon = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be close to ${expected}`,
  );
}

// 读取 classification 返回结果中的名称字段，兼容不同实现返回 label/name/text。
function className(result) {
  return result?.label ?? result?.name ?? result?.text ?? String(result);
}

// 输出带前缀的测试结果，方便快速定位失败项。
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

// 生成最小 project，用于测试激活边、抑制边、memory、reporter、aggregate score。
function makeProject(edgeWeight = 1, overrides = {}) {
  const project = {
    meta: {
      id: "sim-basic-test",
      name: "Sim Basic Test",
      kind: "test",
      domain: "unit-test",
      note: "Basic regression test project for sim.js",
    },
    nodes: [
      {
        id: "in_a",
        kind: "sensor",
        label: "Input A",
        x: 100,
        y: 180,
        C: 1,
        Km: 0.5,
        n: 2,
        weight: 1,
      },
      {
        id: "node_a",
        kind: "response",
        label: "Response A",
        x: 360,
        y: 180,
        bias: 0,
        gain: 4,
      },
      {
        id: "mem_a",
        kind: "memory",
        label: "Memory A",
        x: 580,
        y: 180,
        bias: 0,
        gain: 4,
        latch: 0.5,
      },
      {
        id: "out_a",
        kind: "reporter",
        label: "Output A",
        x: 820,
        y: 180,
        bias: 0,
        gain: 4,
        gainOut: 1,
      },
    ],
    edges: [
      {
        id: "e_in_a_node_a",
        from: "in_a",
        to: "node_a",
        w: edgeWeight,
      },
      {
        id: "e_node_a_mem_a",
        from: "node_a",
        to: "mem_a",
        w: 1,
      },
      {
        id: "e_mem_a_out_a",
        from: "mem_a",
        to: "out_a",
        w: 1,
      },
    ],
    params: {
      tMax: 12,
      tau: 3,
    },
    aggregate: {
      label: "Score",
      mode: "outputs",
      channels: ["out_a"],
      method: "mean",
      unit: "a.u.",
    },
    readouts: [
      {
        id: "ro_classification",
        type: "classification",
        label: "Decision",
        config: {
          channel: "score",
          thresholds: [0.5],
          labels: [
            { name: "low", color: "gray" },
            { name: "high", color: "green" },
          ],
          latch: true,
        },
      },
    ],
    channels: {
      out_a: {
        label: "Output A",
        sub: "test",
      },
    },
  };

  return {
    ...project,
    ...overrides,
  };
}

runTest("Hill 响应", () => {
  assert.equal(Sim.hill(0, 0.5, 2), 0, "Hill response should be 0 when C is 0");

  almostEqual(Sim.hill(0.5, 0.5, 2), 0.5, 1e-6);

  const low = Sim.hill(0.1, 0.5, 2);
  const high = Sim.hill(1, 0.5, 2);

  assert.ok(low > 0 && low < 1, "Hill low-dose response should be inside 0..1");
  assert.ok(high > low, "Hill response should increase with concentration");
  assert.ok(high <= 1, "Hill response should not exceed 1");
});

runTest("激活边", () => {
  const weakProject = makeProject(0.2);
  const strongProject = makeProject(2);

  const weakSim = Sim.run(weakProject);
  const strongSim = Sim.run(strongProject);

  const weakFinal = Sim.channelFinal(weakSim, "score");
  const strongFinal = Sim.channelFinal(strongSim, "score");

  assert.ok(
    strongFinal > weakFinal,
    `activation edge should increase output: weak=${weakFinal}, strong=${strongFinal}`,
  );
});

runTest("抑制边", () => {
  const activatingProject = makeProject(2);
  const inhibitingProject = makeProject(-2);

  const activatingSim = Sim.run(activatingProject);
  const inhibitingSim = Sim.run(inhibitingProject);

  const activatingFinal = Sim.channelFinal(activatingSim, "score");
  const inhibitingFinal = Sim.channelFinal(inhibitingSim, "score");

  assert.ok(
    inhibitingFinal < activatingFinal,
    `inhibitory edge should reduce output: inhibit=${inhibitingFinal}, activate=${activatingFinal}`,
  );
});

runTest("classification 阈值", () => {
  const config = {
    thresholds: [0.5],
    labels: [
      { name: "low", color: "gray" },
      { name: "high", color: "green" },
    ],
  };

  const low = Sim.classify(0.2, config);
  const high = Sim.classify(0.8, config);

  assert.ok(low, "classification low result should exist");
  assert.ok(high, "classification high result should exist");
  assert.equal(className(low), "low", "value below threshold should be classified as low");
  assert.equal(className(high), "high", "value above threshold should be classified as high");
});

runTest("crossedTop / latch", () => {
  const project = makeProject(2);
  const sim = Sim.run(project);

  const peak = Sim.channelPeak(sim, "score");

  const config = {
    channel: "score",
    thresholds: [0.3, Math.max(0.01, peak * 0.8)],
    labels: [
      { name: "low", color: "gray" },
      { name: "mid", color: "orange" },
      { name: "high", color: "green" },
    ],
    latch: true,
  };

  assert.ok(
    peak >= config.thresholds[config.thresholds.length - 1],
    `test setup should cross top threshold, peak=${peak}`,
  );

  assert.equal(
    Sim.crossedTop(sim, config),
    true,
    "crossedTop should be true after crossing top threshold",
  );
});

runTest("未越过最高阈值", () => {
  const project = makeProject(0.2);
  const sim = Sim.run(project);
  const peak = Sim.channelPeak(sim, "score");

  const config = {
    channel: "score",
    thresholds: [0.3, peak + 0.2],
    labels: [
      { name: "low", color: "gray" },
      { name: "mid", color: "orange" },
      { name: "high", color: "green" },
    ],
    latch: true,
  };

  assert.equal(
    Sim.crossedTop(sim, config),
    false,
    `crossedTop should be false if top threshold is never crossed, peak=${peak}`,
  );
});

runTest("输出结构", () => {
  const project = makeProject(1);
  const sim = Sim.run(project);

  assert.ok(sim, "Sim.run should return a result");
  assert.ok(sim.series || sim.channels || sim.steady, "simulation result should include output data");

  const final = Sim.channelFinal(sim, "score");
  const peak = Sim.channelPeak(sim, "score");

  assert.equal(typeof final, "number", "final score should be a number");
  assert.equal(typeof peak, "number", "peak score should be a number");
  assert.ok(Number.isFinite(final), "final score should be finite");
  assert.ok(Number.isFinite(peak), "peak score should be finite");
  assert.ok(peak >= final || Math.abs(peak - final) < 1e-6, "peak should be greater than or equal to final");

  if (typeof Sim.timeToFraction === "function") {
    const t50 = Sim.timeToFraction(sim, "score", 0.5);
    assert.ok(t50 === null || typeof t50 === "number", "t50 should be null or number");
  }
});

console.log("sim basic tests passed");
