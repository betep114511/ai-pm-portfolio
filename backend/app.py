"""AI PM Portfolio local backend.

Provides JSON + streaming SSE endpoints that the four prototype demos call
when they need live model output. All API keys are loaded from environment
variables only, never from the frontend.
"""

from __future__ import annotations

import json
import os
import re
import time
from typing import Any, Iterable

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel, Field


AI_BASE_URL = os.environ.get("AI_BASE_URL", "https://super-relay.byted.org/v1")
AI_MODEL = os.environ.get("AI_MODEL", "ark/k2")
AI_API_KEY = os.environ.get("AI_API_KEY") or os.environ.get("OPENAI_API_KEY")


app = FastAPI(title="AI PM Portfolio Local Backend", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request schemas ----------


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    system: str | None = None
    temperature: float | None = 0.4


class ChemDocRequest(BaseModel):
    question: str
    context: str | None = None
    knowledge: str | None = Field(default=None, description="User-pasted reference snippets, one per blank line")


class SafetyLensRequest(BaseModel):
    chemical: str
    sds_text: str
    extra_rules: str | None = None


class EvalOpsCase(BaseModel):
    id: str | None = None
    scenario: str | None = None
    question: str
    answer: str
    gold_answer: str
    risk_level: str = "medium"


class EvalOpsRequest(BaseModel):
    cases: list[EvalOpsCase]


class InterviewMateRequest(BaseModel):
    jd: str
    answer: str
    stage: str = "project_deep_dive"
    history: list[ChatMessage] | None = None


class PortfolioAskRequest(BaseModel):
    question: str
    history: list[ChatMessage] | None = None


# ---------- Helpers ----------


def get_client() -> OpenAI:
    if not AI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI_API_KEY is not configured. Set it locally; never commit it.",
        )
    return OpenAI(base_url=AI_BASE_URL, api_key=AI_API_KEY)


def extract_json(text: str) -> dict[str, Any]:
    """Tolerant JSON parser for LLM output.

    Order of attempts:
    1. Parse the whole string verbatim.
    2. Strip markdown ```json fences and try again.
    3. Slice from first { to last } and try.
    4. Walk the buffer with a string-aware brace counter and try every
       balanced object we find; return the largest one that parses.
    """
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fenced = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, flags=re.S)
    if fenced:
        candidate = fenced.group(1).strip()
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    best: dict[str, Any] | None = None
    if start >= 0:
        depth = 0
        in_str = False
        esc = False
        obj_start = -1
        for i in range(start, len(text)):
            ch = text[i]
            if esc:
                esc = False
                continue
            if ch == "\\":
                esc = True
                continue
            if ch == '"':
                in_str = not in_str
                continue
            if in_str:
                continue
            if ch == "{":
                if depth == 0:
                    obj_start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and obj_start >= 0:
                    try:
                        candidate = json.loads(text[obj_start : i + 1])
                        if isinstance(candidate, dict) and (
                            best is None or len(text[obj_start : i + 1]) > len(json.dumps(best))
                        ):
                            best = candidate
                    except json.JSONDecodeError:
                        pass
                    obj_start = -1
    if best is not None:
        return best

    raise ValueError("Model did not return valid JSON")


def complete_json(
    system_prompt: str,
    user_payload: dict[str, Any],
    temperature: float = 0.2,
) -> dict[str, Any]:
    client = get_client()
    started = time.time()
    resp = client.chat.completions.create(
        model=AI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": json.dumps(user_payload, ensure_ascii=False, indent=2),
            },
        ],
        temperature=temperature,
    )
    elapsed_ms = int((time.time() - started) * 1000)
    content = resp.choices[0].message.content or "{}"
    try:
        data = extract_json(content)
    except Exception:
        data = {"raw": content}
    if isinstance(data, dict):
        data.setdefault("_meta", {})
        data["_meta"].update({"model": AI_MODEL, "latency_ms": elapsed_ms})
    return data


