import { requireAuth } from "./_lib/auth.js";

const REPO = "jalchaudhary08/founder-agent";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
const API_BASE = `https://api.github.com/repos/${REPO}/contents/`;

const BASE_FILES = [
  "AGENT.md",
  "MEMORY/STATE.md"
];

const CONTEXT_RULES = [
  [/(mission|build|execute|agent|task|run|research|project)/i, "CORE/ORCHESTRATOR.md"],
  [/(decide|decision|compare|choose|strategy|recommend|business|saas)/i, "CORE/DECISION_ENGINE.md"],
  [/(write|create|update|delete|github|approve|approval|send|payment|purchase|deploy)/i, "CORE/APPROVAL_GATES.md"],
  [/(mission[ _-]?002)/i, "MISSIONS/MISSION_002_PROSPECT_RESEARCH.md"],
  [/(mission[ _-]?002|prospect)/i, "MISSIONS/PROSPECT_RECORD_SCHEMA.md"],
  [/(mission[ _-]?002|prospect|food label|nutrition|packaged food)/i, "MISSIONS/PROSPECT_RESEARCH_DATA.md"],
  [/(food label|nutrition)/i, "PRODUCTS/FOOD_LABEL_NUTRITION/PRODUCT_SPEC.md"]
];

const MAX_FILE_CHARS = 12000;
const MAX_CONTEXT_CHARS = 36000;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 12000;

function githubHeaders() {
  const headers = { Accept: "application/vnd.github.raw+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function loadRepoFile(path) {
  const url = process.env.GITHUB_TOKEN ? API_BASE + path : RAW_BASE + path;
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) throw new Error(`GitHub context load failed for ${path}: ${response.status}`);

  if (process.env.GITHUB_TOKEN) {
    const data = await response.json();
    if (data.encoding !== "base64") throw new Error(`Unsupported GitHub encoding for ${path}`);
    return Buffer.from(data.content.replace(/\\n/g, ""), "base64").toString("utf8");
  }

  return response.text();
}

function selectContextPaths(task) {
  const paths = [...BASE_FILES];
  for (const [pattern, path] of CONTEXT_RULES) {
    if (pattern.test(task) && !paths.includes(path)) paths.push(path);
  }
  return paths;
}

async function loadContext(task) {
  const paths = selectContextPaths(task);
  const results = await Promise.all(
    paths.map(async (path) => {
      try {
        const content = await loadRepoFile(path);
        return { path, content: content.length > MAX_FILE_CHARS
          ? content.slice(0, MAX_FILE_CHARS) + "\n[CONTEXT TRUNCATED BY RUNTIME]"
          : content };
      } catch (error) {
        return { path, error: error.message };
      }
    })
  );

  let total = 0;
  const sections = [];
  for (const item of results) {
    const section = item.error
      ? `## ${item.path}\n[CONTEXT UNAVAILABLE: ${item.error}]`
      : `## ${item.path}\n${item.content}`;
    if (total + section.length > MAX_CONTEXT_CHARS) break;
    sections.push(section);
    total += section.length;
  }
  return sections.join("\n\n---\n\n");
}

function trimHistory(history) {
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role === "agent" ? "assistant" : "user",
      content: String(message.text || "").slice(0, 2200)
    }))
    .reduce((items, item) => {
      const used = items.reduce((sum, current) => sum + current.content.length, 0);
      if (used + item.content.length > MAX_HISTORY_CHARS) return items;
      items.push(item);
      return items;
    }, []);
}

