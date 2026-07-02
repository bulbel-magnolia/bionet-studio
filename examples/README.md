# bionet-studio 示例项目说明

本目录用于解释 bionet-studio 当前内置示例的用途、展示能力和可信边界。示例项目用于展示平台工作流，不代表平台只能服务这些应用。

所有示例参数均为 **illustrative / 待标定**，除非明确带有可核实来源。

---

## 示例总览

| 示例 | 类型 | 主要展示能力 |
|---|---|---|
| Signal integration model | 默认通用模板 | 多输入网络、综合输出、时间序列、分类读出 |
| Logic AND gate | 基因逻辑示例 | 逻辑门、真值表、阈值判定 |
| Multi-output reporter | 多输出示例 | 多报告器通道、通道曲线、层活性 |
| Licorice quality example | 应用示例 | 领域输入命名、质量指数、等级分类、剂量响应 |

---

## 1. Signal integration model

这是平台的默认起点。它不对应任何特定应用，而是展示一个通用的多输入、多层、多输出网络如何被搭建和仿真。

适合演示：

```text
1. 调整输入水平
2. 查看节点活性变化
3. 查看综合输出 score
4. 使用 decision rule 判断状态
5. 导出 JSON 复现项目
```

可信边界：

```text
该示例中的节点参数、边权重和阈值都是示意值，不代表真实生物元件参数。
```

---

## 2. Logic AND gate

该示例展示两个输入如何通过非线性响应节点形成 AND 行为。

适合演示：

```text
1. 低/高输入组合
2. 真值表读出
3. 阈值判断
4. 逻辑输出 Q(t)
```

该示例强调平台不仅能表达连续信号整合，也能表达离散逻辑行为。

可信边界：

```text
当前 AND 行为由示意参数构造，用于说明建模方式，不对应某个具体已标定遗传线路。
```

---

## 3. Multi-output reporter

该示例展示一个网络同时驱动多个输出通道。

适合演示：

```text
1. 多报告器通道
2. 输出通道曲线叠加
3. 综合输出 score
4. 层活性 heatmap
```

该示例适合说明平台如何处理多输出设计，例如多个荧光报告器、多个判定通道或多个下游响应。

可信边界：

```text
输出通道亮度、成熟时间和权重均为示意值。真实报告器参数需要来自文献、Registry 或实验标定。
```

---

## 4. Licorice quality example

该示例展示平台如何被一个具体应用项目复用。它把三类归一化成分信号整合为一个示意性的甘草质量指数。

输入包括：

```text
三萜皂苷信号
黄酮类信号
酚酸类信号
```

输出包括：

```text
甘草质量指数
质量等级
示例输出通道
剂量响应
层活性
```

适合演示：

```text
1. 把通用输入节点改成领域输入
2. 把综合输出改成质量指数
3. 使用 classification 显示质量等级
4. 使用 dose-response 查看单一输入对质量指数的影响
5. 导出项目 JSON，说明应用示例可以复现和迁移
```

必须说明：

```text
该示例使用 normalized a.u. 输入和 illustrative 参数，不等同于真实甘草质量检测结果。
真实应用需要用实验数据标定传感器响应、输入归一化方式、聚合权重和判定阈值。
```

---

## 5. 推荐演示流程

```text
打开默认 Signal integration model
  → 调整 Input A / Input B
  → 观察 score 和 decision rule
  → 保存 Snapshot A
  → 修改输入或边权重
  → 保存 Snapshot B
  → 打开 A/B Compare
  → 展示 final、peak、t50 和 decision 的变化
  → 导出 JSON
  → 切换到 Licorice quality example
  → 说明甘草是应用示例，不是平台主线
```

---

## 6. 示例项目写作口径

推荐说法：

```text
This example demonstrates how the generic platform workflow can be adapted to a domain-specific task.
```

中文：

```text
该示例展示通用平台工作流如何适配一个具体应用任务。
```

避免说法：

```text
平台专门用于某一个检测任务。
示例结果是真实实验预测。
示例参数已经完成湿实验标定。
```

---

## 7. 后续计划

后续可以把每个内置示例导出为独立 JSON 文件，放入本目录：

```text
examples/starter.json
examples/and-gate.json
examples/multi-output.json
examples/licorice-quality.json
```

每个 JSON 应包含：

```text
project meta
nodes
edges
params
aggregate
readouts
calibration_status
source notes
```