def model_to_dict(model: BaseModel) -> dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


def to_openai_messages(
    history: list[ChatMessage] | None,
    user_prompt: str | None = None,
    system: str | None = None,
) -> list[dict[str, str]]:
    msgs: list[dict[str, str]] = []
    if system:
        msgs.append({"role": "system", "content": system})
    for m in history or []:
        role = m.role if m.role in {"user", "assistant", "system"} else "user"
        msgs.append({"role": role, "content": m.content})
    if user_prompt is not None:
        msgs.append({"role": "user", "content": user_prompt})
    return msgs


def sse_pack(event: str, data: dict[str, Any]) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")


def stream_json_with_body_field(
    system_prompt: str,
    user_payload: dict[str, Any],
    body_field: str = "body",
    temperature: float = 0.3,
) -> Iterable[bytes]:
    """Stream a strict-JSON model response with progressive UX.

    The model is asked to return JSON. While the response streams in we
    incrementally extract the value of `body_field` (the prose field the UI
    types out, e.g. "body" / "feedback" / "summary_text") and forward it as
    `event: body_delta`. When the stream finishes we parse the whole JSON
    once and emit it as `event: result` so the frontend can render the
    structured side-panels (citations, scores, badges, ...).

    Schema requirement: the prose field must be a plain JSON string. To
    keep partial-extraction simple we never split mid-escape: if the tail
    of the buffer ends with an odd number of backslashes we hold one byte
    back until the next chunk.
    """
    client = get_client()
    started = time.time()
    body_open_re = re.compile(rf'"{re.escape(body_field)}"\s*:\s*"')
    body_started = False
    body_done = False
    cursor = 0
    full: list[str] = []
    try:
        stream = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": json.dumps(user_payload, ensure_ascii=False, indent=2),
                },
            ],
            temperature=temperature,
            stream=True,
        )
        for chunk in stream:
            try:
                delta = chunk.choices[0].delta.content or ""
            except (AttributeError, IndexError):
                delta = ""
            if not delta:
                continue
            full.append(delta)
            buf = "".join(full)

            if not body_started:
                m = body_open_re.search(buf)
                if m:
                    body_started = True
                    cursor = m.end()
                else:
                    continue

            if body_done:
                continue

            # Walk buf[cursor:] looking for the closing unescaped quote.
            i = cursor
            while i < len(buf):
                ch = buf[i]
                if ch == "\\":
                    # Skip the escape pair; if pair is split across chunks
                    # we'll just stop and resume next time.
                    if i + 1 >= len(buf):
                        break
                    i += 2
                    continue
                if ch == '"':
                    seg = buf[cursor:i]
                    if seg:
                        try:
                            text = json.loads('"' + seg + '"')
                        except json.JSONDecodeError:
                            text = seg
                        yield sse_pack("body_delta", {"text": text})
                    cursor = i + 1
                    body_done = True
                    break
                i += 1
            else:
                # No closing quote yet; emit everything up to i, leaving a
                # potential trailing backslash for the next chunk.
                end = i
                if end > 0 and buf[end - 1] == "\\":
                    end -= 1
                if end > cursor:
                    seg = buf[cursor:end]
                    try:
                        text = json.loads('"' + seg + '"')
                    except json.JSONDecodeError:
                        text = seg
                    yield sse_pack("body_delta", {"text": text})
                    cursor = end

        elapsed_ms = int((time.time() - started) * 1000)
        raw = "".join(full)
        try:
            data = extract_json(raw)
        except Exception:
            data = {"raw": raw}
        if isinstance(data, dict):
            data.setdefault("_meta", {})
            data["_meta"].update({"model": AI_MODEL, "latency_ms": elapsed_ms})
        yield sse_pack("result", data)
    except HTTPException as exc:
        yield sse_pack("error", {"detail": exc.detail, "status": exc.status_code})
    except Exception as exc:  # noqa: BLE001
        yield sse_pack("error", {"detail": str(exc), "status": 500})


