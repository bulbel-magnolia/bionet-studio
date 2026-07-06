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
    return (React.createElement("aside", { className: "libdock" },
        React.createElement("div", { className: "libdock-scroll" },
            React.createElement("div", { className: "lib-sect" },
                React.createElement("div", { className: "lib-sect-head" },
                    React.createElement("span", { className: "eyebrow" }, tr("elementPalette")),
                    React.createElement("span", { className: "lib-sect-tag" }, tr("clickToPlace"))),
                TYPE_GROUPS.map((g) => (React.createElement("div", { key: g, className: "palette-group" },
                    React.createElement("div", { className: "palette-group-h" }, g),
                    TYPES.filter((t) => t.group === g).map((t) => (React.createElement("button", { key: t.kind, className: "palette-row", onClick: () => onAddNode(t.kind), title: t.blurb },
                        React.createElement("span", { className: "palette-glyph", style: { "--tint": t.color } },
                            React.createElement(Icon, { name: window.KIND_ICON[t.kind], size: 14, sw: 1.8 })),
                        React.createElement("span", { className: "palette-name" }, t.label),
                        React.createElement("span", { className: "palette-role" }, t.role),
                        React.createElement(Icon, { name: "add", size: 14, className: "palette-add" })))))))),
            React.createElement("div", { className: "lib-sect" },
                React.createElement("div", { className: "lib-sect-head" },
                    React.createElement("span", { className: "eyebrow" }, tr("sources")),
                    React.createElement("span", { className: "badge b-soon" }, tr("soon"))),
                React.createElement("div", { className: "lib-filters" }, [tr("illustrative"), tr("calibrated"), tr("userDefined"), tr("verified")].map((f, i) => (React.createElement("span", { key: f, className: "lib-filter" + (i === 0 ? " on" : "") }, f)))),
                React.createElement("p", { className: "lib-hint sm" }, tr("sourceNote"))),
            React.createElement("div", { className: "lib-sect" },
                React.createElement("div", { className: "lib-sect-head" },
                    React.createElement("span", { className: "eyebrow" }, tr("quickSet")),
                    React.createElement("span", { className: "lib-sect-tag mono" }, "a.u.")),
                React.createElement("div", { className: "lib-inputs" }, sensors.map((s) => {
                    const sig = sim?.signals?.[s.id] ?? 0;
                    const seld = selection?.type === "node" && selection.id === s.id;
                    return (React.createElement("div", { key: s.id, className: "lib-input" + (seld ? " sel" : ""), onClick: () => onSelect({ type: "node", id: s.id }) },
                        React.createElement("div", { className: "lib-input-top" },
                            React.createElement("span", { className: "lib-input-name" }, s.label),
                            React.createElement("span", { className: "num lib-input-c" }, s.C.toFixed(2))),
                        React.createElement("input", { className: "param-slider compact", type: "range", min: "0", max: "1.5", step: "0.01", value: s.C, onClick: (e) => e.stopPropagation(), onChange: (e) => onQuickInput(s.id, parseFloat(e.target.value)), style: { "--pct": (s.C / 1.5 * 100) + "%", "--accent": "var(--k-sensor)" } }),
                        React.createElement("div", { className: "lib-input-sig" },
                            React.createElement("div", { className: "lib-input-sig-bar" },
                                React.createElement("div", { style: { width: (sig * 100) + "%" } })),
                            React.createElement("span", { className: "num" },
                                tr("signal"),
                                " ",
                                sig.toFixed(2)))));
                }))))));
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
    if (!r)
        return null;
    return (React.createElement("div", { className: "placeholder" },
        React.createElement("div", { className: "placeholder-card" },
            React.createElement("div", { className: "placeholder-top" },
                React.createElement("span", { className: "placeholder-ic" },
                    React.createElement(Icon, { name: r.icon, size: 20 })),
                React.createElement("span", { className: "badge b-soon" }, tr(r.tagKey))),
            React.createElement("h1", null, tr(r.titleKey)),
            React.createElement("p", { className: "placeholder-desc" }, tr(r.descKey)),
            React.createElement("ul", { className: "placeholder-list" }, r.itemKeys.map((it, i) => (React.createElement("li", { key: i },
                React.createElement(Icon, { name: "check", size: 15, sw: 2.2 }),
                " ",
                tr(it))))),
            React.createElement("button", { className: "btn", onClick: onBack },
                React.createElement(Icon, { name: "chevronLeft", size: 14 }),
                " ",
                tr("roadmapBack")))));
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
    return (React.createElement("div", { className: "reverse-page" },
        React.createElement("header", { className: "rev-head" },
            React.createElement("button", { className: "btn ghost", onClick: onBack },
                React.createElement(Icon, { name: "chevronLeft", size: 14 }),
                " ",
                tr("返回工作台", "Back")),
            React.createElement("div", { className: "rev-title" },
                React.createElement(Icon, { name: "reverse", size: 20 }),
                React.createElement("div", null,
                    React.createElement("h1", null, tr("反向设计", "Reverse design")),
                    React.createElement("p", null, tr("目标行为转成权重、边强度和阈值建议。", "Turn target behaviour into suggested weights, edge strengths and thresholds.")))),
            React.createElement("button", { className: "btn primary", onClick: solveNow },
                React.createElement(Icon, { name: "run", size: 13 }),
                " ",
                tr("求解", "Solve"))),
        React.createElement("div", { className: "rev-layout" },
            React.createElement("section", { className: "rev-panel rev-target" },
                React.createElement("div", { className: "rev-panel-head" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "eyebrow" }, tr("目标规格", "Target spec")),
                        React.createElement("h2", null, tr("编辑期望输入输出", "Edit expected input-output behaviour"))),
                    React.createElement("button", { className: "btn ghost", onClick: resetSpec },
                        React.createElement(Icon, { name: "reset", size: 13 }),
                        " ",
                        tr("重置", "Reset"))),
                React.createElement("div", { className: "rev-controls" },
                    React.createElement("div", { className: "seg rev-seg" }, [
                        ["classification", tr("分类", "Classify")],
                        ["truth", tr("真值表", "Truth")],
                        ["continuous", tr("连续", "Curve")],
                    ].map(([id, label]) => (React.createElement("button", { key: id, className: "seg-b" + (objective === id ? " on" : ""), onClick: () => setObjective(id) }, label)))),
                    React.createElement("label", { className: "rev-channel" },
                        React.createElement("span", { className: "eyebrow" }, tr("目标通道", "Channel")),
                        React.createElement("select", { value: spec.channel, onChange: (e) => setChannel(e.target.value) }, channels.map((channel) => React.createElement("option", { key: channel.id, value: channel.id }, channel.label))))),
                React.createElement("div", { className: "rev-table-wrap" },
                    React.createElement("table", { className: "rev-table" },
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                spec.inputs.map((input) => React.createElement("th", { key: input.id }, input.label)),
                                React.createElement("th", null, isContinuous ? tr("目标数值", "Target value") : tr("目标状态", "Target state")),
                                React.createElement("th", null))),
                        React.createElement("tbody", null, spec.rows.map((row) => (React.createElement("tr", { key: row.id },
                            inputIds.map((id) => (React.createElement("td", { key: id },
                                React.createElement("input", { className: "rev-num", type: "number", min: "0", max: "1.5", step: "0.05", value: row.values[id] ?? 0, onChange: (e) => setRowValue(row.id, id, parseFloat(e.target.value)) })))),
                            React.createElement("td", null, isContinuous ? (React.createElement("input", { className: "rev-num", type: "number", min: "0", max: "1", step: "0.05", value: row.targetValue ?? 0, onChange: (e) => setRowTarget(row.id, parseFloat(e.target.value)) })) : (React.createElement("select", { className: "rev-select", value: row.targetIndex ?? 0, onChange: (e) => setRowTarget(row.id, parseInt(e.target.value, 10)) }, labels.map((label, idx) => React.createElement("option", { key: idx, value: idx }, label.name))))),
                            React.createElement("td", { className: "rev-row-act" },
                                React.createElement("button", { className: "iconbtn", title: tr("删除", "Delete"), disabled: spec.rows.length <= 2, onClick: () => removeRow(row.id) },
                                    React.createElement(Icon, { name: "trash", size: 13 }))))))))),
                React.createElement("div", { className: "rev-actions" },
                    React.createElement("button", { className: "btn ghost", onClick: addRow },
                        React.createElement(Icon, { name: "add", size: 13 }),
                        " ",
                        tr("添加样本", "Add row")),
                    React.createElement("p", null, tr("数值使用 0-1.5 的归一化输入；求解器不会假定任何具体应用领域。", "Inputs use normalized 0-1.5 levels; the solver is not tied to any application domain.")))),
            React.createElement("section", { className: "rev-panel rev-results" },
                React.createElement("div", { className: "rev-panel-head" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "eyebrow" }, tr("候选方案", "Candidate designs")),
                        React.createElement("h2", null, result ? tr("按目标拟合排序", "Ranked by target fit") : tr("等待求解", "Waiting for solve"))),
                    result && React.createElement("span", { className: "badge b-demo" },
                        result.diagnostics.variables.count,
                        " ",
                        tr("个变量", "vars"))),
                !result ? (React.createElement("div", { className: "rev-empty" },
                    React.createElement(Icon, { name: "reverse", size: 38 }),
                    React.createElement("h3", null, tr("设置目标表后点击求解", "Set targets, then solve")),
                    React.createElement("p", null, tr("第一版会搜索传感器权重、输入边强度和分类阈值，并返回可直接应用到当前网络的候选方案。", "This MVP searches sensor weights, input-edge strengths and thresholds, then returns candidates that can be applied to the current network.")))) : (React.createElement("div", { className: "rev-candidates" }, result.candidates.map((candidate) => (React.createElement(CandidateCard, { key: candidate.id, candidate: candidate, spec: result.spec, labels: labels, applied: appliedId === candidate.id, onApply: () => apply(candidate) })))))))));
}
function CandidateCard({ candidate, spec, labels, applied, onApply }) {
    const tr = (zh, en) => (window.I18n?.lang || "zh") === "zh" ? zh : en;
    const pct = Math.round(candidate.accuracy * 100);
    const weights = Object.entries(candidate.patch.sensorWeights || {});
    const edges = Object.entries(candidate.patch.edgeWeights || {});
    return (React.createElement("article", { className: "rev-candidate" + (candidate.rank === 1 ? " best" : "") },
        React.createElement("div", { className: "rev-cand-top" },
            React.createElement("span", { className: "rev-rank mono" },
                "#",
                candidate.rank),
            React.createElement("div", { className: "rev-cand-score" },
                React.createElement("span", { className: "rev-score-main" }, candidate.score.toFixed(1)),
                React.createElement("span", { className: "rev-score-sub" }, tr("分", "score"))),
            React.createElement("span", { className: "badge b-user" },
                pct,
                "% ",
                tr("匹配", "fit")),
            React.createElement("button", { className: "btn" + (applied ? " ghost" : " primary"), onClick: onApply },
                React.createElement(Icon, { name: applied ? "check" : "run", size: 13 }),
                " ",
                applied ? tr("已应用", "Applied") : tr("应用", "Apply"))),
        React.createElement("div", { className: "rev-kv" },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, tr("输入权重", "Input weights")),
                React.createElement("p", null, weights.map(([id, value]) => `${id}: ${value.toFixed(2)}`).join(" · ") || "—")),
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, tr("阈值", "Thresholds")),
                React.createElement("p", null, (candidate.patch.thresholds || []).map((x) => x.toFixed(2)).join(" · ") || "—"))),
        !!edges.length && (React.createElement("div", { className: "rev-edge-list" },
            React.createElement("span", { className: "eyebrow" }, tr("输入边强度", "Input-edge strengths")),
            React.createElement("p", null,
                edges.slice(0, 5).map(([id, value]) => `${id.replace(">", "→")}: ${value.toFixed(2)}`).join(" · "),
                edges.length > 5 ? " ..." : ""))),
        React.createElement("div", { className: "rev-row-preview" }, candidate.rows.map((row) => {
            const label = spec.objectiveType === "continuous"
                ? `${row.value.toFixed(2)} / ${(row.targetValue ?? 0).toFixed(2)}`
                : `${labels[row.predIndex]?.name || row.predIndex} → ${labels[row.targetIndex]?.name || row.targetIndex}`;
            return React.createElement("span", { key: row.id, className: "rev-row-chip" + (row.ok ? " ok" : " bad") }, label);
        }))));
}
Object.assign(window, { LibraryDock, PlaceholderPage, ReversePage });
