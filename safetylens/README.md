# SafetyLens 作品集项目

SafetyLens 是一个面向实验室、EHS 和化工仓储场景的危化品 SDS 安全合规审核助手。它通过 LLM 结构化抽取 SDS 内容，再结合安全规则校验，生成化学品风险摘要、储存建议、PPE 要求和人工审核记录。

## 项目定位

这个项目用于展示 AI 产品经理在高风险场景下的产品判断：

- 不把 LLM 作为最终决策者。
- 用规则引擎处理明确安全约束。
- 对高风险结论引入人工审核和审计留痕。
- 用抽取准确率、高风险召回率、误报率和人工接管率衡量产品质量。

## 文件说明

- `prd.md`：完整 PRD。
- `user_research.md`：用户画像、访谈问题和需求洞察。
- `competitive_analysis.md`：竞品与替代方案分析。
- `case_study.md`：一页项目复盘。
- `metrics_and_eval.md`：指标、评测和上线门禁。
- `presentation_guide.md`：简历和面试展示指南。
- `interview_script.md`：项目讲述稿和追问回答。
- `data/sds_eval_set.csv`：SDS 抽取与风险校验样例评测集。
- `prototype/index.html`：可直接打开的静态交互原型。

## 简历一句话

独立设计 SafetyLens 危化品 SDS 智能审核助手，完成 SDS 文档抽取、危险类别识别、不相容物质校验、人工复核和审计留痕流程设计，重点体现 AI 在安全合规场景中的人机协同与风险控制。
