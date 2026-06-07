/* =========================================================================
   基因人工神经网络 · 水质检测仿真内核（canonical kernel）
   ─────────────────────────────────────────────────────────────────────────
   供「通用平台」(demo3) 使用。
   纯函数实现,不依赖任何 DOM 或外部库;同一份代码在浏览器与 Node 下均可运行。

   模型链路:
     输入浓度 P_i (0~1)
       → Hill 编码  x_i = P_i^n / (Km_i^n + P_i^n)        [可选高斯噪声]
       → 加权求和   Z_input = Σ (wp · wl_i) · x_i
       → 中间蛋白动力学  dZ/dt = α·Z_input − β·Z         [欧拉法]
       → 三级判定   Z<θ1 绿(安全) / θ1≤Z<θ2 黄(预警) / Z≥θ2 红(重污染)
       → 双稳态记忆 一旦 Z 越过 θ2 即锁死为红,直到手动重置
   ========================================================================= */
(function (global) {
  'use strict';

  /* Hill 函数:把浓度 P 编码成 0~1 的信号 */
  function hill(P, Km, n) {
    var pn = Math.pow(Math.max(0, P), n);
    var kn = Math.pow(Km, n);
    return pn / (kn + pn);
  }

  /* 标准正态随机数(Box–Muller),用于可选噪声 */
  var _spare = null;
  function randn() {
    if (_spare !== null) { var s = _spare; _spare = null; return s; }
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    var mag = Math.sqrt(-2.0 * Math.log(u));
    _spare = mag * Math.sin(2.0 * Math.PI * v);
    return mag * Math.cos(2.0 * Math.PI * v);
  }

  /* 默认参数(三污染传感器的基准配置) */
  function defaults() {
    return {
      n: 2,
      Km: [0.5, 0.3, 0.7],
      wp: 0.8,
      wl: [1.2, 0.9, 1.5],
      alpha: 0.5,
      beta: 0.2,
      theta1: 0.3,
      theta2: 0.7,
      noise: false,
      noiseStd: 0.1,
      duration: 24,   // 小时
      dt: 0.1,        // 步长(小时)
      kF: 0.9         // 荧光蛋白一阶跟随速率(1/h),仅影响曲线平滑度
    };
  }

  /* 给定某时刻各输入浓度 P[],计算加权求和输入 Z_input */
  function weightedInput(cfg, P) {
    var z = 0;
    for (var i = 0; i < P.length; i++) {
      var km = (cfg.Km[i] !== undefined) ? cfg.Km[i] : 0.5;
      var wl = (cfg.wl[i] !== undefined) ? cfg.wl[i] : 1.0;
      var x = hill(P[i], km, cfg.n);
      if (cfg.noise) x += cfg.noiseStd * randn();
      z += (cfg.wp * wl) * x;
    }
    return z;
  }

  /* 把 Z 与记忆状态映射成离散等级 'green' | 'yellow' | 'red' */
  function classify(Z, locked, cfg) {
    if (locked || Z >= cfg.theta2) return 'red';
    if (Z >= cfg.theta1) return 'yellow';
    return 'green';
  }

  /*
    主仿真。
      cfg   : 参数对象(见 defaults)
      Pat   : 浓度来源,两种形式皆可:
                · 数组(长度=输入个数)  —— 各输入全程恒定
                · 函数 t -> 数组         —— 浓度随时间变化(用于场景演示)
      opts  : { startLocked:Boolean } 是否带入"已锁定"的记忆状态进入本次仿真
    返回:
      {
        t[], Zin[], Z[], state[], locked[], gfp[], yfp[], dsred[],
        everCrossed,                         // 全程是否曾越过 θ2
        final:{ t,Z,state,locked,gfp,yfp,dsred }
      }
  */
  function simulate(cfg, Pat, opts) {
    opts = opts || {};
    var dt = cfg.dt, T = cfg.duration;
    var steps = Math.round(T / dt);
    var getP = (typeof Pat === 'function') ? Pat : function () { return Pat; };

    var t = [], Zin = [], Z = [], state = [], lockedArr = [];
    var gfp = [], yfp = [], dsred = [];

    var z = 0;                              // 中间蛋白 Z 初值为 0
    var locked = !!opts.startLocked;        // 记忆状态
    var everCrossed = locked;
    var g = 0, y = 0, r = 0;                // 三种荧光初值
    var kF = cfg.kF;

    for (var k = 0; k <= steps; k++) {
      var time = k * dt;
      var P = getP(time);
      var zin = weightedInput(cfg, P);

      // 欧拉法推进 dZ/dt = α·Z_input − β·Z（k=0 记录初值,不推进）
      if (k > 0) {
        z = z + dt * (cfg.alpha * zin - cfg.beta * z);
        if (z < 0) z = 0;
      }

      if (z >= cfg.theta2) { locked = true; everCrossed = true; }
      var st = classify(z, locked, cfg);

      // 三种荧光蛋白各自一阶跟随目标表达量,使曲线平滑可读
      var gt = (st === 'green') ? 1 : 0;
      var yt = (st === 'yellow') ? 1 : 0;
      var rt = (st === 'red') ? 1 : 0;
      if (k > 0) {
        g += dt * kF * (gt - g);
        y += dt * kF * (yt - y);
        r += dt * kF * (rt - r);
      } else { g = gt; y = yt; r = rt; }

      t.push(time); Zin.push(zin); Z.push(z); state.push(st); lockedArr.push(locked);
      gfp.push(g); yfp.push(y); dsred.push(r);
    }

    var last = t.length - 1;
    return {
      t: t, Zin: Zin, Z: Z, state: state, locked: lockedArr,
      gfp: gfp, yfp: yfp, dsred: dsred,
      everCrossed: everCrossed,
      final: {
        t: t[last], Z: Z[last], state: state[last], locked: lockedArr[last],
        gfp: gfp[last], yfp: yfp[last], dsred: dsred[last]
      }
    };
  }

  var Kernel = {
    hill: hill, randn: randn, defaults: defaults,
    weightedInput: weightedInput, classify: classify, simulate: simulate
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Kernel;
  global.Kernel = Kernel;
})(typeof window !== 'undefined' ? window : this);
