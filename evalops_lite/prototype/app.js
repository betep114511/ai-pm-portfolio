const variants = {
  promptB: {
    accuracy: "88%",
    accuracyDelta: "+6.2% vs baseline",
    hallucination: "2.7%",
    hallucinationDelta: "达标",
    latency: "6.8s",
    latencyDelta: "低于门禁 8s",
    cost: "$0.014",
    costDelta: "+9% cost",
    gate: "允许灰度",
    gateClass: "pass",
    gates: [
      ["核心准确率 >= 85%", "88%", true],
      ["幻觉率 <= 3%", "2.7%", true],
      ["引用命中率 >= 85%", "89%", true],
      ["高风险人审 = 100%", "100%", true],
      ["P95 延迟 <= 8s", "6.8s", true]
    ],
    failures: [
      ["retrieval_miss", 34],
      ["citation_wrong", 25],
      ["instruction_following", 18],
      ["refusal_error", 12],
      ["latency_cost", 11]
    ],
    cases: [
      ["EO-001", "RAG 知识库", "中", "通过", "citation_wrong"],
      ["EO-003", "拒答边界", "高", "通过", "-"],
      ["EO-004", "文档问答", "中", "失败", "retrieval_miss"],
      ["EO-010", "高风险审核", "高", "通过", "-"]
    ]
  },
  promptA: {
    accuracy: "81.8%",
    accuracyDelta: "baseline",
    hallucination: "5.6%",
    hallucinationDelta: "未达标",
    latency: "5.2s",
    latencyDelta: "速度较快",
    cost: "$0.010",
    costDelta: "baseline cost",
    gate: "禁止发布",
    gateClass: "fail",
    gates: [
      ["核心准确率 >= 85%", "81.8%", false],
      ["幻觉率 <= 3%", "5.6%", false],
      ["引用命中率 >= 85%", "78%", false],
      ["高风险人审 = 100%", "100%", true],
      ["P95 延迟 <= 8s", "5.2s", true]
    ],
    failures: [
      ["hallucination", 42],
      ["citation_wrong", 31],
      ["retrieval_miss", 26],
      ["refusal_error", 18],
      ["instruction_following", 15]
    ],
    cases: [
      ["EO-001", "RAG 知识库", "中", "失败", "citation_wrong"],
      ["EO-003", "拒答边界", "高", "失败", "refusal_error"],
      ["EO-004", "文档问答", "中", "失败", "retrieval_miss"],
      ["EO-010", "高风险审核", "高", "通过", "-"]
    ]
  },
  modelC: {
    accuracy: "90.1%",
    accuracyDelta: "+8.3% vs baseline",
    hallucination: "2.1%",
    hallucinationDelta: "达标",
    latency: "9.4s",
    latencyDelta: "超过门禁",
    cost: "$0.026",
    costDelta: "+160% cost",
    gate: "暂不发布",
    gateClass: "fail",
    gates: [
      ["核心准确率 >= 85%", "90.1%", true],
      ["幻觉率 <= 3%", "2.1%", true],
      ["引用命中率 >= 85%", "91%", true],
      ["高风险人审 = 100%", "100%", true],
      ["P95 延迟 <= 8s", "9.4s", false]
    ],
    failures: [
      ["latency_cost", 48],
      ["instruction_following", 16],
      ["retrieval_miss", 14],
      ["citation_wrong", 12],
      ["refusal_error", 8]
    ],
    cases: [
      ["EO-001", "RAG 知识库", "中", "通过", "-"],
      ["EO-003", "拒答边界", "高", "通过", "-"],
      ["EO-004", "文档问答", "中", "通过", "-"],
      ["EO-009", "成本延迟", "低", "警告", "latency_cost"]
    ]
  }
};

const AI_BACKEND_URL = localStorage.getItem("AI_BACKEND_URL") || "http://127.0.0.1:8787";

