# bionet-studio

> Design and predict genetic circuits as neural networks — an open, client-side workbench for synthetic-biology teams.

**把生物线路当神经网络来「设计 + 预测」的纯前端开放工作台。**

bionet-studio lets you lay a genetic circuit out as a layered network — input layer
(sensor parts) → hidden layer (promoter / receptor crosstalk = weights) → output layer
(reporter parts) — then **predict** its input–output behaviour forward, and **design** it
backward by training parameters toward a target function.

Built for all iGEM / synbio teams. Parts are *structurally real, values illustrative and
marked for calibration*; verifiable iGEM Registry / literature parameters are used where
available.

## Status

Early planning — milestone **M0**. This repo currently holds:

- `平台规划/` — the living project plan: vision, concept model, architecture, roadmap (M0–M6) and the anti-hallucination data discipline.
- `demos/demo3-通用平台/` — the working single-neuron prototype (zero-dependency, offline HTML; the math kernel and design system the platform builds on).
- `预览图/` — UI design mock-ups (dark "console" / light "lab bench" themes).

The production platform (multilayer engine + parts library + SPA) is being built per the roadmap in the plan.

## Concept

| Neural network | Genetic circuit |
|---|---|
| input node | sensor part (analyte → signal, Hill-encoded) |
| weight matrix | promoter / receptor crosstalk (non-orthogonality) |
| activation | promoter non-linear response (Hill / sigmoid) |
| output node | reporter part |
| memory | bistable latch |
| training | tuning promoter strength / receptor count / copy number |

Full design: [`平台规划/01_总体规划_v0.1.md`](平台规划/01_总体规划_v0.1.md).

## License

[MIT](LICENSE). Released open-source in keeping with iGEM's software requirements.
