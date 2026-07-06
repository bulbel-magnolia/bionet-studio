/* ===================================================================
   bionet-studio — chrome.jsx  (left rail + top command bar)
   Exports: LeftRail, TopBar
   =================================================================== */
const React = window.React;
const { Icon } = window;
const RAIL_ITEMS = [
    { id: "workbench", labelKey: "navWorkbench", icon: "workbench" },
    { id: "library", labelKey: "navLibrary", icon: "library" },
    { id: "runs", labelKey: "navRuns", icon: "runs" },
    { id: "reverse", labelKey: "navReverse", icon: "reverse" },
];
function LeftRail({ page, onNav, theme, onTheme, runsCount }) {
    const tr = (key) => window.I18n?.t(key) || key;
    return (React.createElement("nav", { className: "rail" },
        React.createElement("div", { className: "rail-logo", title: "bionet-studio" },
            React.createElement(Icon, { name: "logo", size: 19, sw: 1.7 })),
        React.createElement("div", { className: "rail-items" }, RAIL_ITEMS.map((it) => (React.createElement("button", { key: it.id, className: "rail-btn" + (page === it.id ? " on" : ""), onClick: () => onNav(it.id), title: tr(it.labelKey) },
            React.createElement(Icon, { name: it.icon, size: 20 }),
            it.soon && React.createElement("span", { className: "rail-soon" }),
            it.id === "runs" && runsCount > 0 && React.createElement("span", { className: "rail-count mono" }, runsCount > 99 ? "99+" : runsCount))))),
        React.createElement("div", { className: "rail-foot" },
            React.createElement("button", { className: "rail-btn", title: theme === "dark" ? tr("themeLight") : tr("themeDark"), onClick: onTheme },
                React.createElement(Icon, { name: theme === "dark" ? "sun" : "moon", size: 19 })),
            React.createElement("button", { className: "rail-btn", title: tr("settings") },
                React.createElement(Icon, { name: "settings", size: 19 })))));
}
function TopBar({ project, verdict, examples, dirty, onPickExample, onNewProject, onImport, onExport, onRun, lang, onLang, libOpen, inspOpen, onToggleLib, onToggleInsp, canUndo, canRedo, onUndo, onRedo, snapshots, onSaveSnapshot, onClearSnapshot, onCompare }) {
    const [open, setOpen] = React.useState(false);
    const [slotMenu, setSlotMenu] = React.useState(null); // "A" | "B" | null
    const [runFlash, setRunFlash] = React.useState(false);
    const runOnce = () => {
        onRun();
        setRunFlash(true);
        setTimeout(() => setRunFlash(false), 600);
    };
    const isUser = project.meta.kind === "user";
    const tr = (key) => window.I18n?.t(key) || key;
    const formatTs = (ts) => {
        if (!ts)
            return "";
        const d = new Date(ts);
        const pad = (n) => String(n).padStart(2, "0");
        return pad(d.getHours()) + ":" + pad(d.getMinutes());
    };
    const snapA = snapshots?.A, snapB = snapshots?.B;
    const compareReady = snapA && snapB;
    return (React.createElement("header", { className: "topbar" },
        React.createElement("div", { className: "topbar-l" },
            React.createElement("button", { className: "iconbtn" + (libOpen ? " on" : ""), title: tr("toggleLibrary"), onClick: onToggleLib },
                React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7" },
                    React.createElement("rect", { x: "3", y: "4", width: "6", height: "16", rx: "1.3" }),
                    React.createElement("rect", { x: "11", y: "4", width: "10", height: "16", rx: "1.3", opacity: "0.4" }))),
            React.createElement("div", { className: "brand" },
                React.createElement("span", { className: "brand-name" },
                    "bionet",
                    React.createElement("span", { className: "brand-dim" }, "-studio")),
                React.createElement("span", { className: "brand-tag" }, tr("brandTag"))),
            React.createElement("span", { className: "topbar-div" }),
            React.createElement("div", { className: "project", onMouseLeave: () => setOpen(false) },
                React.createElement("button", { className: "project-btn", onClick: () => setOpen((o) => !o) },
                    React.createElement(Icon, { name: "examples", size: 15 }),
                    React.createElement("span", { className: "project-tx" },
                        React.createElement("span", { className: "project-name" }, project.meta.name),
                        React.createElement("span", { className: "project-sub" }, project.meta.domain)),
                    React.createElement("span", { className: "badge " + (isUser ? "b-user" : "b-example") }, isUser ? tr("user") : tr("example")),
                    dirty && React.createElement("span", { className: "unsaved", title: tr("unsaved") }),
                    React.createElement(Icon, { name: "chevronDown", size: 13 })),
                open && (React.createElement("div", { className: "project-menu" },
                    React.createElement("div", { className: "project-menu-h eyebrow" }, tr("examplesTemplates")),
                    examples.map((p) => (React.createElement("button", { key: p.id, className: "project-item" + (p.id === project.meta.id && !isUser ? " on" : ""), onClick: () => { onPickExample(p.id); setOpen(false); } },
                        React.createElement("div", { className: "project-item-tx" },
                            React.createElement("div", { className: "project-item-name" }, p.name),
                            React.createElement("div", { className: "project-item-note" }, p.note)),
                        React.createElement("span", { className: "badge b-example" }, p.domain)))),
                    React.createElement("div", { className: "project-menu-sep" }),
                    React.createElement("button", { className: "project-item ghost", onClick: () => { onNewProject(); setOpen(false); } },
                        React.createElement("div", { className: "project-item-tx" },
                            React.createElement("div", { className: "project-item-name" },
                                React.createElement(Icon, { name: "add", size: 13, style: { verticalAlign: "-2px", marginRight: 5 } }),
                                tr("blankProject")),
                            React.createElement("div", { className: "project-item-note" }, tr("blankProjectNote")))))))),
        React.createElement("div", { className: "topbar-r" },
            React.createElement("span", { className: "live-pill" },
                React.createElement("span", { className: "live-dot" }),
                tr("live")),
            verdict && (React.createElement("span", { className: "verdict-chip", style: { "--vc": verdict.color } },
                React.createElement("span", { className: "dot", style: { background: verdict.color } }),
                React.createElement("span", { className: "verdict-chip-rule" }, verdict.rule),
                React.createElement("span", { className: "verdict-chip-state", style: { color: verdict.color } }, verdict.label))),
            React.createElement("span", { className: "topbar-div" }),
            React.createElement("div", { className: "abgroup", title: tr("compareTitle") },
                React.createElement("span", { className: "abgroup-label eyebrow" }, "A / B"),
                ["A", "B"].map((slot) => {
                    const sn = snapshots?.[slot];
                    return (React.createElement("div", { key: slot, className: "ab-slot-wrap", onMouseLeave: () => setSlotMenu((m) => (m === slot ? null : m)) },
                        React.createElement("button", { className: "ab-slot" + (sn ? " filled" : ""), title: tr(slot === "A" ? "snapshotAFull" : "snapshotBFull"), onClick: () => sn ? setSlotMenu((m) => (m === slot ? null : slot)) : onSaveSnapshot(slot) },
                            React.createElement("span", { className: "ab-slot-key" }, slot),
                            sn ? React.createElement("span", { className: "ab-slot-ts mono" }, formatTs(sn.ts))
                                : React.createElement("span", { className: "ab-slot-add" }, tr("snapshotSave"))),
                        sn && slotMenu === slot && (React.createElement("div", { className: "ab-slot-menu" },
                            React.createElement("button", { className: "ab-slot-menu-i", onClick: () => { onSaveSnapshot(slot); setSlotMenu(null); } },
                                React.createElement(Icon, { name: "reset", size: 12 }),
                                " ",
                                tr("overwriteSlot")),
                            React.createElement("button", { className: "ab-slot-menu-i danger", onClick: () => { onClearSnapshot(slot); setSlotMenu(null); } },
                                React.createElement(Icon, { name: "trash", size: 12 }),
                                " ",
                                tr("cleared"))))));
                }),
                React.createElement("button", { className: "btn ab-compare" + (compareReady ? " ready" : " disabled"), onClick: () => compareReady ? onCompare() : (!snapA ? onSaveSnapshot("A") : onSaveSnapshot("B")), title: compareReady ? tr("compareTitle") : tr("compareSaveHint") },
                    React.createElement(Icon, { name: "runs", size: 14 }),
                    " ",
                    compareReady ? tr("compare") : (!snapA ? tr("snapshotA") : tr("snapshotB")))),
            React.createElement("span", { className: "topbar-div" }),
            React.createElement("div", { className: "undogroup" },
                React.createElement("button", { className: "iconbtn", disabled: !canUndo, title: tr("undo") + " (Ctrl+Z)", onClick: onUndo },
                    React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8" },
                        React.createElement("path", { d: "M9 14L4 9l5-5" }),
                        React.createElement("path", { d: "M4 9h11a5 5 0 0 1 0 10h-4" }))),
                React.createElement("button", { className: "iconbtn", disabled: !canRedo, title: tr("redo") + " (Ctrl+Shift+Z)", onClick: onRedo },
                    React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8" },
                        React.createElement("path", { d: "M15 14l5-5-5-5" }),
                        React.createElement("path", { d: "M20 9H9a5 5 0 0 0 0 10h4" })))),
            React.createElement("div", { className: "filegroup" },
                React.createElement("button", { className: "btn ghost", onClick: onImport, title: tr("importProject") },
                    React.createElement(Icon, { name: "importf", size: 15 }),
                    tr("import")),
                React.createElement("span", { className: "fg-sep" }),
                React.createElement("button", { className: "btn ghost", onClick: onExport, title: tr("exportProject") },
                    React.createElement(Icon, { name: "exportf", size: 15 }),
                    tr("export"))),
            React.createElement("button", { className: "btn ghost lang-btn", onClick: onLang, title: lang === "zh" ? tr("switchToEnglish") : tr("switchToChinese") }, tr("langToggle")),
            React.createElement("button", { className: "btn primary" + (runFlash ? " flash" : ""), onClick: runOnce },
                React.createElement(Icon, { name: "run", size: 13 }),
                tr("runSimulation")),
            React.createElement("button", { className: "iconbtn" + (inspOpen ? " on" : ""), title: tr("toggleInspector"), onClick: onToggleInsp },
                React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7" },
                    React.createElement("rect", { x: "3", y: "4", width: "10", height: "16", rx: "1.3", opacity: "0.4" }),
                    React.createElement("rect", { x: "15", y: "4", width: "6", height: "16", rx: "1.3" }))))));
}
Object.assign(window, { LeftRail, TopBar });
