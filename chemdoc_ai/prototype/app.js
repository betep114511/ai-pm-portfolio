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

const AI_BACKEND_URL = localStorage.getItem("AI_BACKEND_URL") || "http://127.0.0.1:8787";
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
const navItems = Array.from(document.querySelectorAll(".nav-item"));
const docList = document.querySelector(".doc-list");
const uploadButton = document.querySelector(".icon-button");
const exportButton = document.querySelector(".outline-button");
const chips = Array.from(document.querySelectorAll(".chip"));
const feedbackButtons = Array.from(document.querySelectorAll(".feedback-button"));

async function postWithTimeout(url, payload, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`AI backend returned ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function showToast(message) {
  const existing = document.querySelector(".demo-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "demo-toast";
  toast.textContent = message;
  toast.setAttribute("role", "status");
  toast.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:20;max-width:320px;padding:12px 14px;border-radius:8px;background:#132027;color:#fff;box-shadow:0 14px 36px rgba(0,0,0,.18);font-size:14px;line-height:1.45;";
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fallbackAnswer(question) {
  return answers[question] || {
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
}

function renderAnswerObject(answer) {
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
    const title = document.createElement("strong");
    const text = document.createElement("p");
    title.textContent = citation.title;
    text.textContent = citation.text;
    item.append(title, text);
    citationList.appendChild(item);
  });
}

function renderAnswer(question) {
  renderAnswerObject(fallbackAnswer(question));
}

async function askLocalAI(question) {
  return postWithTimeout(`${AI_BACKEND_URL}/api/chemdoc/ask`, {
      question,
      context: "Demo knowledge base: SOP, SDS, chemistry paper excerpts. Return cautious cited answer."
  });
}

navItems.forEach((button) => {
  button.addEventListener("click", () => {
    navItems.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const label = button.textContent.trim();
    feedbackStatus.textContent = `已切换到「${label}」视图，当前演示仍保留问答工作台核心流程。`;
    showToast(`已切换到 ${label}`);
  });
});

function bindDocRows() {
  document.querySelectorAll(".doc-row").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".doc-row").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      const label = button.innerText.replace(/\s+/g, " ").trim();
      retrievalMeta.textContent = `当前选中文档：${label}`;
      feedbackStatus.textContent = `已选择引用文档：${label}`;
    });
  });
}

uploadButton.addEventListener("click", () => {
  const created = document.createElement("button");
  created.className = "doc-row selected";
  created.type = "button";
  created.innerHTML = '<span class="doc-type sop">SOP</span><span>新上传实验 SOP</span>';
  document.querySelectorAll(".doc-row").forEach((item) => item.classList.remove("selected"));
  docList.appendChild(created);
  bindDocRows();
  retrievalMeta.textContent = "当前选中文档：SOP 新上传实验 SOP";
  feedbackStatus.textContent = "已模拟上传 1 份 SOP，并加入最近引用列表。";
  showToast("已模拟上传 SOP 文档");
});

exportButton.addEventListener("click", () => {
  downloadJson("chemdoc_qa_record.json", {
    question: questionInput.value.trim(),
    answer: answerTitle.textContent,
    risk: riskBadge.textContent,
    confidence: confidenceValue.textContent,
    retrieval: retrievalMeta.textContent,
    exported_at: new Date().toISOString()
  });
  feedbackStatus.textContent = "已导出当前问答记录。";
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    questionInput.value = chip.dataset.question;
    renderAnswer(chip.dataset.question);
  });
});

askButton.addEventListener("click", async () => {
  const question = questionInput.value.trim();
  askButton.disabled = true;
  askButton.textContent = "AI 生成中...";
  feedbackStatus.textContent = "正在尝试调用本地 AI 后端；不可用时会回到 mock 数据。";
  try {
    const aiAnswer = await askLocalAI(question);
    const fallback = fallbackAnswer(question);
    const mergedAnswer = {
      ...fallback,
      ...aiAnswer,
      citations: Array.isArray(aiAnswer.citations) ? aiAnswer.citations : fallback.citations
    };
    renderAnswerObject(mergedAnswer);
    feedbackStatus.textContent = "已使用本地 AI 后端生成。";
  } catch (error) {
    renderAnswer(question);
    feedbackStatus.textContent = "本地 AI 后端未连接或响应超时，已展示内置演示数据。";
  } finally {
    askButton.disabled = false;
    askButton.textContent = "生成引用回答";
  }
  chips.forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.question === question);
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

bindDocRows();
renderAnswer(questionInput.value.trim());
