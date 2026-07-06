/* ===================================================================
   bionet-studio — app.jsx  (state + composition, general platform)
   =================================================================== */
const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useMemo, useRef, useEffect, useCallback } = React;
const { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakColor, TweakRadio, LeftRail, TopBar, LibraryDock, PlaceholderPage, NetworkCanvas, ReadoutDock, Inspector, RunsPage, ComparePanel, OnboardingOverlay, ReversePage, } = window;
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
    "accent": "#3E8EF7",
    "dark": true,
    "density": "regular",
    "showGrid": true
} /*EDITMODE-END*/;
const DENSITY = {
    compact: { rail: 52, dockL: 240, dockR: 304, dockB: 264, bar: 48, u: 3 },
    regular: { rail: 56, dockL: 264, dockR: 328, dockB: 286, bar: 52, u: 4 },
    comfy: { rail: 60, dockL: 288, dockR: 352, dockB: 308, bar: 56, u: 5 },
};
let _uid = 100;
function App() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    const [lang, setLang] = useState(() => window.I18n?.lang || "zh");
    const [project, setProject] = useState(() => window.Model.defaultProject());
    const [selection, setSelection] = useState(null);
    const [page, setPage] = useState("workbench");
    const [libOpen, setLibOpen] = useState(true);
    const [inspOpen, setInspOpen] = useState(true);
    const [dockOpen, setDockOpen] = useState(true);
    const [view, setView] = useState({ z: 1, x: 60, y: 30 });
    const [latched, setLatched] = useState({});
    const [dirty, setDirty] = useState(false);
    const [snapshots, setSnapshots] = useState({ A: null, B: null });
    const [compareOpen, setCompareOpen] = useState(false);
    const [toast, setToast] = useState(null); // { text, ts }
    const [runs, setRuns] = useState(() => (window.Runs ? window.Runs.list() : []));
    const [onboardStep, setOnboardStep] = useState(() => {
        try {
            return localStorage.getItem("bionet.onboarded") === "1" ? -1 : 0;
        }
        catch (err) {
            return 0;
        }
    });
    const fileRef = useRef(null);
    const history = useRef({ past: [], future: [] });
    const [histTick, setHistTick] = useState(0);
    const HIST_LIMIT = 30;
    const tr = (key) => window.I18n?.t(key) || key;
    const showToast = useCallback((text) => {
        const ts = Date.now();
        setToast({ text, ts });
        setTimeout(() => setToast((cur) => (cur && cur.ts === ts ? null : cur)), 1800);
    }, []);
    const switchLang = useCallback(() => {
        const next = window.I18n.nextLang();
        window.I18n.switchTo(next);
        setLang(next);
        window.location.reload();
    }, []);
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
            if (ro.type === "classification" && ro.config.latch && window.Sim.crossedTop(sim, ro.config) && !latched[ro.id])
                up[ro.id] = true;
        });
        if (Object.keys(up).length)
            setLatched((l) => ({ ...l, ...up }));
    }, [sim, project.readouts]);
    // primary verdict for the top bar (first classification readout)
    const verdict = useMemo(() => {
        const ro = project.readouts.find((r) => r.type === "classification");
        if (!ro)
            return null;
        const top = window.Sim.topIndex(ro.config);
        const c = (ro.config.latch && latched[ro.id])
            ? { label: ro.config.labels[top].name, color: ro.config.labels[top].color }
            : window.Sim.classify(window.Sim.channelFinal(sim, ro.config.channel), ro.config);
        return { label: c.label, color: c.color, rule: ro.title };
    }, [project, sim, latched]);
    // ---- mutators -------------------------------------------------
    const markUser = (p) => p.meta.kind === "example" ? { ...p, meta: { ...p.meta, kind: "user" } } : p;
    const edit = useCallback((fn) => {
        setProject((p) => {
            const next = markUser(fn(p));
            if (next === p)
                return p;
            history.current.past.push(p);
            if (history.current.past.length > HIST_LIMIT)
                history.current.past.shift();
            history.current.future = [];
            return next;
        });
        setHistTick((n) => n + 1);
        setDirty(true);
    }, []);
    const undo = useCallback(() => {
        const h = history.current;
        if (!h.past.length)
            return;
        setProject((cur) => {
            const prev = h.past.pop();
            h.future.push(cur);
            if (h.future.length > HIST_LIMIT)
                h.future.shift();
            return prev;
        });
        setHistTick((n) => n + 1);
        setDirty(true);
    }, []);
    const redo = useCallback(() => {
        const h = history.current;
        if (!h.future.length)
            return;
        setProject((cur) => {
            const next = h.future.pop();
            h.past.push(cur);
            if (h.past.length > HIST_LIMIT)
                h.past.shift();
            return next;
        });
        setHistTick((n) => n + 1);
        setDirty(true);
    }, []);
    const resetHistory = () => { history.current = { past: [], future: [] }; setHistTick((n) => n + 1); };
    // canUndo/canRedo recompute each render thanks to histTick.
    void histTick;
    const canUndo = history.current.past.length > 0;
    const canRedo = history.current.future.length > 0;
    const setNodeParam = useCallback((id, key, val) => edit((p) => ({ ...p, nodes: p.nodes.map((n) => n.id === id ? { ...n, [key]: val } : n) })), [edit]);
    const setEdgeParam = useCallback((id, key, val) => edit((p) => ({ ...p, edges: p.edges.map((e) => {
            if (e.id !== id)
                return e;
            const ne = { ...e, [key]: val };
            if (key === "sign")
                ne.w = Math.sign(val || 1) * Math.abs(e.w || 0.5);
            if (key === "w")
                ne.sign = val >= 0 ? 1 : -1;
            return ne;
        }) })), [edit]);
    const setModelParam = useCallback((key, val) => edit((p) => ({ ...p, params: { ...p.params, [key]: val } })), [edit]);
    const moveNode = useCallback((id, x, y) => edit((p) => ({ ...p, nodes: p.nodes.map((n) => n.id === id ? { ...n, x, y } : n) })), [edit]);
    const setReadout = useCallback((id, patch) => edit((p) => ({ ...p, readouts: p.readouts.map((r) => r.id === id
            ? { ...r, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.config ? { config: patch.config } : {}) } : r) })), [edit]);
    const addReadout = useCallback((type) => edit((p) => ({ ...p, readouts: [...p.readouts, window.Model.newReadout(type)] })), [edit]);
    const removeReadout = useCallback((id) => {
        edit((p) => ({ ...p, readouts: p.readouts.filter((r) => r.id !== id) }));
        setSelection((s) => (s?.type === "readout" && s.id === id ? null : s));
    }, [edit]);
    const resetLatch = (id) => setLatched((l) => ({ ...l, [id]: false }));
    const togglePin = useCallback((id) => edit((p) => ({ ...p, readouts: p.readouts.map((r) => r.id === id ? { ...r, pinned: !r.pinned } : r) })), [edit]);
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
            const src = p.nodes.find((n) => n.id === id);
            if (!src)
                return p;
            const layout = window._canvasLayout;
            const offset = layout ? layout.NODE_W + 16 : 200;
            const raw = { x: src.x + offset, y: src.y + 12 };
            const pos = layout ? layout.clampNodePos(raw.x, raw.y) : raw;
            return { ...p, nodes: [...p.nodes, { ...src, id: nid, x: pos.x, y: pos.y, label: src.label + " " + (window.I18n?.t("copiedNode") || "copy") }] };
        });
        setSelection({ type: "node", id: nid });
    }, [edit]);
    const addNode = useCallback((kind) => {
        const meta = window.Model.KIND_META[kind];
        const id = kind + "_" + (_uid++);
        const layout = window._canvasLayout;
        const slot = layout ? layout.pickLayerSlot(kind, project.nodes) : { x: 410, y: 70 };
        const node = { id, kind, label: meta.label, sub: lang === "zh" ? "新建" : "new", x: slot.x, y: slot.y };
        (window.Model.PARAM_SCHEMA[kind] || []).forEach((pp) => {
            node[pp.key] = pp.key === "C" ? 0.4 : pp.key === "Km" ? 0.5 : pp.key === "n" ? 2 : pp.key === "weight" ? 0.3
                : pp.key === "gain" ? 3.2 : pp.key === "tauMature" ? 4 : pp.key === "gainOut" ? 1 : 0;
        });
        if (kind === "reporter")
            node.tint = "var(--ch-1)";
        edit((p) => ({ ...p, nodes: [...p.nodes, node] }));
        setSelection({ type: "node", id });
    }, [edit, project.nodes, lang]);
    const pickExample = (id) => {
        const ex = window.Model.EXAMPLES.find((e) => e.id === id);
        if (!ex)
            return;
        setProject(ex.make());
        setSelection(null);
        setLatched({});
        setDirty(false);
        setSnapshots({ A: null, B: null });
        resetHistory();
    };
    const newProject = () => {
        const p = window.Model.defaultProject();
        p.meta = { id: "untitled", name: tr("untitledNetwork"), kind: "user", domain: tr("custom"), note: lang === "zh" ? "从默认骨架创建的空白网络。" : "A blank network from the default backbone." };
        setProject(p);
        setSelection(null);
        setLatched({});
        setDirty(false);
        setSnapshots({ A: null, B: null });
        resetHistory();
    };
    // ---- import / export ------------------------------------------
    const doExport = () => {
        const data = {
            format: "bionet-studio/v2",
            note: "ILLUSTRATIVE DEMO — not calibrated",
            project,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${(project.meta?.name || "network")
            .replace(/\s+/g, "-")
            .toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };
    const doImport = () => fileRef.current?.click();
    // 规范化导入项目：兼容旧版本 JSON，避免缺少字段导致页面失效
    const normalizeImportedProject = (rawProject) => {
        const fallback = window.Model.defaultProject();
        const project = window.Model.clone
            ? window.Model.clone(rawProject)
            : JSON.parse(JSON.stringify(rawProject));
        // nodes / edges 是项目能否恢复的最低要求
        if (!Array.isArray(project.nodes) || !Array.isArray(project.edges)) {
            return null;
        }
        // 兼容旧版本缺失 meta 的情况
        project.meta = {
            ...fallback.meta,
            id: project.meta?.id || "import",
            name: project.meta?.name || tr("importedNetwork"),
            kind: "user",
            domain: project.meta?.domain || tr("custom"),
            note: project.meta?.note || "",
        };
        // 兼容旧版本缺失 params 的情况
        project.params = {
            ...fallback.params,
            ...(project.params || {}),
        };
        // 兼容旧版本缺失 readouts 的情况
        project.readouts = Array.isArray(project.readouts)
            ? project.readouts
            : fallback.readouts;
        // 兼容旧版本缺失 aggregate 的情况
        project.aggregate = {
            ...fallback.aggregate,
            ...(project.aggregate || {}),
        };
        // 兼容旧版本缺失 channels 的情况
        project.channels = {
            ...(fallback.channels || {}),
            ...(project.channels || {}),
        };
        return project;
    };
    const onFile = (e) => {
        const f = e.target.files?.[0];
        if (!f)
            return;
        const rd = new FileReader();
        rd.onload = () => {
            try {
                const data = JSON.parse(rd.result);
                const rawProject = data.project || data.model || data;
                const importedProject = normalizeImportedProject(rawProject);
                if (!importedProject)
                    return;
                setProject(importedProject);
                setSelection(null);
                setLatched({});
                setDirty(false);
                setSnapshots({ A: null, B: null });
                resetHistory();
            }
            catch (err) {
                console.warn("Failed to import project JSON:", err);
            }
        };
        rd.readAsText(f);
        e.target.value = "";
    };
    const onRun = useCallback(() => {
        setProject((p) => ({ ...p }));
        setLatched({});
        if (window.Runs) {
            const run = window.Runs.record(project, sim);
            setRuns(window.Runs.list());
            showToast(tr("runRecorded"));
        }
        else {
            showToast(tr("runFlash"));
        }
    }, [project, sim, showToast]);
    const doExportClean = () => { doExport(); setDirty(false); };
    // ---- A/B snapshots --------------------------------------------
    const saveSnapshot = useCallback((slot) => {
        const snap = {
            label: slot === "A" ? "A" : "B",
            ts: Date.now(),
            project: window.Model.clone(project),
            sim: JSON.parse(JSON.stringify(sim)),
        };
        setSnapshots((s) => ({ ...s, [slot]: snap }));
        showToast(tr(slot === "A" ? "snapshotSavedA" : "snapshotSavedB"));
    }, [project, sim, showToast]);
    const clearSnapshot = useCallback((slot) => {
        setSnapshots((s) => ({ ...s, [slot]: null }));
    }, []);
    const openCompare = useCallback(() => setCompareOpen(true), []);
    const closeCompare = useCallback(() => setCompareOpen(false), []);
    // ---- Run history ----------------------------------------------
    const refreshRuns = useCallback(() => { if (window.Runs)
        setRuns(window.Runs.list()); }, []);
    const deleteRun = useCallback((id) => { if (window.Runs) {
        window.Runs.remove(id);
        refreshRuns();
    } }, [refreshRuns]);
    const clearRuns = useCallback(() => { if (window.Runs) {
        window.Runs.clear();
        refreshRuns();
        showToast(tr("runsCleared"));
    } }, [refreshRuns, showToast]);
    const updateRunNote = useCallback((id, note) => { if (window.Runs) {
        window.Runs.update(id, { note });
        refreshRuns();
    } }, [refreshRuns]);
    const restoreRun = useCallback((id) => {
        if (!window.Runs)
            return;
        const run = window.Runs.list().find((r) => r.id === id);
        if (!run)
            return;
        setProject(window.Model.clone(run.project));
        setSelection(null);
        setLatched({});
        setDirty(false);
        setSnapshots({ A: null, B: null });
        resetHistory();
        setPage("workbench");
        showToast(tr("runRestored"));
    }, [showToast]);
    const exportRuns = useCallback((ids) => {
        if (!window.Runs)
            return;
        const data = window.Runs.exportRuns(ids);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        a.download = "bionet-runs-" + stamp + ".json";
        a.click();
        URL.revokeObjectURL(a.href);
    }, []);
    const importRunsFile = useCallback((file) => {
        if (!file || !window.Runs)
            return;
        const rd = new FileReader();
        rd.onload = () => {
            try {
                const j = JSON.parse(rd.result);
                const added = window.Runs.importRuns(j);
                refreshRuns();
                showToast(added ? `${tr("runsImported")} (${added})` : tr("runsImportedNone"));
            }
            catch (err) {
                showToast(tr("runsImportFailed"));
            }
        };
        rd.readAsText(file);
    }, [refreshRuns, showToast]);
    const applyReverseCandidate = useCallback((candidate) => {
        edit((p) => window.ReverseSolver.applyCandidate(p, candidate));
        showToast(tr("reverseApplied"));
        setLatched({});
    }, [edit, showToast]);
    // ---- view helpers ---------------------------------------------
    const fitView = useCallback(() => {
        const layout = window._canvasLayout;
        const W = layout?.WORLD_W ?? 1040, H = layout?.WORLD_H ?? 480;
        const el = document.querySelector(".canvas");
        if (!el)
            return;
        const r = el.getBoundingClientRect();
        const z = Math.min((r.width - 56) / W, (r.height - 56) / H, 1.4);
        setView({ z, x: (r.width - W * z) / 2, y: (r.height - H * z) / 2 });
    }, []);
    const focusNode = useCallback((id) => {
        const layout = window._canvasLayout;
        if (!layout)
            return;
        const nd = project.nodes.find((n) => n.id === id);
        if (!nd)
            return;
        const el = document.querySelector(".canvas");
        if (!el)
            return;
        const r = el.getBoundingClientRect();
        const z = view.z;
        const cx = nd.x + layout.NODE_W / 2;
        const cy = nd.y + layout.NODE_H / 2;
        setView({ z, x: r.width / 2 - cx * z, y: r.height / 2 - cy * z });
    }, [project.nodes, view.z]);
    // ---- keyboard shortcuts ---------------------------------------
    useEffect(() => {
        const isTyping = (target) => {
            if (!target)
                return false;
            const tag = target.tagName;
            return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
        };
        const handler = (e) => {
            if (isTyping(e.target))
                return;
            const meta = e.ctrlKey || e.metaKey;
            // Undo / Redo
            if (meta && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
                e.preventDefault();
                undo();
                return;
            }
            if (meta && (e.key === "y" || e.key === "Y" || ((e.key === "z" || e.key === "Z") && e.shiftKey))) {
                e.preventDefault();
                redo();
                return;
            }
            // Duplicate
            if (meta && (e.key === "d" || e.key === "D")) {
                if (selection?.type === "node") {
                    e.preventDefault();
                    duplicateNode(selection.id);
                }
                return;
            }
            // Delete
            if (!meta && (e.key === "Delete" || e.key === "Backspace")) {
                if (selection?.type === "node") {
                    e.preventDefault();
                    deleteNode(selection.id);
                }
                else if (selection?.type === "edge") {
                    e.preventDefault();
                    deleteEdge(selection.id);
                }
                return;
            }
            // Escape: clear selection / close compare / dismiss onboarding
            if (e.key === "Escape") {
                if (compareOpen) {
                    setCompareOpen(false);
                    return;
                }
                if (onboardStep >= 0) {
                    setOnboardStep(-1);
                    try {
                        localStorage.setItem("bionet.onboarded", "1");
                    }
                    catch (err) { }
                    return;
                }
                if (selection)
                    setSelection(null);
                return;
            }
            // F: fit view, or focus selected node
            if (!meta && (e.key === "f" || e.key === "F")) {
                e.preventDefault();
                if (selection?.type === "node")
                    focusNode(selection.id);
                else
                    fitView();
                return;
            }
            // I: toggle edge sign
            if (!meta && (e.key === "i" || e.key === "I")) {
                if (selection?.type === "edge") {
                    const ed = project.edges.find((x) => x.id === selection.id);
                    if (ed) {
                        e.preventDefault();
                        setEdgeParam(selection.id, "sign", ed.sign < 0 ? 1 : -1);
                    }
                }
                return;
            }
            // +/-: zoom
            if (!meta && (e.key === "+" || e.key === "=")) {
                e.preventDefault();
                setView((v) => ({ ...v, z: Math.min(2.2, v.z * 1.1) }));
                return;
            }
            if (!meta && (e.key === "-" || e.key === "_")) {
                e.preventDefault();
                setView((v) => ({ ...v, z: Math.max(0.45, v.z * 0.9) }));
                return;
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [selection, undo, redo, duplicateNode, deleteNode, deleteEdge, project.edges, setEdgeParam, focusNode, fitView, compareOpen, onboardStep]);
    const appCls = "app" + (libOpen && page === "workbench" ? "" : " lib-collapsed") + (inspOpen && page === "workbench" ? "" : " insp-collapsed");
    return (React.createElement("div", { className: appCls + (t.showGrid ? "" : " no-grid") },
        React.createElement(LeftRail, { page: page, onNav: setPage, theme: t.dark ? "dark" : "light", onTheme: () => setTweak("dark", !t.dark), runsCount: runs.length }),
        React.createElement(TopBar, { project: project, verdict: verdict, examples: window.Model.EXAMPLES, dirty: dirty, onPickExample: pickExample, onNewProject: newProject, onImport: doImport, onExport: doExportClean, onRun: onRun, lang: lang, onLang: switchLang, libOpen: libOpen, inspOpen: inspOpen, onToggleLib: () => setLibOpen((o) => !o), onToggleInsp: () => setInspOpen((o) => !o), canUndo: canUndo, canRedo: canRedo, onUndo: undo, onRedo: redo, snapshots: snapshots, onSaveSnapshot: saveSnapshot, onClearSnapshot: clearSnapshot, onCompare: openCompare }),
        page === "workbench" ? (React.createElement(React.Fragment, null,
            libOpen && (React.createElement(LibraryDock, { project: project, sim: sim, onAddNode: addNode, onQuickInput: (id, v) => setNodeParam(id, "C", v), onSelect: setSelection, selection: selection })),
            React.createElement("main", { className: "stage", style: { gridArea: "canvas" } },
                React.createElement(NetworkCanvas, { model: project, sim: sim, selection: selection, onSelect: setSelection, onNodeMove: moveNode, onAddEdge: addEdge, onDeleteNode: deleteNode, onDuplicateNode: duplicateNode, view: view, setView: setView }),
                React.createElement(ReadoutDock, { project: project, sim: sim, latched: latched, onResetLatch: resetLatch, onAddReadout: addReadout, onRemoveReadout: removeReadout, onConfigure: (id) => setSelection({ type: "readout", id }), onTogglePin: togglePin, collapsed: !dockOpen, onToggleCollapse: () => setDockOpen((o) => !o), verdict: verdict })),
            inspOpen && (React.createElement(Inspector, { project: project, sim: sim, selection: selection, onParam: setNodeParam, onEdgeParam: setEdgeParam, onEdgeDelete: deleteEdge, onModelParam: setModelParam, onReadout: setReadout, onSelectReadout: (id) => setSelection({ type: "readout", id }) })))) : (React.createElement("main", { className: "stage stage-page" + (page === "runs" ? " runs-mode" : "") + (page === "reverse" ? " reverse-mode" : ""), style: { gridArea: "libdock / libdock / inspector / inspector" } }, page === "runs"
            ? React.createElement(RunsPage, { runs: runs, onBack: () => setPage("workbench"), onDelete: deleteRun, onClearAll: clearRuns, onRestore: restoreRun, onUpdateNote: updateRunNote, onExport: exportRuns, onImportFile: importRunsFile })
            : page === "reverse"
                ? React.createElement(ReversePage, { project: project, onBack: () => setPage("workbench"), onApply: applyReverseCandidate })
                : React.createElement(PlaceholderPage, { page: page, onBack: () => setPage("workbench") }))),
        React.createElement("input", { ref: fileRef, type: "file", accept: "application/json", style: { display: "none" }, onChange: onFile }),
        compareOpen && (React.createElement(ComparePanel, { project: project, snapshots: snapshots, onClose: closeCompare, onClearSnapshot: clearSnapshot })),
        onboardStep >= 0 && (React.createElement(OnboardingOverlay, { step: onboardStep, onNext: () => setOnboardStep((s) => s + 1), onDone: () => { setOnboardStep(-1); try {
                localStorage.setItem("bionet.onboarded", "1");
            }
            catch (err) { } } })),
        toast && React.createElement("div", { className: "toast" }, toast.text),
        React.createElement(TweaksPanel, { title: tr("settings") },
            React.createElement(TweakSection, { label: tr("theme") }),
            React.createElement(TweakToggle, { label: tr("darkMode"), value: t.dark, onChange: (v) => setTweak("dark", v) }),
            React.createElement(TweakColor, { label: tr("accent"), value: t.accent, options: ["#3E8EF7", "#2DBE9E", "#3FCB84", "#E6B24A", "#E8709E"], onChange: (v) => setTweak("accent", v) }),
            React.createElement(TweakSection, { label: tr("workspace") }),
            React.createElement(TweakRadio, { label: tr("density"), value: t.density, options: [
                    { value: "compact", label: tr("compact") },
                    { value: "regular", label: tr("regular") },
                    { value: "comfy", label: tr("comfy") },
                ], onChange: (v) => setTweak("density", v) }),
            React.createElement(TweakToggle, { label: tr("canvasGrid"), value: t.showGrid, onChange: (v) => setTweak("showGrid", v) }))));
}
/* ---- color helpers -------------------------------------------- */
function hexToRgb(h) { const x = h.replace("#", ""); return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]; }
function rgbToHex(r) { return "#" + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function shade(h, pct) { return rgbToHex(hexToRgb(h).map((v) => v + (pct / 100) * 255)); }
function mix(a, b, wb) { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((v, i) => v * (1 - wb) + y[i] * wb)); }
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));
