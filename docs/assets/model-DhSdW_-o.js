/* ===================================================================
   bionet-studio — model.js
   Current iGEM-facing examples use the licorice quality evaluation route:
   three quality-marker inputs, signal integration, and a harvest guidance
   readout. All example values are ILLUSTRATIVE / DEMO / to-be-calibrated.
   No real Registry IDs or literature parameters are invented.
   =================================================================== */
(function () {
  const lang = () => window.I18n?.lang || "zh";
  const ui = (key) => window.I18n?.t(key) || key;
  const pick = (zh, en) => lang() === "zh" ? zh : en;

  /* ---- element kinds (generic platform vocabulary) -------------- */
  const TYPES = [
    { kind: "sensor",   label: pick("传感器", "Sensor"), role: pick("输入", "Input"), group: pick("输入", "Inputs"),
      blurb: pick("将输入信号经 Hill 响应转换为活性。", "Input signal \u2192 activity via a Hill response."),
      main: { key: "C", label: pick("水平", "level") }, color: "var(--k-sensor)" },
    { kind: "signal",   label: pick("调控器", "Regulator"), role: pick("中继", "Relay"), group: pick("处理", "Processing"),
      blurb: pick("整合并转递上游信号。", "Integrates and relays upstream signals."),
      main: { key: "gain", label: pick("增益", "gain") }, color: "var(--k-signal)" },
    { kind: "response", label: pick("响应节点", "Response node"), role: pick("隐藏单元", "Hidden unit"), group: pick("处理", "Processing"),
      blurb: pick("由启动子响应驱动，整合加权输入。", "Promoter-driven node summing weighted inputs."),
      main: { key: "gain", label: pick("增益", "gain") }, color: "var(--k-response)" },
    { kind: "memory",   label: pick("记忆锁存", "Memory latch"), role: pick("双稳态", "Bistable"), group: pick("处理", "Processing"),
      blurb: pick("越过阈值后保持状态。", "Holds a state once a threshold is crossed."),
      main: { key: "gain", label: pick("增益", "gain") }, color: "var(--k-memory)" },
    { kind: "reporter", label: pick("报告器", "Reporter"), role: pick("输出", "Output"), group: pick("输出", "Outputs"),
      blurb: pick("带表达与成熟动力学的输出通道。", "Output channel with expression + maturation."),
      main: { key: "gainOut", label: pick("增益", "gain") }, color: "var(--k-reporter)" },
  ];
  const TYPE_GROUPS = [pick("输入", "Inputs"), pick("处理", "Processing"), pick("输出", "Outputs")];
  const KIND_META = Object.fromEntries(TYPES.map((t) => [t.kind, t]));

  /* ---- parameter schema per kind -------------------------------- */
  const PARAM_SCHEMA = {
    sensor: [
      { key: "C",      label: pick("输入水平", "Input level"), min: 0, max: 1.5, step: 0.01, unit: "a.u." },
      { key: "Km",     label: pick("K\u2098（半最大）", "K\u2098 (half-max)"), min: 0.05, max: 1.5, step: 0.01, unit: "a.u." },
      { key: "n",      label: pick("Hill 系数 n", "Hill coeff. n"), min: 0.5, max: 4, step: 0.1, unit: "" },
      { key: "weight", label: pick("输入权重", "Input weight"), min: -1, max: 1.5, step: 0.05, unit: "" },
    ],
    signal:   [ { key: "bias", label: pick("偏置", "Bias"), min: -2, max: 2, step: 0.05, unit: "" },
                { key: "gain", label: pick("增益", "Gain"), min: 0.5, max: 6, step: 0.1, unit: "" } ],
    response: [ { key: "bias", label: pick("偏置", "Bias"), min: -2, max: 2, step: 0.05, unit: "" },
                { key: "gain", label: pick("增益", "Gain"), min: 0.5, max: 6, step: 0.1, unit: "" } ],
    reporter: [ { key: "gainOut",   label: pick("输出增益", "Output gain"), min: 0, max: 1.5, step: 0.05, unit: "" },
                { key: "tauMature", label: pick("成熟时间 τ", "Maturation \u03c4"), min: 0.5, max: 10, step: 0.1, unit: "h" } ],
    memory:   [ { key: "bias", label: pick("偏置", "Bias"), min: -2, max: 2, step: 0.05, unit: "" },
                { key: "gain", label: pick("增益", "Gain"), min: 0.5, max: 6, step: 0.1, unit: "" } ],
  };

  /* ---- readout type catalogue (configurable output panel) ------- */
  const READOUT_TYPES = [
    { type: "timeseries",     label: pick("时间序列", "Time series"),      icon: "readoutSeries",   unit: "a.u.",
      blurb: pick("绘制一个或多个通道随时间变化。", "Plot one or more channels over time.") },
    { type: "channels",       label: pick("输出通道", "Output channels"),  icon: "readoutChannels", unit: "a.u.",
      blurb: pick("多通道报告器 / 输出轨迹。", "Multi-channel reporter / output traces.") },
    { type: "classification", label: pick("决策规则", "Decision rule"),    icon: "readoutDecision", unit: "state",
      blurb: pick("将通道数值按阈值映射为状态标签。", "Threshold rule mapping a channel to labelled states.") },
    { type: "heatmap",        label: pick("层活性", "Layer activity"),   icon: "readoutHeatmap",  unit: "act",
      blurb: pick("按层显示每个节点的稳态活性。", "Steady-state activation of every node, by layer.") },
    { type: "dose",           label: pick("剂量响应", "Dose–response"),    icon: "readoutDose",     unit: "out",
      blurb: pick("扫描一个输入，读取一个稳态输出。", "Sweep one input, read one output at steady state.") },
    { type: "truth",          label: pick("真值表", "Truth table"),      icon: "readoutTruth",    unit: "bits",
      blurb: pick("低/高输入组合与决策标签的对应关系。", "Low/high input combinations vs. a decision label.") },
  ];
  const READOUT_META = Object.fromEntries(READOUT_TYPES.map((r) => [r.type, r]));

  /* ---- channel helpers ------------------------------------------ */
  // a "channel" is either an aggregate ('score') or a node id.
  function channelsOf(project) {
    const list = [{
      id: "score",
      label: project.aggregate?.label || pick("综合输出", "Aggregate output"),
      color: "var(--ch-score)",
      agg: true
    }];
    project.nodes.forEach((n) => {
      list.push({ id: n.id, label: n.label, color: nodeTint(n) });
    });
    return list;
  }
  function nodeTint(n) {
    if (n.tint) return n.tint;
    return KIND_META[n.kind]?.color || "var(--text-2)";
  }

  /* =================================================================
     EXAMPLE PROJECTS  — each is a complete, self-contained project.
     ================================================================= */

  const E = (from, to, w) => ({ id: from + ">" + to, from, to, w, sign: w >= 0 ? 1 : -1 });

  /* generic backbone topology shared by examples (relabelled per project) */
  function backbone(labels, tints) {
    const X = { sensor: 90, signal: 330, response: 575, reporter: 835 };
    const nodes = [
      { id: "in_a", kind: "sensor", x: X.sensor, y: 80,  C: 0.62, Km: 0.40, n: 2.2, weight: 0.55, ...labels.in_a },
      { id: "in_b", kind: "sensor", x: X.sensor, y: 230, C: 0.38, Km: 0.50, n: 1.8, weight: 0.32, ...labels.in_b },
      { id: "in_c", kind: "sensor", x: X.sensor, y: 380, C: 0.50, Km: 0.60, n: 1.5, weight: 0.18, ...labels.in_c },
      { id: "reg_a", kind: "signal", x: X.signal, y: 130, bias: -0.4, gain: 3.4, label: pick("调控器 α", "Regulator \u03b1"), sub: pick("中继", "relay") },
      { id: "reg_b", kind: "signal", x: X.signal, y: 320, bias: -0.5, gain: 3.0, label: pick("调控器 β", "Regulator \u03b2"), sub: pick("中继", "relay") },
      { id: "nd_1", kind: "response", x: X.response, y: 70,  bias: -0.6, gain: 3.6, label: pick("节点 N1", "Node N1"), sub: pick("整合器", "integrator") },
      { id: "nd_2", kind: "response", x: X.response, y: 230, bias: -0.5, gain: 3.4, label: pick("节点 N2", "Node N2"), sub: pick("整合器", "integrator") },
      { id: "nd_3", kind: "response", x: X.response, y: 390, bias: -0.4, gain: 3.2, label: pick("节点 N3", "Node N3"), sub: pick("整合器", "integrator") },
      { id: "out_1", kind: "reporter", x: X.reporter, y: 80,  gainOut: 1.0, tauMature: 3.2, tint: tints[0], ...labels.out_1 },
      { id: "out_2", kind: "reporter", x: X.reporter, y: 230, gainOut: 0.9, tauMature: 4.0, tint: tints[1], ...labels.out_2 },
      { id: "out_3", kind: "reporter", x: X.reporter, y: 380, gainOut: 0.85, tauMature: 6.0, tint: tints[2], ...labels.out_3 },
    ];
    const edges = [
      E("in_a", "reg_a", 1.6), E("in_b", "reg_a", 0.7),
      E("in_b", "reg_b", 1.5), E("in_c", "reg_b", 0.9), E("in_a", "reg_b", -0.5),
      E("reg_a", "nd_1", 1.7), E("in_a", "nd_1", 0.6),
      E("reg_a", "nd_2", 0.8), E("reg_b", "nd_2", 1.4),
      E("reg_b", "nd_3", 1.6), E("in_c", "nd_3", 0.7), E("reg_a", "nd_3", -0.4),
      E("nd_1", "out_1", 1.8), E("nd_2", "out_1", 0.4),
      E("nd_2", "out_2", 1.7), E("nd_3", "out_2", 0.3),
      E("nd_3", "out_3", 1.6), E("nd_1", "out_3", -0.3),
    ];
    return { nodes, edges };
  }

  const CH = ["var(--ch-1)", "var(--ch-2)", "var(--ch-3)"];

  function rid() { return "r" + Math.random().toString(36).slice(2, 7); }
  const RO = (type, title, config, source) => ({ id: rid(), type, title, config: config || {}, source: source || "preset" });

  /* --- 1. active project example: licorice quality evaluation ----- */
  function licoriceQuality() {
    const bb = backbone({
      in_a: { label: pick("甘草酸类", "Saponin marker"), sub: pick("三萜皂苷输入", "triterpenoid input"), C: 0.72, Km: 0.42, n: 2.1, weight: 0.48 },
      in_b: { label: pick("黄酮类", "Flavonoid marker"), sub: pick("黄酮输入", "flavonoid input"), C: 0.58, Km: 0.46, n: 1.9, weight: 0.34 },
      in_c: { label: pick("酚酸类", "Phenolic acid marker"), sub: pick("酚酸输入", "phenolic input"), C: 0.44, Km: 0.55, n: 1.7, weight: 0.18 },
      out_1: { label: pick("GFP 质量通道", "GFP quality channel"), sub: pick("主读出", "primary readout") },
      out_2: { label: pick("YFP 辅助通道", "YFP auxiliary channel"), sub: pick("成分均衡", "component balance") },
      out_3: { label: pick("DsRed 校正通道", "DsRed correction channel"), sub: pick("样本校正", "sample correction") },
    }, ["var(--rep-gfp)", "var(--rep-yfp)", "var(--rep-dsred)"]);
    return {
      meta: { id: "licorice", name: pick("甘草质量评价示例", "Licorice quality assessor"), kind: "example", domain: pick("甘草质量检测", "Licorice quality"),
        note: pick("以甘草酸类、黄酮类和酚酸类信号计算质量指数，并给出采收窗口提示。", "Combines saponin, flavonoid and phenolic-acid signals into a quality index and harvest-window hint.") },
      ...bb,
      aggregate: { label: pick("甘草质量指数", "Licorice quality index"), mode: "weightedSensors", unit: "a.u." },
      params: { tMax: 24, tau: 4.0 },
      readouts: [
        RO("classification", pick("采收建议", "Harvest guidance"), { channel: "score",
          thresholds: [0.35, 0.68],
          labels: [ { name: pick("继续积累", "ACCUMULATE"), color: "var(--st-idle)" }, { name: pick("建议观察", "WATCH"), color: "var(--st-warn)" }, { name: pick("适宜采收", "READY"), color: "var(--st-ok)" } ],
          latch: false }),
        RO("timeseries", pick("质量指数 Q(t)", "Quality index Q(t)"), { channels: ["score"] }),
        RO("channels", pick("荧光读出", "Fluorescence readouts"), { channels: ["out_1", "out_2", "out_3"] }),
        RO("dose", pick("甘草酸类扫描", "Saponin-marker sweep"), { input: "in_a", output: "score" }),
        RO("heatmap", pick("层活性", "Layer activity"), {}),
      ],
    };
  }

  /* --- 2. neutral template: signal integration model ------------- */
  function signalIntegration() {
    const bb = backbone({
      in_a: { label: pick("输入 A", "Input A"), sub: pick("传感器", "sensor") },
      in_b: { label: pick("输入 B", "Input B"), sub: pick("传感器", "sensor") },
      in_c: { label: pick("输入 C", "Input C"), sub: pick("传感器", "sensor") },
      out_1: { label: pick("通道 1", "Channel 1"), sub: pick("输出", "output") },
      out_2: { label: pick("通道 2", "Channel 2"), sub: pick("输出", "output") },
      out_3: { label: pick("通道 3", "Channel 3"), sub: pick("输出", "output") },
    }, CH);
    return {
      meta: { id: "starter", name: pick("信号整合模型", "Signal integration model"), kind: "example", domain: pick("起始模板", "Starter template"),
        note: pick("一个中性的多输入网络，是平台的默认起点。", "A neutral multi-input network — the platform's default template.") },
      ...bb,
      aggregate: { label: pick("综合输出", "Aggregate output"), mode: "outputs", channels: ["out_1", "out_2", "out_3"], method: "mean", unit: "a.u." },
      params: { tMax: 24, tau: 4.0 },
      readouts: [
        RO("timeseries", pick("综合输出", "Aggregate output"), { channels: ["score"] }),
        RO("classification", pick("模型状态", "Model state"), { channel: "score",
          thresholds: [0.30, 0.70],
          labels: [ { name: ui("low"), color: "var(--st-idle)" }, { name: ui("mid"), color: "var(--accent)" }, { name: ui("high"), color: "var(--k-response)" } ],
          latch: false }),
        RO("channels", pick("输出通道", "Output channels"), { channels: ["out_1", "out_2", "out_3"] }),
        RO("heatmap", pick("层活性", "Layer activity"), {}),
      ],
    };
  }

  /* --- 3. logic example: AND gate (bespoke nonlinear topology) --- */
  function logicAnd() {
    const nodes = [
      { id: "in_a", kind: "sensor", x: 90, y: 150, C: 0.9, Km: 0.40, n: 2.4, weight: 0.5, label: pick("输入 X", "Input X"), sub: pick("逻辑", "logic") },
      { id: "in_b", kind: "sensor", x: 90, y: 330, C: 0.9, Km: 0.40, n: 2.4, weight: 0.5, label: pick("输入 Y", "Input Y"), sub: pick("逻辑", "logic") },
      { id: "nd_q", kind: "response", x: 540, y: 235, bias: -3.0, gain: 3.8, label: pick("AND 节点", "AND node"), sub: pick("门", "gate") },
      { id: "out_q", kind: "reporter", x: 835, y: 235, bias: -2.4, gain: 3.6, gainOut: 1.0, tauMature: 3.0, tint: "var(--ch-1)", label: pick("输出 Q", "Output Q"), sub: pick("门", "gate") },
    ];
    const edges = [ E("in_a", "nd_q", 2.0), E("in_b", "nd_q", 2.0), E("nd_q", "out_q", 3.2) ];
    return {
      meta: { id: "and", name: pick("逻辑 AND 门", "Logic AND gate"), kind: "example", domain: pick("基因逻辑", "Genetic logic"),
        note: pick("两个输入经非线性响应节点形成真正的 AND 行为。", "Two inputs gated by a nonlinear response node — a true AND.") },
      nodes, edges,
      aggregate: { label: pick("门输出", "Gate output"), mode: "outputs", channels: ["out_q"], method: "mean", unit: "state" },
      params: { tMax: 18, tau: 3.0 },
      readouts: [
        RO("truth", pick("真值表", "Truth table"), { inputs: ["in_a", "in_b"], channel: "nd_q", threshold: 0.5 }),
        RO("classification", pick("门状态", "Gate state"), { channel: "nd_q",
          thresholds: [0.5], labels: [ { name: "0 / " + ui("off"), color: "var(--st-idle)" }, { name: "1 / " + ui("on"), color: "var(--st-ok)" } ], latch: false }),
        RO("timeseries", pick("输出 Q(t)", "Output Q(t)"), { channels: ["nd_q", "out_q"] }),
        RO("heatmap", pick("层活性", "Layer activity"), {}),
      ],
    };
  }

  /* --- 4. multi-output reporter panel ---------------------------- */
  function multiOutput() {
    const bb = backbone({
      in_a: { label: pick("输入 A", "Input A"), sub: pick("传感器", "sensor") },
      in_b: { label: pick("输入 B", "Input B"), sub: pick("传感器", "sensor") },
      in_c: { label: pick("输入 C", "Input C"), sub: pick("传感器", "sensor") },
      out_1: { label: pick("报告器 R1", "Reporter R1"), sub: pick("通道", "channel") },
      out_2: { label: pick("报告器 R2", "Reporter R2"), sub: pick("通道", "channel") },
      out_3: { label: pick("报告器 R3", "Reporter R3"), sub: pick("通道", "channel") },
    }, CH);
    return {
      meta: { id: "multiout", name: pick("多输出报告器", "Multi-output reporter"), kind: "example", domain: pick("报告器面板", "Reporter panel"),
        note: pick("一个网络驱动三个独立输出通道。", "One network driving three independent output channels.") },
      ...bb,
      aggregate: { label: pick("综合输出", "Aggregate output"), mode: "outputs", channels: ["out_1", "out_2", "out_3"], method: "mean", unit: "a.u." },
      params: { tMax: 24, tau: 4.0 },
      readouts: [
        RO("channels", pick("报告器通道", "Reporter channels"), { channels: ["out_1", "out_2", "out_3"] }),
        RO("timeseries", pick("综合输出", "Aggregate output"), { channels: ["score"] }),
        RO("heatmap", pick("层活性", "Layer activity"), {}),
      ],
    };
  }

  const EXAMPLES = [
    { id: "licorice", name: pick("甘草质量评价示例", "Licorice quality assessor"), domain: pick("甘草质量检测", "Licorice quality"),
      note: pick("三类活性成分输入，输出质量指数与采收提示。", "Three active-compound inputs with a quality index and harvest hint."), make: licoriceQuality },
    { id: "starter", name: pick("信号整合模型", "Signal integration model"), domain: pick("起始模板", "Starter template"),
      note: pick("中性的多输入网络，是默认模板。", "Neutral multi-input network — default template."), make: signalIntegration },
    { id: "and", name: pick("逻辑 AND 门", "Logic AND gate"), domain: pick("基因逻辑", "Genetic logic"),
      note: pick("带真值表的双输入门。", "Two-input gate with a truth table."), make: logicAnd },
    { id: "multiout", name: pick("多输出报告器", "Multi-output reporter"), domain: pick("报告器面板", "Reporter panel"),
      note: pick("一个网络，三个输出通道。", "One network, three output channels."), make: multiOutput },
  ];

  window.Model = {
    TYPES, TYPE_GROUPS, KIND_META, PARAM_SCHEMA, READOUT_TYPES, READOUT_META, EXAMPLES,
    channelsOf, nodeTint,
    defaultProject: licoriceQuality,
    newReadout: (type) => RO(type, READOUT_META[type].label, defaultConfig(type), "user"),
    clone: (m) => JSON.parse(JSON.stringify(m)),
  };

  window.ReverseSolver = {
    makeDefaultSpec,
    solve,
    evaluateCandidate,
    applyCandidate,
  };

  function defaultConfig(type) {
    switch (type) {
      case "timeseries": return { channels: ["score"] };
      case "channels": return { channels: [] };
      case "classification": return { channel: "score", thresholds: [0.3, 0.7],
        labels: [ { name: ui("low"), color: "var(--st-idle)" }, { name: ui("mid"), color: "var(--accent)" }, { name: ui("high"), color: "var(--k-response)" } ], latch: false };
      case "heatmap": return {};
      case "dose": return { input: "in_a", output: "score" };
      case "truth": return { inputs: ["in_a", "in_b"], channel: "score", threshold: 0.5 };
      default: return {};
    }
  }

  /* =================================================================
     REVERSE DESIGN SOLVER — domain-agnostic target-to-parameter search.
     It optimizes numeric knobs already present in a project:
     sensor weights, input-edge weights, and classification thresholds.
     ================================================================= */

  function solverSensors(project, limit) {
    const sensors = (project.nodes || []).filter((n) => n.kind === "sensor");
    return sensors.slice(0, limit || Math.min(3, sensors.length));
  }

  function firstClassification(project) {
    return (project.readouts || []).find((r) => r.type === "classification") || null;
  }

  function solverLabels(project, objectiveType) {
    if (objectiveType === "truth") {
      return [
        { name: pick("0 / 关", "0 / OFF"), color: "var(--st-idle)" },
        { name: pick("1 / 开", "1 / ON"), color: "var(--st-ok)" },
      ];
    }
    const ro = firstClassification(project);
    return ro?.config?.labels?.length ? ro.config.labels : [
      { name: ui("low"), color: "var(--st-idle)" },
      { name: ui("mid"), color: "var(--accent)" },
      { name: ui("high"), color: "var(--k-response)" },
    ];
  }

  function makeDefaultSpec(project, objectiveType) {
    const type = objectiveType || "classification";
    const sensors = solverSensors(project, type === "truth" ? 3 : 3);
    const inputs = sensors.map((s) => ({ id: s.id, label: s.label }));
    const ro = firstClassification(project);
    const labels = solverLabels(project, type);
    const channel = type === "truth"
      ? (ro?.config?.channel || "score")
      : (ro?.config?.channel || "score");
    const rows = type === "truth"
      ? defaultTruthRows(inputs)
      : type === "continuous"
        ? defaultContinuousRows(inputs)
        : defaultClassificationRows(inputs, labels);

    return {
      objectiveType: type,
      channel,
      readoutId: ro?.id || null,
      inputs,
      labels,
      rows,
      constraints: {
        nonnegativeSensorWeights: true,
        preserveEdgeSigns: true,
        thresholdOrder: true,
      },
    };
  }

  function defaultClassificationRows(inputs, labels) {
    const low = 0.05, mid = 0.55, high = 1.0;
    const last = Math.max(0, labels.length - 1);
    const rows = [];
    const allLow = Object.fromEntries(inputs.map((i) => [i.id, low]));
    rows.push({ id: "row_low", values: allLow, targetIndex: 0 });

    inputs.forEach((input, idx) => {
      const values = { ...allLow, [input.id]: high };
      rows.push({ id: "row_input_" + idx, values, targetIndex: Math.min(1, last) });
    });

    const allMid = Object.fromEntries(inputs.map((i) => [i.id, mid]));
    rows.push({ id: "row_mid", values: allMid, targetIndex: Math.min(1, last) });

    const allHigh = Object.fromEntries(inputs.map((i) => [i.id, high]));
    rows.push({ id: "row_high", values: allHigh, targetIndex: last });
    return rows;
  }

  function defaultTruthRows(inputs) {
    const selected = inputs.slice(0, Math.min(3, inputs.length));
    const rows = [];
    const combos = 1 << selected.length;
    for (let mask = 0; mask < combos; mask++) {
      const values = {};
      let allOn = true;
      selected.forEach((input, idx) => {
        const on = (mask >> (selected.length - 1 - idx)) & 1;
        values[input.id] = on ? 1.0 : 0.05;
        allOn = allOn && !!on;
      });
      rows.push({ id: "row_truth_" + mask, values, targetIndex: allOn ? 1 : 0 });
    }
    return rows;
  }

  function defaultContinuousRows(inputs) {
    const mk = (id, level, targetValue) => ({
      id, values: Object.fromEntries(inputs.map((i) => [i.id, level])), targetValue,
    });
    const rows = [mk("row_cont_low", 0.05, 0.1), mk("row_cont_mid", 0.55, 0.5), mk("row_cont_high", 1.0, 0.9)];
    inputs.forEach((input, idx) => {
      const values = Object.fromEntries(inputs.map((i) => [i.id, 0.05]));
      values[input.id] = 1.0;
      rows.push({ id: "row_cont_input_" + idx, values, targetValue: 0.35 });
    });
    return rows;
  }

  function solve(project, spec, options) {
    const normalized = normalizeSpec(project, spec);
    const iterations = options?.iterations || 420;
    const topN = options?.topN || 4;
    const rng = seededRng(seedFromSpec(project, normalized));
    const candidates = [];

    candidates.push(makeBaselineCandidate(project, normalized));
    for (let i = 0; i < iterations; i++) {
      candidates.push(makeRandomCandidate(project, normalized, rng, i));
    }

    const scored = candidates.map((candidate) => evaluateCandidate(project, normalized, candidate))
      .sort((a, b) => a.loss - b.loss)
      .slice(0, topN)
      .map((candidate, idx) => ({ ...candidate, rank: idx + 1 }));

    return {
      spec: normalized,
      candidates: scored,
      diagnostics: {
        iterations,
        variables: variableSummary(project, normalized),
      },
    };
  }

  function normalizeSpec(project, spec) {
    const fallback = makeDefaultSpec(project, spec?.objectiveType || "classification");
    const merged = {
      ...fallback,
      ...(spec || {}),
      inputs: Array.isArray(spec?.inputs) && spec.inputs.length ? spec.inputs : fallback.inputs,
      labels: Array.isArray(spec?.labels) && spec.labels.length ? spec.labels : fallback.labels,
      rows: Array.isArray(spec?.rows) && spec.rows.length ? spec.rows : fallback.rows,
    };
    merged.channel = merged.channel || fallback.channel || "score";
    merged.readoutId = merged.readoutId ?? fallback.readoutId;
    merged.rows = merged.rows.map((row, idx) => ({
      id: row.id || "row_" + idx,
      values: { ...(row.values || {}) },
      targetIndex: Number.isFinite(row.targetIndex) ? row.targetIndex : 0,
      targetValue: Number.isFinite(row.targetValue) ? row.targetValue : undefined,
    }));
    return merged;
  }

  function variableSummary(project, spec) {
    const inputIds = spec.inputs.map((i) => i.id);
    const inputEdges = (project.edges || []).filter((e) => inputIds.includes(e.from));
    const count = inputIds.length + inputEdges.length + Math.max(0, spec.labels.length - 1);
    return { count, sensorWeights: inputIds.length, inputEdges: inputEdges.length, thresholds: Math.max(0, spec.labels.length - 1) };
  }

  function makeBaselineCandidate(project, spec) {
    const inputIds = spec.inputs.map((i) => i.id);
    const ro = firstClassification(project);
    return {
      id: "baseline",
      patch: {
        sensorWeights: Object.fromEntries(inputIds.map((id) => {
          const node = project.nodes.find((n) => n.id === id);
          return [id, node?.weight ?? 0.3];
        })),
        edgeWeights: Object.fromEntries((project.edges || []).filter((e) => inputIds.includes(e.from)).map((e) => [e.id, e.w ?? 1])),
        thresholds: thresholdsForSpec(ro, spec),
        readoutId: spec.readoutId,
        channel: spec.channel,
      },
    };
  }

  function makeRandomCandidate(project, spec, rng, idx) {
    const inputIds = spec.inputs.map((i) => i.id);
    const sensorWeights = {};
    inputIds.forEach((id) => {
      const cur = project.nodes.find((n) => n.id === id)?.weight ?? 0.35;
      sensorWeights[id] = rng() < 0.35 ? clamp(cur * (0.55 + rng() * 1.35), 0.02, 1.6) : 0.04 + rng() * 1.46;
    });

    const edgeWeights = {};
    (project.edges || []).filter((e) => inputIds.includes(e.from)).forEach((edge) => {
      const cur = Number.isFinite(edge.w) ? edge.w : 1;
      const sign = spec.constraints?.preserveEdgeSigns === false ? (rng() < 0.82 ? Math.sign(cur || 1) : -Math.sign(cur || 1)) : Math.sign(cur || 1);
      const mag = rng() < 0.35 ? Math.abs(cur) * (0.55 + rng() * 1.55) : 0.1 + rng() * 2.4;
      edgeWeights[edge.id] = sign * clamp(mag, 0.04, 3.0);
    });

    return {
      id: "cand_" + idx,
      patch: {
        sensorWeights,
        edgeWeights,
        thresholds: randomThresholds(spec.labels.length - 1, rng),
        readoutId: spec.readoutId,
        channel: spec.channel,
      },
    };
  }

  function thresholdsForSpec(readout, spec) {
    const count = Math.max(0, spec.labels.length - 1);
    const current = readout?.config?.thresholds || [];
    if (current.length === count) return [...current].sort((a, b) => a - b);
    if (count <= 0) return [];
    if (count === 1) return [0.5];
    return Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));
  }

  function randomThresholds(count, rng) {
    if (count <= 0) return [];
    const raw = Array.from({ length: count }, () => 0.12 + rng() * 0.76).sort((a, b) => a - b);
    const minGap = count > 1 ? 0.08 : 0;
    for (let i = 1; i < raw.length; i++) raw[i] = Math.max(raw[i], raw[i - 1] + minGap);
    if (raw[raw.length - 1] > 0.92) {
      const shift = raw[raw.length - 1] - 0.92;
      for (let i = 0; i < raw.length; i++) raw[i] -= shift;
    }
    return raw.map((x) => clamp(x, 0.05, 0.95));
  }

  function evaluateCandidate(project, spec, candidate) {
    const trial = applyCandidate(project, candidate, { preserveMetaKind: true });
    const labels = spec.labels || [];
    const classification = spec.objectiveType !== "continuous";
    const thresholds = candidate.patch.thresholds || [];
    const rowResults = [];
    let loss = 0;
    let ok = 0;

    spec.rows.forEach((row) => {
      const ss = window.Sim.computeSteady(trial, row.values);
      const value = spec.channel === "score" ? ss.score : (ss.steady[spec.channel] ?? 0);
      if (classification) {
        const pred = classifyIndex(value, thresholds, labels.length);
        const target = clampInt(row.targetIndex || 0, 0, Math.max(0, labels.length - 1));
        const rowOk = pred === target;
        if (rowOk) ok += 1;
        loss += rowOk ? 0 : 1.25 + Math.abs(pred - target) * 0.45;
        loss += intervalLoss(value, target, thresholds, labels.length) * 0.8;
        rowResults.push({ id: row.id, value, predIndex: pred, targetIndex: target, ok: rowOk });
      } else {
        const targetValue = clamp(Number.isFinite(row.targetValue) ? row.targetValue : 0, 0, 1);
        const delta = value - targetValue;
        loss += delta * delta;
        if (Math.abs(delta) <= 0.08) ok += 1;
        rowResults.push({ id: row.id, value, targetValue, error: delta, ok: Math.abs(delta) <= 0.08 });
      }
    });

    loss += regularization(project, candidate);
    const accuracy = spec.rows.length ? ok / spec.rows.length : 0;
    return {
      ...candidate,
      loss,
      score: 100 / (1 + loss),
      accuracy,
      rows: rowResults,
    };
  }

  function applyCandidate(project, candidate, opts) {
    const next = JSON.parse(JSON.stringify(project));
    const patch = candidate.patch || candidate;
    const sensorWeights = patch.sensorWeights || {};
    const edgeWeights = patch.edgeWeights || {};
    next.nodes = next.nodes.map((node) => sensorWeights[node.id] != null ? { ...node, weight: round3(sensorWeights[node.id]) } : node);
    next.edges = next.edges.map((edge) => {
      if (edgeWeights[edge.id] == null) return edge;
      const w = round3(edgeWeights[edge.id]);
      return { ...edge, w, sign: w >= 0 ? 1 : -1 };
    });
    if (patch.readoutId && Array.isArray(patch.thresholds)) {
      next.readouts = next.readouts.map((readout) => readout.id === patch.readoutId
        ? { ...readout, config: { ...readout.config, channel: patch.channel || readout.config.channel, thresholds: patch.thresholds.map(round3) } }
        : readout);
    }
    if (!opts?.preserveMetaKind && next.meta?.kind === "example") next.meta = { ...next.meta, kind: "user" };
    return next;
  }

  function regularization(project, candidate) {
    let penalty = 0;
    Object.entries(candidate.patch.sensorWeights || {}).forEach(([id, value]) => {
      const cur = project.nodes.find((n) => n.id === id)?.weight ?? value;
      penalty += Math.pow(value - cur, 2) * 0.018;
    });
    Object.entries(candidate.patch.edgeWeights || {}).forEach(([id, value]) => {
      const cur = project.edges.find((e) => e.id === id)?.w ?? value;
      penalty += Math.pow(value - cur, 2) * 0.012;
    });
    const th = candidate.patch.thresholds || [];
    for (let i = 1; i < th.length; i++) if (th[i] <= th[i - 1]) penalty += 5;
    return penalty;
  }

  function classifyIndex(value, thresholds, labelCount) {
    let idx = 0;
    thresholds.forEach((threshold, i) => { if (value >= threshold) idx = i + 1; });
    return clampInt(idx, 0, Math.max(0, labelCount - 1));
  }

  function intervalLoss(value, targetIndex, thresholds, labelCount) {
    if (labelCount <= 1) return 0;
    const lower = targetIndex <= 0 ? 0 : thresholds[targetIndex - 1];
    const upper = targetIndex >= labelCount - 1 ? 1 : thresholds[targetIndex];
    const center = (lower + upper) / 2;
    const width = Math.max(0.08, upper - lower);
    const centered = Math.abs(value - center) / width;
    return centered * centered;
  }

  function seedFromSpec(project, spec) {
    const text = [project.meta?.id || "project", spec.objectiveType, spec.channel, spec.inputs.map((i) => i.id).join(",")].join("|");
    let seed = 2166136261;
    for (let i = 0; i < text.length; i++) {
      seed ^= text.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }
    return seed >>> 0;
  }

  function seededRng(seed) {
    let s = seed || 123456789;
    return function rng() {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, Number.isFinite(x) ? x : lo)); }
  function clampInt(x, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(Number.isFinite(x) ? x : lo))); }
  function round3(x) { return Math.round(x * 1000) / 1000; }
})();
