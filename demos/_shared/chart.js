/* =========================================================================
   轻量折线图(纯 canvas,零依赖)  v3 —— 仪器示波级
   ─────────────────────────────────────────────────────────────────────────
   供 demo3 使用。相对 v2 的改动:
     · 主题感知:颜色 / 字体在每次 draw() 时从 CSS 变量重新读取,故明暗主题
       切换后只需 redraw() 即可自动换色(无需重建实例)。
     · 曲线辉光:series[i].glow=true 时用 shadowBlur 让曲线像示波器一样发光。
     · 渐变填充:series[i].fill 时用「色→透明」的竖直渐变填充,替代平涂。
     · 更克制的网格(虚线次级网格)、更清晰的阈值线与时间游标药丸标签。
   API 与 v2 完全兼容(draw(spec) / redraw()),新字段均为可选。

   用法:
     var ch = LineChart(canvasEl, { xLabel:'时间 (h)', yLabel:'Z' });
     ch.draw({
       xMax: 24, yMax: null,                                  // null=自动
       zones:  [{from:0,to:0.3,color:'#1faa5a'}, ...],        // 水平 regime 背景带
       series: [{ ys:[...], xs:[...], color:'#0c8f95', width:2.4,
                  fill:true, fillAlpha:0.16, glow:true, dot:true }],
       hlines: [{ y:0.3, color:'#e8a200', label:'θ1' }, ...],
       marker: 10, markerLabel:'t=10.0 h'                     // 竖线 + 药丸标签
     });
   窗口缩放或主题切换后调用 ch.redraw() 重绘(内部缓存上次 spec)。
   ========================================================================= */