function headerNumber(response, name) {
  const value = response.headers.get(name);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rateLimitSnapshot(response) {
  return {
    limitTokens: headerNumber(response, "x-ratelimit-limit-tokens"),
    remainingTokens: headerNumber(response, "x-ratelimit-remaining-tokens"),
    resetTokens: response.headers.get("x-ratelimit-reset-tokens"),
    limitRequests: headerNumber(response, "x-ratelimit-limit-requests"),
    remainingRequests: headerNumber(response, "x-ratelimit-remaining-requests"),
    resetRequests: response.headers.get("x-ratelimit-reset-requests"),
    retryAfter: response.headers.get("retry-after")
  };
}

function addUsage(total, usage) {
  if (!usage) return total;
  return {
    inputTokens: total.inputTokens + Number(usage.input_tokens || 0),
    outputTokens: total.outputTokens + Number(usage.output_tokens || 0),
    totalTokens: total.totalTokens + Number(usage.total_tokens || 0),
    cachedTokens: total.cachedTokens + Number(usage.input_tokens_details?.cached_tokens || 0)
  };
}

const TOOL_DEFINITIONS = [
  {
    type: "function",
    name: "github_read_file",
    description: "Read one text file from the Founder Agent repository.",
    parameters: {
      type: "object",
      properties: { path: { type: "string", description: "Repository-relative file path." } },
      required: ["path"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "github_prepare_write",
    description: "Prepare a proposed repository file change for explicit founder approval. This NEVER writes to GitHub.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Repository-relative file path." },
        content: { type: "string", description: "Complete replacement UTF-8 file content." },
        message: { type: "string", description: "Proposed Git commit message." }
      },
      required: ["path", "content", "message"],
      additionalProperties: false
    },
    strict: true
  }
];

function extractFunctionCalls(data) {
  return (data.output ?? []).filter((item) => item.type === "function_call");
}

