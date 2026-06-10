/* ===================================================================
   bionet-studio — canvas.jsx  (CAD node-network editor)
   Pin ports · node metadata · quick actions · drag-to-connect
   Exports: NetworkCanvas
   =================================================================== */
const NODE_W = 178, NODE_H = 70;
const WORLD_W = 1040, WORLD_H = 480;
const SNAP = 24; // px (world) hit radius for connect targets
const KIND_RANK = { sensor: 0, signal: 1, response: 2, memory: 3, reporter: 4 };

const LAYER_BANDS = [
  { x: 38,  w: 224, labelKey: "layerInputs",     key: "sensor" },
  { x: 292, w: 200, labelKey: "layerRegulators", key: "signal" },
  { x: 522, w: 216, labelKey: "layerResponse",   key: "response" },
  { x: 788, w: 200, labelKey: "layerOutputs",    key: "reporter" },
];

function portOut(nd) { return { x: nd.x + NODE_W, y: nd.y + NODE_H / 2 }; }
function portIn(nd)  { return { x: nd.x,          y: nd.y + NODE_H / 2 }; }
function edgePath(a, b) {
  const dx = Math.max(38, (b.x - a.x) * 0.5);
  return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
}
const fmt = (v) => (v == null ? "—" : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)));

function NodeCard({ nd, act, selected, dim, connecting, isSource, isTarget, canTarget,
                   onSelect, onDragStart, onPortDown, onDelete, onDuplicate }) {
  const tr = (key) => window.I18n?.t(key) || key;
  const meta = window.Model.KIND_META[nd.kind];
  const tint = window.Model.nodeTint(nd);
  const heat = act ?? 0;
  const hasIn = nd.kind !== "sensor";
  const hasOut = nd.kind !== "reporter";
  const mainVal = meta.main ? nd[meta.main.key] : null;
  return (
    <div
      className={"node" + (selected ? " sel" : "") + (dim ? " dim" : "") + (isSource ? " src" : "") + (isTarget ? " tgt" : "")}
      style={{ left: nd.x, top: nd.y, width: NODE_W, height: NODE_H, "--tint": tint }}
      onPointerDown={(e) => { e.stopPropagation(); onDragStart(e, nd.id); }}
      onClick={(e) => { e.stopPropagation(); onSelect({ type: "node", id: nd.id }); }}
    >
      <span className="node-stripe"></span>
      <div className="node-body">
        <div className="node-head">
          <span className="node-glyph"><Icon name={window.KIND_ICON[nd.kind]} size={14} sw={1.8} /></span>
          <span className="node-label">{nd.label}</span>
          <span className="node-cal" title={tr("illustrative")}></span>
        </div>
        <div className="node-meta">
          <span className="node-role">{meta.role}</span>
          {meta.main && <span className="num node-param">{meta.main.label} {fmt(mainVal)}</span>}
        </div>
        <div className="node-act">
          <div className="node-act-track"><div className="node-act-fill" style={{ width: (heat * 100).toFixed(0) + "%" }}></div></div>
          <span className="num node-act-val">{heat.toFixed(2)}</span>
        </div>
      </div>
      {hasIn && <span className={"port port-in" + (connecting && canTarget ? " avail" : "") + (isTarget ? " hot" : "")}></span>}
      {hasOut && <span className="port port-out"
        onPointerDown={(e) => { e.stopPropagation(); onPortDown(e, nd.id); }}
        title={tr("dragConnect")}></span>}
      {selected && (
        <div className="node-actions" onPointerDown={(e) => e.stopPropagation()}>
          <button className="node-act-btn" title={tr("duplicate")} onClick={(e) => { e.stopPropagation(); onDuplicate(nd.id); }}><Icon name="copy" size={13} /></button>
          <button className="node-act-btn danger" title={tr("delete")} onClick={(e) => { e.stopPropagation(); onDelete(nd.id); }}><Icon name="trash" size={13} /></button>
        </div>
      )}
    </div>
  );
}

