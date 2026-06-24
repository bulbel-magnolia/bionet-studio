/* ===================================================================
   bionet-studio — runs-page.jsx  (Run history workbench)
   Exports: RunsPage, RunOverlay
   =================================================================== */
const React = window.React;
const { Icon, LineChart } = window;

function _ts(n) {
  const d = new Date(n);
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function _fmt(v, digits) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits == null ? 3 : digits);
}

function RunsPage({ runs, onBack, onDelete, onClearAll, onRestore, onUpdateNote, onExport, onImportFile, onCompareSelected }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const [selected, setSelected] = React.useState(() => new Set());
  const [overlay, setOverlay] = React.useState(null); // array of runs
  const importRef = React.useRef(null);

  React.useEffect(() => {
    // drop selected ids that no longer exist (after delete / clear)
    const have = new Set(runs.map((r) => r.id));
    setSelected((s) => {
      const next = new Set();
      s.forEach((id) => { if (have.has(id)) next.add(id); });
      return next.size === s.size ? s : next;
    });
  }, [runs]);

  const toggleOne = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const selRuns = React.useMemo(() => runs.filter((r) => selected.has(r.id)), [runs, selected]);
  const canCompare = selRuns.length >= 2 && selRuns.length <= 4;

  return (
    <div className="runs-page">
      <div className="runs-head">
        <button className="btn ghost" onClick={onBack}><Icon name="chevronLeft" size={14} /> {tr("roadmapBack")}</button>
        <div className="runs-head-title">
          <Icon name="runs" size={20} />
          <h1>{tr("runsTitle")}</h1>
          <span className="badge b-demo">{runs.length} {tr("runsCount")}</span>
        </div>
        <div className="runs-head-actions">
          <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
          <button className="btn ghost" onClick={() => importRef.current?.click()}>
            <Icon name="importf" size={14} /> {tr("runsImportFile")}</button>
          <button className="btn ghost" disabled={!runs.length} onClick={() => onExport(null)}>
            <Icon name="exportf" size={14} /> {tr("runsExportAll")}</button>
          <button className="btn ghost" disabled={!runs.length}
            onClick={() => { if (window.confirm(tr("runsConfirmClear"))) onClearAll(); }}>
            <Icon name="trash" size={14} /> {tr("runsClearAll")}</button>
        </div>
      </div>

      {selRuns.length > 0 && (
        <div className="runs-selbar">
          <span className="eyebrow">{selRuns.length} {tr("runsCount")}</span>
          <span className="runs-selbar-hint">{tr("runsSelHint")}</span>
          <div className="runs-selbar-acts">
            <button className="btn ghost" onClick={() => onExport(Array.from(selected))}>
              <Icon name="exportf" size={13} /> {tr("runsExportSel")}</button>
            <button className={"btn" + (canCompare ? " primary" : " ghost disabled")}
              onClick={() => canCompare && setOverlay(selRuns)}
              disabled={!canCompare}>
              <Icon name="runs" size={13} /> {tr("runsCompareSel")}</button>
          </div>
        </div>
      )}

      {runs.length === 0 ? (
        <div className="runs-empty">
          <Icon name="runs" size={42} />
          <h2>{tr("runsEmpty")}</h2>
          <p>{tr("runsEmptyHint")}</p>
          <p className="runs-empty-foot">{tr("runsRetention")}</p>
        </div>
      ) : (
        <div className="runs-table-wrap">
          <table className="runs-table">
            <thead>
              <tr>
                <th className="runs-col-pick"></th>
                <th>{tr("runsCol")}</th>
                <th>{tr("runsColProject")}</th>
                <th className="num">{tr("runsColFinal")}</th>
                <th className="num">{tr("runsColPeak")}</th>
                <th className="num">{tr("runsColT50")}</th>
                <th>{tr("runsColDecision")}</th>
                <th>{tr("runsColNote")}</th>
                <th>{tr("runsColActions")}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const on = selected.has(r.id);
                const s = r.summary || {};
                return (
                  <tr key={r.id} className={on ? "on" : ""}>
                    <td className="runs-col-pick">
                      <button className={"runs-chk" + (on ? " on" : "")} onClick={() => toggleOne(r.id)} aria-label="select">
                        {on && <Icon name="check" size={11} sw={2.8} />}
                      </button>
                    </td>
                    <td className="mono runs-col-ts">{_ts(r.ts)}</td>
                    <td>
                      <div className="runs-proj">
                        <span className="runs-proj-name">{r.projectName}</span>
                        <span className={"badge " + (r.projectKind === "user" ? "b-user" : "b-example")}>
                          {r.projectKind === "user" ? tr("runsKindUser") : tr("runsKindExample")}
                        </span>
                      </div>
                    </td>
                    <td className="num">{_fmt(s.final)}</td>
                    <td className="num">{_fmt(s.peak)}</td>
                    <td className="num">{s.t50 == null ? "—" : s.t50.toFixed(2) + " h"}</td>
                    <td>{s.decision || "—"}</td>
                    <td>
                      <input className="insp-text sm runs-note" placeholder={tr("runsNotePlaceholder")}
                        value={r.note || ""} onChange={(e) => onUpdateNote(r.id, e.target.value)} />
                    </td>
                    <td>
                      <div className="runs-acts">
                        <button className="iconbtn" title={tr("runsRestore")} onClick={() => onRestore(r.id)}>
                          <Icon name="reset" size={14} /></button>
                        <button className="iconbtn" title={tr("runsDeleteOne")} onClick={() => onDelete(r.id)}>
                          <Icon name="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {overlay && <RunOverlay runs={overlay} onClose={() => setOverlay(null)} />}
    </div>
  );
}

/* ============== Multi-run overlay (compare selected) =============== */
const OVERLAY_COLORS = ["var(--accent)", "var(--st-warn)", "var(--rep-gfp)", "var(--rep-dsred)"];

function RunOverlay({ runs, onClose }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const channelOptions = React.useMemo(() => {
    const opts = [{ id: "score", label: tr("outputsWord") }];
    const seen = new Set(["score"]);
    runs.forEach((r) => (r.project.nodes || []).forEach((n) => {
      if (!seen.has(n.id)) { seen.add(n.id); opts.push({ id: n.id, label: n.label }); }
    }));
    return opts;
  }, [runs]);
  const [channelId, setChannelId] = React.useState("score");
  React.useEffect(() => { if (!channelOptions.find((o) => o.id === channelId)) setChannelId("score"); }, [channelOptions]);

  const tMax = Math.max(...runs.map((r) => r.sim?.tMax || 1));
  const series = runs.map((r, i) => ({
    id: r.id, label: r.projectName + (r.note ? " · " + r.note : "") + " · " + _ts(r.ts).slice(11, 16),
    color: OVERLAY_COLORS[i % OVERLAY_COLORS.length],
    data: window.Sim.channelSeries(r.sim, channelId) || [],
    dash: i === 0 ? "0" : (i === 1 ? "5 3" : (i === 2 ? "2 2" : "8 2")),
  }));

  const cls = (runs[0].project.readouts || []).find((r) => r.type === "classification");
  const metrics = runs.map((r) => ({
    id: r.id,
    final: window.Sim.channelFinal(r.sim, channelId),
    peak: window.Sim.channelPeak(r.sim, channelId),
    t50: window.Sim.timeToFraction(r.sim, channelId, 0.5),
    decision: cls ? window.Sim.classify(window.Sim.channelFinal(r.sim, cls.config.channel), cls.config) : null,
  }));

  return (
    <div className="cmp-backdrop" onClick={onClose}>
      <div className="cmp-panel runs-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="cmp-head">
          <div className="cmp-title">{tr("runsOverlayTitle")} · {runs.length}</div>
          <div className="cmp-channel">
            <span className="eyebrow">{tr("channel")}</span>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channelOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <button className="iconbtn" onClick={onClose}><Icon name="close" size={15} /></button>
        </div>

        <div className="cmp-snapline">
          {runs.map((r, i) => (
            <span key={r.id} className="cmp-snapchip" style={{ borderColor: OVERLAY_COLORS[i % OVERLAY_COLORS.length], color: OVERLAY_COLORS[i % OVERLAY_COLORS.length] }}>
              <span className="cmp-snapchip-k mono">#{i + 1}</span>
              <span className="cmp-snapchip-ts mono">{_ts(r.ts).slice(5, 16)}</span>
            </span>
          ))}
        </div>

        <div className="cmp-chart">
          <LineChart series={series} tMax={tMax} yMax={1} height={220}
            yUnit="a.u." xUnit="h" ariaLabel={tr("runsOverlayTitle")} />
        </div>

        <table className="cmp-metrics runs-metrics">
          <thead>
            <tr>
              <th>#</th>
              <th>{tr("runsColProject")}</th>
              <th className="num">{tr("metricFinal")}</th>
              <th className="num">{tr("metricPeak")}</th>
              <th className="num">{tr("metricT50")}</th>
              <th>{tr("metricDecision")}</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => {
              const r = runs[i];
              return (
                <tr key={r.id}>
                  <td><span className="runs-overlay-pill" style={{ background: OVERLAY_COLORS[i % OVERLAY_COLORS.length] }}>{i + 1}</span></td>
                  <td>{r.projectName}{r.note ? " · " + r.note : ""}</td>
                  <td className="num">{_fmt(m.final)}</td>
                  <td className="num">{_fmt(m.peak)}</td>
                  <td className="num">{m.t50 == null ? "—" : m.t50.toFixed(2) + " h"}</td>
                  <td>{m.decision ? <span className="cmp-dec" style={{ color: m.decision.color }}>{m.decision.label}</span> : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { RunsPage, RunOverlay });