async function executeToolCall(call) {
  const args = JSON.parse(call.arguments || "{}");
  const { readFile, prepareWrite } = await import("./tools/github.js");

  if (call.name === "github_read_file") return await readFile(args.path);
  if (call.name === "github_prepare_write") return await prepareWrite(args);

  throw new Error(`Unsupported tool: ${call.name}`);
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();

  const parts = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

async function callOpenAI(task, history, context) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured in Vercel.");
    error.code = "MISSING_API_KEY";
    throw error;
  }
  if (!process.env.OPENAI_MODEL) {
    const error = new Error("OPENAI_MODEL is not configured in Vercel.");
    error.code = "MISSING_MODEL";
    throw error;
  }

  const isMission002 = /mission[ _-]?002/i.test(task);
  const system = `You are Founder Agent. Follow the repository constitution exactly.
Use github_read_file when additional repository evidence is needed.
Use the built-in web_search tool for current public-web discovery and source verification.
For research, do not treat unsupported claims as verified evidence. Use the web search citations/sources provided by the runtime and clearly distinguish FACT, SOURCE_DERIVED, ASSUMPTION, ESTIMATE and HYPOTHESIS.
For Mission 002, follow the mission schema and do not invent missing prospect fields.
Mission 002 is resumable and batch-limited: NEVER attempt all 30 prospects in one model turn. Process at most 5 new prospects per execution, report how many remain, and resume from repository state on the next run.
Authoritative Mission 002 repository paths are exactly:
- MISSIONS/MISSION_002_PROSPECT_RESEARCH.md
- MISSIONS/PROSPECT_RECORD_SCHEMA.md
- MISSIONS/PROSPECT_RESEARCH_DATA.md
Never invent or guess a repository path such as MISSIONS/MISSION_002_PROSPECTS.md. If a needed file is absent, use the exact paths above or report it as unavailable.
Never claim a tool action happened without runtime evidence.
Never fabricate completion, sources, customers, payments, permissions or verification.
For repository changes, use github_prepare_write to create a proposal. NEVER write directly; explicit founder approval is required before any write.
If the user asks to create a NEW file, call github_prepare_write directly; do NOT call github_read_file on the target first because a new file correctly returns 404.
If the user asks for a change to an EXISTING file and the target is not known to exist, read it first only when necessary to establish the current content.
Do not reveal hidden chain-of-thought; provide concise conclusions and evidence.
${isMission002 ? "Mission 002 batch rule is active for this request: maximum 5 new prospects." : ""}

REPOSITORY CONTEXT:
${context}`;

  let input = [...trimHistory(history), { role: "user", content: task }];
  const toolEvidence = [];
  let approval = null;
  let webSearchCount = 0;
  let usageTotals = { inputTokens: 0, outputTokens: 0, totalTokens: 0, cachedTokens: 0 };
  let lastRateLimit = null;

  for (let round = 0; round < 3; round++) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        instructions: system,
        input,
        max_output_tokens: isMission002 ? 4500 : 2500,
        max_tool_calls: isMission002 ? 8 : 4,
        tools: [
          ...TOOL_DEFINITIONS,
          { type: "web_search", search_context_size: "medium" }
        ],
        include: ["web_search_call.results"]
      })
    });

    lastRateLimit = rateLimitSnapshot(response);
    const data = await response.json();
    usageTotals = addUsage(usageTotals, data.usage);

    if (!response.ok) {
      const error = new Error(data?.error?.message || `OpenAI request failed: ${response.status}`);
      error.statusCode = response.status;
      error.code = data?.error?.code;
      error.telemetry = { usage: usageTotals, rateLimit: lastRateLimit };
      throw error;
    }

    const calls = extractFunctionCalls(data);
    webSearchCount += (data.output ?? []).filter((item) => item.type === "web_search_call").length;
    if (!calls.length) {
      return {
        text: extractOutputText(data),
        toolEvidence,
        approval,
        webSearchCount,
        usage: usageTotals,
        rateLimit: lastRateLimit
      };
    }

    input = [...input, ...(data.output ?? [])];

    for (const call of calls) {
      const result = await executeToolCall(call);
      toolEvidence.push({ tool: call.name, path: result.path, verified: result.verified === true });
      if (call.name === "github_prepare_write") {
        approval = {
          approvalToken: result.approvalToken,
          path: result.path,
          expectedSha: result.expectedSha,
          message: result.message,
          contentPreview: result.contentPreview,
          expiresInSeconds: result.expiresInSeconds,
          requiresExplicitApproval: result.requiresExplicitApproval === true
        };
      }
      input.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(result)
      });
    }
  }

  throw new Error("Tool-calling loop exceeded the safe round limit.");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ status: "FAILED", error: "Method not allowed." });
    return;
  }

  try {
    requireAuth(req);

    const body = req.body ?? {};
    const task = typeof body.task === "string" ? body.task.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!task) {
      res.status(400).json({ status: "FAILED", error: "Task is required." });
      return;
    }

    const context = await loadContext(task);
    const modelResult = await callOpenAI(task, history, context);

    res.status(200).json({
      status: modelResult.approval ? "NEEDS_HUMAN_APPROVAL" : "DONE",
      result: modelResult.text,
      approval: modelResult.approval,
      usage: modelResult.usage,
      rateLimit: modelResult.rateLimit,
      evidence: [
        "Authenticated Founder session verified.",
        "Loaded task-relevant repository context only.",
        "Response generated by the configured model provider.",
        ...modelResult.toolEvidence.map((e) => `Tool verified: ${e.tool} (${e.path}).`),
        ...(modelResult.webSearchCount ? [`Built-in web search executed: ${modelResult.webSearchCount} search call(s).`] : [])
      ],
      actions_taken: [
        "Verified Founder authentication.",
        "Parsed the founder request.",
        "Loaded only task-relevant repository context.",
        "Generated a response through the runtime provider adapter.",
        ...(modelResult.toolEvidence.length ? ["Executed bounded GitHub tool calls and recorded evidence."] : [])
      ],
      actions_not_taken: [modelResult.approval
        ? "No repository write was executed; the proposed change is waiting for explicit founder approval."
        : "No repository write or destructive action was executed."],
      next_step: modelResult.approval
        ? "Review the proposed change and approve it explicitly to execute the GitHub write."
        : "Continue with the next task or a resumable mission batch."
    });
  } catch (error) {
    if (error?.code === "UNAUTHORIZED") {
      res.status(401).json({
        status: "NEEDS_AUTHENTICATION",
        error: "Founder authentication required.",
        next_step: "Authenticate through the Founder Agent login screen."
      });
      return;
    }

    const missingConfig =
      error?.code === "MISSING_API_KEY" ||
      error?.code === "MISSING_MODEL" ||
      error?.code === "MISSING_AUTH_SECRET";

    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : (missingConfig ? 503 : 500);
    res.status(statusCode).json({
      status: statusCode === 429 ? "RATE_LIMITED" : (missingConfig ? "BLOCKED" : "FAILED"),
      error: error?.message || "Runtime error.",
      usage: error?.telemetry?.usage || null,
      rateLimit: error?.telemetry?.rateLimit || null,
      next_step: statusCode === 429
        ? "Wait for the reported rate-limit reset, or reduce request size/traffic before retrying."
        : (missingConfig
          ? "Configure the required runtime environment variables in Vercel."
          : "Inspect the runtime error, fix the failing dependency, and retry.")
    });
  }
}
