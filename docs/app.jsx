/* ===================================================================
   bionet-studio — app.jsx  (state + composition, general platform)
   =================================================================== */
const { useState, useMemo, useRef, useEffect, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3E8EF7",
  "dark": true,
  "density": "regular",
  "showGrid": true
}/*EDITMODE-END*/;

const DENSITY = {
  compact: { rail: 52, dockL: 240, dockR: 304, dockB: 264, bar: 48, u: 3 },
  regular: { rail: 56, dockL: 264, dockR: 328, dockB: 286, bar: 52, u: 4 },
  comfy:   { rail: 60, dockL: 288, dockR: 352, dockB: 308, bar: 56, u: 5 },
};

let _uid = 100;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [project, setProject] = useState(() => window.Model.defaultProject());
  const [selection, setSelection] = useState(null);
  const [page, setPage] = useState("workbench");
  const [libOpen, setLibOpen] = useState(true);
  const [inspOpen, setInspOpen] = useState(true);
  const [dockOpen, setDockOpen] = useState(true);
  const [view, setView] = useState({ z: 1, x: 60, y: 30 });
  const [latched, setLatched] = useState({});
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef(null);

  // ---- theme & tokens -------------------------------------------
  useEffect(() => { document.documentElement.setAttribute("data-theme", t.dark ? "dark" : "light"); }, [t.dark]);
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--accent", t.accent);
    r.style.setProperty("--accent-strong", shade(t.accent, t.dark ? 16 : -14));
    r.style.setProperty("--accent-weak", t.dark ? mix(t.accent, "#0C100F", 0.82) : mix(t.accent, "#ffffff", 0.88));
    const d = DENSITY[t.density] || DENSITY.regular;
    r.style.setProperty("--rail-w", d.rail + "px");
    r.style.setProperty("--dock-l", d.dockL + "px");
    r.style.setProperty("--dock-r", d.dockR + "px");
    r.style.setProperty("--dock-b", d.dockB + "px");
    r.style.setProperty("--bar-h", d.bar + "px");
    r.style.setProperty("--u", d.u + "px");
  }, [t.accent, t.density, t.dark]);

  // ---- simulation (live) ----------------------------------------
  const sim = useMemo(() => window.Sim.run(project), [project]);

  // persistent latch per classification readout
  useEffect(() => {
    const up = {};
    project.readouts.forEach((ro) => {
      if (ro.type === "classification" && ro.config.latch && window.Sim.crossedTop(sim, ro.config) && !latched[ro.id]) up[ro.id] = true;
    });
    if (Object.keys(up).length) setLatched((l) => ({ ...l, ...up }));
  }, [sim, project.readouts]);

  // primary verdict for the top bar (first classification readout)
  const verdict = useMemo(() => {
    const ro = project.readouts.find((r) => r.type === "classification");
    if (!ro) return null;
    const top = window.Sim.topIndex(ro.config);
    const c = (ro.config.latch && latched[ro.id])
      ? { label: ro.config.labels[top].name, color: ro.config.labels[top].color }
      : window.Sim.classify(window.Sim.channelFinal(sim, ro.config.channel), ro.config);
    return { label: c.label, color: c.color, rule: ro.title };
  }, [project, sim, latched]);

  // ---- mutators -------------------------------------------------
  const markUser = (p) => p.meta.kind === "example" ? { ...p, meta: { ...p.meta, kind: "user" } } : p;
  const edit = useCallback((fn) => { setProject((p) => markUser(fn(p))); setDirty(true); }, []);

  const setNodeParam = useCallback((id, key, val) =>
    edit((p) => ({ ...p, nodes: p.nodes.map((n) => n.id === id ? { ...n, [key]: val } : n) })), [edit]);
  const setEdgeParam = useCallback((id, key, val) =>
    edit((p) => ({ ...p, edges: p.edges.map((e) => {
      if (e.id !== id) return e;
      const ne = { ...e, [key]: val };
      if (key === "sign") ne.w = Math.sign(val || 1) * Math.abs(e.w || 0.5);
      if (key === "w") ne.sign = val >= 0 ? 1 : -1;
      return ne;
    }) })), [edit]);
  const setModelParam = useCallback((key, val) =>
    edit((p) => ({ ...p, params: { ...p.params, [key]: val } })), [edit]);
  const moveNode = useCallback((id, x, y) =>
    edit((p) => ({ ...p, nodes: p.nodes.map((n) => n.id === id ? { ...n, x, y } : n) })), [edit]);
  const setReadout = useCallback((id, patch) =>
    edit((p) => ({ ...p, readouts: p.readouts.map((r) => r.id === id
      ? { ...r, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.config ? { config: patch.config } : {}) } : r) })), [edit]);
  const addReadout = useCallback((type) =>
    edit((p) => ({ ...p, readouts: [...p.readouts, window.Model.newReadout(type)] })), [edit]);
  const removeReadout = useCallback((id) => {
    edit((p) => ({ ...p, readouts: p.readouts.filter((r) => r.id !== id) }));
    setSelection((s) => (s?.type === "readout" && s.id === id ? null : s));
  }, [edit]);
  const resetLatch = (id) => setLatched((l) => ({ ...l, [id]: false }));
  const togglePin = useCallback((id) =>
    edit((p) => ({ ...p, readouts: p.readouts.map((r) => r.id === id ? { ...r, pinned: !r.pinned } : r) })), [edit]);

  const addEdge = useCallback((from, to) => {
    const id = from + ">" + to;
    edit((p) => p.edges.some((e) => e.id === id) ? p : ({ ...p, edges: [...p.edges, { id, from, to, w: 1.0, sign: 1 }] }));
    setSelection({ type: "edge", id });
  }, [edit]);
  const deleteNode = useCallback((id) => {
    edit((p) => ({ ...p, nodes: p.nodes.filter((n) => n.id !== id), edges: p.edges.filter((e) => e.from !== id && e.to !== id) }));
    setSelection((s) => (s?.type === "node" && s.id === id ? null : s));
  }, [edit]);
  const deleteEdge = useCallback((id) => {
    edit((p) => ({ ...p, edges: p.edges.filter((e) => e.id !== id) }));
    setSelection((s) => (s?.type === "edge" && s.id === id ? null : s));
  }, [edit]);
  const duplicateNode = useCallback((id) => {
    const nid = "n_" + (_uid++);
    edit((p) => {
      const src = p.nodes.find((n) => n.id === id); if (!src) return p;
      return { ...p, nodes: [...p.nodes, { ...src, id: nid, x: src.x + 30, y: src.y + 38, label: src.label + " copy" }] };
    });
    setSelection({ type: "node", id: nid });
  }, [edit]);

  const addNode = useCallback((kind) => {
    const meta = window.Model.KIND_META[kind];
    const id = kind + "_" + (_uid++);
    const node = { id, kind, label: meta.label, sub: "new", x: 410 + Math.random() * 70, y: 70 + Math.random() * 60 };
    (window.Model.PARAM_SCHEMA[kind] || []).forEach((pp) => {
      node[pp.key] = pp.key === "C" ? 0.4 : pp.key === "Km" ? 0.5 : pp.key === "n" ? 2 : pp.key === "weight" ? 0.3
        : pp.key === "gain" ? 3.2 : pp.key === "tauMature" ? 4 : pp.key === "gainOut" ? 1 : 0;
    });
    if (kind === "reporter") node.tint = "var(--ch-1)";
    edit((p) => ({ ...p, nodes: [...p.nodes, node] }));
    setSelection({ type: "node", id });
  }, [edit]);

  const pickExample = (id) => {
    const ex = window.Model.EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setProject(ex.make());
    setSelection(null); setLatched({}); setDirty(false);
  };
  const newProject = () => {
    const p = window.Model.defaultProject();
    p.meta = { id: "untitled", name: "Untitled network", kind: "user", domain: "Custom", note: "A blank network from the default backbone." };
    setProject(p); setSelection(null); setLatched({}); setDirty(false);
  };

  // ---- import / export ------------------------------------------
  const doExport = () => {
    const blob = new Blob([JSON.stringify({ format: "bionet-studio/v2", note: "ILLUSTRATIVE DEMO — not calibrated", project }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = (project.meta.name || "network").replace(/\s+/g, "-").toLowerCase() + ".json";
    a.click(); URL.revokeObjectURL(a.href);
  };
  const doImport = () => fileRef.current?.click();
  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(rd.result);
        const pr = j.project || j.model;
        if (pr?.nodes && pr?.edges) {
          if (!pr.readouts) pr.readouts = window.Model.defaultProject().readouts;
          if (!pr.aggregate) pr.aggregate = window.Model.defaultProject().aggregate;
          if (!pr.meta) pr.meta = { id: "import", name: "Imported network", kind: "user", domain: "Custom", note: "" };
          pr.meta.kind = "user";
          setProject(pr); setSelection(null); setLatched({}); setDirty(false);
        }
      } catch (err) { /* ignore */ }
    };
    rd.readAsText(f); e.target.value = "";
  };

  const onRun = () => setProject((p) => ({ ...p }));
  const doExportClean = () => { doExport(); setDirty(false); };

  const appCls = "app" + (libOpen && page === "workbench" ? "" : " lib-collapsed") + (inspOpen && page === "workbench" ? "" : " insp-collapsed");

  return (
    <div className={appCls + (t.showGrid ? "" : " no-grid")}>
      <LeftRail page={page} onNav={setPage} theme={t.dark ? "dark" : "light"} onTheme={() => setTweak("dark", !t.dark)} />
      <TopBar project={project} verdict={verdict} examples={window.Model.EXAMPLES} dirty={dirty}
        onPickExample={pickExample} onNewProject={newProject}
        onImport={doImport} onExport={doExportClean} onRun={onRun}
        libOpen={libOpen} inspOpen={inspOpen}
        onToggleLib={() => setLibOpen((o) => !o)} onToggleInsp={() => setInspOpen((o) => !o)} />

      {page === "workbench" ? (
        <>
          {libOpen && (
            <LibraryDock project={project} sim={sim} onAddNode={addNode}
              onQuickInput={(id, v) => setNodeParam(id, "C", v)} onSelect={setSelection} selection={selection} />
          )}
          <main className="stage" style={{ gridArea: "canvas" }}>
            <NetworkCanvas model={project} sim={sim} selection={selection}
              onSelect={setSelection} onNodeMove={moveNode} onAddEdge={addEdge}
              onDeleteNode={deleteNode} onDuplicateNode={duplicateNode} view={view} setView={setView} />
            <ReadoutDock project={project} sim={sim} latched={latched}
              onResetLatch={resetLatch} onAddReadout={addReadout} onRemoveReadout={removeReadout}
              onConfigure={(id) => setSelection({ type: "readout", id })} onTogglePin={togglePin}
              collapsed={!dockOpen} onToggleCollapse={() => setDockOpen((o) => !o)} />
          </main>
          {inspOpen && (
            <Inspector project={project} sim={sim} selection={selection}
              onParam={setNodeParam} onEdgeParam={setEdgeParam} onEdgeDelete={deleteEdge} onModelParam={setModelParam}
              onReadout={setReadout} onSelectReadout={(id) => setSelection({ type: "readout", id })} />
          )}
        </>
      ) : (
        <main className="stage stage-page" style={{ gridArea: "libdock / libdock / inspector / inspector" }}>
          <PlaceholderPage page={page} onBack={() => setPage("workbench")} />
        </main>
      )}

      <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onFile} />

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakColor label="Accent" value={t.accent}
          options={["#3E8EF7", "#2DBE9E", "#3FCB84", "#E6B24A", "#E8709E"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Workspace" />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakToggle label="Canvas grid" value={t.showGrid} onChange={(v) => setTweak("showGrid", v)} />
      </TweaksPanel>
    </div>
  );
}

/* ---- color helpers -------------------------------------------- */
function hexToRgb(h) { const x = h.replace("#", ""); return [parseInt(x.slice(0,2),16), parseInt(x.slice(2,4),16), parseInt(x.slice(4,6),16)]; }
function rgbToHex(r){ return "#" + r.map((v)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join(""); }
function shade(h, pct){ return rgbToHex(hexToRgb(h).map((v)=>v + (pct/100)*255)); }
function mix(a,b,wb){ const x=hexToRgb(a), y=hexToRgb(b); return rgbToHex(x.map((v,i)=>v*(1-wb)+y[i]*wb)); }

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
