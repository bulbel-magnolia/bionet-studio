/* ===================================================================
   bionet-studio — compare.jsx  (A/B run comparison overlay)
   Renders snapshot diff: overlay lineplot + metric table + project diff.
   Exports: ComparePanel, OnboardingOverlay
   =================================================================== */

function _formatNum(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3);
}
function _formatHours(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(1) + " h";
}
function _formatSigned(v, unit) {
  if (v == null || !Number.isFinite(v)) return "—";
  const s = v > 0 ? "+" : "";
  return s + (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3)) + (unit || "");
}
function _classifyOf(sim, ro) {
  if (!ro) return null;
  const val = window.Sim.channelFinal(sim, ro.config.channel);
  return window.Sim.classify(val, ro.config);
}

function ComparePanel({ project, snapshots, onClose, onClearSnapshot }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const snapA = snapshots?.A, snapB = snapshots?.B;

  // pick a comparable channel: prefer "score" if both snapshots have a non-trivial series.
  const channelOptions = React.useMemo(() => {
    if (!snapA || !snapB) return [];
    const opts = [{ id: "score", label: tr("outputsWord") }];
    const ids = new Set();
    (snapA.project.nodes || []).forEach((n) => ids.add(n.id));
    (snapB.project.nodes || []).forEach((n) => ids.add(n.id));
    ids.forEach((id) => {
      const lblA = snapA.project.nodes.find((n) => n.id === id);
      const lblB = snapB.project.nodes.find((n) => n.id === id);
      opts.push({ id, label: (lblA || lblB).label });
    });
    return opts;
  }, [snapA, snapB]);

  const [channelId, setChannelId] = React.useState("score");
  React.useEffect(() => {
    if (!channelOptions.find((o) => o.id === channelId)) setChannelId("score");
  }, [channelOptions]);

  if (!snapA || !snapB) {
    return (
      <div className="cmp-backdrop" onClick={onClose}>
        <div className="cmp-panel cmp-empty" onClick={(e) => e.stopPropagation()}>
          <div className="cmp-head">
            <div className="cmp-title">{tr("compareTitle")}</div>
            <button className="iconbtn" onClick={onClose}><Icon name="close" size={15} /></button>
          </div>
          <p className="cmp-empty-text">{tr("compareEmpty")}</p>
          <p className="cmp-empty-hint">{tr("compareSaveHint")}</p>
        </div>
      </div>
    );
  }

  const simA = snapA.sim, simB = snapB.sim;
  const tMax = Math.max(simA.tMax || 1, simB.tMax || 1);

  const seriesA = window.Sim.channelSeries(simA, channelId) || [];
  const seriesB = window.Sim.channelSeries(simB, channelId) || [];
  const finalA = window.Sim.channelFinal(simA, channelId);
  const finalB = window.Sim.channelFinal(simB, channelId);
  const peakA = window.Sim.channelPeak(simA, channelId);
  const peakB = window.Sim.channelPeak(simB, channelId);
  const t50A = window.Sim.timeToFraction(simA, channelId, 0.5);
  const t50B = window.Sim.timeToFraction(simB, channelId, 0.5);
  // decision: use the first classification readout in B
  const cls = (snapB.project.readouts || []).find((r) => r.type === "classification");
  const decA = _classifyOf(simA, cls);
  const decB = _classifyOf(simB, cls);

  const series = [
    { id: "A", label: "A", color: "var(--accent)", data: seriesA, dash: "0" },
    { id: "B", label: "B", color: "var(--st-warn)", data: seriesB, dash: "5 3" },
  ];

  const diffs = window.Sim.projectDiff(snapA.project, snapB.project);
  const topDiffs = diffs.slice(0, 6);

  const ts = (n) => {
    const d = new Date(n);
    const pad = (x) => String(x).padStart(2, "0");
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  };

  const renderMetric = (key, a, b, delta, fmt) => (
    <tr key={key}>
      <td className="cmp-metric-k">{key}</td>
      <td className="num">{fmt(a)}</td>
      <td className="num">{fmt(b)}</td>
      <td className={"num cmp-delta" + (delta == null ? "" : (delta > 0 ? " up" : delta < 0 ? " down" : ""))}>
        {delta == null ? "—" : _formatSigned(delta)}
      </td>
    </tr>
  );

  return (
    <div className="cmp-backdrop" onClick={onClose}>
      <div className="cmp-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cmp-head">
          <div className="cmp-title">{tr("compareTitle")}</div>
          <div className="cmp-channel">
            <span className="eyebrow">{tr("channel")}</span>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channelOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <button className="iconbtn" onClick={onClose} title={tr("close") || "Close"}><Icon name="close" size={15} /></button>
        </div>

        <div className="cmp-snapline">
          <span className="cmp-snapchip cmp-A"><span className="cmp-snapchip-k">A</span> <span className="cmp-snapchip-ts mono">{tr("snapshotAt")} {ts(snapA.ts)}</span>
            <button className="cmp-snapchip-x" title={tr("cleared")} onClick={() => onClearSnapshot("A")}><Icon name="close" size={11} /></button></span>
          <span className="cmp-snapchip cmp-B"><span className="cmp-snapchip-k">B</span> <span className="cmp-snapchip-ts mono">{tr("snapshotAt")} {ts(snapB.ts)}</span>
            <button className="cmp-snapchip-x" title={tr("cleared")} onClick={() => onClearSnapshot("B")}><Icon name="close" size={11} /></button></span>
        </div>

        <div className="cmp-chart">
          <LineChart series={series} tMax={tMax} yMax={1} height={210}
            yUnit="a.u." xUnit="h" ariaLabel={tr("compareTitle")} />
        </div>

        <table className="cmp-metrics">
          <thead>
            <tr>
              <th>{tr("metricFinal").split(" ")[0] || ""}</th>
              <th>A</th><th>B</th><th>{tr("metricDelta")}</th>
            </tr>
          </thead>
          <tbody>
            {renderMetric(tr("metricFinal"), finalA, finalB, finalB - finalA, _formatNum)}
            {renderMetric(tr("metricPeak"), peakA, peakB, peakB - peakA, _formatNum)}
            <tr>
              <td className="cmp-metric-k">{tr("metricT50")}</td>
              <td className="num">{_formatHours(t50A)}</td>
              <td className="num">{_formatHours(t50B)}</td>
              <td className={"num cmp-delta" + (t50A == null || t50B == null ? "" : (t50B - t50A > 0 ? " down" : t50B - t50A < 0 ? " up" : ""))}>
                {t50A == null || t50B == null ? "—" : _formatSigned(t50B - t50A, " h")}
              </td>
            </tr>
            {cls && (
              <tr>
                <td className="cmp-metric-k">{tr("metricDecision")}</td>
                <td><span className="cmp-dec" style={{ color: decA?.color }}>{decA?.label || "—"}</span></td>
                <td><span className="cmp-dec" style={{ color: decB?.color }}>{decB?.label || "—"}</span></td>
                <td className={"cmp-delta" + (decA?.label !== decB?.label ? " changed" : "")}>{decA?.label === decB?.label ? "—" : "▲"}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="cmp-diffs">
          <div className="eyebrow cmp-diffs-h">{tr("differences")}</div>
          {topDiffs.length === 0 ? (
            <p className="cmp-diffs-empty">{tr("noDifferences")}</p>
          ) : (
            <ul className="cmp-diff-list">
              {topDiffs.map((d, i) => (
                <li key={i} className="cmp-diff">
                  <span className="cmp-diff-kind">{d.kind}</span>
                  <span className="cmp-diff-label">{d.label}{d.key && d.key !== "—" ? " · " + d.key : ""}</span>
                  <span className="num cmp-diff-vals">{_formatNum(d.a)} → {_formatNum(d.b)}</span>
                </li>
              ))}
              {diffs.length > topDiffs.length && (
                <li className="cmp-diff-more">+ {diffs.length - topDiffs.length} {tr("moreDiffs")}</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================================================================
   OnboardingOverlay — 4-step first-run hint
   =================================================================== */
function OnboardingOverlay({ step, onNext, onDone }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const steps = [
    { title: tr("onboardWelcome"), body: tr("onboardStep1") },
    { title: tr("onboardWelcome"), body: tr("onboardStep2") },
    { title: tr("onboardWelcome"), body: tr("onboardStep3") },
    { title: tr("onboardWelcome"), body: tr("onboardStep4") },
  ];
  const last = step >= steps.length - 1;
  const cur = steps[Math.min(step, steps.length - 1)];
  return (
    <div className="onb-backdrop">
      <div className="onb-card">
        <div className="onb-step mono">{step + 1} / {steps.length}</div>
        <div className="onb-title">{cur.title}</div>
        <p className="onb-body">{cur.body}</p>
        <div className="onb-dots">
          {steps.map((_, i) => <span key={i} className={"onb-dot" + (i === step ? " on" : "")}></span>)}
        </div>
        <div className="onb-actions">
          <button className="btn ghost" onClick={onDone}>{tr("onboardSkip")}</button>
          {last
            ? <button className="btn primary" onClick={onDone}>{tr("onboardDone")}</button>
            : <button className="btn primary" onClick={onNext}>{tr("onboardNext")}</button>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ComparePanel, OnboardingOverlay });
