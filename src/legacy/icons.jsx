/* ===================================================================
   bionet-studio — icons.jsx  (shared line-icon system)
   <Icon name="..." size sw /> ; window.Icon, window.KIND_ICON
   Icons are data: array of [tag, attrs]. Default stroke = currentColor.
   =================================================================== */
const React = window.React;

const ICONS = {
  // --- navigation ---
  workbench: [["rect",{x:3,y:4,width:7,height:6,rx:1.3}],["rect",{x:14,y:4,width:7,height:6,rx:1.3}],["rect",{x:8.5,y:14,width:7,height:6,rx:1.3}],["path",{d:"M10 7h4M12 10v4"}]],
  library: [["rect",{x:4,y:3,width:16,height:18,rx:2}],["path",{d:"M8 7h8M8 11h8M8 15h5"}]],
  runs: [["path",{d:"M3 12a9 9 0 1 0 2-5.7"}],["path",{d:"M3 4v3h3M12 8v4l3 2"}]],
  reverse: [["path",{d:"M4 12h11M9 7l-5 5 5 5"}],["circle",{cx:19,cy:12,r:2}]],
  settings: [["circle",{cx:12,cy:12,r:3}],["path",{d:"M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"}]],
  // --- theme ---
  moon: [["path",{d:"M20 14a8 8 0 1 1-9-11 6.5 6.5 0 0 0 9 11z"}]],
  sun: [["circle",{cx:12,cy:12,r:4}],["path",{d:"M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"}]],
  // --- node kinds ---
  sensor: [["path",{d:"M3 12h8"}],["path",{d:"M8 8l4 4-4 4"}],["circle",{cx:18,cy:12,r:3}]],
  signal: [["path",{d:"M4 9h16M4 15h16"}],["circle",{cx:9,cy:9,r:2.1}],["circle",{cx:15,cy:15,r:2.1}]],
  response: [["circle",{cx:12,cy:12,r:2.6}],["path",{d:"M12 4v4.5M6.5 18.5L9.6 14M17.5 18.5L14.4 14"}],["circle",{cx:12,cy:4,r:1.4}],["circle",{cx:6,cy:19,r:1.4}],["circle",{cx:18,cy:19,r:1.4}]],
  reporter: [["circle",{cx:6,cy:12,r:3}],["path",{d:"M11 12h8M15 8l4 4-4 4"}]],
  memory: [["rect",{x:5,y:11,width:14,height:9,rx:2}],["path",{d:"M8 11V8a4 4 0 0 1 8 0v3"}]],
  // --- edges ---
  activate: [["path",{d:"M4 12h12"}],["path",{d:"M12 7l5 5-5 5"}]],
  inhibit: [["path",{d:"M4 12h12"}],["path",{d:"M17 7v10"}]],
  // --- readouts ---
  readoutSeries: [["path",{d:"M3 20h18"}],["path",{d:"M4 16l4-5 3 3 5-8"}]],
  readoutChannels: [["path",{d:"M3 14l4-3 4 2 4-5 5 3"}],["path",{d:"M3 19l4-2 4 1 4-3 5 2",opacity:.5}]],
  readoutDecision: [["path",{d:"M12 3l4.5 4.5L12 12 7.5 7.5z"}],["path",{d:"M12 12v5M7 21h10"}]],
  readoutHeatmap: [["rect",{x:4,y:4,width:7,height:7,rx:1}],["rect",{x:13,y:4,width:7,height:7,rx:1}],["rect",{x:4,y:13,width:7,height:7,rx:1}],["rect",{x:13,y:13,width:7,height:7,rx:1}]],
  readoutDose: [["path",{d:"M4 4v16h16"}],["path",{d:"M4 17c4.5 0 4-9 9-9s3.5 4 7 4"}]],
  readoutTruth: [["rect",{x:4,y:5,width:16,height:14,rx:1.5}],["path",{d:"M4 10h16M12 5v14"}]],
  // --- actions ---
  run: [["path",{d:"M7 5l12 7-12 7z",fill:true}]],
  reset: [["path",{d:"M3 12a9 9 0 1 0 3-6.7L3 8"}],["path",{d:"M3 3v5h5"}]],
  importf: [["path",{d:"M12 3v12M7 10l5 5 5-5M5 21h14"}]],
  exportf: [["path",{d:"M12 21V9M7 14l5-5 5 5M5 3h14"}]],
  add: [["path",{d:"M12 5v14M5 12h14"}]],
  minus: [["path",{d:"M5 12h14"}]],
  close: [["path",{d:"M6 6l12 12M18 6L6 18"}]],
  check: [["path",{d:"M5 12l5 5L20 7"}]],
  chevronDown: [["path",{d:"M6 9l6 6 6-6"}]],
  chevronUp: [["path",{d:"M6 15l6-6 6 6"}]],
  chevronLeft: [["path",{d:"M15 6l-6 6 6 6"}]],
  chevronRight: [["path",{d:"M9 6l6 6-6 6"}]],
  fit: [["path",{d:"M3 8V4h4M21 8V4h-4M3 16v4h4M21 16v4h-4"}]],
  search: [["circle",{cx:11,cy:11,r:7}],["path",{d:"M21 21l-4-4"}]],
  info: [["circle",{cx:12,cy:12,r:9}],["path",{d:"M12 11v5M12 8h.01"}]],
  lock: [["rect",{x:5,y:11,width:14,height:9,rx:2}],["path",{d:"M8 11V8a4 4 0 0 1 8 0v3"}]],
  trash: [["path",{d:"M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"}]],
  copy: [["rect",{x:9,y:9,width:11,height:11,rx:2}],["path",{d:"M5 15V5a2 2 0 0 1 2-2h8"}]],
  pin: [["path",{d:"M9 3h6v2l-1 4 3 2v2H7v-2l3-2-1-4V3z"}],["path",{d:"M12 15v6"}]],
  // --- tools ---
  select: [["path",{d:"M5 3l6.5 16 2.2-6.3L20 10.5z"}]],
  connect: [["path",{d:"M9.5 14.5l5-5"}],["path",{d:"M7 12l-1.5 1.5a3 3 0 0 0 4.2 4.2L11 16"}],["path",{d:"M17 8l-1.5 1.5"}],["path",{d:"M13 11l4-4a3 3 0 0 0-4.2-4.2L11 4.5"}]],
  pan: [["path",{d:"M12 3v18M3 12h18"}],["path",{d:"M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"}]],
  // --- misc ---
  layers: [["path",{d:"M12 3l9 5-9 5-9-5z"}],["path",{d:"M3 12l9 5 9-5M3 16l9 5 9-5"}]],
  examples: [["path",{d:"M12 3l9 5-9 5-9-5z"}],["path",{d:"M3 12.5l9 5 9-5"}]],
  channel: [["path",{d:"M3 12h3l2-6 4 12 2-6h7"}]],
  inspector: [["path",{d:"M4 7h8M18 7h2M4 17h4M14 17h6"}],["circle",{cx:15,cy:7,r:2.1}],["circle",{cx:11,cy:17,r:2.1}]],
  logo: [["circle",{cx:5,cy:6,r:2.2}],["circle",{cx:5,cy:18,r:2.2}],["circle",{cx:19,cy:12,r:2.2}],["path",{d:"M7 6.8l10 4M7 17.2l10-4"}]],
  dot: [["circle",{cx:12,cy:12,r:4,fill:true}]],
};

function Icon({ name, size = 16, sw = 1.6, className, style }) {
  const data = ICONS[name];
  if (!data) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" className={className} style={style}
      aria-hidden="true">
      {data.map(([tag, attrs], i) => {
        const { fill, ...rest } = attrs;
        return React.createElement(tag, { key: i, ...rest, fill: fill ? "currentColor" : "none" });
      })}
    </svg>
  );
}

const KIND_ICON = { sensor: "sensor", signal: "signal", response: "response", reporter: "reporter", memory: "memory" };

Object.assign(window, { Icon, KIND_ICON });