function LineChart(canvas, opt) {
  opt = opt || {};
  var ctx = canvas.getContext('2d');
  var pad = { l: 50, r: 16, t: 16, b: 32 };
  var last = null;

  // —— 每次绘制时重读 CSS 变量(支持明暗主题热切换)——
  function palette() {
    var css = getComputedStyle(document.documentElement);
    function cv(name, fb) { return (css.getPropertyValue(name) || fb).trim(); }
    return {
      ink:  cv('--ink', '#16202e'),
      ink2: cv('--ink-2', '#46566b'),
      ink3: cv('--ink-3', '#7d8b9c'),
      line: cv('--line', '#e0e6ec'),
      grid: cv('--chart-grid', cv('--line', '#e0e6ec')),
      panel: cv('--panel', '#ffffff'),
      mono: cv('--mono', 'monospace')
    };
  }

  function hexA(hex, a) {
    hex = (hex || '#000').trim().replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function size() {
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var w = canvas.clientWidth || 600;
    var h = canvas.clientHeight || 240;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  function niceMax(v) {
    if (!isFinite(v) || v <= 0) return 1;
    var exp = Math.floor(Math.log10(v));
    var base = Math.pow(10, exp);
    var f = v / base;
    var nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nf * base;
  }

  function fmt(v) {
    if (v === 0) return '0';
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 1) return v.toFixed(1);
    return v.toFixed(2);
  }

  function draw(spec) {
    last = spec;
    var C = palette();
    var MONO = C.mono;
    var dim = size();
    var W = dim.w, H = dim.h;
    ctx.clearRect(0, 0, W, H);

    var x0 = pad.l, x1 = W - pad.r, y0 = H - pad.b, y1 = pad.t;
    var xMax = spec.xMax || 1;

    var ymax = spec.yMax;
    if (ymax == null) {
      var m = 0;
      (spec.series || []).forEach(function (s) { (s.ys || []).forEach(function (v) { if (v > m) m = v; }); });
      (spec.hlines || []).forEach(function (h) { if (h.y > m) m = h.y; });
      ymax = niceMax(m * 1.12) || 1;
    }

    var X = function (x) { return x0 + (x / xMax) * (x1 - x0); };
    var Y = function (y) { return y0 - (Math.max(0, Math.min(ymax, y)) / ymax) * (y0 - y1); };

    // —— regime 背景带 ——
    (spec.zones || []).forEach(function (z) {
      var top = Y(Math.min(z.to, ymax)), bot = Y(Math.max(0, z.from));
      ctx.fillStyle = hexA(z.color, z.opacity != null ? z.opacity : 0.08);
      ctx.fillRect(x0, top, x1 - x0, bot - top);
    });

    // —— 网格 + Y 刻度(主网格实线,极淡)——
    ctx.font = '11px ' + MONO;
    ctx.fillStyle = C.ink3;
    ctx.lineWidth = 1;
    var yticks = 4;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var i = 0; i <= yticks; i++) {
      var yv = ymax * i / yticks, py = Y(yv);
      ctx.strokeStyle = C.grid;
      ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
      ctx.fillStyle = C.ink3;
      ctx.fillText(fmt(yv), x0 - 8, py);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var xticks = 6;
    for (var j = 0; j <= xticks; j++) {
      var xv = xMax * j / xticks, px = X(xv);
      ctx.fillText(fmt(xv), px, y0 + 7);
    }

    // 轴标题
    ctx.fillStyle = C.ink3;
    if (spec.xLabel || opt.xLabel) { ctx.textAlign = 'right'; ctx.fillText(spec.xLabel || opt.xLabel, x1, y0 + 17); }
    if (spec.yLabel || opt.yLabel) {
      ctx.save(); ctx.translate(14, y1 + 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(spec.yLabel || opt.yLabel, 0, 0); ctx.restore();
    }

    // —— 当前时刻竖线 ——
    if (spec.marker != null) {
      var mx = X(spec.marker);
      ctx.strokeStyle = hexA(C.ink3, 0.9); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, y1); ctx.lineTo(mx, y0); ctx.stroke();
      ctx.setLineDash([]);
      if (spec.markerLabel) {
        ctx.font = '700 10px ' + MONO;
        var tw = ctx.measureText(spec.markerLabel).width + 10;
        var bx = Math.min(Math.max(mx - tw / 2, x0), x1 - tw);
        ctx.fillStyle = C.ink;
        roundRect(ctx, bx, y1 - 1, tw, 16, 4); ctx.fill();
        ctx.fillStyle = C.panel; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(spec.markerLabel, bx + tw / 2, y1 + 7);
      }
    }

    // —— 阈值水平线 ——
    (spec.hlines || []).forEach(function (h) {
      var py = Y(h.y);
      ctx.strokeStyle = h.color; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
      ctx.setLineDash([]);
      if (h.label) {
        ctx.font = '700 11px ' + MONO;
        var lw = ctx.measureText(h.label).width + 8;
        ctx.fillStyle = hexA(h.color, 0.14);
        roundRect(ctx, x0 + 3, py - 14, lw, 13, 3); ctx.fill();
        ctx.fillStyle = h.color; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(h.label, x0 + 7, py - 2);
      }
    });

    // —— 数据曲线(渐变填充 + 可选辉光)——
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    (spec.series || []).forEach(function (s) {
      var ys = s.ys || [], xs = s.xs;
      if (!ys.length) return;
      var pts = [];
      for (var k = 0; k < ys.length; k++) {
        var xx = xs ? xs[k] : (k / (ys.length - 1)) * xMax;
        pts.push([X(xx), Y(ys[k])]);
      }
      if (s.fill) {
        var grad = ctx.createLinearGradient(0, y1, 0, y0);
        grad.addColorStop(0, hexA(s.color, s.fillAlpha != null ? s.fillAlpha : 0.16));
        grad.addColorStop(1, hexA(s.color, 0.0));
        ctx.beginPath();
        ctx.moveTo(pts[0][0], y0);
        for (var a = 0; a < pts.length; a++) ctx.lineTo(pts[a][0], pts[a][1]);
        ctx.lineTo(pts[pts.length - 1][0], y0);
        ctx.closePath();
        ctx.fillStyle = grad; ctx.fill();
      }
      ctx.save();
      if (s.glow) { ctx.shadowColor = hexA(s.color, 0.55); ctx.shadowBlur = 9; }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2.4;
      if (s.dashed) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
      ctx.beginPath();
      for (var b = 0; b < pts.length; b++) { if (b === 0) ctx.moveTo(pts[b][0], pts[b][1]); else ctx.lineTo(pts[b][0], pts[b][1]); }
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);
      if (s.dot && pts.length) {
        var lp = pts[pts.length - 1];
        ctx.save();
        if (s.glow) { ctx.shadowColor = hexA(s.color, 0.7); ctx.shadowBlur = 10; }
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(lp[0], lp[1], 3.8, 0, 2 * Math.PI); ctx.fill();
        ctx.restore();
        ctx.fillStyle = C.panel;
        ctx.beginPath(); ctx.arc(lp[0], lp[1], 1.6, 0, 2 * Math.PI); ctx.fill();
      }
    });

    // 绘图区边框
    ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    ctx.strokeRect(x0 + .5, y1 + .5, x1 - x0 - 1, y0 - y1 - 1);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function redraw() { if (last) draw(last); }
  window.addEventListener('resize', redraw);
  return { draw: draw, redraw: redraw };
}
