/* ===================================================================
   bionet-studio — chrome.jsx  (left rail + top command bar)
   Exports: LeftRail, TopBar
   =================================================================== */

const RAIL_ITEMS = [
  { id: "workbench", label: "Workbench", icon: "workbench" },
  { id: "library",   label: "Element library", icon: "library" },
  { id: "runs",      label: "Run history", icon: "runs" },
  { id: "reverse",   label: "Reverse design", icon: "reverse", soon: true },
];

function LeftRail({ page, onNav, theme, onTheme }) {
  return (
    <nav className="rail">
      <div className="rail-logo" title="bionet-studio"><Icon name="logo" size={19} sw={1.7} /></div>
      <div className="rail-items">
        {RAIL_ITEMS.map((it) => (
          <button key={it.id} className={"rail-btn" + (page === it.id ? " on" : "")} onClick={() => onNav(it.id)} title={it.label}>
            <Icon name={it.icon} size={20} />
            {it.soon && <span className="rail-soon"></span>}
          </button>
        ))}
      </div>
      <div className="rail-foot">
        <button className="rail-btn" title={theme === "dark" ? "Light theme" : "Dark theme"} onClick={onTheme}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
        </button>
        <button className="rail-btn" title="Settings"><Icon name="settings" size={19} /></button>
      </div>
    </nav>
  );
}

function TopBar({ project, verdict, examples, dirty, onPickExample, onNewProject,
                  onImport, onExport, onRun, libOpen, inspOpen, onToggleLib, onToggleInsp }) {
  const [open, setOpen] = React.useState(false);
  const isUser = project.meta.kind === "user";

  return (
    <header className="topbar">
      <div className="topbar-l">
        <button className={"iconbtn" + (libOpen ? " on" : "")} title="Toggle library" onClick={onToggleLib}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="6" height="16" rx="1.3" /><rect x="11" y="4" width="10" height="16" rx="1.3" opacity="0.4" /></svg>
        </button>
        <div className="brand">
          <span className="brand-name">bionet<span className="brand-dim">-studio</span></span>
          <span className="brand-tag">network workbench</span>
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
            <span className={"badge " + (isUser ? "b-user" : "b-example")}>{isUser ? "user" : "example"}</span>
            {dirty && <span className="unsaved" title="Unsaved changes"></span>}
            <Icon name="chevronDown" size={13} />
          </button>
          {open && (
            <div className="project-menu">
              <div className="project-menu-h eyebrow">Examples &amp; templates</div>
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
                <div className="project-item-tx"><div className="project-item-name"><Icon name="add" size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />Blank project</div>
                  <div className="project-item-note">Start from the default backbone</div></div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-r">
        <span className="live-pill"><span className="live-dot"></span>live</span>
        {verdict && (
          <span className="verdict-chip" style={{ "--vc": verdict.color }}>
            <span className="dot" style={{ background: verdict.color }}></span>
            <span className="verdict-chip-rule">{verdict.rule}</span>
            <span className="verdict-chip-state" style={{ color: verdict.color }}>{verdict.label}</span>
          </span>
        )}
        <span className="topbar-div"></span>
        <div className="filegroup">
          <button className="btn ghost" onClick={onImport} title="Import project (JSON)"><Icon name="importf" size={15} />Import</button>
          <span className="fg-sep"></span>
          <button className="btn ghost" onClick={onExport} title="Export project (JSON)"><Icon name="exportf" size={15} />Export</button>
        </div>
        <button className="btn primary" onClick={onRun}><Icon name="run" size={13} />Run simulation</button>
        <button className={"iconbtn" + (inspOpen ? " on" : "")} title="Toggle inspector" onClick={onToggleInsp}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="10" height="16" rx="1.3" opacity="0.4" /><rect x="15" y="4" width="6" height="16" rx="1.3" /></svg>
        </button>
      </div>
    </header>
  );
}

Object.assign(window, { LeftRail, TopBar });
