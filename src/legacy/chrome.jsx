/* ===================================================================
   bionet-studio — chrome.jsx  (left rail + top command bar)
   Exports: LeftRail, TopBar
   =================================================================== */
const React = window.React;
const { Icon } = window;

const RAIL_ITEMS = [
  { id: "workbench", labelKey: "navWorkbench", icon: "workbench" },
  { id: "library",   labelKey: "navLibrary", icon: "library" },
  { id: "runs",      labelKey: "navRuns", icon: "runs" },
  { id: "reverse",   labelKey: "navReverse", icon: "reverse" },
];

function LeftRail({ page, onNav, theme, onTheme, runsCount }) {
  const tr = (key) => window.I18n?.t(key) || key;
  return (
    <nav className="rail">
      <div className="rail-logo" title="bionet-studio"><Icon name="logo" size={19} sw={1.7} /></div>
      <div className="rail-items">
        {RAIL_ITEMS.map((it) => (
          <button key={it.id} className={"rail-btn" + (page === it.id ? " on" : "")} onClick={() => onNav(it.id)} title={tr(it.labelKey)}>
            <Icon name={it.icon} size={20} />
            {it.soon && <span className="rail-soon"></span>}
            {it.id === "runs" && runsCount > 0 && <span className="rail-count mono">{runsCount > 99 ? "99+" : runsCount}</span>}
          </button>
        ))}
      </div>
      <div className="rail-foot">
        <button className="rail-btn" title={theme === "dark" ? tr("themeLight") : tr("themeDark")} onClick={onTheme}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
        </button>
        <button className="rail-btn" title={tr("settings")}><Icon name="settings" size={19} /></button>
      </div>
    </nav>
  );
}

