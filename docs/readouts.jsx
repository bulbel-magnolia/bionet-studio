/* ===================================================================
   bionet-studio — readouts.jsx  (configurable output panel)
   Exports: ReadoutDock  (+ individual renderers)
   Each readout is interpreted from generic sim outputs. Nothing here
   is domain-specific; domain meaning comes from the project's config.
   =================================================================== */

function chanLabel(project, id) {
  const tr = (key) => window.I18n?.t(key) || key;
  if (id === "score") return project.aggregate?.label || tr("outputsWord");
  const n = project.nodes.find((x) => x.id === id);
  return n ? n.label : id;
}
function chanColor(project, id) {
  if (id === "score") return "var(--ch-score)";
  const n = project.nodes.find((x) => x.id === id);
  return n ? window.Model.nodeTint(n) : "var(--text-2)";
}

/* ---------- time series / channels ----------------------------- */
function RO_TimeSeries({ project, sim, config, yUnit }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const chans = (config.channels && config.channels.length ? config.channels : ["score"]);
  const series = chans.map((id) => ({
    id, color: chanColor(project, id), label: chanLabel(project, id),
    data: window.Sim.channelSeries(sim, id) || [],
  }));
  return (
    <div className="ro-pane">
      <div className="ro-legend">
        {series.map((s) => (
          <span key={s.id} className="ro-leg"><span className="dot" style={{ background: s.color }}></span>{s.label}
            <b className="num">{(s.data[s.data.length - 1] ?? 0).toFixed(3)}</b></span>
        ))}
      </div>
      <div className="ro-chartwrap">
        <LineChart series={series} tMax={sim.tMax} yMax={1} height={186}
          yUnit={yUnit || "a.u."} xUnit="h" ariaLabel={tr("timeSeries")} />
      </div>
    </div>
  );
}

/* ---------- decision rule (classification) --------------------- */
function RO_Classification({ project, sim, config, latched, onResetLatch }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const value = window.Sim.channelFinal(sim, config.channel);
  const peak = Math.max(...(window.Sim.channelSeries(sim, config.channel) || [0]));
  const top = window.Sim.topIndex(config);
  const cur = (config.latch && latched) ? { index: top, label: config.labels[top].name, color: config.labels[top].color }
                                        : window.Sim.classify(value, config);
  const series = [{ id: config.channel, color: chanColor(project, config.channel),
    label: chanLabel(project, config.channel), data: window.Sim.channelSeries(sim, config.channel) || [] }];
  // bands from thresholds
  const th = config.thresholds || [];
  const edges = [0, ...th, 1];
  const bands = config.labels.map((lab, i) => ({ from: edges[i], to: edges[i + 1], color: bandTint(lab.color) }));
  const thr = th.map((y, i) => ({ y, color: config.labels[i + 1]?.color || "var(--text-3)", label: "θ" + (i + 1) }));
  return (
    <div className="ro-split">
      <div className="ro-verdict">
        <div className="ro-vhead">
          <span className="eyebrow">{chanLabel(project, config.channel)} → {tr("toState")}</span>
          <span className="badge b-demo">{tr("illustrativeBadge")}</span>
        </div>
        <div className="ro-vstate">
          <span className="ro-vdot" style={{ background: cur.color }}></span>
          <span className="ro-vlabel" style={{ color: cur.color }}>{cur.label}</span>
          {config.latch && latched && <span className="ro-vlock"><Icon name="lock" size={11} /> {tr("latched")}</span>}
        </div>
        <div className="ro-vgrid">
          <div><span className="vg-k">{tr("value")}</span><span className="num vg-v">{value.toFixed(3)}</span></div>
          <div><span className="vg-k">{tr("peak")}</span><span className="num vg-v">{peak.toFixed(3)}</span></div>
          <div><span className="vg-k">{tr("thresholds")}</span><span className="num vg-v">{th.map((x) => x.toFixed(2)).join(" / ") || "—"}</span></div>
          <div><span className="vg-k">{tr("latch")}</span><span className="num vg-v">{config.latch ? tr("on") : tr("off")}</span></div>
        </div>
        {sim.dominant && (
          <div className="ro-reason">{tr("driver")}: <b>{sim.dominant.label}</b> · {tr("signal")} <span className="num">{sim.dominant.signal.toFixed(2)}</span></div>
        )}
        {config.latch && latched && (
          <button className="btn ro-reset" onClick={onResetLatch}><Icon name="reset" size={13} /> {tr("resetState")}</button>
        )}
      </div>
      <div className="ro-chartwrap">
        <LineChart series={series} tMax={sim.tMax} yMax={1} height={186}
          yUnit="a.u." xUnit="h" bands={bands} thresholds={thr} ariaLabel={tr("decisionRule")} />
      </div>
    </div>
  );
}
function bandTint(color) {
  // map a status var to its translucent surface
  if (color.includes("crit") || color.includes("danger")) return "var(--crit-bg)";
  if (color.includes("warn")) return "var(--warn-bg)";
  if (color.includes("ok") || color.includes("safe")) return "var(--ok-bg)";
  return "var(--idle-bg)";
}

