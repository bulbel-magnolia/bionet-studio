/* ===================================================================
   bionet-studio — runs.js  (run history store)
   localStorage-backed log of past simulation runs.
   Each run is a frozen snapshot of {project, sim, summary} at recording time.
   window.Runs.{ list, record, remove, clear, update, exportRuns, importRuns }
   =================================================================== */
(function () {
  const KEY = "bionet.runs";
  const MAX_RUNS = 50;
  const DEDUPE_MS = 60 * 1000;

  function rid() { return "run_" + Math.random().toString(36).slice(2, 9); }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) { return []; }
  }
  function write(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); return true; }
    catch (err) {
      // quota exceeded — drop oldest until it fits or list is empty
      const trimmed = arr.slice(0, Math.max(0, arr.length - 1));
      if (trimmed.length === arr.length) return false;
      return write(trimmed);
    }
  }

  // shallow project fingerprint for dedupe
  function fingerprint(project) {
    const ns = project.nodes.map((n) => {
      const keys = Object.keys(n).sort();
      return n.id + ":" + keys.filter((k) => typeof n[k] === "number").map((k) => k + "=" + n[k].toFixed(4)).join(",");
    });
    const es = project.edges.map((e) => e.id + ":w=" + (e.w ?? 0).toFixed(4) + ",s=" + e.sign);
    const ps = project.params ? Object.entries(project.params).sort().map(([k, v]) => k + "=" + v).join(",") : "";
    return ns.join("|") + "##" + es.join("|") + "##" + ps;
  }

  function summarize(project, sim) {
    const Sim = window.Sim;
    if (!Sim) return {};
    const final = Sim.channelFinal(sim, "score");
    const peak = Sim.channelPeak(sim, "score");
    const t50 = Sim.timeToFraction(sim, "score", 0.5);
    const cls = (project.readouts || []).find((r) => r.type === "classification");
    const decision = cls ? Sim.classify(Sim.channelFinal(sim, cls.config.channel), cls.config).label : null;
    return { final, peak, t50, decision };
  }

  function list() { return read(); }

  function record(project, sim, opts) {
    const all = read();
    const fp = fingerprint(project);
    // dedupe: if last run has same fingerprint within DEDUPE_MS, bump its ts instead.
    if (all.length && all[0].fingerprint === fp && (Date.now() - all[0].ts) < DEDUPE_MS) {
      all[0].ts = Date.now();
      all[0].sim = sim;
      all[0].summary = summarize(project, sim);
      write(all);
      return all[0];
    }
    const run = {
      id: rid(),
      ts: Date.now(),
      projectName: project.meta?.name || "untitled",
      projectKind: project.meta?.kind || "user",
      note: opts?.note || "",
      project: JSON.parse(JSON.stringify(project)),
      sim: JSON.parse(JSON.stringify(sim)),
      summary: summarize(project, sim),
      fingerprint: fp,
    };
    all.unshift(run);
    if (all.length > MAX_RUNS) all.length = MAX_RUNS;
    write(all);
    return run;
  }

  function remove(id) {
    const all = read().filter((r) => r.id !== id);
    write(all);
    return all;
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (err) {}
  }

  function update(id, patch) {
    const all = read();
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...patch };
    write(all);
    return all[idx];
  }

  function exportRuns(ids) {
    const all = read();
    const subset = ids && ids.length ? all.filter((r) => ids.includes(r.id)) : all;
    return { format: "bionet-studio/runs/v1", exportedAt: Date.now(), runs: subset };
  }

  function importRuns(payload) {
    if (!payload || !Array.isArray(payload.runs)) return 0;
    const all = read();
    const have = new Set(all.map((r) => r.id));
    let added = 0;
    payload.runs.forEach((r) => {
      if (!r || !r.project || !r.sim || have.has(r.id)) return;
      all.push({ ...r, fingerprint: r.fingerprint || fingerprint(r.project) });
      added++;
    });
    all.sort((a, b) => b.ts - a.ts);
    if (all.length > MAX_RUNS) all.length = MAX_RUNS;
    write(all);
    return added;
  }

  window.Runs = { list, record, remove, clear, update, exportRuns, importRuns, MAX_RUNS };
})();
