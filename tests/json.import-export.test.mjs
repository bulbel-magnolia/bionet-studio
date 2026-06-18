// tests/json.import-export.test.mjs
// JSON 导入导出基础回归测试：确认导出的项目再次导入后可以完整恢复核心字段。
// 运行方式：node tests/json.import-export.test.mjs

import assert from "node:assert/strict";

// 深拷贝工具，避免导入规范化过程污染原始测试对象。
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// 模拟 window.Model.defaultProject() 中导入 fallback 需要用到的核心字段。
function defaultProject() {
  return {
    meta: {
      id: "default",
      name: "Default Project",
      kind: "template",
      domain: "default",
      note: "",
    },
    nodes: [],
    edges: [],
    params: {
      tMax: 24,
      tau: 4,
    },
    readouts: [
      {
        id: "default_readout",
        type: "classification",
        label: "Default Decision",
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
    aggregate: {
      label: "Score",
      mode: "outputs",
      channels: ["out_a"],
      method: "mean",
      unit: "a.u.",
    },
    channels: {
      out_a: {
        label: "Output A",
        sub: "default",
      },
    },
  };
}

// 模拟 app.jsx 中导出项目 JSON 的结构。
function exportProject(project) {
  return JSON.stringify(
    {
      format: "bionet-studio/v2",
      note: "ILLUSTRATIVE DEMO — not calibrated",
      project,
    },
    null,
    2,
  );
}

// 模拟 app.jsx 中导入 JSON 时对旧版本项目的兼容逻辑。
function normalizeImportedProject(rawProject) {
  const fallback = defaultProject();

  if (!rawProject || typeof rawProject !== "object") {
    return null;
  }

  const project = clone(rawProject);

  // nodes / edges 是项目能否恢复的最低要求。
  if (!Array.isArray(project.nodes) || !Array.isArray(project.edges)) {
    return null;
  }

  // meta 缺失时使用默认项补齐，并统一导入项目类型为 user。
  project.meta = {
    ...fallback.meta,
    ...(project.meta || {}),
    id: project.meta?.id || "import",
    name: project.meta?.name || "Imported Network",
    kind: "user",
    domain: project.meta?.domain || "Custom",
    note: project.meta?.note || "",
  };

  // params 缺失或字段不完整时使用默认仿真参数兜底。
  project.params = {
    ...fallback.params,
    ...(project.params || {}),
  };

  // readouts 缺失时恢复默认 readouts，避免读数面板失效。
  project.readouts = Array.isArray(project.readouts)
    ? project.readouts
    : clone(fallback.readouts);

  // aggregate 缺失或字段不完整时使用默认聚合配置兜底。
  project.aggregate = {
    ...fallback.aggregate,
    ...(project.aggregate || {}),
  };

  // channels 缺失时使用默认通道兜底。
  project.channels = {
    ...(fallback.channels || {}),
    ...(project.channels || {}),
  };

  return project;
}

// 从导出的 JSON 中读取项目，兼容新版本 project、旧版本 model、以及直接项目对象。
function importProject(jsonText) {
  const data = JSON.parse(jsonText);
  const rawProject = data.project || data.model || data;

  return normalizeImportedProject(rawProject);
}

// 构造一个包含 nodes、edges、params、readouts、aggregate 的完整项目。
function makeProject() {
  return {
    meta: {
      id: "json-test-project",
      name: "JSON Test Project",
      kind: "user",
      domain: "unit-test",
      note: "Project used for import/export regression test",
    },
    nodes: [
      {
        id: "in_a",
        kind: "sensor",
        label: "Input A",
        x: 120,
        y: 160,
        C: 0.8,
        Km: 0.5,
        n: 2,
        weight: 1,
      },
      {
        id: "node_a",
        kind: "response",
        label: "Response A",
        x: 360,
        y: 160,
        bias: 0.1,
        gain: 4,
      },
      {
        id: "out_a",
        kind: "reporter",
        label: "Output A",
        x: 620,
        y: 160,
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
        w: 1.5,
      },
      {
        id: "e_node_a_out_a",
        from: "node_a",
        to: "out_a",
        w: 0.9,
      },
    ],
    params: {
      tMax: 18,
      tau: 3,
    },
    readouts: [
      {
        id: "ro_json_test",
        type: "classification",
        label: "JSON Decision",
        config: {
          channel: "score",
          thresholds: [0.25, 0.75],
          labels: [
            { name: "low", color: "gray" },
            { name: "mid", color: "orange" },
            { name: "high", color: "green" },
          ],
          latch: true,
        },
      },
    ],
    aggregate: {
      label: "JSON Score",
      mode: "outputs",
      channels: ["out_a"],
      method: "mean",
      unit: "a.u.",
    },
    channels: {
      out_a: {
        label: "Output A",
        sub: "json-test",
      },
    },
  };
}

// 执行具名测试，失败时明确指出是哪一类 JSON 导入导出问题。
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

runTest("导出结构", () => {
  const project = makeProject();
  const exported = JSON.parse(exportProject(project));

  assert.equal(exported.format, "bionet-studio/v2", "export format should be v2");
  assert.equal(exported.note, "ILLUSTRATIVE DEMO — not calibrated", "export note should exist");
  assert.deepEqual(exported.project, project, "exported project should be unchanged");
});

runTest("导出后再导入保持一致", () => {
  const project = makeProject();
  const imported = importProject(exportProject(project));

  assert.deepEqual(imported.nodes, project.nodes, "nodes should be restored");
  assert.deepEqual(imported.edges, project.edges, "edges should be restored");
  assert.deepEqual(imported.params, project.params, "params should be restored");
  assert.deepEqual(imported.readouts, project.readouts, "readouts should be restored");
  assert.deepEqual(imported.aggregate, project.aggregate, "aggregate should be restored");
  assert.deepEqual(imported.channels, project.channels, "channels should be restored");
  assert.equal(imported.meta.kind, "user", "imported project kind should be user");
});

runTest("旧版本 model 字段兼容", () => {
  const project = makeProject();
  const imported = importProject(
    JSON.stringify({
      format: "bionet-studio/v1",
      model: project,
    }),
  );

  assert.deepEqual(imported.nodes, project.nodes, "nodes should be restored from model");
  assert.deepEqual(imported.edges, project.edges, "edges should be restored from model");
  assert.deepEqual(imported.params, project.params, "params should be restored from model");
  assert.deepEqual(imported.readouts, project.readouts, "readouts should be restored from model");
  assert.deepEqual(imported.aggregate, project.aggregate, "aggregate should be restored from model");
});

runTest("直接项目对象兼容", () => {
  const project = makeProject();
  const imported = importProject(JSON.stringify(project));

  assert.deepEqual(imported.nodes, project.nodes, "nodes should be restored from direct project JSON");
  assert.deepEqual(imported.edges, project.edges, "edges should be restored from direct project JSON");
  assert.deepEqual(imported.params, project.params, "params should be restored from direct project JSON");
  assert.deepEqual(imported.readouts, project.readouts, "readouts should be restored from direct project JSON");
  assert.deepEqual(imported.aggregate, project.aggregate, "aggregate should be restored from direct project JSON");
});

runTest("旧版本缺失字段 fallback", () => {
  const fallback = defaultProject();
  const oldProject = {
    nodes: [
      {
        id: "in_old",
        kind: "sensor",
        label: "Old Input",
        x: 100,
        y: 100,
        C: 1,
      },
    ],
    edges: [],
  };

  const imported = importProject(JSON.stringify({ model: oldProject }));

  assert.ok(imported, "old project should be importable");
  assert.deepEqual(imported.nodes, oldProject.nodes, "old project nodes should be preserved");
  assert.deepEqual(imported.edges, oldProject.edges, "old project edges should be preserved");
  assert.deepEqual(imported.params, fallback.params, "missing params should use fallback");
  assert.deepEqual(imported.readouts, fallback.readouts, "missing readouts should use fallback");
  assert.deepEqual(imported.aggregate, fallback.aggregate, "missing aggregate should use fallback");
  assert.deepEqual(imported.channels, fallback.channels, "missing channels should use fallback");
  assert.equal(imported.meta.id, "import", "missing meta id should use import");
  assert.equal(imported.meta.name, "Imported Network", "missing meta name should use fallback");
  assert.equal(imported.meta.kind, "user", "missing meta kind should be user");
});

runTest("旧版本字段不完整 fallback", () => {
  const oldProject = {
    meta: {
      name: "Partial Old Project",
    },
    nodes: [
      {
        id: "node_partial",
        kind: "response",
        label: "Partial Node",
        x: 200,
        y: 220,
      },
    ],
    edges: [],
    params: {
      tMax: 9,
    },
    aggregate: {
      channels: ["node_partial"],
    },
  };

  const imported = importProject(JSON.stringify({ project: oldProject }));

  assert.equal(imported.meta.id, "import", "partial meta should receive fallback id");
  assert.equal(imported.meta.name, "Partial Old Project", "partial meta name should be preserved");
  assert.equal(imported.meta.kind, "user", "partial meta kind should be user");
  assert.equal(imported.meta.domain, "Custom", "partial meta should receive fallback domain");
  assert.equal(imported.params.tMax, 9, "existing params should be preserved");
  assert.equal(imported.params.tau, defaultProject().params.tau, "missing param tau should use fallback");
  assert.deepEqual(imported.aggregate.channels, ["node_partial"], "existing aggregate fields should be preserved");
  assert.equal(imported.aggregate.method, defaultProject().aggregate.method, "missing aggregate method should use fallback");
  assert.deepEqual(imported.readouts, defaultProject().readouts, "missing readouts should use fallback");
});

runTest("无效 JSON 项目拒绝导入", () => {
  assert.equal(importProject(JSON.stringify({ project: null })), null, "null project should be rejected");
  assert.equal(importProject(JSON.stringify({ project: {} })), null, "project without nodes and edges should be rejected");
  assert.equal(
    importProject(JSON.stringify({ project: { nodes: [], edges: "bad" } })),
    null,
    "project with invalid edges should be rejected",
  );
});

console.log("json import/export tests passed");