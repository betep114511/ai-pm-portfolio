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

- `chemdoc_ai/`：第一个完整作品集项目，包含 PRD、用户研究、竞品分析、评测集、Case Study、面试讲述稿和可打开原型。
- `safetylens/`：第二个完整作品集项目，强调 SDS 安全审核、人机协同、规则校验和审计留痕。
- `evalops_lite/`：第三个完整作品集项目，强调 LLM 评测、Prompt/模型对比、上线门禁和失败案例回流。
- `interviewmate_ai/`：补充作品集项目，强调 Agent 流程、JD 解析、多轮追问和评分 Rubric。
- `backend/`：FastAPI 服务，本地起一份即可让上面 4 个原型走真实 LLM。

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

## 本地 AI 调用

**安全设计**：GitHub Pages 公开版**不连**任何活的后端 —— 默认 URL 是 `http://127.0.0.1:8787`（您自己机器）。这是有意为之：

- 公开 demo 上不暴露任何能调用 LLM 的 endpoint，避免 API key 被陌生访客消费。
- 想看 mock 效果的访客直接看 fallback 数据，UI 不会崩、不会请求外部服务。
- 想看真实 LLM 的访客（包括您自己 / 您主动邀请的面试官）只需在本机跑一份后端，github.io 页面会自动检测并切到真实 LLM。

后端启动后，**所有 4 个原型 + 主页 AI 助手都会切换到真实 LLM**：

- 主页右上角「问问作品集」是流式 SSE 助手，可以让面试官用自然语言询问候选人背景、项目细节、指标定义。
- ChemDoc AI 支持粘贴任意 SOP/SDS/论文片段作为知识源，模型只在用户提供的 snippet 内回答并附引用。
- SafetyLens 支持粘贴任意化学品名 + SDS 段落 + 附加规则，AI 完成字段抽取 + 规则校验。
- EvalOps Lite 支持自由添加 case（Q/A/Gold/Risk），调用 LLM-as-Judge 批量打分。
- InterviewMate AI 支持粘贴任意 JD，多轮对话保留上下文，AI 流式追问 + 四维评分。

页面顶部的 runtime metadata bar 会显示 `backend / model / latency` 的实时状态。后端不可用时自动回到兜底数据，UI 不会崩。

### Mac 本地启动（推荐）

一次性安装：

```bash
git clone https://github.com/betep114511/ai-pm-portfolio.git
cd ai-pm-portfolio
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r backend/requirements.txt

cat > .env.local <<'EOF'
AI_API_KEY=<your-plat-or-openai-key>
AI_BASE_URL=https://super-relay.byted.org/v1
AI_MODEL=ark/k2
EOF
chmod 600 .env.local
```

每次启动：

```bash
cd ~/ai-pm-portfolio && source .venv/bin/activate && ./scripts/run_ai_backend.sh
# 监听 http://127.0.0.1:8787，Ctrl+C 干净停
```

然后浏览器打开 https://betep114511.github.io/ai-pm-portfolio/ — 顶部 backend pill 会自动从 `offline · mock` 切到 `localhost:8787 · online`，4 个原型全部接通真实 LLM。

> 现代浏览器（Chrome 67+ / Safari 15+）对 `http://localhost` 有 mixed-content 豁免，所以 HTTPS 的 github.io 可以直接 fetch 您 Mac 上 HTTP 的 8787 端口，不需要任何 tunnel / 代理。

### 远程后端（可选）

如果您把后端跑在 devbox / 云服务器 / cloudflared tunnel 上，在 github.io 页面的 DevTools Console 里：

```js
localStorage.setItem("AI_BACKEND_URL", "https://your-backend.example.com");
location.reload();
```

撤销：`localStorage.removeItem("AI_BACKEND_URL"); location.reload();`

**注意**：远程后端 URL 一旦写进公开 repo 就等于把您的 API key 配额开放给互联网；推荐只在 localStorage 里保存私有 URL，不要 commit 进代码。

### 后端 API 一览

| 端点 | 类型 | 用途 |
| --- | --- | --- |
| `GET /health` | JSON | 健康检查 + 模型与 base_url 信息 |
| `POST /api/chemdoc/ask` | JSON | ChemDoc — 基于用户 snippet 的引用式回答 |
| `POST /api/safetylens/analyze` | JSON | SafetyLens — SDS 字段抽取 + 规则校验 |
| `POST /api/evalops/judge` | JSON | EvalOps — 批量 LLM-as-Judge 评分 |
| `POST /api/interviewmate/coach` | JSON | InterviewMate — 评分 + 反馈 + 训练计划 |
| `POST /api/interviewmate/chat/stream` | SSE | InterviewMate — 流式多轮追问 |
| `POST /api/portfolio/ask/stream` | SSE | 主页 AI 助手 — 流式问答 |
| `POST /api/chat/stream` | SSE | 通用流式 chat（自定义 system + history） |

安全提醒：

- 不要把 API key 写进任何 `.js`、`.md`、`.html` 文件。
- 不要提交 `.env`。
- `backend/.env.example` 只是模板，不包含真实 key。

## 参考方向

近期 AI PM 岗位普遍强调：从用户痛点定义产品、制定 roadmap、跨团队协作、定义模型/产品指标、做 eval、管理安全与可靠性风险。参考：

- [OpenAI Product Manager, Multimodal](https://openai.com/careers/product-manager-multimodal/)
- [OpenAI Product Manager, API Agents](https://openai.com/careers/product-manager-api-agents-san-francisco/)
- [OpenAI Enterprise Product Manager, AI Solutions](https://openai.com/careers/enterprise-product-manager-ai-solutions-san-francisco/)
- [Singapore WSG Gen AI Product Manager skill map](https://www.wsg.gov.sg/docs/default-source/content/jobs-transformation-map/genai/product-manager.pdf?sfvrsn=60eecb86_3)