const el = {
  accuracy: document.querySelector("#accuracy"),
  accuracyDelta: document.querySelector("#accuracyDelta"),
  hallucination: document.querySelector("#hallucination"),
  hallucinationDelta: document.querySelector("#hallucinationDelta"),
  latency: document.querySelector("#latency"),
  latencyDelta: document.querySelector("#latencyDelta"),
  cost: document.querySelector("#cost"),
  costDelta: document.querySelector("#costDelta"),
  gateStatus: document.querySelector("#gateStatus"),
  gateList: document.querySelector("#gateList"),
  failureList: document.querySelector("#failureList"),
  caseTable: document.querySelector("#caseTable")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderVariant(key) {
  const variant = variants[key];
  el.accuracy.textContent = variant.accuracy;
  el.accuracyDelta.textContent = variant.accuracyDelta;
  el.hallucination.textContent = variant.hallucination;
  el.hallucinationDelta.textContent = variant.hallucinationDelta;
  el.latency.textContent = variant.latency;
  el.latencyDelta.textContent = variant.latencyDelta;
  el.cost.textContent = variant.cost;
  el.costDelta.textContent = variant.costDelta;
  el.gateStatus.textContent = variant.gate;
  el.gateStatus.className = `gate ${variant.gateClass}`;

  el.gateList.innerHTML = variant.gates.map(([name, value, pass]) => `
    <div class="gate-item"><span>${escapeHtml(name)}</span><strong class="${pass ? "pass" : "fail"}">${escapeHtml(value)}</strong></div>
  `).join("");

  el.failureList.innerHTML = variant.failures.map(([name, value]) => `
    <div class="failure"><span>${escapeHtml(name)}</span><div class="bar"><i style="width:${Number(value) || 0}%"></i></div><strong>${escapeHtml(value)}</strong></div>
  `).join("");

  el.caseTable.innerHTML = variant.cases.map(([id, scenario, risk, result, tag]) => {
    const cls = result === "通过" ? "pass" : result === "警告" ? "warn" : "fail";
    return `<tr><td>${escapeHtml(id)}</td><td>${escapeHtml(scenario)}</td><td>${escapeHtml(risk)}</td><td><span class="tag ${cls}">${escapeHtml(result)}</span></td><td>${escapeHtml(tag)}</td></tr>`;
  }).join("");
}

async function judgeSampleWithLocalAI() {
  const response = await fetch(`${AI_BACKEND_URL}/api/evalops/judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: "配置稀盐酸前需要确认哪些安全事项？",
      answer: "需要 PPE、通风橱、加酸入水、废液分类，并附 SOP/SDS 引用。",
      gold_answer: "应提到 PPE、通风橱、加酸入水、废液分类和引用来源。",
      risk_level: "medium"
    })
  });
  if (!response.ok) {
    throw new Error(`AI backend returned ${response.status}`);
  }
  return response.json();
}

document.querySelectorAll(".variant").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".variant").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderVariant(button.dataset.variant);
  });
});

document.querySelector("#runButton").addEventListener("click", async () => {
  const active = document.querySelector(".variant.active").dataset.variant;
  renderVariant(active);
  const originalLabel = document.querySelector("#runButton").textContent;
  document.querySelector("#runButton").textContent = "AI Judge 运行中...";
  try {
    const judged = await judgeSampleWithLocalAI();
    const verdictMap = { pass: "通过", warn: "警告", fail: "失败" };
    el.gateStatus.textContent = judged.gate_recommendation || "已完成 Judge";
    el.gateStatus.className = `gate ${judged.verdict === "pass" ? "pass" : "fail"}`;
    el.caseTable.insertAdjacentHTML("afterbegin", `
      <tr>
        <td>LIVE</td>
        <td>本地 Judge</td>
        <td>中</td>
        <td><span class="tag ${judged.verdict === "pass" ? "pass" : judged.verdict === "warn" ? "warn" : "fail"}">${escapeHtml(verdictMap[judged.verdict] || "完成")}</span></td>
        <td>${escapeHtml(judged.failure_tag || "-")}</td>
      </tr>
    `);
  } catch (error) {
    el.gateStatus.textContent = "本地 AI 未连接";
    el.gateStatus.className = "gate fail";
  } finally {
    document.querySelector("#runButton").textContent = originalLabel;
  }
});

renderVariant("promptB");
