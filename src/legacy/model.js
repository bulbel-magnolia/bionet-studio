/* ===================================================================
   bionet-studio — model.js  (GENERAL synthetic-biology network platform)
   The platform is domain-agnostic. Domain specifics (domain examples,
   logic gates, …) live inside individual EXAMPLE PROJECTS, never in the
   core UI. All example values are ILLUSTRATIVE / DEMO / to-be-calibrated.
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

  /* --- 1. default template: signal integration model ------------- */
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

  /* --- 2. domain example: licorice quality ------------------- */
  function licoriceQuality() {
    const bb = backbone({
      in_a: { label: pick("三萜皂苷信号", "Triterpenoid saponin signal"), sub: pick("甘草酸相关 · 示例", "glycyrrhizin-related · demo") },
      in_b: { label: pick("黄酮类信号", "Flavonoid signal"), sub: pick("甘草苷/异甘草素相关 · 示例", "liquiritin / isoliquiritigenin-related · demo") },
      in_c: { label: pick("酚酸类信号", "Phenolic-acid signal"), sub: pick("香豆酸等相关 · 示例", "coumaric-acid-related · demo") },
      out_1: { label: pick("质量指数通道", "Quality-index channel"), sub: pick("报告器", "reporter") },
      out_2: { label: pick("成分平衡通道", "Profile-balance channel"), sub: pick("报告器", "reporter") },
      out_3: { label: pick("复核提示通道", "Review-hint channel"), sub: pick("报告器", "reporter") },
    }, CH);
    return {
      meta: { id: "licorice", name: pick("甘草质量检测示例", "Licorice quality example"), kind: "example", domain: pick("领域示例", "Domain example"),
        note: pick("示例应用：把三类归一化成分信号整合为一个甘草质量指数。", "Example application: integrate three normalized phytochemical signals into a licorice quality index.") },
      ...bb,
      aggregate: { label: pick("甘草质量指数", "Licorice quality index"), mode: "outputs", channels: ["out_1", "out_2", "out_3"], method: "weighted",
        weights: { out_1: 0.45, out_2: 0.35, out_3: 0.20 }, unit: "a.u." },
      params: { tMax: 24, tau: 4.0 },
      readouts: [
        RO("classification", pick("质量等级", "Quality class"), { channel: "score",
          thresholds: [0.35, 0.70],
          labels: [ { name: pick("偏低", "LOW"), color: "var(--st-idle)" }, { name: pick("待复核", "REVIEW"), color: "var(--st-warn)" }, { name: pick("较高", "HIGH"), color: "var(--st-ok)" } ],
          latch: false }),
        RO("timeseries", pick("甘草质量指数 Q(t)", "Licorice quality index Q(t)"), { channels: ["score"] }),
        RO("channels", pick("示例输出通道", "Example output channels"), { channels: ["out_1", "out_2", "out_3"] }),
        RO("dose", pick("剂量响应", "Dose–response"), { input: "in_a", output: "score" }),
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
    { id: "starter", name: pick("信号整合模型", "Signal integration model"), domain: pick("起始模板", "Starter template"),
      note: pick("中性的多输入网络，是默认模板。", "Neutral multi-input network — default template."), make: signalIntegration },
    { id: "and", name: pick("逻辑 AND 门", "Logic AND gate"), domain: pick("基因逻辑", "Genetic logic"),
      note: pick("带真值表的双输入门。", "Two-input gate with a truth table."), make: logicAnd },
    { id: "multiout", name: pick("多输出报告器", "Multi-output reporter"), domain: pick("报告器面板", "Reporter panel"),
      note: pick("一个网络，三个输出通道。", "One network, three output channels."), make: multiOutput },
    { id: "licorice", name: pick("甘草质量检测示例", "Licorice quality example"), domain: pick("领域示例", "Domain example"),
      note: pick("示例应用：把三类归一化成分信号整合为一个质量指数。", "Example application: integrate three normalized input signals into a quality index."), make: licoriceQuality },
  ];

  window.Model = {
    TYPES, TYPE_GROUPS, KIND_META, PARAM_SCHEMA, READOUT_TYPES, READOUT_META, EXAMPLES,
    channelsOf, nodeTint,
    defaultProject: signalIntegration,
    newReadout: (type) => RO(type, READOUT_META[type].label, defaultConfig(type), "user"),
    clone: (m) => JSON.parse(JSON.stringify(m)),
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
})();
