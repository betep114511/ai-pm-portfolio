# AI 产品经理转岗作品集

这套材料按“能写进简历、能在面试里讲清楚、后续能快速补成真实作品”的标准来设计。你的化学背景不一定是劣势，最适合包装成“垂直行业理解 + AI 产品化能力”：不和计算机候选人拼算法深度，而是证明你能把复杂专业场景拆成用户需求、数据流、指标和上线风险。

## 推荐求职定位

优先投这些岗位：

- AI 产品经理 / AIGC 产品经理助理 / AI 解决方案产品
- 垂直行业 AI 产品：医药、化工、材料、实验室信息化、知识库、企业内效工具
- LLM 应用产品：RAG 知识库、智能客服、Agent 工作流、模型评估平台
- 数据与标注产品：模型评测、人工审核、数据闭环、质量管理

不建议一上来主攻这些岗位：

- 纯算法平台 PM，要求 ML infra、训练平台、分布式系统很深
- 高级 AI PM，要求 3-6 年真实上线经验
- 纯 ToC 增长 PM，和你的化学背景关联较弱

## 简历主线

建议用一句话定位自己：

> 化学背景转 AI 产品，擅长把专业知识场景拆解为 LLM/RAG 产品方案，能完成需求分析、原型设计、Prompt/评测方案、指标体系与风险闭环。

简历关键词可以覆盖：

- 产品能力：用户访谈、PRD、竞品分析、MVP、RICE 优先级、需求拆解、路线图
- AI 应用：LLM、RAG、Embedding、Prompt Engineering、Agent、Tool Calling、LLM-as-Judge
- 指标评估：准确率、召回率、幻觉率、引用命中率、任务完成率、人工接管率、响应延迟、Token 成本
- 业务经验：化学文献、实验 SOP、安全合规、配方/材料研发、实验室效率

## 作品集组合

建议最终放 3 个项目在简历上：

1. ChemDoc AI：化学文献与实验 SOP 智能问答助手
2. SafetyLens：危化品 SDS 安全合规审核助手
3. EvalOps Lite：LLM 应用质量评估与迭代看板

第 4 个项目可以作为补充：InterviewMate AI 面试陪练 Agent。它更偏通用 AI 应用，适合证明你会做 Agent 流程和用户成长闭环，但主简历不一定要放满。

## 21 天落地计划

第 1-3 天：完成 3 个项目的 PRD、用户画像、核心流程图、指标定义。

第 4-7 天：用 Figma、墨刀、飞书多维表、Notion 或简单网页做可点击原型。每个项目至少 5 个页面：入口、上传/输入、AI 输出、人工反馈、数据看板。

第 8-12 天：补 10 条样例数据和评测表。即使没有真实开发，也要能展示“怎么判断 AI 答得好不好”。

第 13-16 天：每个项目写一页 Case Study：背景、问题、方案、指标、风险、迭代。

第 17-21 天：准备面试讲法。每个项目练一版 2 分钟、5 分钟、10 分钟讲述。

## 材料说明

- `projects_for_resume.md`：可直接做作品集/简历项目的 4 个项目方案。
- `resume_snippets.md`：简历项目经历、个人介绍、转行解释话术。
- `interview_guide_ai_pm.md`：AI 产品经理面经、题库和回答框架。
- `chemdoc_ai/`：已完成的第一个完整作品集项目，包含 PRD、用户研究、竞品分析、评测集、Case Study、面试讲述稿和可打开原型。
- `safetylens/`：已完成的第二个完整作品集项目，强调 SDS 安全审核、人机协同、规则校验和审计留痕。
- `evalops_lite/`：已完成的第三个完整作品集项目，强调 LLM 评测、Prompt/模型对比、上线门禁和失败案例回流。
- `interviewmate_ai/`：已完成的补充作品集项目，强调 Agent 流程、JD 解析、多轮追问和评分 Rubric。
- `portfolio_presentation_guide.md`：三个项目如何串成一条作品集主线。

## 已完成项目矩阵

### ChemDoc AI

推荐优先展示：

1. `chemdoc_ai/case_study.md`
2. `chemdoc_ai/prototype/index.html`
3. `chemdoc_ai/metrics_and_eval.md`
4. `chemdoc_ai/data/eval_set.csv`

### SafetyLens

推荐优先展示：

1. `safetylens/case_study.md`
2. `safetylens/prototype/index.html`
3. `safetylens/metrics_and_eval.md`
4. `safetylens/data/sds_eval_set.csv`

### EvalOps Lite

推荐优先展示：

1. `evalops_lite/case_study.md`
2. `evalops_lite/prototype/index.html`
3. `evalops_lite/metrics_and_eval.md`
4. `evalops_lite/data/eval_cases.csv`

### InterviewMate AI

推荐作为补充展示：

1. `interviewmate_ai/prototype/index.html`
2. `interviewmate_ai/case_study.md`
3. `interviewmate_ai/metrics_and_eval.md`
4. `interviewmate_ai/data/question_bank.csv`

## 参考方向

近期 AI PM 岗位普遍强调：从用户痛点定义产品、制定 roadmap、跨团队协作、定义模型/产品指标、做 eval、管理安全与可靠性风险。参考：

- [OpenAI Product Manager, Multimodal](https://openai.com/careers/product-manager-multimodal/)
- [OpenAI Product Manager, API Agents](https://openai.com/careers/product-manager-api-agents-san-francisco/)
- [OpenAI Enterprise Product Manager, AI Solutions](https://openai.com/careers/enterprise-product-manager-ai-solutions-san-francisco/)
- [Singapore WSG Gen AI Product Manager skill map](https://www.wsg.gov.sg/docs/default-source/content/jobs-transformation-map/genai/product-manager.pdf?sfvrsn=60eecb86_3)
