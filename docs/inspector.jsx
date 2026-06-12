/* ===================================================================
   bionet-studio — inspector.jsx  (contextual right panel)
   Contexts: model (no selection) · node · edge · readout
   Exports: Inspector, ParamRow
   =================================================================== */

function ParamRow({ label, value, min, max, step, unit, onChange, accent }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="param">
      <div className="param-top">
        <label className="param-label">{label}</label>
        <div className="param-num">
          <input className="num param-input" type="number" value={value} min={min} max={max} step={step}
                 onChange={(e) => onChange(parseFloat(e.target.value))} />
          {unit && <span className="param-unit mono">{unit}</span>}
        </div>
      </div>
      <input className="param-slider" type="range" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(parseFloat(e.target.value))}
             style={{ "--pct": pct + "%", "--accent": accent || "var(--accent)" }} />
    </div>
  );
}

function Section({ label, children, icon, right }) {
  return (
    <div className="insp-sect">
      <div className="insp-sect-head">
        <span className="eyebrow">{icon && <Icon name={icon} size={12} style={{ marginRight: 5, verticalAlign: "-1px" }} />}{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function Switch({ label, sub, checked, onChange }) {
  return (
    <label className="switch">
      <span><span className="switch-label">{label}</span>{sub && <span className="switch-sub">{sub}</span>}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track"><span className="switch-knob"></span></span>
    </label>
  );
}

function Select({ value, options, onChange }) {
  return (
    <div className="insp-select">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="chevronDown" size={13} />
    </div>
  );
}

function ChannelChecks({ project, selected, onToggle }) {
  const chans = window.Model.channelsOf(project);
  return (
    <div className="chk-list">
      {chans.map((c) => {
        const on = selected.includes(c.id);
        return (
          <button key={c.id} className={"chk" + (on ? " on" : "")} onClick={() => onToggle(c.id)}>
            <span className="chk-box" style={{ borderColor: c.color, background: on ? c.color : "transparent" }}>
              {on && <Icon name="check" size={10} sw={2.6} />}</span>
            <span className="dot" style={{ background: c.color }}></span>
            <span className="chk-lbl">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =============== context bodies ================================= */
function NodeBody({ project, sim, nd, onParam }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const meta = window.Model.KIND_META[nd.kind];
  const schema = window.Model.PARAM_SCHEMA[nd.kind] || [];
  const tint = window.Model.nodeTint(nd);
  const act = sim?.steady?.[nd.id];
  return (
    <>
      <div className="insp-id">
        <span className="insp-id-glyph" style={{ background: tint }}><Icon name={window.KIND_ICON[nd.kind]} size={17} sw={1.8} /></span>
        <div className="insp-id-tx">
          <div className="insp-id-title">{nd.label}</div>
          <div className="insp-id-sub">{meta.label} · {meta.role}{nd.sub ? " · " + nd.sub : ""}</div>
        </div>
      </div>
      {act != null && (
        <div className="insp-readout">
          <span className="eyebrow">{tr("activation")}</span>
          <span className="num insp-readout-val">{act.toFixed(3)}</span>
          <div className="insp-readout-bar"><div style={{ width: (act * 100) + "%", background: tint }}></div></div>
        </div>
      )}
      {nd.kind === "sensor" && sim && (
        <div className="insp-mini">{tr("hillSignal")} <b className="num">{(sim.signals[nd.id] ?? 0).toFixed(3)}</b>
          <span className="badge b-demo">{tr("demo")}</span></div>
      )}
      <Section label={tr("parameters")} icon="inspector">
        {schema.map((p) => (
          <ParamRow key={p.key} label={p.label} value={nd[p.key]} min={p.min} max={p.max} step={p.step}
            unit={p.unit} accent={tint} onChange={(v) => onParam(nd.id, p.key, v)} />
        ))}
      </Section>
    </>
  );
}

function EdgeBody({ project, e, onEdgeParam, onEdgeDelete }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const from = project.nodes.find((n) => n.id === e.from);
  const to = project.nodes.find((n) => n.id === e.to);
  return (
    <>
      <div className="insp-id">
        <span className="insp-id-glyph" style={{ background: e.sign < 0 ? "var(--c-inhibit)" : "var(--accent)" }}>
          <Icon name={e.sign < 0 ? "inhibit" : "activate"} size={17} /></span>
        <div className="insp-id-tx">
          <div className="insp-id-title">{tr("edgeWeight")}</div>
          <div className="insp-id-sub">{from.label} → {to.label}</div>
        </div>
      </div>
      <Section label={tr("connection")} icon="connect">
        <ParamRow label={tr("strength")} value={e.w} min={-2.5} max={2.5} step={0.05} unit=""
          onChange={(v) => onEdgeParam(e.id, "w", v)} />
        <div className="seg">
          <button className={"seg-b" + (e.sign >= 0 ? " on" : "")} onClick={() => onEdgeParam(e.id, "sign", 1)}>
            <Icon name="activate" size={13} /> {tr("activateAction")}</button>
          <button className={"seg-b" + (e.sign < 0 ? " on" : "")} onClick={() => onEdgeParam(e.id, "sign", -1)}>
            <Icon name="inhibit" size={13} /> {tr("inhibitAction")}</button>
        </div>
      </Section>
      <Section label={tr("label")}>
        <input className="insp-text" placeholder={tr("optionalEdgeLabel")} value={e.label || ""}
          onChange={(ev) => onEdgeParam(e.id, "label", ev.target.value)} />
      </Section>
      <button className="btn insp-danger" onClick={() => onEdgeDelete(e.id)}><Icon name="trash" size={13} /> {tr("removeEdge")}</button>
    </>
  );
}

function ReadoutBody({ project, ro, onReadout }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const meta = window.Model.READOUT_META[ro.type];
  const cfg = ro.config;
  const chanOpts = window.Model.channelsOf(project).map((c) => ({ value: c.id, label: c.label }));
  const setCfg = (patch) => onReadout(ro.id, { config: { ...cfg, ...patch } });
  return (
    <>
      <div className="insp-id">
        <span className="insp-id-glyph" style={{ background: "var(--accent)" }}><Icon name={meta.icon} size={17} /></span>
        <div className="insp-id-tx">
          <div className="insp-id-title">{ro.title}</div>
          <div className="insp-id-sub">{tr("readout")} · {meta.label}
            <span className={"badge " + (ro.source === "user" ? "b-user" : "b-example")} style={{ marginLeft: 6 }}>{ro.source === "user" ? tr("user") : tr("presetBadge")}</span></div>
        </div>
      </div>
      <Section label={tr("title")}>
        <input className="insp-text" value={ro.title} onChange={(e) => onReadout(ro.id, { title: e.target.value })} />
      </Section>

      {(ro.type === "timeseries" || ro.type === "channels") && (
        <Section label={tr("channels")} icon="channel">
          <ChannelChecks project={project} selected={cfg.channels || []}
            onToggle={(id) => { const s = new Set(cfg.channels || []); s.has(id) ? s.delete(id) : s.add(id); setCfg({ channels: [...s] }); }} />
        </Section>
      )}

      {ro.type === "classification" && (
        <Section label={tr("decisionRule")} icon="readoutDecision">
          <div className="param"><div className="param-top"><label className="param-label">{tr("channel")}</label></div>
            <Select value={cfg.channel} options={chanOpts} onChange={(v) => setCfg({ channel: v })} /></div>
          {(cfg.thresholds || []).map((th, i) => {
            const arr = cfg.thresholds || [];
            const lo = i === 0 ? 0.02 : Math.min(0.98, (arr[i - 1] ?? 0.02) + 0.01);
            const hi = i === arr.length - 1 ? 0.98 : Math.max(0.02, (arr[i + 1] ?? 0.98) - 0.01);
            return (
              <ParamRow key={i} label={"θ" + (i + 1) + " · " + (cfg.labels[i + 1]?.name || "")} value={th} min={lo} max={hi} step={0.01}
                accent={cfg.labels[i + 1]?.color}
                onChange={(v) => { const next = [...arr]; next[i] = Math.max(lo, Math.min(hi, v)); setCfg({ thresholds: next }); }} />
            );
          })}
          <div className="insp-labels">
            {cfg.labels.map((lab, i) => (
              <div key={i} className="insp-label-row">
                <span className="dot" style={{ background: lab.color }}></span>
                <input className="insp-text sm" value={lab.name}
                  onChange={(e) => { const arr = cfg.labels.map((l, k) => k === i ? { ...l, name: e.target.value } : l); setCfg({ labels: arr }); }} />
              </div>
            ))}
          </div>
          <Switch label={tr("memoryLatch")} sub={tr("latchSub")}
            checked={!!cfg.latch} onChange={(v) => setCfg({ latch: v })} />
        </Section>
      )}

      {ro.type === "dose" && (
        <Section label={tr("sweep")} icon="readoutDose">
          <div className="param"><div className="param-top"><label className="param-label">{tr("inputSwept")}</label></div>
            <Select value={cfg.input} options={project.nodes.filter((n) => n.kind === "sensor").map((n) => ({ value: n.id, label: n.label }))} onChange={(v) => setCfg({ input: v })} /></div>
          <div className="param"><div className="param-top"><label className="param-label">{tr("outputRead")}</label></div>
            <Select value={cfg.output} options={chanOpts} onChange={(v) => setCfg({ output: v })} /></div>
        </Section>
      )}

      {ro.type === "truth" && (
        <Section label={tr("config")} icon="readoutTruth">
          <div className="param-label" style={{ marginBottom: 6 }}>{tr("inputsMax3")}</div>
          <ChannelChecks project={{ nodes: project.nodes.filter((n) => n.kind === "sensor"), edges: [] }} selected={cfg.inputs || []}
            onToggle={(id) => { let s = cfg.inputs || []; s = s.includes(id) ? s.filter((x) => x !== id) : (s.length < 3 ? [...s, id] : s); setCfg({ inputs: s }); }} />
          <div className="param" style={{ marginTop: 10 }}><div className="param-top"><label className="param-label">{tr("outputChannel")}</label></div>
            <Select value={cfg.channel} options={chanOpts} onChange={(v) => setCfg({ channel: v })} /></div>
          <ParamRow label={tr("onThreshold")} value={cfg.threshold} min={0.05} max={0.95} step={0.01} unit="" onChange={(v) => setCfg({ threshold: v })} />
        </Section>
      )}

      {ro.type === "heatmap" && <p className="insp-note">{tr("heatmapNote")}</p>}
    </>
  );
}

function ModelBody({ project, onModelParam, onSelectReadout }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const p = project.params;
  const isUser = project.meta.kind === "user";
  return (
    <>
      <div className="insp-id">
        <span className="insp-id-glyph" style={{ background: "var(--bg-active)", color: "var(--text-1)" }}><Icon name="layers" size={17} /></span>
        <div className="insp-id-tx">
          <div className="insp-id-title">{project.meta.name}</div>
          <div className="insp-id-sub">{project.meta.domain}
            <span className={"badge " + (isUser ? "b-user" : "b-example")} style={{ marginLeft: 6 }}>{isUser ? tr("userDefined") : tr("example")}</span></div>
        </div>
      </div>
      <p className="insp-note">{project.meta.note}</p>
      <Section label={tr("modelDynamics")} icon="settings">
        <ParamRow label={tr("runLength")} value={p.tMax} min={6} max={72} step={1} unit="h" onChange={(v) => onModelParam("tMax", v)} />
        <ParamRow label={tr("integrationTau")} value={p.tau} min={0.5} max={12} step={0.1} unit="h" onChange={(v) => onModelParam("tau", v)} />
      </Section>
      <Section label={tr("readouts")} icon="readoutSeries" right={<span className="badge b-demo">{project.readouts.length}</span>}>
        <div className="insp-rolist">
          {project.readouts.map((ro) => {
            const meta = window.Model.READOUT_META[ro.type];
            return (
              <button key={ro.id} className="insp-roitem" onClick={() => onSelectReadout(ro.id)}>
                <Icon name={meta.icon} size={15} />
                <span className="insp-roitem-tx"><span className="insp-roitem-name">{ro.title}</span>
                  <span className="insp-roitem-type">{meta.label}</span></span>
                {ro.source === "user" && <span className="badge b-user">{tr("user")}</span>}
                <Icon name="chevronRight" size={13} />
              </button>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function Inspector({ project, sim, selection, onParam, onEdgeParam, onEdgeDelete, onModelParam, onReadout, onSelectReadout }) {
  let body;
  if (selection?.type === "node") {
    const nd = project.nodes.find((n) => n.id === selection.id);
    body = nd ? <NodeBody project={project} sim={sim} nd={nd} onParam={onParam} /> : null;
  } else if (selection?.type === "edge") {
    const e = project.edges.find((x) => x.id === selection.id);
    body = e ? <EdgeBody project={project} e={e} onEdgeParam={onEdgeParam} onEdgeDelete={onEdgeDelete} /> : null;
  } else if (selection?.type === "readout") {
    const ro = project.readouts.find((x) => x.id === selection.id);
    body = ro ? <ReadoutBody project={project} ro={ro} onReadout={onReadout} /> : null;
  } else {
    body = <ModelBody project={project} onModelParam={onModelParam} onSelectReadout={onSelectReadout} />;
  }
  return (
    <aside className="inspector">
      <div className="insp-scroll">{body}</div>
    </aside>
  );
}

Object.assign(window, { Inspector, ParamRow });
