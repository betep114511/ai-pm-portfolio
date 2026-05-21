(function () {
  const AI_BACKEND_URL = localStorage.getItem("AI_BACKEND_URL") || "http://127.0.0.1:8787";

  const els = {
    healthPill: document.getElementById("healthPill"),
    healthLabel: document.getElementById("healthLabel"),
    rtBackend: document.getElementById("rtBackend"),
    rtModel: document.getElementById("rtModel"),
    rtLatency: document.getElementById("rtLatency"),
    rtSource: document.getElementById("rtSource"),
    questionInput: document.getElementById("questionInput"),
    knowledgeInput: document.getElementById("knowledgeInput"),
    askBtn: document.getElementById("askBtn"),
    clearBtn: document.getElementById("clearBtn"),
    loadDemoBtn: document.getElementById("loadDemoBtn"),
    exportBtn: document.getElementById("exportBtn"),
    suggestRow: document.getElementById("suggestRow"),
    riskBadge: document.getElementById("riskBadge"),
    answerTitle: document.getElementById("answerTitle"),
    answerBody: document.getElementById("answerBody"),
    safetyBody: document.getElementById("safetyBody"),
    confidenceValue: document.getElementById("confidenceValue"),
    confidenceFill: document.getElementById("confidenceFill"),
    citationList: document.getElementById("citationList"),
    retrievalMeta: document.getElementById("retrievalMeta"),
    feedbackStatus: document.getElementById("feedbackStatus"),
  };

  let backendReady = false;

  function fallbackAnswer(question, knowledge) {
    const hasKnowledge = knowledge && knowledge.trim().length > 0;
    const k = (question || "").toLowerCase();
    if (k.includes("乙醚") || k.includes("热源") || k.includes("flammable")) {
      return {
        risk: "high", riskText: "高风险", confidence: "94%",
        title: "不可以。乙醚应远离热源、火源和强氧化剂储存。",
        body: "SDS 片段显示乙醚属于高度易燃液体，储存时应保持容器密闭并远离热源、火花和不相容物质。",
        safety: "已触发高风险储存规则，建议立即对照实验室易燃品储存 SOP，并由安全管理员确认当前存放位置。",
        retrieval: "Top-4 片段 · SDS 强匹配",
        citations: [
          { title: "SDS-乙醚 · 储存条件", text: "Keep away from heat, sparks, open flames and oxidizing materials." },
          { title: "SOP-易燃品储存 · 第 1 节", text: "易燃液体应存放于指定防火柜，远离热源和氧化剂。" },
        ],
      };
    }
    if (k.includes("聚合") || k.includes("温度") || k.includes("65")) {
      return {
        risk: "low", riskText: "低风险", confidence: "91%",
        title: "论文实验部分显示该聚合反应在 65 ℃、氮气气氛下进行。",
        body: "检索到的实验片段描述了反应温度和气氛。当前回答只基于论文实验部分，不补充文献外条件。",
        safety: "该问题主要是文献条件查询。若用于真实复现实验，还需结合课题组 SOP 和导师确认。",
        retrieval: "Top-2 片段 · 论文实验部分",
        citations: [
          { title: "Paper Polymer 2024 · Experimental", text: "The polymerization mixture was maintained at 65 °C under nitrogen atmosphere." },
          { title: "Paper Polymer 2024 · Table S1", text: "Reaction temperature: 65 °C; atmosphere: N2." },
        ],
      };
    }
    if (k.includes("无 sop") || k.includes("没有 sop") || k.includes("危险")) {
      return {
        risk: "high", riskText: "高风险", confidence: "97%",
        title: "不能。该请求缺少可靠 SOP 和安全审批，应拒绝直接给出操作建议。",
        body: "系统未检索到可执行的内部 SOP。对于危险反应，不能仅依据网上步骤开展实验，需要补充 SOP、风险评估和负责人确认。",
        safety: "已触发拒答策略：无可靠来源 + 高风险实验。建议创建 SOP 审核任务并联系导师或 EHS 负责人。",
        retrieval: "Top-2 片段 · 审批流程命中",
        citations: [
          { title: "SOP-实验审批流程 · 高风险实验", text: "高风险实验需完成书面风险评估，并经负责人确认后执行。" },
          { title: "实验室安全守则 · 第 4 节", text: "未建立 SOP 的实验不得由新人独立开展。" },
        ],
      };
    }
    if (!hasKnowledge) {
      return {
        risk: "high", riskText: "拒答", confidence: "20%",
        title: "未提供知识片段，无法基于来源给出可靠回答。",
        body: "ChemDoc AI 不会在没有可信来源时编造化学/实验回答。请粘贴 SOP / SDS / 论文片段后重试。",
        safety: "已触发空检索拒答策略。建议在左侧粘贴至少 1 个 [snippet] 片段后重新提问。",
        retrieval: "Top-0 片段 · 知识库为空",
        citations: [{ title: "无可靠引用", text: "用户未提供任何知识来源。" }],
      };
    }
    return {
      risk: "medium", riskText: "中风险", confidence: "72%",
      title: "演示模式 — 本地未启用真实 LLM，已返回兜底回答。",
      body: "请启动本地后端（./scripts/run_ai_backend.sh）即可看到模型基于你粘贴的知识片段生成的引用式答案。",
      safety: "演示模式回答仅作 UI 展示，不能作为实验依据。",
      retrieval: "Top-0 片段 · 演示模式",
      citations: [{ title: "Demo Fallback", text: "本回答由前端兜底逻辑生成。" }],
    };
  }

  function setLoading(loading) {
    els.askBtn.disabled = loading;
    els.askBtn.textContent = loading ? "AI 生成中…" : "生成引用回答 →";
  }

  function renderAnswer(answer, source) {
    const conf = String(answer.confidence || "0%").replace("%", "");
    const confNum = Math.max(0, Math.min(100, parseInt(conf, 10) || 0));
    els.riskBadge.className = `risk-badge ${answer.risk || "medium"}`;
    els.riskBadge.textContent = answer.riskText || "待评估";
    els.answerTitle.textContent = answer.title || "—";
    els.answerBody.textContent = answer.body || "—";
    els.safetyBody.textContent = answer.safety || "—";
    els.confidenceValue.textContent = `${confNum}%`;
    els.confidenceFill.style.width = `${confNum}%`;
    els.retrievalMeta.textContent = answer.retrieval || "—";
    els.rtSource.innerHTML = source === "ai" ? "<strong>live LLM</strong>" : "<strong>mock fallback</strong>";

    els.citationList.innerHTML = "";
    (answer.citations || []).forEach((c) => {
      const item = document.createElement("div");
      item.className = "citation";
      const title = document.createElement("strong");
      title.textContent = c.title || "(no title)";
      const text = document.createElement("p");
      text.textContent = c.text || "";
      item.append(title, text);
      els.citationList.appendChild(item);
    });
    if (!els.citationList.children.length) {
      els.citationList.innerHTML = '<div class="citation"><strong>无引用</strong><p>当前回答未引用任何 snippet。</p></div>';
    }
  }

  async function checkHealth() {
    try {
      const r = await fetch(`${AI_BACKEND_URL}/health`, { mode: "cors" });
      if (!r.ok) throw new Error("not ok");
      const data = await r.json();
      backendReady = !!data.configured;
      els.healthLabel.textContent = backendReady ? "实时 LLM" : "未配置 API key";
      els.healthPill.classList.toggle("offline", !backendReady);
      els.rtBackend.innerHTML = `<strong>${backendReady ? "online" : "no-key"}</strong>`;
      els.rtModel.innerHTML = `<strong>${data.model || "?"}</strong>`;
    } catch (_) {
      backendReady = false;
      els.healthLabel.textContent = "离线 · mock";
      els.healthPill.classList.add("offline");
      els.rtBackend.innerHTML = "<strong>offline</strong>";
      els.rtModel.innerHTML = "<strong>—</strong>";
    }
  }

  async function ask() {
    const question = els.questionInput.value.trim();
    const knowledge = els.knowledgeInput.value.trim();
    if (!question) {
      els.feedbackStatus.textContent = "请先输入问题。";
      return;
    }
    setLoading(true);
    els.feedbackStatus.textContent = backendReady ? "正在调用实时 LLM…" : "本地后端离线，使用兜底回答。";
    const started = performance.now();
    try {
      if (!backendReady) throw new Error("offline");
      const r = await fetch(`${AI_BACKEND_URL}/api/chemdoc/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, knowledge, context: "User-supplied snippets only. Cite each fact." }),
      });
      if (!r.ok) throw new Error(`backend ${r.status}`);
      const data = await r.json();
      const elapsed = (performance.now() - started) / 1000;
      els.rtLatency.innerHTML = `<strong>${elapsed.toFixed(1)}s</strong>`;
      if (data._meta && data._meta.model) {
        els.rtModel.innerHTML = `<strong>${data._meta.model}</strong>`;
      }
      const fallback = fallbackAnswer(question, knowledge);
      renderAnswer({ ...fallback, ...data, citations: Array.isArray(data.citations) ? data.citations : fallback.citations }, "ai");
      els.feedbackStatus.textContent = "已使用实时 LLM 生成。";
    } catch (e) {
      const elapsed = (performance.now() - started) / 1000;
      els.rtLatency.innerHTML = `<strong>${elapsed.toFixed(1)}s</strong>`;
      renderAnswer(fallbackAnswer(question, knowledge), "mock");
      els.feedbackStatus.textContent = "实时调用失败或离线，已展示兜底回答。";
    } finally {
      setLoading(false);
    }
  }

  els.askBtn.addEventListener("click", ask);
  els.clearBtn.addEventListener("click", () => {
    els.questionInput.value = "";
    els.knowledgeInput.value = "";
    els.feedbackStatus.textContent = "已清空输入。";
  });
  els.loadDemoBtn.addEventListener("click", () => {
    const first = els.suggestRow.querySelector(".chip");
    if (first) first.click();
  });
  els.exportBtn.addEventListener("click", () => {
    const payload = {
      question: els.questionInput.value.trim(),
      knowledge: els.knowledgeInput.value.trim(),
      answer: {
        title: els.answerTitle.textContent,
        body: els.answerBody.textContent,
        safety: els.safetyBody.textContent,
        risk: els.riskBadge.textContent,
        confidence: els.confidenceValue.textContent,
        citations: Array.from(els.citationList.children).map((c) => ({
          title: c.querySelector("strong")?.textContent || "",
          text: c.querySelector("p")?.textContent || "",
        })),
      },
      meta: {
        backend: els.rtBackend.textContent,
        model: els.rtModel.textContent,
        latency: els.rtLatency.textContent,
      },
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chemdoc_qa_record.json";
    a.click();
    URL.revokeObjectURL(url);
    els.feedbackStatus.textContent = "已导出当前问答记录。";
  });

  els.suggestRow.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    els.suggestRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    if (chip.dataset.q) els.questionInput.value = chip.dataset.q;
    if (chip.dataset.k !== undefined) els.knowledgeInput.value = chip.dataset.k;
  });

  document.querySelectorAll(".nav-item").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
      b.classList.add("active");
      els.feedbackStatus.textContent = `已切换到「${b.textContent.trim()}」视图，演示中保留问答工作台。`;
    });
  });
  document.querySelectorAll(".doc-row").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".doc-row").forEach((i) => i.classList.remove("selected"));
      b.classList.add("selected");
    });
  });
  document.querySelectorAll(".feedback-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const labels = {
        useful: "已记录：有用。该样本会提升相似回答权重。",
        citation: "已记录：引用不对。样本进入引用校验队列。",
        incomplete: "已记录：答案不完整。样本进入回归测试集。",
        risk: "已记录：有风险。已推送人工复核队列。",
      };
      els.feedbackStatus.textContent = labels[b.dataset.feedback] || "已记录反馈。";
    });
  });

  checkHealth();
})();