def stream_chat(messages: list[dict[str, str]], temperature: float = 0.4) -> Iterable[bytes]:
    """Yield SSE chunks for a streaming chat completion."""
    client = get_client()
    started = time.time()
    try:
        stream = client.chat.completions.create(
            model=AI_MODEL,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        full = []
        for chunk in stream:
            try:
                delta = chunk.choices[0].delta.content or ""
            except (AttributeError, IndexError):
                delta = ""
            if delta:
                full.append(delta)
                yield sse_pack("token", {"text": delta})
        elapsed_ms = int((time.time() - started) * 1000)
        yield sse_pack(
            "done",
            {
                "text": "".join(full),
                "model": AI_MODEL,
                "latency_ms": elapsed_ms,
            },
        )
    except HTTPException as exc:
        yield sse_pack("error", {"detail": exc.detail, "status": exc.status_code})
    except Exception as exc:  # noqa: BLE001
        yield sse_pack("error", {"detail": str(exc), "status": 500})


# ---------- Common endpoints ----------


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "model": AI_MODEL,
        "base_url": AI_BASE_URL,
        "configured": bool(AI_API_KEY),
    }


@app.post("/api/chat/stream")
def chat_stream(req: ChatRequest) -> StreamingResponse:
    messages = to_openai_messages(req.messages, system=req.system)
    return StreamingResponse(
        stream_chat(messages, temperature=req.temperature or 0.4),
        media_type="text/event-stream",
    )


# ---------- ChemDoc AI ----------


CHEMDOC_SYSTEM = """\
You are ChemDoc AI, a cautious chemistry lab RAG assistant.
Rules:
1. Only use the "knowledge" snippets the user provided. Do NOT invent citations or facts.
2. If the snippets do not contain enough evidence, set risk to "high" and clearly refuse.
3. Risk levels: low (routine info), medium (safety-relevant), high (PPE/SDS/risky operations or unclear evidence).
4. Always answer in Chinese. Citations must quote the snippet ID and a short supporting sentence.

Return JSON only. The "body" field MUST appear first so streaming clients can
display it progressively. Schema:
{
  "body": "answer in Chinese, 2-4 sentences",
  "title": "short answer title in Chinese",
  "risk": "low|medium|high",
  "riskText": "低风险|中风险|高风险",
  "confidence": "0-100%",
  "safety": "specific safety note in Chinese",
  "retrieval": "brief retrieval/source note",
  "citations": [{"title": "source label", "text": "supporting quote from the user knowledge"}]
}
"""


def _chemdoc_payload(req: ChemDocRequest) -> dict[str, Any]:
    return {
        "question": req.question,
        "context": req.context or "lab knowledge: SOP, SDS, paper excerpts",
        "knowledge": req.knowledge
        or "(no user knowledge provided; reply with low confidence and refuse if unsafe.)",
    }


@app.post("/api/chemdoc/ask")
def chemdoc_ask(req: ChemDocRequest) -> dict[str, Any]:
    return complete_json(CHEMDOC_SYSTEM, _chemdoc_payload(req))


@app.post("/api/chemdoc/ask/stream")
def chemdoc_ask_stream(req: ChemDocRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_json_with_body_field(CHEMDOC_SYSTEM, _chemdoc_payload(req), body_field="body"),
        media_type="text/event-stream",
    )


# ---------- SafetyLens ----------


