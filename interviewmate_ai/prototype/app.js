(function () {
  const AI_BACKEND_URL = localStorage.getItem("AI_BACKEND_URL") || "http://127.0.0.1:8787";

  const openers = [
    "用 2 分钟介绍一个你做过的 AI 产品项目，包含用户、方案和关键指标。",
    "RAG 和 fine-tuning 怎么选？请给一个具体业务的判断逻辑。",
    "你是一名 AI PM，刚被分配「给客服系统加 LLM」，请给 4 周 MVP 计划。",
    "如果一个 RAG 项目幻觉率突然从 3% 跳到 8%，你会怎么排查？",
    "设计 LLM 应用的上线门禁，你会用哪些指标和阈值？",
  ];

  const stages = ["PROJECT DEEP DIVE", "AI LITERACY", "METRICS", "RISK", "WRAP UP"];
  let stageIdx = 0;

  const els = {
    healthPill: document.getElementById("healthPill"),
    healthLabel: document.getElementById("healthLabel"),
    rtBackend: document.getElementById("rtBackend"),
    rtModel: document.getElementById("rtModel"),
    rtTurn: document.getElementById("rtTurn"),
    rtLatency: document.getElementById("rtLatency"),
    stagePill: document.getElementById("stagePill"),
    messages: document.getElementById("messages"),
    answerInput: document.getElementById("answerInput"),
    submitButton: document.getElementById("submitButton"),
    hintBtn: document.getElementById("hintBtn"),
    newQBtn: document.getElementById("newQBtn"),
    resetBtn: document.getElementById("resetBtn"),
    jdInput: document.getElementById("jdInput"),
    feedbackText: document.getElementById("feedbackText"),
    planList: document.getElementById("planList"),
    scoreProduct: document.getElementById("scoreProduct"),
    scoreAI: document.getElementById("scoreAI"),
    scoreMetric: document.getElementById("scoreMetric"),
    scoreRisk: document.getElementById("scoreRisk"),
    barProduct: document.getElementById("barProduct"),
    barAI: document.getElementById("barAI"),
    barMetric: document.getElementById("barMetric"),
    barRisk: document.getElementById("barRisk"),
  };

  let backendReady = false;
  const history = [];

  function addMsg(role, text) {
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = role === "ai" ? "面试官" : "候选人";
    const body = document.createElement("div");
    body.textContent = text;
    wrap.append(meta, body);
    els.messages.appendChild(wrap);
    els.messages.scrollTop = els.messages.scrollHeight;
    return body;
  }

  function setScore(value, scoreEl, barEl) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    scoreEl.textContent = v;
    barEl.style.width = `${v}%`;
  }

  function setStage(i) {
    stageIdx = Math.min(stages.length - 1, i);
    els.stagePill.textContent = stages[stageIdx];
  }

  function askNew() {
    const opener = openers[history.filter((m) => m.role === "assistant").length % openers.length];
    addMsg("ai", opener);
    history.push({ role: "assistant", content: opener });
    setStage(stageIdx);
    els.rtTurn.innerHTML = `<strong>${history.filter((m) => m.role === "user").length + 1}</strong>`;
  }

  async function checkHealth() {
    try {
      const r = await fetch(`${AI_BACKEND_URL}/health`, { mode: "cors" });
      if (!r.ok) throw new Error("not ok");
      const d = await r.json();
      backendReady = !!d.configured;
      els.healthLabel.textContent = backendReady ? "实时 LLM" : "未配置";
      els.healthPill.classList.toggle("offline", !backendReady);
      els.rtBackend.innerHTML = `<strong>${backendReady ? "online" : "no-key"}</strong>`;
      els.rtModel.innerHTML = `<strong>${d.model || "?"}</strong>`;
    } catch (_) {
      backendReady = false;
      els.healthLabel.textContent = "离线 · mock";
      els.healthPill.classList.add("offline");
      els.rtBackend.innerHTML = "<strong>offline</strong>";
    }
  }

  async function streamFollowUp(answer) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    const stagedHistory = history.slice();
    try {
      const r = await fetch(`${AI_BACKEND_URL}/api/interviewmate/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd: els.jdInput.value.trim(),
          answer,
          stage: stages[stageIdx].toLowerCase().replace(/\s+/g, "_"),
          history: stagedHistory,
        }),
        signal: ctrl.signal,
      });
      if (!r.ok || !r.body) throw new Error("stream not available");
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      const node = addMsg("ai", "");
      const cursor = document.createElement("span");
      cursor.className = "typing-cursor";
      node.appendChild(cursor);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          const lines = evt.split("\n");
          let evType = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) evType = line.slice(6).trim();
            if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          try {
            const obj = JSON.parse(data);
            if (evType === "token" && obj.text) {
              full += obj.text;
              cursor.remove();
              node.textContent = full;
              node.appendChild(cursor);
              els.messages.scrollTop = els.messages.scrollHeight;
            } else if (evType === "done") {
              cursor.remove();
              els.rtLatency.innerHTML = `<strong>${(obj.latency_ms / 1000).toFixed(1)}s</strong>`;
              if (obj.model) els.rtModel.innerHTML = `<strong>${obj.model}</strong>`;
              history.push({ role: "assistant", content: full });
              return full;
            } else if (evType === "error") {
              throw new Error(obj.detail || "ai error");
            }
          } catch (_) {}
        }
      }
      cursor.remove();
      if (full) history.push({ role: "assistant", content: full });
      return full;
    } finally {
      clearTimeout(timer);
    }
  }

  async function scoreAnswer(answer) {
    if (!backendReady) {
      const tip = "本地后端未启动，使用兜底反馈：建议补充指标定义、风险兜底和具体数字。";
      els.feedbackText.textContent = tip;
      [70, 65, 60, 72].forEach((v, i) => {
        const map = [
          [els.scoreProduct, els.barProduct],
          [els.scoreAI, els.barAI],
          [els.scoreMetric, els.barMetric],
          [els.scoreRisk, els.barRisk],
        ][i];
        setScore(v, map[0], map[1]);
      });
      els.planList.innerHTML = `<li>启动本地 AI 后端以获得真实评分。</li><li>给项目补 3 个数据指标。</li><li>准备一个"模型答错"的兜底案例。</li>`;
      return;
    }
    try {
      const r = await fetch(`${AI_BACKEND_URL}/api/interviewmate/coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd: els.jdInput.value.trim(),
          answer,
          stage: stages[stageIdx].toLowerCase().replace(/\s+/g, "_"),
          history,
        }),
      });
      if (!r.ok) throw new Error(`backend ${r.status}`);
      const data = await r.json();
      const scores = data.scores || {};
      setScore(scores.product, els.scoreProduct, els.barProduct);
      setScore(scores.ai, els.scoreAI, els.barAI);
      setScore(scores.metrics, els.scoreMetric, els.barMetric);
      setScore(scores.risk, els.scoreRisk, els.barRisk);
      els.feedbackText.textContent = data.feedback || "—";
      const plan = Array.isArray(data.training_plan) ? data.training_plan : [];
      els.planList.innerHTML = plan.length
        ? plan.map((p) => `<li>${escapeHtml(p)}</li>`).join("")
        : "<li>暂无训练计划。</li>";
    } catch (e) {
      els.feedbackText.textContent = "评分失败：" + (e.message || "未知错误");
    }
  }

  function escapeHtml(v) {
    return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  async function submit() {
    const answer = els.answerInput.value.trim();
    if (!answer) return;
    els.answerInput.value = "";
    els.submitButton.disabled = true;
    addMsg("user", answer);
    history.push({ role: "user", content: answer });
    els.rtTurn.innerHTML = `<strong>${history.filter((m) => m.role === "user").length + 1}</strong>`;
    try {
      if (backendReady) {
        await Promise.all([streamFollowUp(answer), scoreAnswer(answer)]);
      } else {
        addMsg(
          "ai",
          "（演示模式）追问：你提到的指标里，幻觉率和引用命中率分别怎么定义？高风险样本怎么走人审？"
        );
        history.push({ role: "assistant", content: "（演示模式追问）" });
        await scoreAnswer(answer);
      }
      stageIdx = Math.min(stages.length - 1, stageIdx + 1);
      setStage(stageIdx);
    } finally {
      els.submitButton.disabled = false;
      els.answerInput.focus();
    }
  }

  els.submitButton.addEventListener("click", submit);
  els.answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  });
  els.hintBtn.addEventListener("click", () => {
    addMsg("ai", "提示：可以用 STAR 框架（情境/任务/行动/结果），并具体说出 1-2 个数字指标。");
  });
  els.newQBtn.addEventListener("click", () => {
    askNew();
  });
  els.resetBtn.addEventListener("click", () => {
    history.length = 0;
    els.messages.innerHTML = "";
    stageIdx = 0;
    setStage(0);
    els.feedbackText.textContent = "对话已重置，AI 会基于左侧 JD 重新开始。";
    els.planList.innerHTML = "<li>提交回答后会自动更新。</li>";
    [els.scoreProduct, els.scoreAI, els.scoreMetric, els.scoreRisk].forEach((e) => (e.textContent = "—"));
    [els.barProduct, els.barAI, els.barMetric, els.barRisk].forEach((b) => (b.style.width = "0%"));
    askNew();
  });

  document.querySelectorAll(".sidebar nav button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".sidebar nav button").forEach((i) => i.classList.remove("active"));
      b.classList.add("active");
    });
  });

  checkHealth().then(askNew);
})();
