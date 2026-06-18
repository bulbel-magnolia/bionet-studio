# Project Schema 草案 v0.1

本文档描述 `bionet-studio` 当前代码实际使用的项目 JSON 结构。  

---

## 1. 顶层结构

一个完整的 `Project` 推荐包含：

```js
{
  meta,
  nodes,
  edges,
  params,
  aggregate,
  readouts,
  channels
}
```

当前导入 JSON 时，最低要求是：

```js
{
  nodes: [],
  edges: []
}
```

但为了保证导出、导入、仿真、读出和 A/B 对比稳定，推荐完整保存所有字段。

---

## 2. `meta`

`meta` 保存项目信息。

```js
{
  id: "starter",
  name: "Signal integration model",
  kind: "example",
  domain: "Starter template",
  note: "A neutral multi-input network."
}
```

关键字段：

```text
id       项目 ID
name     项目名称
kind     项目类型，例如 example / user
domain   所属领域
note     项目说明
```

导入项目时，如果没有 `meta`，代码会补默认值。  
导入后 `meta.kind` 会被设置为：

```js
"user"
```

---

## 3. `nodes`

`nodes` 保存网络节点。

```js
[
  {
    id: "in_a",
    kind: "sensor",
    label: "Input A",
    x: 100,
    y: 160,
    C: 1,
    Km: 0.5,
    n: 2,
    weight: 1
  }
]
```

当前代码使用：

```js
node.kind
```

而不是：

```js
node.type
```

当前主要节点类型：

```js
"sensor"
"signal"
"response"
"memory"
"reporter"
```

仿真计算顺序大致是：

```text
sensor → signal → response → memory → reporter
```

常见节点参数：

```text
id        节点唯一 ID
kind      节点类型
label     显示名称
x, y      画布位置

C         sensor 输入浓度 / 输入水平
Km        sensor Hill 半最大参数
n         sensor Hill 系数
weight    sensor 输入权重

bias      非 sensor 节点偏置
gain      非 sensor 节点增益
gainOut   reporter 输出增益
latch     memory 锁存相关参数
```

---

## 4. `edges`

`edges` 保存节点之间的连接。

```js
[
  {
    id: "e_in_a_out",
    from: "in_a",
    to: "out_1",
    w: 1
  }
]
```

当前代码使用：

```js
edge.from
edge.to
edge.w
```

不要写成：

```js
edge.source
edge.target
edge.weight
```

含义：

```text
from    起点节点 ID
to      终点节点 ID
w       边权重
```

权重含义：

```text
w > 0   激活
w < 0   抑制
w = 0   无影响
```

---

## 5. `params`

`params` 保存全局仿真参数。

```js
{
  tMax: 24,
  tau: 4.0
}
```

关键字段：

```text
tMax   仿真最大时间
tau    动力学时间常数
```

当前代码中还兼容：

```js
params.aggregate
```

但推荐使用顶层：

```js
project.aggregate
```

---

## 6. `aggregate`

`aggregate` 定义综合输出 `score` 的来源。

```js
{
  label: "Aggregate output",
  mode: "outputs",
  channels: ["out_1", "out_2", "out_3"],
  method: "mean",
  unit: "a.u."
}
```

关键字段：

```text
label      综合输出名称
mode       综合输出模式
channels   参与综合输出的通道
method     综合方法，当前常见为 mean
unit       单位
```

当前常见模式：

```js
"outputs"
"inputs"
"weightedSensors"
```

推荐默认使用：

```js
mode: "outputs"
```

---

## 7. `channels`

`channels` 保存输出通道的显示信息。

```js
{
  out_1: {
    label: "Channel 1",
    sub: "output"
  },
  out_2: {
    label: "Channel 2",
    sub: "output"
  }
}
```

它主要用于 UI 展示和读出面板。  
如果项目有多个输出，建议保存该字段。

---

## 8. `readouts`

`readouts` 定义底部结果读出面板。

```js
[
  {
    id: "ro_timeseries",
    type: "timeseries",
    label: "Aggregate output",
    config: {
      channels: ["score"]
    }
  }
]
```

