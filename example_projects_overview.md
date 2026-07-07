# Example Projects Overview

## 1. 说明

下面三个示例用于说明“生物元件库”与“人工神经网络/系统建模”的示范用途。它们不代表平台本体中固定的研究领域，而是用于展示不同类型的建模逻辑与元件组织方式。

> 需要特别说明：Water quality monitor 是一个 example project，而不是平台本体的固定领域。它主要用于演示“如何把非生物学领域的问题映射为通用元件建模流程”，并不意味着平台的核心对象必须限定在水质监测领域。

---

## 2. 示例一：Signal integration model

### 2.1 通路图

```text
Input A --> Node 1 --> Merge --> Output
Input B --> Node 2 --> Merge --> Output
Input C --> Node 3 --> Merge --> Output
```

### 2.2 说明

这个例子展示的是“多个输入一起进入多个节点，然后被整合成一个输出”。

- 输入：A、B、C
- 处理：多个节点分别处理后汇合
- 输出：一个整合结果

### 2.3 数值说明

这里的数值多是示意值或待标定值，例如：

- threshold_voltage = -55 mV（阈值电压，触发门槛）
- synaptic_weight = 0.8（突触权重，影响大小）
- firing_rate = 10 Hz（放电频率，每秒触发次数）

---

## 3. 示例二：Logic AND gate

### 3.1 通路图

```text
Condition A --> AND Gate --> Output
Condition B --> AND Gate --> Output
```

### 3.2 说明

这个例子展示的是“只有多个条件同时满足时，才会产生输出”。

- 输入：Condition A、Condition B
- 处理：AND Gate 进行逻辑判断
- 输出：只有两者都成立时才输出

### 3.3 数值说明

这里的数值也是示意值或待标定值，例如：

- activation_threshold = 1.0（激活阈值，达到就触发）
- input_weight_A = 0.5（输入 A 的权重，影响大小）
- input_weight_B = 0.5（输入 B 的权重，影响大小）

---

## 4. 示例三：Water quality monitor

### 4.1 通路图

```text
pH value --> Monitor Module --> Warning / Normal
Turbidity --> Monitor Module --> Warning / Normal
Conductivity --> Monitor Module --> Warning / Normal
```

### 4.2 说明

这个例子展示的是“多个观测指标一起进入监控模块，然后得到一个判断结果”。

- 输入：pH、Turbidity、Conductivity
- 处理：Monitor Module 进行综合判断
- 输出：Warning 或 Normal

### 4.3 数值说明

这里的数值多是示范值或待标定值，例如：

- pH_threshold = 7.0（pH 阈值，酸碱界限）
- turbidity_limit = 5.0 NTU（浊度上限，越高越浑浊）
- conductivity_warning = 1000 μS/cm（导电率警戒值，超高就报警）

### 4.4 重要说明

Water quality monitor 只是一个 example project，不是平台本体的固定领域。它的作用是说明平台可以用来做跨领域示范，而不是说平台只能围绕水质监测展开。

---

## 5. 三个示例的简单总结

- Signal integration model：多个输入一起进入，最后得到一个整合结果。
- Logic AND gate：多个条件同时满足时才输出。
- Water quality monitor：多个观测指标进入监控模块，输出判断结果。

---

## 6. 一句话结论

这三个示例分别说明了：

1. 如何把多个输入整合成输出；
2. 如何用逻辑条件决定输出；
3. 如何把一个非生物领域的例子映射到通用建模流程中。