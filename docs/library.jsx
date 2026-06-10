/* ===================================================================
   bionet-studio — library.jsx  (element library dock + roadmap pages)
   Exports: LibraryDock, PlaceholderPage
   =================================================================== */

function LibraryDock({ project, sim, onAddNode, onQuickInput, onSelect, selection }) {
  const { TYPES, TYPE_GROUPS } = window.Model;
  const sensors = project.nodes.filter((n) => n.kind === "sensor");
  return (
    <aside className="libdock">
      <div className="libdock-scroll">
        <div className="lib-sect">
          <div className="lib-sect-head"><span className="eyebrow">Element palette</span>
            <span className="lib-sect-tag">click to place</span></div>
          {TYPE_GROUPS.map((g) => (
            <div key={g} className="palette-group">
              <div className="palette-group-h">{g}</div>
              {TYPES.filter((t) => t.group === g).map((t) => (
                <button key={t.kind} className="palette-row" onClick={() => onAddNode(t.kind)} title={t.blurb}>
                  <span className="palette-glyph" style={{ "--tint": t.color }}><Icon name={window.KIND_ICON[t.kind]} size={14} sw={1.8} /></span>
                  <span className="palette-name">{t.label}</span>
                  <span className="palette-role">{t.role}</span>
                  <Icon name="add" size={14} className="palette-add" />
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="lib-sect">
          <div className="lib-sect-head"><span className="eyebrow">Sources</span><span className="badge b-soon">soon</span></div>
          <div className="lib-filters">
            {["Illustrative", "Calibrated", "User-defined", "Verified"].map((f, i) => (
              <span key={f} className={"lib-filter" + (i === 0 ? " on" : "")}>{f}</span>
            ))}
          </div>
          <p className="lib-hint sm">Verified biological parts will be a curated module — distinct from these abstract element types.</p>
        </div>

        <div className="lib-sect">
          <div className="lib-sect-head"><span className="eyebrow">Inputs · quick set</span><span className="lib-sect-tag mono">a.u.</span></div>
          <div className="lib-inputs">
            {sensors.map((s) => {
              const sig = sim?.signals?.[s.id] ?? 0;
              const seld = selection?.type === "node" && selection.id === s.id;
              return (
                <div key={s.id} className={"lib-input" + (seld ? " sel" : "")} onClick={() => onSelect({ type: "node", id: s.id })}>
                  <div className="lib-input-top">
                    <span className="lib-input-name">{s.label}</span>
                    <span className="num lib-input-c">{s.C.toFixed(2)}</span>
                  </div>
                  <input className="param-slider compact" type="range" min="0" max="1.5" step="0.01" value={s.C}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onQuickInput(s.id, parseFloat(e.target.value))}
                    style={{ "--pct": (s.C / 1.5 * 100) + "%", "--accent": "var(--k-sensor)" }} />
                  <div className="lib-input-sig">
                    <div className="lib-input-sig-bar"><div style={{ width: (sig * 100) + "%" }}></div></div>
                    <span className="num">sig {sig.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

const ROADMAP = {
  library: { title: "Element library", tag: "Module 2", icon: "library",
    desc: "A searchable catalogue of characterised elements — sensors, regulators, reporters — with parameter ranges, response curves and provenance.",
    items: ["Per-element response curves & operating ranges", "Filter by signal type / channel / chassis", "Verified provenance (curated separately)", "Drag a catalogued element onto the canvas"] },
  runs: { title: "Run history", tag: "Module 2", icon: "runs",
    desc: "Every simulation is archived as a reproducible run — topology, parameters and inputs — so you can compare configurations side by side.",
    items: ["Timeline of saved runs", "A/B overlay of two runs on one chart", "Parameter diff between runs", "Export a run bundle as JSON"] },
  reverse: { title: "Reverse design", tag: "Future", icon: "reverse",
    desc: "Specify a target behaviour — a desired output profile or truth table — and let the solver propose element choices and edge weights.",
    items: ["Target curve / truth-table editor", "Weight & threshold optimisation", "Element recommendation shortlist", "Sensitivity & dose–response analysis"] },
};

function PlaceholderPage({ page, onBack }) {
  const r = ROADMAP[page];
  if (!r) return null;
  return (
    <div className="placeholder">
      <div className="placeholder-card">
        <div className="placeholder-top">
          <span className="placeholder-ic"><Icon name={r.icon} size={20} /></span>
          <span className="badge b-soon">{r.tag}</span>
        </div>
        <h1>{r.title}</h1>
        <p className="placeholder-desc">{r.desc}</p>
        <ul className="placeholder-list">
          {r.items.map((it, i) => (
            <li key={i}><Icon name="check" size={15} sw={2.2} /> {it}</li>
          ))}
        </ul>
        <button className="btn" onClick={onBack}><Icon name="chevronLeft" size={14} /> Back to workbench</button>
      </div>
    </div>
  );
}

Object.assign(window, { LibraryDock, PlaceholderPage });
