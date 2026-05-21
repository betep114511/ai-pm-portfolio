const chemicals = {
  ether: {
    name: "乙醚 SDS 审核",
    meta: "CAS 60-29-7 · 高度易燃 · 待 EHS 确认",
    score: "94%",
    conflicts: "2",
    status: "待确认",
    source: "Section 2 / Section 7",
    text: "Highly flammable liquid and vapor. Keep away from heat, sparks, open flames. Store in a well-ventilated place. Incompatible with oxidizing agents.",
    fields: [
      ["CAS", "60-29-7", "99%"],
      ["危险类别", "易燃液体 1 类", "94%"],
      ["PPE", "护目镜、防护手套、实验服", "91%"],
      ["储存", "防火柜，远离热源", "93%"]
    ],
    rules: [
      ["high", "不相容物质", "不得与强氧化剂混放，需单独置于易燃品柜。"],
      ["high", "热源风险", "SDS 明确要求远离热源、火花和明火。"],
      ["ok", "PPE 完整", "已识别护目镜、防护手套和实验服。"]
    ],
    checklist: ["存放于防火柜", "远离氧化剂和热源", "确认容器密闭和标签", "操作区域保持通风"],
    audit: ["AI 完成 SDS 字段抽取", "规则引擎触发 2 项高风险", "等待 EHS 确认储存库位"]
  },
  acid: {
    name: "浓硫酸 SDS 审核",
    meta: "CAS 7664-93-9 · 强腐蚀 · 待 EHS 确认",
    score: "92%",
    conflicts: "3",
    status: "待确认",
    source: "Section 2 / Section 8",
    text: "Causes severe skin burns and eye damage. Reacts violently with water and bases. Wear protective gloves and eye protection.",
    fields: [
      ["CAS", "7664-93-9", "99%"],
      ["危险类别", "皮肤腐蚀 1A", "95%"],
      ["PPE", "防酸手套、护目镜、面屏", "89%"],
      ["储存", "腐蚀品柜，远离碱", "90%"]
    ],
    rules: [
      ["high", "酸碱分储", "不得与强碱混放，需进入腐蚀品储存区域。"],
      ["high", "稀释放热", "涉及配液时必须提示加酸入水和冷却。"],
      ["medium", "PPE 补充", "建议补充面屏或防酸围裙，由管理员确认。"]
    ],
    checklist: ["存放于腐蚀品柜", "远离碱和活泼金属", "配置时加酸入水", "酸性废液单独收集"],
    audit: ["AI 标记强腐蚀风险", "规则引擎触发酸碱分储", "PPE 字段待人工补充确认"]
  },
  dmf: {
    name: "DMF SDS 审核",
    meta: "CAS 68-12-2 · 健康危害 · 管理员确认",
    score: "88%",
    conflicts: "1",
    status: "待确认",
    source: "Section 2 / Section 8",
    text: "May damage fertility or the unborn child. Avoid breathing vapors. Wear protective gloves and use in a fume hood.",
    fields: [
      ["CAS", "68-12-2", "99%"],
      ["危险类别", "生殖毒性 / 健康危害", "87%"],
      ["PPE", "丁腈手套、护目镜", "86%"],
      ["储存", "通风阴凉处", "84%"]
    ],
    rules: [
      ["medium", "暴露控制", "建议在通风橱中使用，避免皮肤接触和吸入。"],
      ["ok", "储存条件", "当前储存建议与 SDS 一致。"]
    ],
    checklist: ["通风橱中操作", "佩戴兼容手套", "避免皮肤接触", "废液进入有机废液桶"],
    audit: ["AI 抽取健康危害字段", "规则引擎提示暴露控制", "等待管理员确认 PPE"]
  },
  nah: {
    name: "氢化钠 SDS 审核",
    meta: "CAS 7646-69-7 · 遇水反应 · 待 EHS 确认",
    score: "91%",
    conflicts: "3",
    status: "待确认",
    source: "Section 2 / Section 10",
    text: "In contact with water releases flammable gases. Causes severe burns. Handle under inert atmosphere and keep away from moisture.",
    fields: [
      ["CAS", "7646-69-7", "99%"],
      ["危险类别", "遇水释放易燃气体", "93%"],
      ["PPE", "护目镜、防护手套、实验服", "88%"],
      ["储存", "干燥惰性环境", "92%"]
    ],
    rules: [
      ["high", "禁水", "不得与水、潮湿空气或酸接触。"],
      ["high", "惰性条件", "操作和储存需保持干燥惰性条件。"],
      ["high", "人工审核", "该化学品必须由 EHS 确认入库位置。"]
    ],
    checklist: ["干燥惰性条件储存", "远离水和酸", "高风险库位确认", "泄漏处理需专人负责"],
    audit: ["AI 抽取遇水反应风险", "规则引擎强制 EHS 审核", "高风险项锁定，等待确认"]
  }
};

const fields = {
  chemicalName: document.querySelector("#chemicalName"),
  chemicalMeta: document.querySelector("#chemicalMeta"),
  extractScore: document.querySelector("#extractScore"),
  conflictCount: document.querySelector("#conflictCount"),
  reviewStatus: document.querySelector("#reviewStatus"),
  docSource: document.querySelector("#docSource"),
  sdsText: document.querySelector("#sdsText"),
  fieldList: document.querySelector("#fieldList"),
  ruleList: document.querySelector("#ruleList"),
  checklist: document.querySelector("#checklist"),
  auditLog: document.querySelector("#auditLog")
};

function renderChemical(key) {
  const item = chemicals[key];
  fields.chemicalName.textContent = item.name;
  fields.chemicalMeta.textContent = item.meta;
  fields.extractScore.textContent = item.score;
  fields.conflictCount.textContent = item.conflicts;
  fields.reviewStatus.textContent = item.status;
  fields.docSource.textContent = item.source;
  fields.sdsText.textContent = item.text;

  fields.fieldList.innerHTML = item.fields.map(([name, value, score]) => `
    <div class="field"><span>${name}</span><strong>${value}</strong><span class="score">${score}</span></div>
  `).join("");

  fields.ruleList.innerHTML = item.rules.map(([level, title, text]) => `
    <div class="rule ${level}"><strong>${title}</strong><p>${text}</p></div>
  `).join("");

  fields.checklist.innerHTML = item.checklist.map((task) => `<li>${task}</li>`).join("");

  fields.auditLog.innerHTML = item.audit.map((event, index) => `
    <div class="event"><time>Step ${index + 1}</time><p>${event}</p></div>
  `).join("");
}

document.querySelectorAll(".chem").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".chem").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderChemical(button.dataset.chemical);
  });
});

document.querySelector("#approveButton").addEventListener("click", () => {
  fields.reviewStatus.textContent = "已确认";
  fields.auditLog.insertAdjacentHTML("beforeend", `
    <div class="event"><time>Manual</time><p>EHS 已确认高风险项，系统保留人工审核记录。</p></div>
  `);
});

renderChemical("ether");
