const questions = [
  {
    ai: "请用 2 分钟介绍一个你做过的 AI 产品项目。",
    follow: "你刚才讲了用户和方案。追问一下：这个项目上线前，你会如何评估 AI 回答质量？",
    feedback: "回答已经讲清楚用户和方案，建议补充北极星指标、幻觉率、引用命中率和上线门禁。",
    scores: [82, 78, 74, 86]
  },
  {
    ai: "RAG 和 fine-tuning 怎么选？",
    follow: "如果检索召回的片段不对，产品上应该如何发现并修复？",
    feedback: "技术概念基本准确，建议加入具体场景：私有知识和可追溯优先 RAG，稳定格式和风格可考虑 fine-tuning。",
    scores: [76, 84, 79, 80]
  },
  {
    ai: "设计一个 AI 面试陪练产品，你会怎么做 MVP？",
    follow: "为什么它是 Agent，而不是简单题库？",
    feedback: "MVP 范围清楚，建议强调 Agent 的阶段、状态、追问策略和评分 Rubric。",
    scores: [86, 82, 77, 81]
  }
];

const AI_BACKEND_URL = localStorage.getItem("AI_BACKEND_URL") || "http://127.0.0.1:8787";
let index = 0;
const messages = document.querySelector("#messages");
const answerInput = document.querySelector("#answerInput");
const feedbackText = document.querySelector("#feedbackText");
const scoreEls = [
  document.querySelector("#scoreProduct"),
  document.querySelector("#scoreAI"),
  document.querySelector("#scoreMetric"),
  document.querySelector("#scoreRisk")
];

function addMessage(type, text) {
  const node = document.createElement("div");
  node.className = `msg ${type}`;
  node.textContent = text;
  messages.appendChild(node);
}

function renderQuestion() {
  messages.innerHTML = "";
  addMessage("ai", questions[index].ai);
  feedbackText.textContent = questions[index].feedback;
  questions[index].scores.forEach((score, i) => {
    scoreEls[i].textContent = score;
  });
}

async function coachWithLocalAI(answer) {
  const response = await fetch(`${AI_BACKEND_URL}/api/interviewmate/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jd: "AI 产品经理，要求 LLM/RAG/Agent/Eval、产品指标和跨团队协作。",
      answer,
      stage: "mock_interview"
    })
  });
  if (!response.ok) {
    throw new Error(`AI backend returned ${response.status}`);
  }
  return response.json();
}

document.querySelector("#submitButton").addEventListener("click", async () => {
  const answer = answerInput.value.trim();
  addMessage("user", answer);
  const submitButton = document.querySelector("#submitButton");
  submitButton.disabled = true;
  submitButton.textContent = "AI 追问中...";
  try {
    const result = await coachWithLocalAI(answer);
    addMessage("ai", result.follow_up || questions[index].follow);
    feedbackText.textContent = result.feedback || questions[index].feedback;
    const scores = result.scores || {};
    scoreEls[0].textContent = scores.product ?? questions[index].scores[0];
    scoreEls[1].textContent = scores.ai ?? questions[index].scores[1];
    scoreEls[2].textContent = scores.metrics ?? questions[index].scores[2];
    scoreEls[3].textContent = scores.risk ?? questions[index].scores[3];
  } catch (error) {
    addMessage("ai", questions[index].follow);
    feedbackText.textContent = "本地 AI 后端未连接，已展示内置追问和反馈。";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "提交回答";
  }
});

document.querySelector("#nextButton").addEventListener("click", () => {
  index = (index + 1) % questions.length;
  renderQuestion();
});

renderQuestion();
