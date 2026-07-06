/* ===================================================================
   bionet-studio — library.jsx  (element library dock + roadmap pages)
   Exports: LibraryDock, PlaceholderPage
   =================================================================== */
const React = window.React;
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

function ReversePage({ project, onBack, onApply }) {
  const tr = (zh, en) => (window.I18n?.lang || "zh") === "zh" ? zh : en;
  const [objective, setObjective] = React.useState("classification");
  const [spec, setSpec] = React.useState(() => window.ReverseSolver.makeDefaultSpec(project, "classification"));
  const [result, setResult] = React.useState(null);
  const [appliedId, setAppliedId] = React.useState(null);

  React.useEffect(() => {
    setSpec(window.ReverseSolver.makeDefaultSpec(project, objective));
    setResult(null);
    setAppliedId(null);
  }, [project.meta?.id, objective]);

  const channels = window.Model.channelsOf(project);
  const inputIds = spec.inputs.map((input) => input.id);
  const labels = spec.labels || [];
  const isContinuous = objective === "continuous";

  const setChannel = (channel) => setSpec((cur) => ({ ...cur, channel }));
  const setRowValue = (rowId, inputId, value) => {
    const numeric = Number.isFinite(value) ? value : 0;
    setSpec((cur) => ({
      ...cur,
      rows: cur.rows.map((row) => row.id === rowId
        ? { ...row, values: { ...row.values, [inputId]: numeric } }
        : row),
    }));
  };
  const setRowTarget = (rowId, value) => {
    setSpec((cur) => ({
      ...cur,
      rows: cur.rows.map((row) => row.id === rowId
        ? isContinuous ? { ...row, targetValue: value } : { ...row, targetIndex: value }
        : row),
    }));
  };
  const addRow = () => {
    const values = Object.fromEntries(spec.inputs.map((input) => {
      const node = project.nodes.find((n) => n.id === input.id);
      return [input.id, node?.C ?? 0.5];
    }));
    setSpec((cur) => ({
      ...cur,
      rows: [...cur.rows, {
        id: "row_user_" + Date.now(),
        values,
        targetIndex: 0,
        targetValue: 0.5,
      }],
    }));
  };
  const removeRow = (rowId) => setSpec((cur) => ({ ...cur, rows: cur.rows.filter((row) => row.id !== rowId) }));
  const resetSpec = () => {
    setSpec(window.ReverseSolver.makeDefaultSpec(project, objective));
    setResult(null);
    setAppliedId(null);
  };
  const solveNow = () => {
    const next = window.ReverseSolver.solve(project, spec, { iterations: 520, topN: 4 });
    setResult(next);
    setAppliedId(null);
  };
  const apply = (candidate) => {
    onApply(candidate);
    setAppliedId(candidate.id);
  };

  return (
    <div className="reverse-page">
      <header className="rev-head">
        <button className="btn ghost" onClick={onBack}><Icon name="chevronLeft" size={14} /> {tr("返回工作台", "Back")}</button>
        <div className="rev-title">
          <Icon name="reverse" size={20} />
          <div>
            <h1>{tr("反向设计", "Reverse design")}</h1>
            <p>{tr("目标行为转成权重、边强度和阈值建议。", "Turn target behaviour into suggested weights, edge strengths and thresholds.")}</p>
          </div>
        </div>
        <button className="btn primary" onClick={solveNow}><Icon name="run" size={13} /> {tr("求解", "Solve")}</button>
      </header>

      <div className="rev-layout">
        <section className="rev-panel rev-target">
          <div className="rev-panel-head">
            <div>
              <span className="eyebrow">{tr("目标规格", "Target spec")}</span>
              <h2>{tr("编辑期望输入输出", "Edit expected input-output behaviour")}</h2>
            </div>
            <button className="btn ghost" onClick={resetSpec}><Icon name="reset" size={13} /> {tr("重置", "Reset")}</button>
          </div>

          <div className="rev-controls">
            <div className="seg rev-seg">
              {[
                ["classification", tr("分类", "Classify")],
                ["truth", tr("真值表", "Truth")],
                ["continuous", tr("连续", "Curve")],
              ].map(([id, label]) => (
                <button key={id} className={"seg-b" + (objective === id ? " on" : "")}
                  onClick={() => setObjective(id)}>{label}</button>
              ))}
            </div>
            <label className="rev-channel">
              <span className="eyebrow">{tr("目标通道", "Channel")}</span>
              <select value={spec.channel} onChange={(e) => setChannel(e.target.value)}>
                {channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}
              </select>
            </label>
          </div>

          <div className="rev-table-wrap">
            <table className="rev-table">
              <thead>
                <tr>
                  {spec.inputs.map((input) => <th key={input.id}>{input.label}</th>)}
                  <th>{isContinuous ? tr("目标数值", "Target value") : tr("目标状态", "Target state")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {spec.rows.map((row) => (
                  <tr key={row.id}>
                    {inputIds.map((id) => (
                      <td key={id}>
                        <input className="rev-num" type="number" min="0" max="1.5" step="0.05"
                          value={row.values[id] ?? 0}
                          onChange={(e) => setRowValue(row.id, id, parseFloat(e.target.value))} />
                      </td>
                    ))}
                    <td>
                      {isContinuous ? (
                        <input className="rev-num" type="number" min="0" max="1" step="0.05"
                          value={row.targetValue ?? 0}
                          onChange={(e) => setRowTarget(row.id, parseFloat(e.target.value))} />
                      ) : (
                        <select className="rev-select" value={row.targetIndex ?? 0}
                          onChange={(e) => setRowTarget(row.id, parseInt(e.target.value, 10))}>
                          {labels.map((label, idx) => <option key={idx} value={idx}>{label.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="rev-row-act">
                      <button className="iconbtn" title={tr("删除", "Delete")} disabled={spec.rows.length <= 2}
                        onClick={() => removeRow(row.id)}><Icon name="trash" size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rev-actions">
            <button className="btn ghost" onClick={addRow}><Icon name="add" size={13} /> {tr("添加样本", "Add row")}</button>
            <p>{tr("数值使用 0-1.5 的归一化输入；求解器不会假定任何具体应用领域。", "Inputs use normalized 0-1.5 levels; the solver is not tied to any application domain.")}</p>
          </div>
        </section>

        <section className="rev-panel rev-results">
          <div className="rev-panel-head">
            <div>
              <span className="eyebrow">{tr("候选方案", "Candidate designs")}</span>
              <h2>{result ? tr("按目标拟合排序", "Ranked by target fit") : tr("等待求解", "Waiting for solve")}</h2>
            </div>
            {result && <span className="badge b-demo">{result.diagnostics.variables.count} {tr("个变量", "vars")}</span>}
          </div>

          {!result ? (
            <div className="rev-empty">
              <Icon name="reverse" size={38} />
              <h3>{tr("设置目标表后点击求解", "Set targets, then solve")}</h3>
              <p>{tr("第一版会搜索传感器权重、输入边强度和分类阈值，并返回可直接应用到当前网络的候选方案。", "This MVP searches sensor weights, input-edge strengths and thresholds, then returns candidates that can be applied to the current network.")}</p>
            </div>
          ) : (
            <div className="rev-candidates">
              {result.candidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} spec={result.spec}
                  labels={labels} applied={appliedId === candidate.id} onApply={() => apply(candidate)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CandidateCard({ candidate, spec, labels, applied, onApply }) {
  const tr = (zh, en) => (window.I18n?.lang || "zh") === "zh" ? zh : en;
  const pct = Math.round(candidate.accuracy * 100);
  const weights = Object.entries(candidate.patch.sensorWeights || {});
  const edges = Object.entries(candidate.patch.edgeWeights || {});
  return (
    <article className={"rev-candidate" + (candidate.rank === 1 ? " best" : "")}>
      <div className="rev-cand-top">
        <span className="rev-rank mono">#{candidate.rank}</span>
        <div className="rev-cand-score">
          <span className="rev-score-main">{candidate.score.toFixed(1)}</span>
          <span className="rev-score-sub">{tr("分", "score")}</span>
        </div>
        <span className="badge b-user">{pct}% {tr("匹配", "fit")}</span>
        <button className={"btn" + (applied ? " ghost" : " primary")} onClick={onApply}>
          <Icon name={applied ? "check" : "run"} size={13} /> {applied ? tr("已应用", "Applied") : tr("应用", "Apply")}
        </button>
      </div>

      <div className="rev-kv">
        <div>
          <span className="eyebrow">{tr("输入权重", "Input weights")}</span>
          <p>{weights.map(([id, value]) => `${id}: ${value.toFixed(2)}`).join(" · ") || "—"}</p>
        </div>
        <div>
          <span className="eyebrow">{tr("阈值", "Thresholds")}</span>
          <p>{(candidate.patch.thresholds || []).map((x) => x.toFixed(2)).join(" · ") || "—"}</p>
        </div>
      </div>

      {!!edges.length && (
        <div className="rev-edge-list">
          <span className="eyebrow">{tr("输入边强度", "Input-edge strengths")}</span>
          <p>{edges.slice(0, 5).map(([id, value]) => `${id.replace(">", "→")}: ${value.toFixed(2)}`).join(" · ")}{edges.length > 5 ? " ..." : ""}</p>
        </div>
      )}

      <div className="rev-row-preview">
        {candidate.rows.map((row) => {
          const label = spec.objectiveType === "continuous"
            ? `${row.value.toFixed(2)} / ${(row.targetValue ?? 0).toFixed(2)}`
            : `${labels[row.predIndex]?.name || row.predIndex} → ${labels[row.targetIndex]?.name || row.targetIndex}`;
          return <span key={row.id} className={"rev-row-chip" + (row.ok ? " ok" : " bad")}>{label}</span>;
        })}
      </div>
    </article>
  );
}

Object.assign(window, { LibraryDock, PlaceholderPage, ReversePage });
