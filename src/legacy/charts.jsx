/* ===================================================================
   bionet-studio — charts.jsx  (SVG instrument-style line plots)
   Exports to window: LineChart
   =================================================================== */
const React = window.React;

const { useRef: _useRef, useState: _useState, useMemo: _useMemo } = React;

function _niceTicks(max, count) {
  const out = [];
  for (let i = 0; i <= count; i++) out.push((max * i) / count);
  return out;
}

/* series: [{ id, color, data:[y...], label, dash? }]
   x runs 0..tMax over data.length points.
   bands: [{ from, to, color }] horizontal regions in y-units (0..1)
   thresholds: [{ y, color, label }] horizontal lines              */
function LineChart({
  series, tMax, yMax = 1, height = 150,
  bands = [], thresholds = [], yUnit = "", xUnit = "h",
  cursor = true, ariaLabel,
}) {
  const wrapRef = _useRef(null);
  const [w, setW] = _useState(640);
  const [hx, setHx] = _useState(null); // hovered index

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((ents) => {
      for (const e of ents) setW(Math.max(200, e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padL = 38, padR = 12, padT = 10, padB = 22;
  const iw = w - padL - padR;
  const ih = height - padT - padB;
  const n = series[0]?.data.length ?? 0;

  const xAt = (i) => padL + (n <= 1 ? 0 : (i / (n - 1)) * iw);
  const yAt = (v) => padT + ih - (Math.max(0, Math.min(yMax, v)) / yMax) * ih;

  const pathFor = (data) => {
    let d = "";
    for (let i = 0; i < data.length; i++) {
      d += (i === 0 ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(data[i]).toFixed(1);
    }
    return d;
  };

  const yTicks = _niceTicks(yMax, 4);
  const xTickCount = 4;

  function onMove(e) {
    const rect = wrapRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < padL || px > w - padR || n === 0) { setHx(null); return; }
    const i = Math.round(((px - padL) / iw) * (n - 1));
    setHx(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <div ref={wrapRef} className="chart" style={{ position: "relative" }}
         onMouseMove={cursor ? onMove : undefined}
         onMouseLeave={() => setHx(null)}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel}
           style={{ display: "block" }}>
        {/* y bands */}
        {bands.map((b, k) => (
          <rect key={"b" + k} x={padL} y={yAt(b.to)} width={iw}
                height={Math.max(0, yAt(b.from) - yAt(b.to))} fill={b.color} />
        ))}
        {/* grid */}
        {yTicks.map((v, k) => (
          <g key={"y" + k}>
            <line x1={padL} x2={w - padR} y1={yAt(v)} y2={yAt(v)}
                  stroke="var(--grid-major)" strokeWidth="1"
                  strokeDasharray={k === 0 ? "0" : "2 3"} />
            <text x={padL - 6} y={yAt(v) + 3} textAnchor="end"
                  className="num" fontSize="9.5" fill="var(--text-3)">{v.toFixed(1)}</text>
          </g>
        ))}
        {_niceTicks(tMax, xTickCount).map((v, k) => (
          <g key={"x" + k}>
            <line x1={xAt((v / tMax) * (n - 1))} x2={xAt((v / tMax) * (n - 1))}
                  y1={padT} y2={padT + ih} stroke="var(--grid-minor)" strokeWidth="1" />
            <text x={xAt((v / tMax) * (n - 1))} y={height - 7} textAnchor="middle"
                  className="num" fontSize="9.5" fill="var(--text-3)">{Math.round(v)}</text>
          </g>
        ))}
        {/* threshold lines */}
        {thresholds.map((t, k) => (
          <g key={"t" + k}>
            <line x1={padL} x2={w - padR} y1={yAt(t.y)} y2={yAt(t.y)}
                  stroke={t.color} strokeWidth="1" strokeDasharray="5 3" opacity="0.8" />
            <text x={w - padR - 2} y={yAt(t.y) - 3} textAnchor="end"
                  className="num" fontSize="9" fill={t.color}>{t.label}</text>
          </g>
        ))}
        {/* series */}
        {series.map((s) => (
          <path key={s.id} d={pathFor(s.data)} fill="none" stroke={s.color}
                strokeWidth="1.9" strokeDasharray={s.dash || "0"}
                strokeLinejoin="round" strokeLinecap="round"
                style={{ filter: "var(--glow-line)" }} />
        ))}
        {/* axis frame */}
        <line x1={padL} x2={padL} y1={padT} y2={padT + ih} stroke="var(--border-strong)" />
        <line x1={padL} x2={w - padR} y1={padT + ih} y2={padT + ih} stroke="var(--border-strong)" />
        {/* cursor */}
        {hx != null && (
          <g>
            <line x1={xAt(hx)} x2={xAt(hx)} y1={padT} y2={padT + ih}
                  stroke="var(--text-3)" strokeWidth="1" strokeDasharray="3 2" />
            {series.map((s) => (
              <circle key={"c" + s.id} cx={xAt(hx)} cy={yAt(s.data[hx])} r="3"
                      fill="var(--bg-panel)" stroke={s.color} strokeWidth="1.8" />
            ))}
          </g>
        )}
      </svg>
      {/* axis unit labels */}
      <div className="chart-unit-y mono">{yUnit}</div>
      <div className="chart-unit-x mono">{xUnit}</div>
      {/* readout tooltip */}
      {hx != null && (
        <div className="chart-readout" style={{
          left: Math.min(w - 124, Math.max(padL, xAt(hx) + 8)),
        }}>
          <div className="chart-readout-t mono">t = {((hx / (n - 1)) * tMax).toFixed(1)} {xUnit}</div>
          {series.map((s) => (
            <div key={"r" + s.id} className="chart-readout-row">
              <span className="dot" style={{ background: s.color }}></span>
              <span className="chart-readout-lbl">{s.label}</span>
              <span className="num chart-readout-val">{s.data[hx].toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { LineChart });