function NetworkCanvas({ model, sim, selection, onSelect, onNodeMove, onAddEdge, onDeleteNode, onDuplicateNode, view, setView }) {
  const wrapRef = React.useRef(null);
  const drag = React.useRef(null);
  const [connect, setConnect] = React.useState(null); // { fromId, wx, wy, targetId }
  const tr = (key) => window.I18n?.t(key) || key;

  const nodeById = React.useMemo(() => {
    const m = {}; model.nodes.forEach((n) => (m[n.id] = n)); return m;
  }, [model.nodes]);

  const toWorld = (clientX, clientY) => {
    const r = wrapRef.current.getBoundingClientRect();
    return { x: (clientX - r.left - view.x) / view.z, y: (clientY - r.top - view.y) / view.z };
  };

  // candidate targets for an in-progress connection
  const canConnect = (fromId, toId) => {
    if (!fromId || fromId === toId) return false;
    const from = nodeById[fromId];
    const to = nodeById[toId];
    if (!from || !to || from.kind === "reporter" || to.kind === "sensor") return false;
    if ((KIND_RANK[from.kind] ?? 0) >= (KIND_RANK[to.kind] ?? 0)) return false;
    return !model.edges.some((e) => e.from === fromId && e.to === toId);
  };

  // ---- pan / zoom ----
  function onWheel(e) {
    e.preventDefault();
    const r = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const z2 = Math.max(0.45, Math.min(2.2, view.z * (e.deltaY < 0 ? 1.08 : 0.926)));
    const k = z2 / view.z;
    setView({ z: z2, x: mx - (mx - view.x) * k, y: my - (my - view.y) * k });
  }
  function onBgDown(e) {
    drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onNodeDown(e, id) {
    const nd = nodeById[id];
    drag.current = { mode: "node", id, sx: e.clientX, sy: e.clientY, ox: nd.x, oy: nd.y };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onPortDown(e, id) {
    const w = toWorld(e.clientX, e.clientY);
    drag.current = { mode: "connect", fromId: id };
    setConnect({ fromId: id, wx: w.x, wy: w.y, targetId: null });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onMove(e) {
    const d = drag.current; if (!d) return;
    if (d.mode === "pan") {
      setView({ ...view, x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
    } else if (d.mode === "node") {
      const dx = (e.clientX - d.sx) / view.z, dy = (e.clientY - d.sy) / view.z;
      onNodeMove(d.id, Math.round(d.ox + dx), Math.round(d.oy + dy));
    } else if (d.mode === "connect") {
      const w = toWorld(e.clientX, e.clientY);
      // nearest valid input port
      let target = null, best = SNAP;
      model.nodes.forEach((n) => {
        if (!canConnect(d.fromId, n.id)) return;
        const p = portIn(n);
        const dist = Math.hypot(p.x - w.x, p.y - w.y);
        if (dist < best) { best = dist; target = n.id; }
      });
      setConnect({ fromId: d.fromId, wx: w.x, wy: w.y, targetId: target });
    }
  }
  function onUp() {
    const d = drag.current;
    if (d && d.mode === "connect") {
      setConnect((c) => {
        if (c && c.targetId) onAddEdge(c.fromId, c.targetId);
        return null;
      });
    }
    drag.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  function fit() {
    const r = wrapRef.current.getBoundingClientRect();
    const z = Math.min((r.width - 56) / WORLD_W, (r.height - 56) / WORLD_H, 1.4);
    setView({ z, x: (r.width - WORLD_W * z) / 2, y: (r.height - WORLD_H * z) / 2 });
  }
  React.useEffect(() => { fit(); /* eslint-disable-next-line */ }, []);

  const selNode = selection?.type === "node" ? selection.id : null;
  const selEdge = selection?.type === "edge" ? selection.id : null;
  const connected = React.useMemo(() => {
    if (!selNode) return null;
    const s = new Set([selNode]);
    model.edges.forEach((e) => { if (e.from === selNode) s.add(e.to); if (e.to === selNode) s.add(e.from); });
    return s;
  }, [selNode, model.edges]);

  const fromNode = connect ? nodeById[connect.fromId] : null;
  const previewEnd = connect && connect.targetId ? portIn(nodeById[connect.targetId]) : (connect ? { x: connect.wx, y: connect.wy } : null);

  return (
    <div className={"canvas" + (connect ? " connecting" : "")} ref={wrapRef} onWheel={onWheel} onPointerDown={onBgDown}
         onClick={() => onSelect(null)}>
      <div className="canvas-world" style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.z})` }}>
        <svg className="edges" width={WORLD_W} height={WORLD_H}>
          {LAYER_BANDS.map((b) => (
            <g key={b.key}>
              <rect x={b.x} y={20} width={b.w} height={WORLD_H - 40} rx="10" className="layer-band" />
              <text x={b.x + b.w / 2} y={38} textAnchor="middle" className="layer-label">{tr(b.labelKey)}</text>
            </g>
          ))}
          <defs>
            <marker id="arw" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M1,1 L8,4.5 L1,8 Z" fill="var(--accent)" /></marker>
            <marker id="arw-dim" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M1,1 L8,4.5 L1,8 Z" fill="var(--border-strong)" /></marker>
          </defs>
          {model.edges.map((e) => {
            const a = nodeById[e.from], b = nodeById[e.to];
            if (!a || !b) return null;
            const p = edgePath(portOut(a), portIn(b));
            const inhib = e.sign < 0;
            const isSel = selEdge === e.id;
            const dim = (selNode && !(e.from === selNode || e.to === selNode)) || (connect != null);
            const stroke = isSel ? "var(--accent-strong)" : dim ? "var(--border)" : inhib ? "var(--c-inhibit)" : "var(--accent)";
            const wpx = 0.9 + Math.min(2.4, Math.abs(e.w)) * 0.9;
            const mid = { x: (portOut(a).x + portIn(b).x) / 2, y: (portOut(a).y + portIn(b).y) / 2 };
            return (
              <g key={e.id} className="edge" onClick={(ev) => { ev.stopPropagation(); onSelect({ type: "edge", id: e.id }); }}>
                <path d={p} fill="none" stroke="transparent" strokeWidth="12" style={{ cursor: "pointer" }} />
                <path d={p} fill="none" stroke={stroke} strokeWidth={isSel ? wpx + 0.8 : wpx}
                      strokeDasharray={inhib ? "5 3" : "0"} opacity={dim ? 0.5 : 1}
                      markerEnd={inhib ? "" : (dim ? "url(#arw-dim)" : "url(#arw)")} />
                {inhib && (() => { const ip = portIn(b); return <line x1={ip.x - 2} y1={ip.y - 6} x2={ip.x - 2} y2={ip.y + 6} stroke={dim ? "var(--border-strong)" : "var(--c-inhibit)"} strokeWidth="2.4" />; })()}
                {e.label && !dim && <text x={mid.x} y={mid.y - 5} textAnchor="middle" className="edge-label">{e.label}</text>}
              </g>
            );
          })}
          {/* connection preview */}
          {connect && fromNode && (
            <path d={edgePath(portOut(fromNode), previewEnd)} fill="none"
              stroke={connect.targetId ? "var(--accent)" : "var(--text-3)"} strokeWidth="2"
              strokeDasharray="6 4" className="edge-preview" />
          )}
        </svg>
        {model.nodes.map((nd) => (
          <NodeCard key={nd.id} nd={nd} act={sim?.steady?.[nd.id]}
            selected={selNode === nd.id}
            dim={connected ? !connected.has(nd.id) : false}
            connecting={connect != null}
            isSource={connect?.fromId === nd.id}
            isTarget={connect?.targetId === nd.id}
            canTarget={connect ? canConnect(connect.fromId, nd.id) : false}
            onSelect={onSelect} onDragStart={onNodeDown} onPortDown={onPortDown}
            onDelete={onDeleteNode} onDuplicate={onDuplicateNode} />
        ))}
      </div>

      <div className="canvas-tools">
        <button className="iconbtn" title={tr("zoomOut")} onClick={() => setView({ ...view, z: Math.max(0.45, view.z * 0.9) })}><Icon name="minus" size={15} /></button>
        <span className="num canvas-zoom">{Math.round(view.z * 100)}%</span>
        <button className="iconbtn" title={tr("zoomIn")} onClick={() => setView({ ...view, z: Math.min(2.2, view.z * 1.1) })}><Icon name="add" size={15} /></button>
        <span className="canvas-tools-sep"></span>
        <button className="iconbtn" title={tr("fitView")} onClick={fit}><Icon name="fit" size={15} /></button>
      </div>

      <div className="canvas-legend">
        <span className="lg"><span className="lg-line" style={{ background: "var(--accent)" }}></span>{tr("activate")}</span>
        <span className="lg"><span className="lg-line dash" style={{ background: "var(--c-inhibit)" }}></span>{tr("inhibit")}</span>
        <span className="lg lg-note">{tr("dragForward")}</span>
      </div>
    </div>
  );
}

Object.assign(window, { NetworkCanvas });