/* ---------- layer activity heatmap ----------------------------- */
function RO_Heatmap({ project, sim }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const order = ["sensor", "signal", "response", "reporter", "memory"];
  const cols = order.map((k) => ({ k, meta: window.Model.KIND_META[k], nodes: project.nodes.filter((n) => n.kind === k) }))
    .filter((c) => c.nodes.length);
  return (
    <div className="ro-pane">
      <div className="ro-heat">
        {cols.map((c) => (
          <div key={c.k} className="ro-heatcol">
            <div className="ro-heatcol-h"><Icon name={window.KIND_ICON[c.k]} size={13} /><span>{c.meta.label}</span></div>
            {c.nodes.map((n) => {
              const a = sim.steady[n.id] ?? 0;
              return (
                <div key={n.id} className="ro-cell" title={n.label + " · " + a.toFixed(3)}>
                  <span className="ro-cell-fill" style={{ background: window.Model.nodeTint(n), opacity: 0.12 + a * 0.85 }}></span>
                  <span className="ro-cell-lbl">{n.label}</span>
                  <span className="num ro-cell-val">{a.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="ro-heatscale"><span>0.0</span><div className="ro-heatbar"></div><span>1.0 {tr("activation")}</span></div>
    </div>
  );
}

/* ---------- dose–response -------------------------------------- */
function RO_Dose({ project, config }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const dr = window.Sim.doseResponse(project, config.input, config.output);
  const series = [{ id: "dose", color: chanColor(project, config.output),
    label: chanLabel(project, config.output), data: dr.y }];
  return (
    <div className="ro-pane">
      <div className="ro-legend">
        <span className="ro-leg">{tr("sweepWord")} <b>{dr.inputLabel}</b> → <b>{chanLabel(project, config.output)}</b> ({tr("steadyState")})</span>
        <span className="badge b-demo">{tr("illustrativeBadge")}</span>
      </div>
      <div className="ro-chartwrap">
        <LineChart series={series} tMax={1.5} yMax={1} height={186}
          yUnit={tr("out")} xUnit="in a.u." cursor={true} ariaLabel={window.Model.READOUT_META.dose.label} />
      </div>
    </div>
  );
}

/* ---------- truth table ---------------------------------------- */
function RO_Truth({ project, config }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const rows = window.Sim.truthTable(project, config.inputs, config.channel, config.threshold);
  const inLabels = config.inputs.map((id) => chanLabel(project, id));
  return (
    <div className="ro-pane">
      <div className="ro-legend">
        <span className="ro-leg">{tr("lowHighNote")} · {tr("outputChannel")} <b>{chanLabel(project, config.channel)}</b> ≥ {config.threshold}</span>
        <span className="badge b-demo">{tr("illustrativeBadge")}</span>
      </div>
      <div className="ro-truthwrap">
        <table className="ro-truth">
          <thead>
            <tr>{inLabels.map((l, i) => <th key={i}>{l}</th>)}<th>{tr("value")}</th><th>{tr("out")}</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.bits.map((b, k) => <td key={k} className={"num tt-bit" + (b ? " on" : "")}>{b}</td>)}
                <td className="num tt-val">{r.value.toFixed(3)}</td>
                <td className={"num tt-out" + (r.out ? " on" : "")}>{r.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderReadout(r, props) {
  switch (r.type) {
    case "timeseries": return <RO_TimeSeries {...props} config={r.config} />;
    case "channels": return <RO_TimeSeries {...props} config={r.config} yUnit="a.u." />;
    case "classification": return <RO_Classification {...props} config={r.config} />;
    case "heatmap": return <RO_Heatmap {...props} />;
    case "dose": return <RO_Dose {...props} config={r.config} />;
    case "truth": return <RO_Truth {...props} config={r.config} />;
    default: return null;
  }
}

/* ================= DOCK ========================================= */
function ReadoutDock({ project, sim, latched, onResetLatch, onAddReadout, onRemoveReadout, onConfigure, onTogglePin,
                       collapsed, onToggleCollapse }) {
  const readouts = project.readouts || [];
  const [active, setActive] = React.useState(0);
  const [addOpen, setAddOpen] = React.useState(false);
  const tr = (key) => window.I18n?.t(key) || key;
  React.useEffect(() => { setActive((a) => Math.min(a, Math.max(0, readouts.length - 1))); }, [project.meta.id, readouts.length]);

  if (collapsed) {
    return (
      <div className="readout collapsed">
        <button className="readout-handle" onClick={onToggleCollapse}>
          <Icon name="chevronUp" size={13} />
          <span className="eyebrow">{tr("readouts")}</span>
          <span className="readout-handle-meta mono">{readouts.length} {tr("outputCount")}</span>
        </button>
      </div>
    );
  }

  const r = readouts[active] || readouts[0];
  const props = { project, sim,
    latched: r && latched ? latched[r.id] : false,
    onResetLatch: () => r && onResetLatch(r.id) };

  return (
    <div className="readout">
      <div className="readout-bar">
        <div className="readout-tabs">
          {readouts.map((ro, i) => {
            const meta = window.Model.READOUT_META[ro.type];
            return (
              <button key={ro.id} className={"rtab" + (i === active ? " on" : "")} onClick={() => setActive(i)}>
                <Icon name={meta.icon} size={14} />
                <span className="rtab-t">{ro.title}</span>
                {ro.pinned && <span className="rtab-pin" title={tr("pinned")}><Icon name="pin" size={10} /></span>}
                {ro.source === "user" && <span className="rtab-src" title={tr("userDefined")}></span>}
              </button>
            );
          })}
          <div className="rtab-add-wrap" onMouseLeave={() => setAddOpen(false)}>
            <button className="rtab-add" title={tr("addReadout")} onClick={() => setAddOpen((o) => !o)}><Icon name="add" size={14} /></button>
            {addOpen && (
              <div className="rtab-menu">
                <div className="rtab-menu-h eyebrow">{tr("addReadout")}</div>
                {window.Model.READOUT_TYPES.map((t) => (
                  <button key={t.type} className="rtab-menu-i" onClick={() => { onAddReadout(t.type); setAddOpen(false); setActive(readouts.length); }}>
                    <Icon name={t.icon} size={15} />
                    <span><span className="rtab-menu-name">{t.label}</span><span className="rtab-menu-blurb">{t.blurb}</span></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="readout-bar-r">
          {r && <span className={"badge " + (r.source === "user" ? "b-user" : "b-demo")}>{r.source === "user" ? tr("user") : tr("illustrativeBadge")}</span>}
          {r && <button className="iconbtn" title={tr("configureModule")} onClick={() => onConfigure(r.id)}><Icon name="settings" size={15} /></button>}
          {r && <button className={"iconbtn" + (r.pinned ? " on" : "")} title={r.pinned ? tr("unpinModule") : tr("pinModule")} onClick={() => onTogglePin(r.id)}><Icon name="pin" size={15} /></button>}
          {r && readouts.length > 1 && <button className="iconbtn" title={tr("removeModule")} onClick={() => onRemoveReadout(r.id)}><Icon name="close" size={15} /></button>}
          <span className="canvas-tools-sep"></span>
          <button className="iconbtn" title={tr("collapse")} onClick={onToggleCollapse}><Icon name="chevronDown" size={15} /></button>
        </div>
      </div>
      <div className="readout-body">
        {r ? renderReadout(r, props) : <div className="ro-empty">{tr("noReadouts")}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { ReadoutDock });