function TopBar({ project, verdict, examples, dirty, onPickExample, onNewProject,
                  onImport, onExport, onRun, lang, onLang, libOpen, inspOpen, onToggleLib, onToggleInsp,
                  canUndo, canRedo, onUndo, onRedo,
                  snapshots, onSaveSnapshot, onClearSnapshot, onCompare }) {
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
    if (!ts) return "";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  };
  const snapA = snapshots?.A, snapB = snapshots?.B;
  const compareReady = snapA && snapB;

  return (
    <header className="topbar">
      <div className="topbar-l">
        <button className={"iconbtn" + (libOpen ? " on" : "")} title={tr("toggleLibrary")} onClick={onToggleLib}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="6" height="16" rx="1.3" /><rect x="11" y="4" width="10" height="16" rx="1.3" opacity="0.4" /></svg>
        </button>
        <div className="brand">
          <span className="brand-name">bionet<span className="brand-dim">-studio</span></span>
          <span className="brand-tag">{tr("brandTag")}</span>
        </div>
        <span className="topbar-div"></span>

        {/* project / examples */}
        <div className="project" onMouseLeave={() => setOpen(false)}>
          <button className="project-btn" onClick={() => setOpen((o) => !o)}>
            <Icon name="examples" size={15} />
            <span className="project-tx">
              <span className="project-name">{project.meta.name}</span>
              <span className="project-sub">{project.meta.domain}</span>
            </span>
            <span className={"badge " + (isUser ? "b-user" : "b-example")}>{isUser ? tr("user") : tr("example")}</span>
            {dirty && <span className="unsaved" title={tr("unsaved")}></span>}
            <Icon name="chevronDown" size={13} />
          </button>
          {open && (
            <div className="project-menu">
              <div className="project-menu-h eyebrow">{tr("examplesTemplates")}</div>
              {examples.map((p) => (
                <button key={p.id} className={"project-item" + (p.id === project.meta.id && !isUser ? " on" : "")}
                  onClick={() => { onPickExample(p.id); setOpen(false); }}>
                  <div className="project-item-tx">
                    <div className="project-item-name">{p.name}</div>
                    <div className="project-item-note">{p.note}</div>
                  </div>
                  <span className="badge b-example">{p.domain}</span>
                </button>
              ))}
              <div className="project-menu-sep"></div>
              <button className="project-item ghost" onClick={() => { onNewProject(); setOpen(false); }}>
                <div className="project-item-tx"><div className="project-item-name"><Icon name="add" size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />{tr("blankProject")}</div>
                  <div className="project-item-note">{tr("blankProjectNote")}</div></div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-r">
        <span className="live-pill"><span className="live-dot"></span>{tr("live")}</span>
        {verdict && (
          <span className="verdict-chip" style={{ "--vc": verdict.color }}>
            <span className="dot" style={{ background: verdict.color }}></span>
            <span className="verdict-chip-rule">{verdict.rule}</span>
            <span className="verdict-chip-state" style={{ color: verdict.color }}>{verdict.label}</span>
          </span>
        )}
        <span className="topbar-div"></span>
        <div className="abgroup" title={tr("compareTitle")}>
          <span className="abgroup-label eyebrow">A / B</span>
          {["A", "B"].map((slot) => {
            const sn = snapshots?.[slot];
            return (
              <div key={slot} className="ab-slot-wrap" onMouseLeave={() => setSlotMenu((m) => (m === slot ? null : m))}>
                <button className={"ab-slot" + (sn ? " filled" : "")}
                  title={tr(slot === "A" ? "snapshotAFull" : "snapshotBFull")}
                  onClick={() => sn ? setSlotMenu((m) => (m === slot ? null : slot)) : onSaveSnapshot(slot)}>
                  <span className="ab-slot-key">{slot}</span>
                  {sn ? <span className="ab-slot-ts mono">{formatTs(sn.ts)}</span>
                      : <span className="ab-slot-add">{tr("snapshotSave")}</span>}
                </button>
                {sn && slotMenu === slot && (
                  <div className="ab-slot-menu">
                    <button className="ab-slot-menu-i" onClick={() => { onSaveSnapshot(slot); setSlotMenu(null); }}>
                      <Icon name="reset" size={12} /> {tr("overwriteSlot")}</button>
                    <button className="ab-slot-menu-i danger" onClick={() => { onClearSnapshot(slot); setSlotMenu(null); }}>
                      <Icon name="trash" size={12} /> {tr("cleared")}</button>
                  </div>
                )}
              </div>
            );
          })}
          <button className={"btn ab-compare" + (compareReady ? " ready" : " disabled")}
            onClick={() => compareReady ? onCompare() : (!snapA ? onSaveSnapshot("A") : onSaveSnapshot("B"))}
            title={compareReady ? tr("compareTitle") : tr("compareSaveHint")}>
            <Icon name="runs" size={14} /> {compareReady ? tr("compare") : (!snapA ? tr("snapshotA") : tr("snapshotB"))}
          </button>
        </div>
        <span className="topbar-div"></span>
        <div className="undogroup">
          <button className="iconbtn" disabled={!canUndo} title={tr("undo") + " (Ctrl+Z)"} onClick={onUndo}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-4" /></svg>
          </button>
          <button className="iconbtn" disabled={!canRedo} title={tr("redo") + " (Ctrl+Shift+Z)"} onClick={onRedo}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 14l5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h4" /></svg>
          </button>
        </div>
        <div className="filegroup">
          <button className="btn ghost" onClick={onImport} title={tr("importProject")}><Icon name="importf" size={15} />{tr("import")}</button>
          <span className="fg-sep"></span>
          <button className="btn ghost" onClick={onExport} title={tr("exportProject")}><Icon name="exportf" size={15} />{tr("export")}</button>
        </div>
        <button className="btn ghost lang-btn" onClick={onLang} title={lang === "zh" ? tr("switchToEnglish") : tr("switchToChinese")}>{tr("langToggle")}</button>
        <button className={"btn primary" + (runFlash ? " flash" : "")} onClick={runOnce}><Icon name="run" size={13} />{tr("runSimulation")}</button>
        <button className={"iconbtn" + (inspOpen ? " on" : "")} title={tr("toggleInspector")} onClick={onToggleInsp}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="10" height="16" rx="1.3" opacity="0.4" /><rect x="15" y="4" width="6" height="16" rx="1.3" /></svg>
        </button>
      </div>
    </header>
  );
}

Object.assign(window, { LeftRail, TopBar });
