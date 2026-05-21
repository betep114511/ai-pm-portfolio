# AI PM 作品集总展示指南

## 作品集主线

你的作品集不要讲成“三四个无关项目”，而要讲成一个能力矩阵：

1. ChemDoc AI：垂直行业 AI 应用，证明你能从化学场景拆需求。
2. SafetyLens：高风险 AI 合规产品，证明你理解人机协同和责任边界。
3. EvalOps Lite：LLM 评测平台，证明你知道 AI 产品如何上线和迭代。
4. InterviewMate AI：Agent 补充项目，证明你能设计多轮任务流程和评分 Rubric。

一句话总定位：

> 我的作品集围绕专业知识密集型场景展开：先用 RAG 解决知识问答，再用人机协同处理安全合规，最后用 EvalOps 解决 AI 功能上线前的质量评估。

## 简历项目排序

如果只放 2 个：

1. ChemDoc AI
2. EvalOps Lite

如果放 3 个主项目：

1. ChemDoc AI
2. SafetyLens
3. EvalOps Lite

原因：

- ChemDoc AI 最贴你的化学背景。
- SafetyLens 强化“安全/合规/人审”差异化。
- EvalOps Lite 拉高 AI PM 专业度。
- InterviewMate AI 放在作品集里作为加分项即可，简历不一定写满。

## 面试 10 分钟展示路线

### 第 1 分钟：总介绍

> 我用三个个人项目补齐 AI 产品经理的核心能力。ChemDoc AI 解决化学实验知识问答，SafetyLens 解决 SDS 安全审核，EvalOps Lite 解决 LLM 应用上线前的评测和门禁。它们分别对应场景理解、风险控制和评测迭代。

### 第 2-5 分钟：讲 ChemDoc AI

打开：

`chemdoc_ai/prototype/index.html`

重点说：

- 为什么化学场景不能做普通聊天机器人。
- 为什么用 RAG。
- 为什么强制引用和拒答。
- 如何用引用命中率、幻觉率、拒答正确率评估。

### 第 5-7 分钟：讲 SafetyLens

打开：

`safetylens/prototype/index.html`

重点说：

- AI 只做抽取和证据整理。
- 规则引擎处理明确安全约束。
- 高风险项必须人审。
- 审计日志用于合规留痕。

### 第 7-9 分钟：讲 EvalOps Lite

打开：

`evalops_lite/prototype/index.html`

重点说：

- AI 产品上线不能只靠试 prompt。
- 测试集、指标、失败归因、上线门禁。
- 线上失败样本回流到回归测试。

### 第 9-10 分钟：收尾

> 这三个项目共同体现的是，我不是把 AI 当成一个聊天框，而是把它放进真实业务流程里，考虑数据来源、用户流程、质量指标、风险边界和迭代闭环。

如果面试官对 Agent 或教育/求职工具感兴趣，可以追加展示 `interviewmate_ai/prototype/index.html`，用 1 分钟说明 JD 解析、多轮追问和评分 Rubric。

## 简历链接写法

如果只有 GitHub Pages 链接：

```text
作品集：ChemDoc AI 化学知识库问答助手
https://betep114511.github.io/chemdoc-ai/
```

如果后续把三个项目合并到一个总作品集仓库：

```text
AI 产品经理作品集：RAG 问答、SDS 安全审核、LLM 评测平台
https://github.com/betep114511/ai-pm-portfolio
```

## 面试官可能质疑：这些都是个人项目，含金量够吗？

回答：

> 我会明确说这是个人作品集项目，不包装成真实上线项目。但我不是只做概念，而是按真实产品流程做了用户画像、PRD、原型、指标、评测集和风险闭环。我的目标是证明自己具备进入 AI PM 岗位的基础能力，后续进入团队后可以先从需求分析、原型、评测和数据闭环模块贡献。

## 最推荐你背熟的三句话

- ChemDoc AI：专业知识场景里，AI 的可信度来自可追溯引用，而不是回答流畅。
- SafetyLens：高风险场景里，AI 应该提效和整理证据，不能替代合规责任人。
- EvalOps Lite：AI 产品上线不是感觉变好，而是通过测试集、指标、门禁和回归样本证明变好。
