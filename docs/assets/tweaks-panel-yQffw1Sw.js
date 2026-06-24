import{j as e}from"./jsx-runtime-u17CrQMm.js";const x=window.React,L=`
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;function E(i){const[t,r]=x.useState(i),a=x.useCallback((n,c)=>{const o=typeof n=="object"&&n!==null?n:{[n]:c};r(l=>({...l,...o})),window.parent.postMessage({type:"__edit_mode_set_keys",edits:o},"*"),window.dispatchEvent(new CustomEvent("tweakchange",{detail:o}))},[]);return[t,a]}function T({title:i,children:t}){const[r,a]=x.useState(!1),n=x.useRef(null),c=x.useRef({x:16,y:16}),o=16,l=i||window.I18n?.t("settings")||"Tweaks",h=window.I18n?.t("closeTweaks")||"Close tweaks",g=x.useCallback(()=>{const d=n.current;if(!d)return;const p=d.offsetWidth,w=d.offsetHeight,v=Math.max(o,window.innerWidth-p-o),s=Math.max(o,window.innerHeight-w-o);c.current={x:Math.min(v,Math.max(o,c.current.x)),y:Math.min(s,Math.max(o,c.current.y))},d.style.right=c.current.x+"px",d.style.bottom=c.current.y+"px"},[]);x.useEffect(()=>{if(!r)return;if(g(),typeof ResizeObserver>"u")return window.addEventListener("resize",g),()=>window.removeEventListener("resize",g);const d=new ResizeObserver(g);return d.observe(document.documentElement),()=>d.disconnect()},[r,g]),x.useEffect(()=>{const d=p=>{const w=p?.data?.type;w==="__activate_edit_mode"?a(!0):w==="__deactivate_edit_mode"&&a(!1)};return window.addEventListener("message",d),window.parent.postMessage({type:"__edit_mode_available"},"*"),()=>window.removeEventListener("message",d)},[]);const b=()=>{a(!1),window.parent.postMessage({type:"__edit_mode_dismissed"},"*")},f=d=>{const p=n.current;if(!p)return;const w=p.getBoundingClientRect(),v=d.clientX,s=d.clientY,u=window.innerWidth-w.right,k=window.innerHeight-w.bottom,m=y=>{c.current={x:u-(y.clientX-v),y:k-(y.clientY-s)},g()},N=()=>{window.removeEventListener("mousemove",m),window.removeEventListener("mouseup",N)};window.addEventListener("mousemove",m),window.addEventListener("mouseup",N)};return r?e.jsxs(e.Fragment,{children:[e.jsx("style",{children:L}),e.jsxs("div",{ref:n,className:"twk-panel","data-omelette-chrome":"",style:{right:c.current.x,bottom:c.current.y},children:[e.jsxs("div",{className:"twk-hd",onMouseDown:f,children:[e.jsx("b",{children:l}),e.jsx("button",{className:"twk-x","aria-label":h,onMouseDown:d=>d.stopPropagation(),onClick:b,children:"✕"})]}),e.jsx("div",{className:"twk-body",children:t})]})]}):null}function R({label:i,children:t}){return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"twk-sect",children:i}),t]})}function j({label:i,value:t,children:r,inline:a=!1}){return e.jsxs("div",{className:a?"twk-row twk-row-h":"twk-row",children:[e.jsxs("div",{className:"twk-lbl",children:[e.jsx("span",{children:i}),t!=null&&e.jsx("span",{className:"twk-val",children:t})]}),r]})}function M({label:i,value:t,min:r=0,max:a=100,step:n=1,unit:c="",onChange:o}){return e.jsx(j,{label:i,value:`${t}${c}`,children:e.jsx("input",{type:"range",className:"twk-slider",min:r,max:a,step:n,value:t,onChange:l=>o(Number(l.target.value))})})}function z({label:i,value:t,onChange:r}){return e.jsxs("div",{className:"twk-row twk-row-h",children:[e.jsx("div",{className:"twk-lbl",children:e.jsx("span",{children:i})}),e.jsx("button",{type:"button",className:"twk-toggle","data-on":t?"1":"0",role:"switch","aria-checked":!!t,onClick:()=>r(!t),children:e.jsx("i",{})})]})}function S({label:i,value:t,options:r,onChange:a}){const n=x.useRef(null),[c,o]=x.useState(!1),l=x.useRef(t);l.current=t;const h=s=>String(typeof s=="object"?s.label:s).length;if(!(r.reduce((s,u)=>Math.max(s,h(u)),0)<=({2:16,3:10}[r.length]??0))){const s=u=>{const k=r.find(m=>String(typeof m=="object"?m.value:m)===u);return k===void 0?u:typeof k=="object"?k.value:k};return e.jsx(_,{label:i,value:t,options:r,onChange:u=>a(s(u))})}const f=r.map(s=>typeof s=="object"?s:{value:s,label:s}),d=Math.max(0,f.findIndex(s=>s.value===t)),p=f.length,w=s=>{const u=n.current.getBoundingClientRect(),k=u.width-4,m=Math.floor((s-u.left-2)/k*p);return f[Math.max(0,Math.min(p-1,m))].value},v=s=>{o(!0);const u=w(s.clientX);u!==l.current&&a(u);const k=N=>{if(!n.current)return;const y=w(N.clientX);y!==l.current&&a(y)},m=()=>{o(!1),window.removeEventListener("pointermove",k),window.removeEventListener("pointerup",m)};window.addEventListener("pointermove",k),window.addEventListener("pointerup",m)};return e.jsx(j,{label:i,children:e.jsxs("div",{ref:n,role:"radiogroup",onPointerDown:v,className:c?"twk-seg dragging":"twk-seg",children:[e.jsx("div",{className:"twk-seg-thumb",style:{left:`calc(2px + ${d} * (100% - 4px) / ${p})`,width:`calc((100% - 4px) / ${p})`}}),f.map(s=>e.jsx("button",{type:"button",role:"radio","aria-checked":s.value===t,children:s.label},s.value))]})})}function _({label:i,value:t,options:r,onChange:a}){return e.jsx(j,{label:i,children:e.jsx("select",{className:"twk-field",value:t,onChange:n=>a(n.target.value),children:r.map(n=>{const c=typeof n=="object"?n.value:n,o=typeof n=="object"?n.label:n;return e.jsx("option",{value:c,children:o},c)})})})}function C({label:i,value:t,placeholder:r,onChange:a}){return e.jsx(j,{label:i,children:e.jsx("input",{className:"twk-field",type:"text",value:t,placeholder:r,onChange:n=>a(n.target.value)})})}function D({label:i,value:t,min:r,max:a,step:n=1,unit:c="",onChange:o}){const l=b=>r!=null&&b<r?r:a!=null&&b>a?a:b,h=x.useRef({x:0,val:0}),g=b=>{b.preventDefault(),h.current={x:b.clientX,val:t};const f=(String(n).split(".")[1]||"").length,d=w=>{const v=w.clientX-h.current.x,s=h.current.val+v*n,u=Math.round(s/n)*n;o(l(Number(u.toFixed(f))))},p=()=>{window.removeEventListener("pointermove",d),window.removeEventListener("pointerup",p)};window.addEventListener("pointermove",d),window.addEventListener("pointerup",p)};return e.jsxs("div",{className:"twk-num",children:[e.jsx("span",{className:"twk-num-lbl",onPointerDown:g,children:i}),e.jsx("input",{type:"number",value:t,min:r,max:a,step:n,onChange:b=>o(l(Number(b.target.value)))}),c&&e.jsx("span",{className:"twk-num-unit",children:c})]})}function A(i){const t=String(i).replace("#",""),r=t.length===3?t.replace(/./g,l=>l+l):t.padEnd(6,"0"),a=parseInt(r.slice(0,6),16);if(Number.isNaN(a))return!0;const n=a>>16&255,c=a>>8&255,o=a&255;return n*299+c*587+o*114>148e3}const B=({light:i})=>e.jsx("svg",{viewBox:"0 0 14 14","aria-hidden":"true",children:e.jsx("path",{d:"M3 7.2 5.8 10 11 4.2",fill:"none",strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round",stroke:i?"rgba(0,0,0,.78)":"#fff"})});function X({label:i,value:t,options:r,onChange:a}){if(!r||!r.length)return e.jsxs("div",{className:"twk-row twk-row-h",children:[e.jsx("div",{className:"twk-lbl",children:e.jsx("span",{children:i})}),e.jsx("input",{type:"color",className:"twk-swatch",value:t,onChange:o=>a(o.target.value)})]});const n=o=>String(JSON.stringify(o)).toLowerCase(),c=n(t);return e.jsx(j,{label:i,children:e.jsx("div",{className:"twk-chips",role:"radiogroup",children:r.map((o,l)=>{const h=Array.isArray(o)?o:[o],[g,...b]=h,f=b.slice(0,4),d=n(o)===c;return e.jsxs("button",{type:"button",className:"twk-chip",role:"radio","aria-checked":d,"data-on":d?"1":"0","aria-label":h.join(", "),title:h.join(" · "),style:{background:g},onClick:()=>a(o),children:[f.length>0&&e.jsx("span",{children:f.map((p,w)=>e.jsx("i",{style:{background:p}},w))}),d&&e.jsx(B,{light:A(g)})]},l)})})})}function I({label:i,onClick:t,secondary:r=!1}){return e.jsx("button",{type:"button",className:r?"twk-btn secondary":"twk-btn",onClick:t,children:i})}Object.assign(window,{useTweaks:E,TweaksPanel:T,TweakSection:R,TweakRow:j,TweakSlider:M,TweakToggle:z,TweakRadio:S,TweakSelect:_,TweakText:C,TweakNumber:D,TweakColor:X,TweakButton:I});
