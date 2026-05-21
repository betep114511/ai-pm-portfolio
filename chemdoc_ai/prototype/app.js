const answers = {
  "配置稀盐酸前需要确认哪些安全事项？": {
    risk: "medium",
    riskText: "中风险",
    confidence: "86%",
    title: "配置稀盐酸前需要确认 PPE、通风橱、加酸入水和废液分类。",
    body: "配置前应确认护目镜、防酸手套、实验服和通风条件；操作时遵循加酸入水原则，容器需要清晰标识，剩余液体进入酸性废液流程。",
    safety: "该问题涉及腐蚀性试剂，建议由熟悉 SOP 的人员确认后再进行操作。若 SOP 与 SDS 描述不一致，以实验室最新版 SOP 和安全负责人意见为准。",
    retrieval: "Top-5 片段 · SOP 优先 · SDS 补充",
    citations: [
      {
        title: "SOP-酸碱溶液配置 · 第 2 节",
        text: "酸液稀释应在通风条件下进行，容器需贴明浓度和日期标签。"
      },
      {
        title: "SDS-盐酸 · 防护措施",
        text: "建议佩戴护目镜、防护手套和实验服，避免吸入酸雾。"
      }
    ]
  },
  "论文中聚合反应的温度是多少？": {
    risk: "low",
    riskText: "低风险",
    confidence: "91%",
    title: "论文实验部分显示该聚合反应在 65 摄氏度条件下进行。",
    body: "检索到的实验片段描述了反应温度和持续时间。当前回答只基于论文实验部分，不补充文献外条件。",
    safety: "该问题主要是文献条件查询。若用于真实复现实验，还需要结合课题组 SOP 和导师确认。",
    retrieval: "Top-3 片段 · 论文实验部分",
    citations: [
      {
        title: "Paper-Polymer-2024 · Experimental",
        text: "The polymerization mixture was maintained at 65 C under nitrogen atmosphere."
      },
      {
        title: "Paper-Polymer-2024 · Table S1",
        text: "Reaction temperature: 65 C; atmosphere: N2."
      }
    ]
  },
  "乙醚可以放在热源旁边吗？": {
    risk: "high",
    riskText: "高风险",
    confidence: "94%",
    title: "不可以。乙醚应远离热源、火源和强氧化剂储存。",
    body: "SDS 片段显示乙醚属于高度易燃液体，储存时应保持容器密闭并远离热源、火花和不相容物质。",
    safety: "该问题触发高风险储存规则。建议立即对照实验室易燃品储存 SOP，并由安全管理员确认当前存放位置。",
    retrieval: "Top-4 片段 · SDS 强匹配",
    citations: [
      {
        title: "SDS-乙醚 · 储存条件",
        text: "Keep away from heat, sparks, open flames and oxidizing materials."
      },
      {
        title: "SOP-易燃品储存 · 第 1 节",
        text: "易燃液体应存放于指定防火柜，远离热源和氧化剂。"
      }
    ]
  },
  "没有 SOP 的情况下能不能直接按网上步骤做危险反应？": {
    risk: "high",
    riskText: "高风险",
    confidence: "97%",
    title: "不能。该请求缺少可靠 SOP 和安全审批，应拒绝直接给出操作建议。",
    body: "系统未检索到可执行的内部 SOP。对于危险反应，不能仅依据网上步骤开展实验，需要补充 SOP、风险评估和负责人确认。",
    safety: "已触发拒答策略：无可靠来源 + 高风险实验。建议创建 SOP 审核任务并联系导师或 EHS 负责人。",
    retrieval: "Top-2 片段 · 审批流程命中",
    citations: [
      {
        title: "SOP-实验审批流程 · 高风险实验",
        text: "高风险实验需完成书面风险评估，并经负责人确认后执行。"
      },
      {
        title: "实验室安全守则 · 第 4 节",
        text: "未建立 SOP 的实验不得由新人独立开展。"
      }
    ]
  },
  "HPLC 样品进样前要过滤吗？": {
    risk: "low",
    riskText: "低风险",
    confidence: "82%",
    title: "需要按 HPLC SOP 确认过滤要求，当前文档建议进样前过滤。",
    body: "当前 SOP 片段要求样品进样前去除颗粒物，滤膜规格需按方法文件确认。若样品可能吸附在滤膜上，需要先做兼容性确认。",
    safety: "该问题风险较低，但会影响仪器维护和数据质量。建议保存为进样前检查项。",
    retrieval: "Top-5 片段 · SOP 和方法文件",
    citations: [
      {
        title: "SOP-HPLC · 样品准备",
        text: "样品进样前应确认澄清度，并按方法要求过滤或离心。"
      },
      {
        title: "HPLC 方法文件 · 样品处理",
        text: "过滤材料和孔径应与分析物兼容。"
      }
    ]
  }
};

const questionInput = document.querySelector("#questionInput");
const askButton = document.querySelector("#askButton");
const clearButton = document.querySelector("#clearButton");
const riskBadge = document.querySelector("#riskBadge");
const answerTitle = document.querySelector("#answerTitle");
const answerBody = document.querySelector("#answerBody");
const safetyBody = document.querySelector("#safetyBody");
const confidenceValue = document.querySelector("#confidenceValue");
const citationList = document.querySelector("#citationList");
const retrievalMeta = document.querySelector("#retrievalMeta");
const feedbackStatus = document.querySelector("#feedbackStatus");
const chips = Array.from(document.querySelectorAll(".chip"));
const feedbackButtons = Array.from(document.querySelectorAll(".feedback-button"));

function renderAnswer(question) {
  const answer = answers[question] || {
    risk: "medium",
    riskText: "需评估",
    confidence: "58%",
    title: "当前知识库没有找到足够可靠的来源。",
    body: "建议补充 SOP、SDS 或论文原文后重新提问。系统不会基于无来源内容生成实验建议。",
    safety: "已触发低置信度兜底策略。请由导师或安全负责人确认后再执行相关实验。",
    retrieval: "Top-0 片段 · 需要补充文档",
    citations: [
      {
        title: "无可靠引用",
        text: "当前问题未命中可支撑回答的文档片段。"
      }
    ]
  };

  riskBadge.className = `risk-badge ${answer.risk}`;
  riskBadge.textContent = answer.riskText;
  answerTitle.textContent = answer.title;
  answerBody.textContent = answer.body;
  safetyBody.textContent = answer.safety;
  confidenceValue.textContent = answer.confidence;
  retrievalMeta.textContent = answer.retrieval;
  feedbackStatus.textContent = "等待用户反馈";

  citationList.innerHTML = "";
  answer.citations.forEach((citation) => {
    const item = document.createElement("div");
    item.className = "citation";
    item.innerHTML = `<strong>${citation.title}</strong><p>${citation.text}</p>`;
    citationList.appendChild(item);
  });
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    questionInput.value = chip.dataset.question;
    renderAnswer(chip.dataset.question);
  });
});

askButton.addEventListener("click", () => {
  renderAnswer(questionInput.value.trim());
  chips.forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.question === questionInput.value.trim());
  });
});

clearButton.addEventListener("click", () => {
  questionInput.value = "";
  feedbackStatus.textContent = "问题已清空";
});

feedbackButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const labels = {
      useful: "已记录：有用。该样本会提升相似回答权重。",
      citation: "已记录：引用不对。样本进入引用校验队列。",
      incomplete: "已记录：答案不完整。样本进入回归测试集。",
      risk: "已记录：有风险。已推送人工复核队列。"
    };
    feedbackStatus.textContent = labels[button.dataset.feedback];
  });
});

renderAnswer(questionInput.value.trim());
