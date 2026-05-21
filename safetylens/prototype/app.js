(function () {
  // Live demo backend = a cloudflared "quick tunnel" pointed at the devbox FastAPI.
  // The URL is ephemeral (rotates whenever the tunnel restarts); override locally
  // with: localStorage.setItem("AI_BACKEND_URL", "http://127.0.0.1:8787")
  const DEFAULT_BACKEND_URL = "https://duration-walls-unknown-generators.trycloudflare.com";
  const AI_BACKEND_URL = localStorage.getItem("AI_BACKEND_URL") || DEFAULT_BACKEND_URL;

  const presets = {
    ether: {
      label: "乙醚 (CAS 60-29-7)",
      sds: "Highly flammable liquid and vapour. Keep away from heat, sparks, open flames. Store in a well-ventilated place. Incompatible with oxidizing agents. Use appropriate PPE including safety goggles and chemical-resistant gloves.",
      mock: {
        name: "乙醚 SDS 审核",
        meta: "CAS 60-29-7 · 高度易燃 · 待 EHS 确认",
        score: "94%", conflicts: "2", status: "待确认", source: "Section 2 / Section 7",
        fields: [["CAS", "60-29-7", "99%"], ["危险类别", "易燃液体 1 类", "94%"], ["PPE", "护目镜、防护手套、实验服", "91%"], ["储存", "防火柜，远离热源", "93%"]],
        rules: [["high", "不相容物质", "不得与强氧化剂混放，需单独置于易燃品柜。"], ["high", "热源风险", "SDS 明确要求远离热源、火花和明火。"], ["ok", "PPE 完整", "已识别护目镜、防护手套和实验服。"]],
        checklist: ["存放于防火柜", "远离氧化剂和热源", "确认容器密闭和标签", "操作区域保持通风"],
        audit: ["AI 完成 SDS 字段抽取", "规则引擎触发 2 项高风险", "等待 EHS 确认储存库位"],
      },
    },
    acid: {
      label: "浓硫酸 (CAS 7664-93-9)",
      sds: "Causes severe skin burns and eye damage. Reacts violently with water and bases. Wear protective gloves, eye protection and face shield. Store in corrosive cabinet, separately from alkalis and reactive metals.",
      mock: {
        name: "浓硫酸 SDS 审核",
        meta: "CAS 7664-93-9 · 强腐蚀 · 待 EHS 确认",
        score: "92%", conflicts: "3", status: "待确认", source: "Section 2 / Section 8",
        fields: [["CAS", "7664-93-9", "99%"], ["危险类别", "皮肤腐蚀 1A", "95%"], ["PPE", "防酸手套、护目镜、面屏", "89%"], ["储存", "腐蚀品柜，远离碱", "90%"]],
        rules: [["high", "酸碱分储", "不得与强碱混放，需进入腐蚀品储存区域。"], ["high", "稀释放热", "涉及配液时必须提示加酸入水和冷却。"], ["medium", "PPE 补充", "建议补充面屏或防酸围裙，由管理员确认。"]],
        checklist: ["存放于腐蚀品柜", "远离碱和活泼金属", "配置时加酸入水", "酸性废液单独收集"],
        audit: ["AI 标记强腐蚀风险", "规则引擎触发酸碱分储", "PPE 字段待人工补充确认"],
      },
    },
    dmf: {
      label: "DMF (CAS 68-12-2)",
      sds: "May damage fertility or the unborn child. Avoid breathing vapors. Wear protective gloves and use in a fume hood. Store in a cool, well-ventilated area away from incompatible materials.",
      mock: {
        name: "DMF SDS 审核",
        meta: "CAS 68-12-2 · 健康危害 · 管理员确认",
        score: "88%", conflicts: "1", status: "待确认", source: "Section 2 / Section 8",
        fields: [["CAS", "68-12-2", "99%"], ["危险类别", "生殖毒性 / 健康危害", "87%"], ["PPE", "丁腈手套、护目镜", "86%"], ["储存", "通风阴凉处", "84%"]],
        rules: [["medium", "暴露控制", "建议在通风橱中使用，避免皮肤接触和吸入。"], ["ok", "储存条件", "当前储存建议与 SDS 一致。"]],
        checklist: ["通风橱中操作", "佩戴兼容手套", "避免皮肤接触", "废液进入有机废液桶"],
        audit: ["AI 抽取健康危害字段", "规则引擎提示暴露控制", "等待管理员确认 PPE"],
      },
    },
    nah: {
      label: "氢化钠 (CAS 7646-69-7)",
      sds: "In contact with water releases flammable gases that may ignite spontaneously. Causes severe skin burns and eye damage. Handle under inert atmosphere and keep away from moisture and acids.",
      mock: {
        name: "氢化钠 SDS 审核",
        meta: "CAS 7646-69-7 · 遇水反应 · 待 EHS 确认",
        score: "91%", conflicts: "3", status: "待确认", source: "Section 2 / Section 10",
        fields: [["CAS", "7646-69-7", "99%"], ["危险类别", "遇水释放易燃气体", "93%"], ["PPE", "护目镜、防护手套、实验服", "88%"], ["储存", "干燥惰性环境", "92%"]],
        rules: [["high", "禁水", "不得与水、潮湿空气或酸接触。"], ["high", "惰性条件", "操作和储存需保持干燥惰性条件。"], ["high", "人工审核", "该化学品必须由 EHS 确认入库位置。"]],
        checklist: ["干燥惰性条件储存", "远离水和酸", "高风险库位确认", "泄漏处理需专人负责"],
        audit: ["AI 抽取遇水反应风险", "规则引擎强制 EHS 审核", "高风险项锁定，等待确认"],
      },
    },
    thf: {
      label: "四氢呋喃 (CAS 109-99-9)",
      sds: "Highly flammable liquid and vapour. May form explosive peroxides on storage. Causes skin and eye irritation. Use peroxide-inhibited grade and store below 30 °C, away from light.",
      mock: null,
    },
  };

  const els = {
    healthPill: document.getElementById("healthPill"),
    healthLabel: document.getElementById("healthLabel"),
    rtBackend: document.getElementById("rtBackend"),
    rtModel: document.getElementById("rtModel"),
    rtLatency: document.getElementById("rtLatency"),
    rtMode: document.getElementById("rtMode"),
    chemInput: document.getElementById("chemInput"),
    sdsInput: document.getElementById("sdsInput"),
    rulesInput: document.getElementById("rulesInput"),
    presetRow: document.getElementById("presetRow"),
    analyzeBtn: document.getElementById("analyzeButton"),
    exportBtn: document.getElementById("exportBtn"),
    chemicalName: document.getElementById("chemicalName"),
    chemicalMeta: document.getElementById("chemicalMeta"),
    extractScore: document.getElementById("extractScore"),
    conflictCount: document.getElementById("conflictCount"),
    reviewStatus: document.getElementById("reviewStatus"),
    docSource: document.getElementById("docSource"),
    sdsText: document.getElementById("sdsText"),
    fieldList: document.getElementById("fieldList"),
    ruleList: document.getElementById("ruleList"),
    checklist: document.getElementById("checklist"),
    auditLog: document.getElementById("auditLog"),
  };

  let backendReady = false;

  function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  function render(item, source) {
    els.chemicalName.textContent = item.name || els.chemInput.value;
    els.chemicalMeta.textContent = item.meta || "AI 完成抽取";
    els.extractScore.textContent = item.score || "—";
    els.conflictCount.textContent = item.conflicts || "0";
    els.reviewStatus.textContent = item.status || "已分析";
    els.docSource.textContent = item.source || "user input";
    els.sdsText.textContent = item.text || els.sdsInput.value;
    els.rtMode.innerHTML = source === "ai" ? "<strong>live LLM</strong>" : "<strong>mock</strong>";

    const fields = Array.isArray(item.fields) && item.fields.length ? item.fields : [["—", "—", "—"]];
    els.fieldList.innerHTML = fields
      .map(
        ([n, v, s]) =>
          `<div class="field-item"><span class="f-name">${escapeHtml(n)}</span><span class="f-val">${escapeHtml(v)}</span><span class="f-score">${escapeHtml(s)}</span></div>`
      )
      .join("");

    const rules = Array.isArray(item.rules) && item.rules.length ? item.rules : [["ok", "无规则触发", "AI 未检测到额外风险。"]];
    els.ruleList.innerHTML = rules
      .map(([lvl, t, txt]) => `<div class="rule ${escapeHtml(lvl)}"><strong>${escapeHtml(t)}</strong><p>${escapeHtml(txt)}</p></div>`)
      .join("");

    const checklist = Array.isArray(item.checklist) ? item.checklist : [];
    els.checklist.innerHTML = checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join("");

    const audit = Array.isArray(item.audit) ? item.audit : [];
    els.auditLog.innerHTML = audit
      .map(
        (e, i) =>
          `<div class="event"><time>Step ${i + 1} · ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><p>${escapeHtml(e)}</p></div>`
      )
      .join("");
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

  async function analyze() {
    const chemical = els.chemInput.value.trim();
    const sds = els.sdsInput.value.trim();
    const rules = els.rulesInput.value.trim();
    if (!chemical || !sds) {
      els.reviewStatus.textContent = "请填写化学品和 SDS";
      return;
    }
    els.analyzeBtn.disabled = true;
    els.analyzeBtn.textContent = "AI 分析中…";
    els.reviewStatus.textContent = backendReady ? "LLM 分析中…" : "兜底分析中…";
    const started = performance.now();
    try {
      if (!backendReady) throw new Error("offline");
      const r = await fetch(`${AI_BACKEND_URL}/api/safetylens/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chemical, sds_text: sds, extra_rules: rules || null }),
      });
      if (!r.ok) throw new Error(`backend ${r.status}`);
      const data = await r.json();
      const elapsed = (performance.now() - started) / 1000;
      els.rtLatency.innerHTML = `<strong>${elapsed.toFixed(1)}s</strong>`;
      if (data._meta && data._meta.model) {
        els.rtModel.innerHTML = `<strong>${data._meta.model}</strong>`;
      }
      data.text = data.text || sds;
      render(data, "ai");
    } catch (e) {
      const elapsed = (performance.now() - started) / 1000;
      els.rtLatency.innerHTML = `<strong>${elapsed.toFixed(1)}s</strong>`;
      const active = els.presetRow.querySelector(".preset.active");
      const key = active ? active.dataset.chemical : null;
      const mock = (key && presets[key] && presets[key].mock) || {
        name: chemical,
        meta: "演示数据 — 未启动本地 AI 后端",
        score: "—", conflicts: "—", status: "演示模式", source: "demo",
        fields: [["CAS", "—", "—"], ["危险类别", "—", "—"], ["PPE", "—", "—"], ["储存", "—", "—"]],
        rules: [["medium", "演示模式", "请启动本地后端以获取真实 AI 分析。"]],
        checklist: ["启动本地 AI 后端", "粘贴真实 SDS 段落", "确认抽取字段", "由 EHS 复核"],
        audit: ["本地后端离线，使用兜底数据"],
      };
      mock.text = sds;
      render(mock, "mock");
    } finally {
      els.analyzeBtn.disabled = false;
      els.analyzeBtn.textContent = "AI 分析 →";
    }
  }

  els.analyzeBtn.addEventListener("click", analyze);
  els.exportBtn.addEventListener("click", () => {
    const payload = {
      chemical: els.chemInput.value,
      sds: els.sdsInput.value,
      extra_rules: els.rulesInput.value,
      fields: Array.from(els.fieldList.querySelectorAll(".field-item")).map((it) => ({
        name: it.querySelector(".f-name")?.textContent,
        value: it.querySelector(".f-val")?.textContent,
        score: it.querySelector(".f-score")?.textContent,
      })),
      rules: Array.from(els.ruleList.querySelectorAll(".rule")).map((r) => ({
        level: r.className.replace("rule", "").trim(),
        title: r.querySelector("strong")?.textContent,
        text: r.querySelector("p")?.textContent,
      })),
      checklist: Array.from(els.checklist.querySelectorAll("li")).map((l) => l.textContent),
      audit: Array.from(els.auditLog.querySelectorAll(".event")).map((e) => e.querySelector("p")?.textContent),
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "safetylens_review.json"; a.click();
    URL.revokeObjectURL(url);
  });

  function applyPreset(key) {
    const p = presets[key];
    if (!p) return;
    els.chemInput.value = p.label;
    els.sdsInput.value = p.sds;
    els.presetRow.querySelectorAll(".preset").forEach((b) => b.classList.toggle("active", b.dataset.chemical === key));
    document.querySelectorAll(".chem").forEach((b) => b.classList.toggle("active", b.dataset.chemical === key));
  }

  els.presetRow.addEventListener("click", (e) => {
    const b = e.target.closest(".preset");
    if (b) applyPreset(b.dataset.chemical);
  });
  document.querySelectorAll(".chem").forEach((b) => {
    b.addEventListener("click", () => applyPreset(b.dataset.chemical));
  });
  document.querySelectorAll(".nav button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".nav button").forEach((i) => i.classList.remove("active"));
      b.classList.add("active");
    });
  });

  // initialize with the first preset
  applyPreset("ether");
  checkHealth();
})();
