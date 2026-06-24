/* ===================================================================
   bionet-studio — canvas.jsx  (CAD node-network editor)
   Pin ports · node metadata · quick actions · drag-to-connect
   Exports: NetworkCanvas
   =================================================================== */
const React = window.React;
const { Icon } = window;

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

// clamp a node position into the world box (with a small margin)
function clampNodePos(x, y) {
  const PAD = 8;
  return {
    x: Math.max(PAD, Math.min(WORLD_W - NODE_W - PAD, x)),
    y: Math.max(PAD, Math.min(WORLD_H - NODE_H - PAD, y)),
  };
}

// expose a placement helper so app.jsx can drop new nodes onto the right band
function pickLayerSlot(kind, existingNodes) {
  const band = LAYER_BANDS.find((b) => b.key === kind) || LAYER_BANDS.find((b) => b.key === "response");
  const cx = band.x + (band.w - NODE_W) / 2;
  const ys = existingNodes.filter((n) => n.kind === kind).map((n) => n.y).sort((a, b) => a - b);
  // try empty slots at y = 60, 140, 220, 300, 380
  const slots = [60, 140, 220, 300, 380];
  for (const y of slots) {
    if (!ys.some((py) => Math.abs(py - y) < 50)) return clampNodePos(cx, y);
  }
  return clampNodePos(cx, 60 + (ys.length * 18) % (WORLD_H - 120));
}
Object.assign(window, { _canvasLayout: { clampNodePos, pickLayerSlot, NODE_W, NODE_H, WORLD_W, WORLD_H } });

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
  // flip the quick-action toolbar to the left edge if the node sits near the right wall
  const actionsRight = nd.x > WORLD_W - NODE_W - 80;
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
      {hasIn && <span className={"port port-in" + (connecting && canTarget ? " avail" : "") + (isTarget ? " hot" : "")}
        onPointerDown={(e) => { e.stopPropagation(); onPortDown(e, nd.id, "in"); }}
        title={tr("dragConnect")}></span>}
      {hasOut && <span className="port port-out"
        onPointerDown={(e) => { e.stopPropagation(); onPortDown(e, nd.id, "out"); }}
        title={tr("dragConnect")}></span>}
      {selected && (
        <div className={"node-actions" + (actionsRight ? " left" : "")} onPointerDown={(e) => e.stopPropagation()}>
          <button className="node-act-btn" title={tr("duplicate") + " (Ctrl+D)"} onClick={(e) => { e.stopPropagation(); onDuplicate(nd.id); }}><Icon name="copy" size={13} /></button>
          <button className="node-act-btn danger" title={tr("delete") + " (Del)"} onClick={(e) => { e.stopPropagation(); onDelete(nd.id); }}><Icon name="trash" size={13} /></button>
        </div>
      )}
    </div>
  );
}