SAFETYLENS_SYSTEM = """\
You are SafetyLens, an SDS extraction and EHS review assistant for chemical labs.
Be conservative on high-risk chemicals. All output must be in Chinese
(except CAS numbers and English SDS quotes).

Return JSON only. The "summary" field MUST come first; it should be a
2-4 sentence Chinese narrative the UI types out (mention compound type,
key risks, what you found in the SDS, what the next human step should be).
Then deliver the structured analysis. Schema:
{
  "summary": "2-4 sentence Chinese narrative — streams character by character",
  "name": "display title in Chinese",
  "meta": "CAS / risk class / review status summary",
  "score": "0-100%",
  "conflicts": "number as string",
  "status": "待确认|管理员确认|已确认",
  "source": "SDS sections that supported the extraction",
  "text": "short SDS quote (English ok)",
  "fields": [["field name", "field value", "confidence string"]],
  "rules": [["high|medium|ok", "rule title", "rule explanation"]],
  "checklist": ["actionable item"],
  "audit": ["audit event"]
}
"""


@app.post("/api/safetylens/analyze")
def safetylens_analyze(req: SafetyLensRequest) -> dict[str, Any]:
    return complete_json(SAFETYLENS_SYSTEM, model_to_dict(req))


@app.post("/api/safetylens/analyze/stream")
def safetylens_analyze_stream(req: SafetyLensRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_json_with_body_field(SAFETYLENS_SYSTEM, model_to_dict(req), body_field="summary"),
        media_type="text/event-stream",
    )


# ---------- EvalOps Lite ----------


EVALOPS_SYSTEM = """\
You are EvalOps Lite, a strict LLM-as-Judge for AI product teams.
For each case, judge accuracy / grounding / safety / format on 0-100,
pick a failure tag (or "-" if pass), explain in 1-2 Chinese sentences,
and recommend a gate decision.

Return JSON only. The "summary_text" field MUST come first — a 2-4
sentence Chinese narrative the UI types out (overall pass rate, where
the batch is breaking, gate recommendation). Then the structured
summary metrics and per-case verdicts. Schema:
{
  "summary_text": "2-4 sentence Chinese narrative — streams character by character",
  "summary": {
    "accuracy": "percentage string",
    "hallucination": "percentage string",
    "latency": "string with seconds",
    "cost": "string with dollar amount",
    "gate": "允许灰度|暂不发布|禁止发布",
    "gateClass": "pass|warn|fail"
  },
  "gates": [["gate name", "value", true|false]],
  "failures": [["failure_tag", number]],
  "cases": [
    {
      "id": "case id",
      "scenario": "short scenario label",
      "risk": "高|中|低",
      "verdict": "通过|警告|失败",
      "verdictClass": "pass|warn|fail",
      "failure_tag": "retrieval_miss|citation_wrong|hallucination|instruction_following|refusal_error|safety_violation|latency_cost|-",
      "scores": {"accuracy": 0-100, "grounding": 0-100, "safety": 0-100, "format": 0-100},
      "rationale": "short Chinese explanation"
    }
  ]
}
"""


def _evalops_payload(req: EvalOpsRequest) -> dict[str, Any]:
    if not req.cases:
        raise HTTPException(status_code=400, detail="cases must be non-empty")
    return {"cases": [model_to_dict(c) for c in req.cases]}


@app.post("/api/evalops/judge")
def evalops_judge(req: EvalOpsRequest) -> dict[str, Any]:
    return complete_json(EVALOPS_SYSTEM, _evalops_payload(req))


@app.post("/api/evalops/judge/stream")
def evalops_judge_stream(req: EvalOpsRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_json_with_body_field(
            EVALOPS_SYSTEM, _evalops_payload(req), body_field="summary_text"
        ),
        media_type="text/event-stream",
    )


# ---------- InterviewMate ----------


INTERVIEWMATE_SYSTEM = """\
You are InterviewMate AI, an AI product manager interview coach.
Goals:
- Generate one sharp Chinese follow-up question grounded in the candidate's own answer and the target JD.
- Score four dimensions 0-100: product structure, AI literacy, metrics sense, risk awareness.
- Give a concrete Chinese improvement note (no fluff, no fabricated experience).
- Suggest 3 short training actions.

Return JSON only. The "feedback" field MUST come first so streaming
clients can type it out live. Schema:
{
  "feedback": "specific 3-6 sentence Chinese feedback — streams character by character",
  "follow_up": "one sharp Chinese follow-up question",
  "scores": {
    "product": 0-100,
    "ai": 0-100,
    "metrics": 0-100,
    "risk": 0-100
  },
  "training_plan": ["short Chinese action", "...", "..."]
}
"""