当前代码使用：

```js
readout.type
readout.config
```

常见读出类型：

```js
"timeseries"
"classification"
"channels"
"heatmap"
"truth"
"dose"
```

常见配置示例：

```js
{
  type: "timeseries",
  config: {
    channels: ["score"]
  }
}
```

```js
{
  type: "channels",
  config: {
    channels: ["out_1", "out_2", "out_3"]
  }
}
```

```js
{
  type: "classification",
  config: {
    channel: "score",
    thresholds: [0.3, 0.7],
    labels: [
      { name: "low", color: "var(--st-idle)" },
      { name: "mid", color: "var(--accent)" },
      { name: "high", color: "var(--k-response)" }
    ],
    latch: false
  }
}
```

```js
{
  type: "truth",
  config: {
    inputs: ["in_a", "in_b"],
    channel: "score",
    threshold: 0.5
  }
}
```

```js
{
  type: "heatmap",
  config: {}
}
```

---

## 9. 推荐导出格式

推荐 JSON 文件外层使用：

```js
{
  project: {
    meta,
    nodes,
    edges,
    params,
    aggregate,
    readouts,
    channels
  }
}
```

当前代码也兼容：

```js
{
  model: {
    nodes: [],
    edges: []
  }
}
```

但建议统一使用：

```js
project
```

---

## 10. 最小可用示例

```json
{
  "project": {
    "meta": {
      "id": "and",
      "name": "Logic AND gate",
      "kind": "example",
      "domain": "Genetic logic",
      "note": "Two-input gate with a truth table."
    },
    "nodes": [
      {
        "id": "in_a",
        "kind": "sensor",
        "label": "Input A",
        "x": 100,
        "y": 120,
        "C": 1,
        "Km": 0.5,
        "n": 2,
        "weight": 1
      },
      {
        "id": "in_b",
        "kind": "sensor",
        "label": "Input B",
        "x": 100,
        "y": 240,
        "C": 1,
        "Km": 0.5,
        "n": 2,
        "weight": 1
      },
      {
        "id": "nd_q",
        "kind": "response",
        "label": "AND node",
        "x": 540,
        "y": 180,
        "bias": -3,
        "gain": 3.8
      },
      {
        "id": "out_q",
        "kind": "reporter",
        "label": "Output Q",
        "x": 835,
        "y": 180,
        "bias": -2.4,
        "gain": 3.6,
        "gainOut": 1
      }
    ],
    "edges": [
      {
        "from": "in_a",
        "to": "nd_q",
        "w": 2
      },
      {
        "from": "in_b",
        "to": "nd_q",
        "w": 2
      },
      {
        "from": "nd_q",
        "to": "out_q",
        "w": 3.2
      }
    ],
    "params": {
      "tMax": 18,
      "tau": 3
    },
    "aggregate": {
      "label": "Gate output",
      "mode": "outputs",
      "channels": ["out_q"],
      "method": "mean",
      "unit": "state"
    },
    "readouts": [
      {
        "id": "ro_truth",
        "type": "truth",
        "label": "Truth table",
        "config": {
          "inputs": ["in_a", "in_b"],
          "channel": "nd_q",
          "threshold": 0.5
        }
      },
      {
        "id": "ro_timeseries",
        "type": "timeseries",
        "label": "Gate output",
        "config": {
          "channels": ["score"]
        }
      }
    ],
    "channels": {
      "out_q": {
        "label": "Output Q",
        "sub": "gate"
      }
    }
  }
}
```

---

## 11. 最关键规范

当前项目必须遵守这些字段名：

```js
node.kind
edge.from
edge.to
edge.w
project.aggregate
readout.type
readout.config
```

而非：

```js
node.type
edge.source
edge.target
edge.weight
```

总结：

```text
Project 的核心结构就是 meta + nodes + edges + params + aggregate + readouts + channels；
其中 nodes 和 edges 是最低必需字段，其他字段用于保证仿真、读出和导入导出的完整性。
```