function NetworkCanvas({ model, sim, selection, onSelect, onNodeMove, onAddEdge, onDeleteNode, onDuplicateNode, view, setView }) {
  const wrapRef = React.useRef(null);
  const drag = React.useRef(null);
  const [connect, setConnect] = React.useState(null); // { fromId, dir, wx, wy, targetId, allowSameLayer }
  const tr = (key) => window.I18n?.t(key) || key;

  const nodeById = React.useMemo(() => {
    const m = {}; model.nodes.forEach((n) => (m[n.id] = n)); return m;
  }, [model.nodes]);

  const toWorld = (clientX, clientY) => {
    const r = wrapRef.current.getBoundingClientRect();
    return { x: (clientX - r.left - view.x) / view.z, y: (clientY - r.top - view.y) / view.z };
  };

  // candidate targets for an in-progress connection
  const canConnect = (fromId, toId, allowSameLayer) => {
    if (!fromId || fromId === toId) return false;
    const from = nodeById[fromId];
    const to = nodeById[toId];
    if (!from || !to || from.kind === "reporter" || to.kind === "sensor") return false;
    const rf = KIND_RANK[from.kind] ?? 0;
    const rt = KIND_RANK[to.kind] ?? 0;
    if (allowSameLayer ? rf > rt : rf >= rt) return false;
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
    drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onNodeDown(e, id) {
    const nd = nodeById[id];
    drag.current = { mode: "node", id, sx: e.clientX, sy: e.clientY, ox: nd.x, oy: nd.y };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onPortDown(e, id, dir) {
    const w = toWorld(e.clientX, e.clientY);
    const direction = dir || "out";
    drag.current = { mode: "connect", fromId: id, dir: direction };
    setConnect({ fromId: id, dir: direction, wx: w.x, wy: w.y, targetId: null, allowSameLayer: !!e.altKey });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onMove(e) {
    const d = drag.current; if (!d) return;
    if (d.mode === "pan") {
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (!d.moved && Math.hypot(dx, dy) < 3) return;
      d.moved = true;
      setView({ ...view, x: d.ox + dx, y: d.oy + dy });
    } else if (d.mode === "node") {
      const dx = (e.clientX - d.sx) / view.z, dy = (e.clientY - d.sy) / view.z;
      const p = clampNodePos(Math.round(d.ox + dx), Math.round(d.oy + dy));
      onNodeMove(d.id, p.x, p.y);
    } else if (d.mode === "connect") {
      const w = toWorld(e.clientX, e.clientY);
      const allowSameLayer = !!e.altKey;
      // nearest valid port: for an out-drag we look for inputs; for an in-drag we look for outputs.
      let target = null, best = SNAP;
      model.nodes.forEach((n) => {
        const ok = d.dir === "in"
          ? canConnect(n.id, d.fromId, allowSameLayer)
          : canConnect(d.fromId, n.id, allowSameLayer);
        if (!ok) return;
        const p = d.dir === "in" ? portOut(n) : portIn(n);
        const dist = Math.hypot(p.x - w.x, p.y - w.y);
        if (dist < best) { best = dist; target = n.id; }
      });
      setConnect({ fromId: d.fromId, dir: d.dir, wx: w.x, wy: w.y, targetId: target, allowSameLayer });
    }
  }
  function onUp() {
    const d = drag.current;
    if (d && d.mode === "connect") {
      setConnect((c) => {
        if (c && c.targetId) {
          if (c.dir === "in") onAddEdge(c.targetId, c.fromId);
          else onAddEdge(c.fromId, c.targetId);
        }
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
  // For an "out" drag the preview goes fromNode.out -> cursor (or target.in).
  // For an "in" drag the preview goes target.out (or cursor) -> fromNode.in.
  let previewA = null, previewB = null;
  if (connect && fromNode) {
    if (connect.dir === "in") {
      previewA = connect.targetId ? portOut(nodeById[connect.targetId]) : { x: connect.wx, y: connect.wy };
      previewB = portIn(fromNode);
    } else {
      previewA = portOut(fromNode);
      previewB = connect.targetId ? portIn(nodeById[connect.targetId]) : { x: connect.wx, y: connect.wy };
    }
  }

  return (
    <div className={"canvas" + (connect ? " connecting" : "")} ref={wrapRef} onWheel={onWheel} onPointerDown={onBgDown}
         onClick={(e) => { if (!drag.current?.moved) onSelect(null); }}>
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
                {isSel && <path d={p} fill="none" stroke="var(--accent)" strokeWidth={wpx + 6} opacity="0.18" />}
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
            <path d={edgePath(previewA, previewB)} fill="none"
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
            canTarget={connect
              ? (connect.dir === "in"
                  ? canConnect(nd.id, connect.fromId, connect.allowSameLayer)
                  : canConnect(connect.fromId, nd.id, connect.allowSameLayer))
              : false}
            onSelect={onSelect} onDragStart={onNodeDown} onPortDown={onPortDown}
            onDelete={onDeleteNode} onDuplicate={onDuplicateNode} />
        ))}
      </div>

      <div className="canvas-tools">
        <button className="iconbtn" title={tr("zoomOut") + " (-)"} onClick={() => setView({ ...view, z: Math.max(0.45, view.z * 0.9) })}><Icon name="minus" size={15} /></button>
        <button className="num canvas-zoom" title="1:1" onClick={() => {
          const r = wrapRef.current.getBoundingClientRect();
          setView({ z: 1, x: (r.width - WORLD_W) / 2, y: (r.height - WORLD_H) / 2 });
        }}>{Math.round(view.z * 100)}%</button>
        <button className="iconbtn" title={tr("zoomIn") + " (+)"} onClick={() => setView({ ...view, z: Math.min(2.2, view.z * 1.1) })}><Icon name="add" size={15} /></button>
        <span className="canvas-tools-sep"></span>
        <button className="iconbtn" title={tr("fitView") + " (F)"} onClick={fit}><Icon name="fit" size={15} /></button>
      </div>

      <div className="canvas-legend">
        <span className="lg"><span className="lg-line" style={{ background: "var(--accent)" }}></span>{tr("activate")}</span>
        <span className="lg"><span className="lg-line dash" style={{ background: "var(--c-inhibit)" }}></span>{tr("inhibit")}</span>
        <span className="lg lg-note">{tr("dragForward")} · Alt {tr("sameLayerHint")}</span>
      </div>
    </div>
  );
}

Object.assign(window, { NetworkCanvas });