def _interviewmate_payload(req: InterviewMateRequest) -> dict[str, Any]:
    history_text = ""
    if req.history:
        rendered = []
        for m in req.history[-6:]:
            tag = "面试官" if m.role == "assistant" else "候选人"
            rendered.append(f"[{tag}] {m.content}")
        history_text = "\n".join(rendered)
    return {
        "jd": req.jd,
        "stage": req.stage,
        "history": history_text,
        "candidate_answer": req.answer,
    }


@app.post("/api/interviewmate/coach")
def interviewmate_coach(req: InterviewMateRequest) -> dict[str, Any]:
    return complete_json(INTERVIEWMATE_SYSTEM, _interviewmate_payload(req), temperature=0.5)


@app.post("/api/interviewmate/coach/stream")
def interviewmate_coach_stream(req: InterviewMateRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_json_with_body_field(
            INTERVIEWMATE_SYSTEM,
            _interviewmate_payload(req),
            body_field="feedback",
            temperature=0.5,
        ),
        media_type="text/event-stream",
    )


@app.post("/api/interviewmate/chat/stream")
def interviewmate_chat_stream(req: InterviewMateRequest) -> StreamingResponse:
    system = (
        "你是 InterviewMate AI，AI 产品经理面试官与教练。"
        "根据目标岗位 JD 和当前对话，提出一个具体、能挖深度的中文追问，"
        "不要重复套话，不要捏造经历，必要时点出回答里的漏洞。"
        f"\n\n目标 JD:\n{req.jd}\n\n阶段: {req.stage}"
    )
    messages = to_openai_messages(req.history, user_prompt=req.answer, system=system)
    return StreamingResponse(stream_chat(messages, temperature=0.5), media_type="text/event-stream")


# ---------- Portfolio assistant ("ask the portfolio") ----------


PORTFOLIO_SYSTEM = """\
You are the AI assistant embedded in 何佳佳的 AI 产品经理作品集主页。
你的目标是帮访客（招聘官、面试官）快速理解候选人的能力与作品，
要直接、可读、有具体证据。所有回答用中文。

候选人背景：化学专业转 AI 产品，强项是把领域知识场景拆成 LLM/RAG 产品方案、
指标体系、风险闭环。已交付 4 个可演示项目：

1. ChemDoc AI — 化学实验文献与 SOP 的 RAG 助手，强调引用、拒答、安全提示。
2. SafetyLens — 危化品 SDS 安全审核助手，强调字段抽取、规则校验、人审留痕。
3. EvalOps Lite — LLM 应用质量评估与上线门禁，强调 Prompt/模型对比、失败回流。
4. InterviewMate AI — AI PM 面试陪练 Agent，强调多轮追问与评分 Rubric。

回答风格：
- 优先用 1-3 句话直接回答，不要废话。
- 如果对方问"项目细节"，挑 1 个最贴合的项目讲指标、风险、用户、AI 边界。
- 如果对方问"为什么从化学转 AI 产品"，强调垂直行业理解 + AI 应用，不要找借口。
- 如果对方问"你做过 ToC/算法平台"，诚实承认偏重 LLM 应用而非算法基础设施。
- 不要捏造数据或公司名。
"""


@app.post("/api/portfolio/ask/stream")
def portfolio_ask_stream(req: PortfolioAskRequest) -> StreamingResponse:
    messages = to_openai_messages(req.history, user_prompt=req.question, system=PORTFOLIO_SYSTEM)
    return StreamingResponse(stream_chat(messages, temperature=0.45), media_type="text/event-stream")
