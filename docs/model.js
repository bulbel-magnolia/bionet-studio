/* ===================================================================
   bionet-studio — model.js  (GENERAL synthetic-biology network platform)
   The platform is domain-agnostic. Domain specifics (water quality,
   logic gates, …) live inside individual EXAMPLE PROJECTS, never in the
   core UI. All example values are ILLUSTRATIVE / DEMO / to-be-calibrated.
   No real Registry IDs or literature parameters are invented.
   =================================================================== */
(function () {

  /* ---- element kinds (generic platform vocabulary) -------------- */
  const TYPES = [
    { kind: "sensor",   label: "Sensor", role: "Input", group: "Inputs",
      blurb: "Input signal \u2192 activity via a Hill response.",
      main: { key: "C", label: "level" }, color: "var(--k-sensor)" },
    { kind: "signal",   label: "Regulator", role: "Relay", group: "Processing",
      blurb: "Integrates and relays upstream signals.",
      main: { key: "gain", label: "gain" }, color: "var(--k-signal)" },
    { kind: "response", label: "Response node", role: "Hidden unit", group: "Processing",
      blurb: "Promoter-driven node summing weighted inputs.",
      main: { key: "gain", label: "gain" }, color: "var(--k-response)" },
    { kind: "memory",   label: "Memory latch", role: "Bistable", group: "Processing",
      blurb: "Holds a state once a threshold is crossed.",
      main: { key: "gain", label: "gain" }, color: "var(--k-memory)" },
    { kind: "reporter", label: "Reporter", role: "Output", group: "Outputs",
      blurb: "Output channel with expression + maturation.",
      main: { key: "gainOut", label: "gain" }, color: "var(--k-reporter)" },
  ];
  const TYPE_GROUPS = ["Inputs", "Processing", "Outputs"];
  const KIND_META = Object.fromEntries(TYPES.map((t) => [t.kind, t]));

  /* ---- parameter schema per kind -------------------------------- */
  const PARAM_SCHEMA = {
    sensor: [
      { key: "C",      label: "Input level", min: 0, max: 1.5, step: 0.01, unit: "a.u." },
      { key: "Km",     label: "K\u2098 (half-max)", min: 0.05, max: 1.5, step: 0.01, unit: "a.u." },
      { key: "n",      label: "Hill coeff. n", min: 0.5, max: 4, step: 0.1, unit: "" },
      { key: "weight", label: "Input weight", min: -1, max: 1.5, step: 0.05, unit: "" },
    ],
    signal:   [ { key: "bias", label: "Bias", min: -2, max: 2, step: 0.05, unit: "" },
                { key: "gain", label: "Gain", min: 0.5, max: 6, step: 0.1, unit: "" } ],
    response: [ { key: "bias", label: "Bias", min: -2, max: 2, step: 0.05, unit: "" },
                { key: "gain", label: "Gain", min: 0.5, max: 6, step: 0.1, unit: "" } ],
    reporter: [ { key: "gainOut",   label: "Output gain", min: 0, max: 1.5, step: 0.05, unit: "" },
                { key: "tauMature", label: "Maturation \u03c4", min: 0.5, max: 10, step: 0.1, unit: "h" } ],
    memory:   [ { key: "bias", label: "Bias", min: -2, max: 2, step: 0.05, unit: "" },
                { key: "gain", label: "Gain", min: 0.5, max: 6, step: 0.1, unit: "" } ],
  };

  /* ---- readout type catalogue (configurable output panel) ------- */
  const READOUT_TYPES = [
    { type: "timeseries",     label: "Time series",      icon: "readoutSeries",   unit: "a.u.",
      blurb: "Plot one or more channels over time." },
    { type: "channels",       label: "Output channels",  icon: "readoutChannels", unit: "a.u.",
      blurb: "Multi-channel reporter / output traces." },
    { type: "classification", label: "Decision rule",    icon: "readoutDecision", unit: "state",
      blurb: "Threshold rule mapping a channel to labelled states." },
    { type: "heatmap",        label: "Layer activity",   icon: "readoutHeatmap",  unit: "act",
      blurb: "Steady-state activation of every node, by layer." },
    { type: "dose",           label: "Dose–response",    icon: "readoutDose",     unit: "out",
      blurb: "Sweep one input, read one output at steady state." },
    { type: "truth",          label: "Truth table",      icon: "readoutTruth",    unit: "bits",
      blurb: "Low/high input combinations vs. a decision label." },
  ];
  const READOUT_META = Object.fromEntries(READOUT_TYPES.map((r) => [r.type, r]));

  /* ---- channel helpers ------------------------------------------ */
  // a "channel" is either an aggregate ('score') or a node id.
  function channelsOf(project) {
    const list = [{
      id: "score",
      label: project.aggregate?.label || "Aggregate output",
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
      { id: "reg_a", kind: "signal", x: X.signal, y: 130, bias: -0.4, gain: 3.4, label: "Regulator \u03b1", sub: "relay" },
      { id: "reg_b", kind: "signal", x: X.signal, y: 320, bias: -0.5, gain: 3.0, label: "Regulator \u03b2", sub: "relay" },
      { id: "nd_1", kind: "response", x: X.response, y: 70,  bias: -0.6, gain: 3.6, label: "Node N1", sub: "integrator" },
      { id: "nd_2", kind: "response", x: X.response, y: 230, bias: -0.5, gain: 3.4, label: "Node N2", sub: "integrator" },
      { id: "nd_3", kind: "response", x: X.response, y: 390, bias: -0.4, gain: 3.2, label: "Node N3", sub: "integrator" },
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
      in_a: { label: "Input A", sub: "sensor" },
      in_b: { label: "Input B", sub: "sensor" },
      in_c: { label: "Input C", sub: "sensor" },
      out_1: { label: "Channel 1", sub: "output" },
      out_2: { label: "Channel 2", sub: "output" },
      out_3: { label: "Channel 3", sub: "output" },
    }, CH);
    return {
      meta: { id: "starter", name: "Signal integration model", kind: "example", domain: "Starter template",
        note: "A neutral multi-input network — the platform's default template." },
      ...bb,
      aggregate: { label: "Aggregate output", mode: "outputs", channels: ["out_1", "out_2", "out_3"], method: "mean", unit: "a.u." },
      params: { tMax: 24, tau: 4.0 },
      readouts: [
        RO("timeseries", "Aggregate output", { channels: ["score"] }),
        RO("classification", "Model state", { channel: "score",
          thresholds: [0.30, 0.70],
          labels: [ { name: "LOW", color: "var(--st-idle)" }, { name: "MID", color: "var(--accent)" }, { name: "HIGH", color: "var(--k-response)" } ],
          latch: false }),
        RO("channels", "Output channels", { channels: ["out_1", "out_2", "out_3"] }),
        RO("heatmap", "Layer activity", {}),
      ],
    };
  }

  /* --- 2. domain example: water quality monitor ------------------ */
  function waterQuality() {
    const bb = backbone({
      in_a: { label: "Heavy metal", sub: "Pollutant A" },
      in_b: { label: "Organic toxin", sub: "Pollutant B" },
      in_c: { label: "Nutrient load", sub: "Pollutant C" },
      out_1: { label: "GFP", sub: "green" },
      out_2: { label: "YFP", sub: "yellow" },
      out_3: { label: "DsRed", sub: "red" },
    }, ["var(--rep-gfp)", "var(--rep-yfp)", "var(--rep-dsred)"]);
    return {
      meta: { id: "water", name: "Water quality monitor", kind: "example", domain: "Environmental",
        note: "Example application: contamination risk from three analytes." },
      ...bb,
      aggregate: { label: "Risk score", mode: "weightedSensors", unit: "a.u." },
      params: { tMax: 24, tau: 4.0 },
      readouts: [
        RO("classification", "Risk state", { channel: "score",
          thresholds: [0.30, 0.70],
          labels: [ { name: "SAFE", color: "var(--st-ok)" }, { name: "WARN", color: "var(--st-warn)" }, { name: "CRIT", color: "var(--st-crit)" } ],
          latch: true }),
        RO("timeseries", "Risk score Z(t)", { channels: ["score"] }),
        RO("channels", "Fluorescence", { channels: ["out_1", "out_2", "out_3"] }),
        RO("dose", "Dose\u2013response", { input: "in_a", output: "score" }),
        RO("heatmap", "Layer activity", {}),
      ],
    };
  }

  /* --- 3. logic example: AND gate (bespoke nonlinear topology) --- */
  function logicAnd() {
    const nodes = [
      { id: "in_a", kind: "sensor", x: 90, y: 150, C: 0.9, Km: 0.40, n: 2.4, weight: 0.5, label: "Input X", sub: "logic" },
      { id: "in_b", kind: "sensor", x: 90, y: 330, C: 0.9, Km: 0.40, n: 2.4, weight: 0.5, label: "Input Y", sub: "logic" },
      { id: "nd_q", kind: "response", x: 540, y: 235, bias: -3.0, gain: 3.8, label: "AND node", sub: "gate" },
      { id: "out_q", kind: "reporter", x: 835, y: 235, bias: -2.4, gain: 3.6, gainOut: 1.0, tauMature: 3.0, tint: "var(--ch-1)", label: "Output Q", sub: "gate" },
    ];
    const edges = [ E("in_a", "nd_q", 2.0), E("in_b", "nd_q", 2.0), E("nd_q", "out_q", 3.2) ];
    return {
      meta: { id: "and", name: "Logic AND gate", kind: "example", domain: "Genetic logic",
        note: "Two inputs gated by a nonlinear response node — a true AND." },
      nodes, edges,
      aggregate: { label: "Gate output", mode: "outputs", channels: ["out_q"], method: "mean", unit: "state" },
      params: { tMax: 18, tau: 3.0 },
      readouts: [
        RO("truth", "Truth table", { inputs: ["in_a", "in_b"], channel: "nd_q", threshold: 0.5 }),
        RO("classification", "Gate state", { channel: "nd_q",
          thresholds: [0.5], labels: [ { name: "0 / OFF", color: "var(--st-idle)" }, { name: "1 / ON", color: "var(--st-ok)" } ], latch: false }),
        RO("timeseries", "Output Q(t)", { channels: ["nd_q", "out_q"] }),
        RO("heatmap", "Layer activity", {}),
      ],
    };
  }

  /* --- 4. multi-output reporter panel ---------------------------- */
  function multiOutput() {
    const bb = backbone({
      in_a: { label: "Input A", sub: "sensor" },
      in_b: { label: "Input B", sub: "sensor" },
      in_c: { label: "Input C", sub: "sensor" },
      out_1: { label: "Reporter R1", sub: "channel" },
      out_2: { label: "Reporter R2", sub: "channel" },
      out_3: { label: "Reporter R3", sub: "channel" },
    }, CH);
    return {
      meta: { id: "multiout", name: "Multi-output reporter", kind: "example", domain: "Reporter panel",
        note: "One network driving three independent output channels." },
      ...bb,
      aggregate: { label: "Aggregate output", mode: "outputs", channels: ["out_1", "out_2", "out_3"], method: "mean", unit: "a.u." },
      params: { tMax: 24, tau: 4.0 },
      readouts: [
        RO("channels", "Reporter channels", { channels: ["out_1", "out_2", "out_3"] }),
        RO("timeseries", "Aggregate output", { channels: ["score"] }),
        RO("heatmap", "Layer activity", {}),
      ],
    };
  }

  const EXAMPLES = [
    { id: "starter", name: "Signal integration model", domain: "Starter template",
      note: "Neutral multi-input network — default template.", make: signalIntegration },
    { id: "and", name: "Logic AND gate", domain: "Genetic logic",
      note: "Two-input gate with a truth table.", make: logicAnd },
    { id: "multiout", name: "Multi-output reporter", domain: "Reporter panel",
      note: "One network, three output channels.", make: multiOutput },
    { id: "water", name: "Water quality monitor", domain: "Environmental",
      note: "Example application: contamination risk from three analytes.", make: waterQuality },
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
        labels: [ { name: "LOW", color: "var(--st-idle)" }, { name: "MID", color: "var(--accent)" }, { name: "HIGH", color: "var(--k-response)" } ], latch: false };
      case "heatmap": return {};
      case "dose": return { input: "in_a", output: "score" };
      case "truth": return { inputs: ["in_a", "in_b"], channel: "score", threshold: 0.5 };
      default: return {};
    }
  }
})();
