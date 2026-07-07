# Element Library Field Definition

## 1. 目标

本文档用于定义“生物元件库”中单个元件记录应包含的字段结构，以及每个字段的注释说明，便于后续查资料、录入数据和统一建库。

---

## 2. 字段结构

| 字段名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| element_id | string | 是 | 元件在平台中的唯一标识。 |
| name | string | 是 | 元件名称，建议使用标准术语。 |
| type | string | 是 | 元件类别，例如 neuron、synapse、receptor、ion_channel。 |
| biological_role | string | 是 | 元件在生物系统中的功能角色。 |
| layer | string | 是 | 元件所处的网络层级或生物结构层级。 |
| parameters | object | 是 | 元件的关键参数集合，建议结构化存储。 |
| source | string | 是 | 参数与元件信息的来源，例如文献、数据库、实验数据。 |
| confidence | string | 是 | 对信息可信度的评估，建议使用 High / Medium / Low。 |
| calibration_status | string | 是 | 参数是否已标定，以及标定方式。 |
| notes | string | 否 | 备注说明，如限制条件、假设或后续核查信息。 |

---

## 3. 字段注释说明

### 3.1 element_id
- 作用：唯一标识一个元件。
- 要求：在整个元件库中保持唯一。
- 建议格式：BIO-NEURON-001、E001 等。

### 3.2 name
- 作用：记录元件的名称。
- 要求：尽量使用通用且标准的生物学术语。
- 示例：兴奋性神经元、谷氨酸受体、Na+ 通道。

### 3.3 type
- 作用：说明元件属于哪一类。
- 常见类型：neuron、synapse、receptor、ion_channel、gene_regulator。

### 3.4 biological_role
- 作用：说明元件在生物系统中的功能角色。
- 示例：信号传递、兴奋性调控、离子平衡、突触整合。

### 3.5 layer
- 作用：说明元件在系统中的层级位置。
- 示例：input_layer、hidden_layer_1、cortex_layer_III。

### 3.6 parameters
- 作用：记录元件的关键参数。
- 要求：建议以结构化对象形式记录，至少包含参数名、数值、单位、来源、标定状态。
- 示例：阈值电压、放电频率、膜电阻等。

### 3.7 source
- 作用：说明参数和元件信息的来源。
- 建议内容：文献 DOI、数据库名称、实验数据集、模型假设。

### 3.8 confidence
- 作用：评估信息的可信度。
- 建议取值：High、Medium、Low。

### 3.9 calibration_status
- 作用：说明参数是否已被标定，以及标定依据。
- 建议取值：calibrated、partially_calibrated、estimated、not_calibrated、pending_validation。

### 3.10 notes
- 作用：补充说明。
- 可记录：限制条件、假设、未解决问题、后续校验建议。

---

## 4. 推荐记录模板

| element_id | name | type | biological_role | layer | parameters | source | confidence | calibration_status | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BIO-NEURON-001 | 兴奋性神经元 | neuron | 信号传递与兴奋性整合 | hidden_layer_1 | threshold_voltage=-55 mV; firing_rate=10 Hz | 文献 DOI；实验数据补充 | Medium | partially_calibrated | 部分参数来自实验测量，其余为模型估计 |

---

## 5. 说明

该字段表的重点是：
- 明确每个字段的用途；
- 统一录入标准；
- 为后续查资料、入库和数据对齐提供统一框架。