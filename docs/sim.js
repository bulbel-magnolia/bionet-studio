/* ===================================================================
   bionet-studio — sim.js  (general network simulation kernel)
   window.Sim — domain-agnostic. Readouts interpret the outputs.
   ALL VALUES ILLUSTRATIVE / DEMO — not calibrated.
   =================================================================== */
(function () {
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  function hill(C, Km, n) {
    if (C <= 0) return 0;
    const cn = Math.pow(C, n);
    return cn / (Math.pow(Km, n) + cn);
  }

  // tau (hours) used when integrating each kind toward steady state
  const KIND_TAU = { sensor: 0.6, signal: 1.5, response: 2.0, reporter: 4.0, memory: 2.5 };

  function sensorAggregate(project, values) {
    let zNum = 0, zDen = 0;
    project.nodes.filter((n) => n.kind === "sensor").forEach((n) => {
      const v = values[n.id] ?? 0;
      zNum += (n.weight ?? 0) * v;
      zDen += Math.abs(n.weight ?? 0);
    });
    return zDen > 0 ? clamp01(zNum / zDen) : 0;
  }

  function aggregateSpec(project) {
    return project.aggregate || project.params?.aggregate || { label: window.I18n?.t("outputsWord") || "Aggregate output", mode: "outputs" };
  }

  function terminalNodeIds(project) {
    const from = new Set(project.edges.map((e) => e.from));
    return project.nodes.filter((n) => n.kind !== "sensor" && !from.has(n.id)).map((n) => n.id);
  }

  function aggregateValue(project, values, sensorScore) {
    const spec = aggregateSpec(project);
    if (spec.mode === "weightedSensors" || spec.mode === "inputs") return sensorScore;

    let ids = spec.channels && spec.channels.length ? spec.channels : [];
    if (!ids.length && spec.mode === "outputs") ids = project.nodes.filter((n) => n.kind === "reporter").map((n) => n.id);
    if (!ids.length) ids = terminalNodeIds(project);
    const vals = ids.map((id) => values[id]).filter((v) => Number.isFinite(v));
    if (!vals.length) return sensorScore ?? 0;

    if (spec.method === "max") return clamp01(Math.max(...vals));
    if (spec.method === "weighted") {
      const weights = spec.weights || {};
      let num = 0, den = 0;
      ids.forEach((id) => {
        const v = values[id];
        if (!Number.isFinite(v)) return;
        const w = weights[id] ?? 1;
        num += w * v;
        den += Math.abs(w);
      });
      return den > 0 ? clamp01(num / den) : 0;
    }
    return clamp01(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // ---- steady-state forward pass --------------------------------
  // overrideC: optional { sensorId: level } to override input levels
  function computeSteady(project, overrideC) {
    const signals = {};
    project.nodes.filter((n) => n.kind === "sensor").forEach((n) => {
      const C = overrideC && overrideC[n.id] != null ? overrideC[n.id] : n.C;
      const s = hill(C, n.Km, n.n);
      signals[n.id] = s;
    });
    const sensorScore = sensorAggregate(project, signals);

    const act = {};
    project.nodes.filter((n) => n.kind === "sensor").forEach((n) => { act[n.id] = clamp01(signals[n.id]); });
    ["signal", "response", "memory", "reporter"].forEach((kind) => {
      project.nodes.filter((n) => n.kind === kind).forEach((n) => {
        let s = n.bias ?? 0;
        project.edges.filter((e) => e.to === n.id).forEach((e) => { s += (act[e.from] ?? 0) * e.w; });
        act[n.id] = clamp01(sigmoid((n.gain ?? 3.2) * s) * (n.gainOut ?? 1));
      });
    });
    const score = aggregateValue(project, act, sensorScore);
    return { signals, steady: act, score, sensorScore };
  }

  // ---- full time-domain run -------------------------------------
  function run(project, opts) {
    const p = project.params;
    const T = opts?.tMax ?? p.tMax;
    const steps = opts?.steps ?? 220;
    const dt = T / steps;

    const ss = computeSteady(project);
    const t = new Array(steps + 1);
    const score = new Array(steps + 1);
    const series = {};
    const cur = {};
    project.nodes.forEach((n) => { series[n.id] = new Array(steps + 1); cur[n.id] = 0; });

    let z = 0;
    const tauZ = p.tau;
    const spec = aggregateSpec(project);
    for (let i = 0; i <= steps; i++) {
      t[i] = i * dt;
      project.nodes.forEach((n) => {
        const tau = n.kind === "reporter" ? (n.tauMature ?? 4) : (KIND_TAU[n.kind] ?? 2);
        const target = ss.steady[n.id] ?? 0;
        if (i > 0) cur[n.id] += (target - cur[n.id]) / tau * dt;
        series[n.id][i] = clamp01(cur[n.id]);
      });
      if (spec.mode === "weightedSensors" || spec.mode === "inputs") {
        if (i > 0) z += (ss.sensorScore - z) / tauZ * dt;
        score[i] = clamp01(z);
      } else {
        const sensorNow = sensorAggregate(project, cur);
        score[i] = aggregateValue(project, cur, sensorNow);
      }
    }

    // generic dominant-input attribution (for any classification readout)
    let dom = null, domVal = -1;
    project.nodes.filter((n) => n.kind === "sensor").forEach((n) => {
      const c = n.weight * ss.signals[n.id];
      if (c > domVal) { domVal = c; dom = n; }
    });

    return {
      t, tMax: T, steps,
      signals: ss.signals, steady: ss.steady,
      series, score, scoreInput: ss.sensorScore, scoreSteady: ss.score,
      dominant: dom ? { id: dom.id, label: dom.label, signal: ss.signals[dom.id] } : null,
    };
  }

  // ---- channel access -------------------------------------------
  function channelSeries(sim, channelId) {
    return channelId === "score" ? sim.score : (sim.series ? sim.series[channelId] : null);
  }
  function channelFinal(sim, channelId) {
    if (channelId === "score") return sim.score[sim.score.length - 1];
    const ser = sim.series?.[channelId];
    return ser ? ser[ser.length - 1] : (sim.steady[channelId] ?? 0);
  }

  // ---- decision rule --------------------------------------------
  // rule: { thresholds:[...ascending], labels:[{name,color}], latch }
  // returns { index, label, color }
  function classify(value, rule) {
    const th = rule.thresholds || [];
    let idx = 0;
    for (let i = 0; i < th.length; i++) if (value >= th[i]) idx = i + 1;
    idx = Math.min(idx, (rule.labels?.length || 1) - 1);
    const lab = rule.labels?.[idx] || { name: "—", color: "var(--text-2)" };
    return { index: idx, label: lab.name, color: lab.color };
  }
  function topIndex(rule) { return (rule.labels?.length || 1) - 1; }
  function crossedTop(sim, rule) {
    const ser = channelSeries(sim, rule.channel) || [0];
    const peak = Math.max(...ser);
    const th = rule.thresholds || [];
    return th.length ? peak >= th[th.length - 1] : false;
  }

  // ---- dose-response (steady-state sweep) -----------------------
  function doseResponse(project, inputId, outputId, n) {
    n = n || 28;
    const node = project.nodes.find((x) => x.id === inputId);
    const max = 1.5;
    const x = [], y = [];
    for (let i = 0; i <= n; i++) {
      const C = (i / n) * max;
      const ss = computeSteady(project, { [inputId]: C });
      x.push(C);
      y.push(outputId === "score" ? ss.score : (ss.steady[outputId] ?? 0));
    }
    return { x, y, inputLabel: node?.label || inputId };
  }

  // ---- truth table ----------------------------------------------
  // inputs held LOW(0.05) / HIGH(1.0); other sensors keep their level.
  function truthTable(project, inputs, channelId, threshold) {
    const lo = 0.05, hi = 1.0;
    const rows = [];
    const combos = 1 << inputs.length;
    for (let m = 0; m < combos; m++) {
      const over = {};
      const bits = [];
      inputs.forEach((id, k) => {
        const on = (m >> (inputs.length - 1 - k)) & 1;
        bits.push(on);
        over[id] = on ? hi : lo;
      });
      const ss = computeSteady(project, over);
      const val = channelId === "score" ? ss.score : (ss.steady[channelId] ?? 0);
      rows.push({ bits, value: val, out: val >= (threshold ?? 0.5) ? 1 : 0 });
    }
    return rows;
  }

  window.Sim = { run, computeSteady, hill, sigmoid, clamp01,
    channelSeries, channelFinal, classify, crossedTop, topIndex, doseResponse, truthTable };
})();
