/* ===================================================================
   bionet-studio — library.jsx  (element library dock + roadmap pages)
   Exports: LibraryDock, PlaceholderPage
   =================================================================== */
const { Icon } = window;

function LibraryDock({ project, sim, onAddNode, onQuickInput, onSelect, selection }) {
  const { TYPES, TYPE_GROUPS } = window.Model;
  const sensors = project.nodes.filter((n) => n.kind === "sensor");
  const tr = (key) => window.I18n?.t(key) || key;
  return (
    <aside className="libdock">
      <div className="libdock-scroll">
        <div className="lib-sect">
          <div className="lib-sect-head"><span className="eyebrow">{tr("elementPalette")}</span>
            <span className="lib-sect-tag">{tr("clickToPlace")}</span></div>
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
          <div className="lib-sect-head"><span className="eyebrow">{tr("sources")}</span><span className="badge b-soon">{tr("soon")}</span></div>
          <div className="lib-filters">
            {[tr("illustrative"), tr("calibrated"), tr("userDefined"), tr("verified")].map((f, i) => (
              <span key={f} className={"lib-filter" + (i === 0 ? " on" : "")}>{f}</span>
            ))}
          </div>
          <p className="lib-hint sm">{tr("sourceNote")}</p>
        </div>

        <div className="lib-sect">
          <div className="lib-sect-head"><span className="eyebrow">{tr("quickSet")}</span><span className="lib-sect-tag mono">a.u.</span></div>
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
                    <span className="num">{tr("signal")} {sig.toFixed(2)}</span>
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
  library: { titleKey: "libraryPageTitle", tagKey: "roadmapLibraryTag", icon: "library",
    descKey: "roadmapLibraryDesc",
    itemKeys: ["roadmapLibraryItem1", "roadmapLibraryItem2", "roadmapLibraryItem3", "roadmapLibraryItem4"] },
  runs: { titleKey: "runsPageTitle", tagKey: "roadmapRunsTag", icon: "runs",
    descKey: "roadmapRunsDesc",
    itemKeys: ["roadmapRunsItem1", "roadmapRunsItem2", "roadmapRunsItem3", "roadmapRunsItem4"] },
  reverse: { titleKey: "reversePageTitle", tagKey: "roadmapReverseTag", icon: "reverse",
    descKey: "roadmapReverseDesc",
    itemKeys: ["roadmapReverseItem1", "roadmapReverseItem2", "roadmapReverseItem3", "roadmapReverseItem4"] },
};

function PlaceholderPage({ page, onBack }) {
  const r = ROADMAP[page];
  const tr = (key) => window.I18n?.t(key) || key;
  if (!r) return null;
  return (
    <div className="placeholder">
      <div className="placeholder-card">
        <div className="placeholder-top">
          <span className="placeholder-ic"><Icon name={r.icon} size={20} /></span>
          <span className="badge b-soon">{tr(r.tagKey)}</span>
        </div>
        <h1>{tr(r.titleKey)}</h1>
        <p className="placeholder-desc">{tr(r.descKey)}</p>
        <ul className="placeholder-list">
          {r.itemKeys.map((it, i) => (
            <li key={i}><Icon name="check" size={15} sw={2.2} /> {tr(it)}</li>
          ))}
        </ul>
        <button className="btn" onClick={onBack}><Icon name="chevronLeft" size={14} /> {tr("roadmapBack")}</button>
      </div>
    </div>
  );
}

Object.assign(window, { LibraryDock, PlaceholderPage });
