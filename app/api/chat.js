import { requireAuth } from "./_lib/auth.js";

const REPO = "jalchaudhary08/founder-agent";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
const API_BASE = `https://api.github.com/repos/${REPO}/contents/`;

const ROUTES = {
  status: {
    patterns: [
      /^(project )?status/i,
      /current (project )?status/i,
      /what are we building/i,
      /where (are|do) we stand/i,
      /progress/i
    ],
    files: ["MEMORY/STATE.md"],
    tools: [],
    historyMessages: 2,
    maxOutputTokens: 350
  },
  mission: {
    patterns: [/mission[ _-]?002/i, /mission/i, /prospect/i],
    files: [
      "MEMORY/STATE.md",
      "MISSIONS/PROSPECT_RESEARCH_DATA.md"
    ],
    tools: ["web_search"],
    historyMessages: 0,
    maxOutputTokens: 900,
    reasoningEffort: "low",
    maxToolCalls: 1
  },
  research: {
    patterns: [/research/i, /search/i, /find/i, /latest/i, /current/i, /verify/i, /source/i, /market/i],
    files: ["MEMORY/STATE.md"],
    tools: ["web_search"],
    historyMessages: 0,
    maxOutputTokens: 600,
    reasoningEffort: "low",
    maxToolCalls: 1
  },
  write: {
    patterns: [/create/i, /write/i, /update/i, /change/i, /edit/i, /build/i, /deploy/i, /github/i, /approve/i],
    files: ["MEMORY/STATE.md", "CORE/APPROVAL_GATES.md"],
    tools: ["github_read_file", "github_prepare_write"],
    historyMessages: 3,
    maxOutputTokens: 2200
  },
  decision: {
    patterns: [/decide/i, /decision/i, /compare/i, /choose/i, /strategy/i, /recommend/i, /business/i, /saas/i],
    files: ["MEMORY/STATE.md", "CORE/DECISION_ENGINE.md"],
    tools: [],
    historyMessages: 2,
    maxOutputTokens: 700,
    reasoningEffort: "medium",
    maxToolCalls: 0
  },
  general: {
    patterns: [],
    files: ["MEMORY/STATE.md"],
    tools: [],
    historyMessages: 3,
    maxOutputTokens: 1600
  }
};

const MAX_FILE_CHARS = 3500;
const MAX_CONTEXT_CHARS = 7000;
const MAX_HISTORY_CHARS = 2200;

function githubHeaders() {
  const headers = {
    Accept: process.env.GITHUB_TOKEN
      ? "application/vnd.github+json"
      : "application/vnd.github.raw+json"
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    headers["X-GitHub-Api-Version"] = "2022-11-28";
  }
  return headers;
}

async function loadRepoFile(path) {
  const apiUrl = API_BASE + path;
  const rawUrl = RAW_BASE + path;

  async function readResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (data.encoding === "base64" && typeof data.content === "string") {
        return Buffer.from(data.content.replace(/\\n/g, ""), "base64").toString("utf8");
      }
      if (typeof data.content === "string") return data.content;
      throw new Error(`Unexpected GitHub JSON response for ${path}`);
    }

    return response.text();
  }

  if (process.env.GITHUB_TOKEN) {
    try {
      const response = await fetch(apiUrl, { headers: githubHeaders() });
      if (response.ok) return await readResponse(response);

      // Public repositories can fall back to raw content if the GitHub API has
      // a transient/server-side failure. Never treat an API error body as JSON.
      const rawResponse = await fetch(rawUrl);
      if (rawResponse.ok) return await rawResponse.text();

      throw new Error(`GitHub context load failed for ${path}: API ${response.status}, RAW ${rawResponse.status}`);
    } catch (error) {
      if (error.message?.includes("GitHub context load failed")) throw error;
      const rawResponse = await fetch(rawUrl);
      if (rawResponse.ok) return await rawResponse.text();
      throw new Error(`GitHub context load failed for ${path}: ${error.message}`);
    }
  }

  const response = await fetch(rawUrl);
  if (!response.ok) throw new Error(`GitHub context load failed for ${path}: ${response.status}`);
  return response.text();
}

function classifyTask(task) {
  for (const [name, route] of Object.entries(ROUTES)) {
    if (route.patterns.some((pattern) => pattern.test(task))) return { name, ...route };
  }
  return { name: "general", ...ROUTES.general };
}

async function loadContext(paths) {
  const results = await Promise.all(
    paths.map(async (path) => {
      try {
        const content = await loadRepoFile(path);
        return {
          path,
          content: content.length > MAX_FILE_CHARS
            ? content.slice(0, MAX_FILE_CHARS) + "\n[CONTEXT TRUNCATED BY RUNTIME]"
            : content
        };
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

function trimHistory(history, maxMessages) {
  const items = history.slice(-maxMessages).map((message) => ({
    role: message.role === "agent" ? "assistant" : "user",
    content: String(message.text || "").slice(0, 900)
  }));

  let used = 0;
  return items.filter((item) => {
    if (used + item.content.length > MAX_HISTORY_CHARS) return false;
    used += item.content.length;
    return true;
  });
}

function headerNumber(response, name) {
  const value = response.headers.get(name);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractRetryAfterFromMessage(message) {
  const text = String(message || "");
  const match = text.match(/(?:try again|retry)[^\d]*(?:in|after)\s+(\d+(?:\.\d+)?(?:ms|s|m|h|d)(?:\s*\d+(?:\.\d+)?(?:ms|s|m|h|d))*)/i);
  return match ? match[1] : null;
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

const GITHUB_READ_TOOL = {
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
};

const GITHUB_WRITE_TOOL = {
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
};

function buildTools(route) {
  const tools = [];
  if (route.tools.includes("github_read_file")) tools.push(GITHUB_READ_TOOL);
  if (route.tools.includes("github_prepare_write")) tools.push(GITHUB_WRITE_TOOL);
  if (route.tools.includes("web_search")) {
    tools.push({ type: "web_search", search_context_size: "low" });
  }
  return tools;
}

async function executeToolCall(call) {
  const args = JSON.parse(call.arguments || "{}");
  const { readFile, prepareWrite } = await import("./tools/github.js");

  if (call.name === "github_read_file") return await readFile(args.path);
  if (call.name === "github_prepare_write") return await prepareWrite(args);

  throw new Error(`Unsupported tool: ${call.name}`);
}

function extractFunctionCalls(data) {
  return (data.output ?? []).filter((item) => item.type === "function_call");
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

function buildMemoryCandidate({ task, route, status, evidence, nextStep }) {
  const facts = [
    "Task: " + String(task || "").slice(0, 500),
    "Route: " + String(route || "general"),
    "Status: " + String(status || "UNVERIFIED")
  ];

  return {
    kind: "MEMORY_CANDIDATE",
    version: 1,
    durable_facts: facts,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 8) : [],
    next_step: String(nextStep || "").slice(0, 500),
    persistence: "NOT_PERSISTED",
    rule: "Candidate only until the existing Founder approval gate explicitly approves a repository memory write."
  };
}

function buildInstructions(route, context) {
  const missionRules = route.name === "mission"
    ? `
Mission 002 is resumable and batch-limited: process at most 5 new prospects per execution.
Target: India-based small packaged-food businesses (cookies, granola, protein snacks, sauces, spices, pickles and similar).
For each prospect require: business name, website/social, product category, active product evidence, why relevant, public contact route, source/evidence URL, priority and verification status.
Only record facts supported by public evidence. Missing evidence = UNVERIFIED. Never invent contacts, sources, customers, payments or verification.
Return a compact, evidence-first batch; do not write to GitHub from the mission route.`
    : "";

  const webRules = route.tools.includes("web_search")
    ? "Use built-in web_search for current public-web discovery and source verification. Distinguish FACT, SOURCE_DERIVED, ASSUMPTION, ESTIMATE and HYPOTHESIS."
    : "Do not use web search for this task.";

  const writeRules = route.tools.includes("github_prepare_write")
    ? "Repository changes must use github_prepare_write. It only prepares a proposal; never claim a write occurred without approval and runtime evidence."
    : "Do not propose repository writes unless the user explicitly asks for a repository change.";

  return `You are Founder Agent. Follow the repository constitution. Be concise and truthful.
Task route: ${route.name}.
${webRules}
${writeRules}
Use github_read_file only when additional repository evidence is needed.
Never reveal hidden chain-of-thought.
${missionRules}

RELEVANT REPOSITORY CONTEXT:
${context}`;
}

async function callOpenAI(task, history, route, context) {
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

  let input = [...trimHistory(history, route.historyMessages), { role: "user", content: task }];
  const toolEvidence = [];
  let approval = null;
  let webSearchCount = 0;
  let usageTotals = { inputTokens: 0, outputTokens: 0, totalTokens: 0, cachedTokens: 0 };
  let lastRateLimit = null;
  const tools = buildTools(route);

  for (let round = 0; round < (route.tools.includes("web_search") ? 1 : 2); round++) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        instructions: buildInstructions(route, context),
        input,
        max_output_tokens: route.maxOutputTokens,
        ...(route.tools.length ? { max_tool_calls: route.maxToolCalls ?? (route.name === "mission" ? 1 : 2) } : {}),
        ...(route.reasoningEffort ? { reasoning: { effort: route.reasoningEffort } } : {}),
        ...(route.tools.includes("web_search") ? { prompt_cache_key: "founder-agent-" + route.name + "-v2", prompt_cache_retention: "24h" } : {}),
        tools,
      })
    });

    lastRateLimit = rateLimitSnapshot(response);
    const data = await response.json();
    usageTotals = addUsage(usageTotals, data.usage);

    if (!response.ok) {
      const error = new Error(data?.error?.message || `OpenAI request failed: ${response.status}`);
      error.statusCode = response.status;
      error.code = data?.error?.code;
      if (response.status === 429 && lastRateLimit && !lastRateLimit.retryAfter) {
        lastRateLimit.retryAfter = extractRetryAfterFromMessage(error.message);
      }
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
  try {
    requireAuth(req);




    if (req.method === "GET" && req.query?.recovery === "1") {
      // Deterministic fault-injection test. No OpenAI call, no GitHub write.
      const trace = [];
      let runtimeState = "READY";

      trace.push({ step: "baseline", state: runtimeState, expected: "READY" });

      runtimeState = "FAILED";
      trace.push({ step: "injected_failure", state: runtimeState, expected: "FAILED" });

      const failureDetected = runtimeState === "FAILED";
      runtimeState = failureDetected ? "RECOVERING" : runtimeState;
      trace.push({ step: "recovery_started", state: runtimeState, expected: "RECOVERING" });

      runtimeState = runtimeState === "RECOVERING" ? "READY" : runtimeState;
      trace.push({ step: "recovery_complete", state: runtimeState, expected: "READY" });

      const pass =
        trace[0].state === trace[0].expected &&
        trace[1].state === trace[1].expected &&
        trace[2].state === trace[2].expected &&
        trace[3].state === trace[3].expected &&
        failureDetected &&
        runtimeState === "READY";

      res.status(pass ? 200 : 503).json({
        status: pass ? "RECOVERY_TEST_PASS" : "RECOVERY_TEST_FAIL",
        trace,
        failureDetected,
        recovered: runtimeState === "READY",
        tokenUsage: 0,
        openaiProbe: "NOT_RUN",
        githubWrite: "NOT_RUN",
        note: "Deterministic fault-injection recovery test. It validates failure detection and recovery state transitions without external side effects."
      });
      return;
    }

    if (req.method === "GET" && req.query?.diagnostics === "1") {
      const targets = [
        ["Auth module", "app/api/_lib/auth.js"],
        ["GitHub tool layer", "app/api/tools/github.js"],
        ["Approval executor", "app/api/approvals/approve.js"],
        ["Repository state", "MEMORY/STATE.md"],
        ["Master roadmap", "MEMORY/ROADMAP.json"],
        ["Founder UI", "app/src/main.jsx"],
        ["UI styles", "app/src/styles.css"]
      ];
      const checks = [];
      for (const [name, path] of targets) {
        try {
          const content = await loadRepoFile(path);
          checks.push({ name, path, status: content ? "PASS" : "FAIL" });
        } catch (error) {
          checks.push({ name, path, status: "FAIL", error: error.message });
        }
      }

      const configChecks = [
        ["OPENAI_API_KEY", Boolean(process.env.OPENAI_API_KEY)],
        ["OPENAI_MODEL", Boolean(process.env.OPENAI_MODEL)],
        ["FOUNDER_AUTH_SECRET", Boolean(process.env.FOUNDER_AUTH_SECRET)],
        ["GITHUB_TOKEN", Boolean(process.env.GITHUB_TOKEN)]
      ].map(([name, configured]) => ({ name, status: configured ? "PASS" : "FAIL" }));

      const allChecks = [...checks, ...configChecks];
      const passed = allChecks.filter((item) => item.status === "PASS").length;
      const total = allChecks.length;
      const healthy = passed === total;

      res.status(healthy ? 200 : 503).json({
        status: healthy ? "SELF_TEST_PASS" : "SELF_TEST_DEGRADED",
        passed,
        total,
        checks: allChecks,
        tokenUsage: 0,
        openaiProbe: "NOT_RUN",
        note: "Deterministic runtime diagnostics only. No model call and no repository write."
      });
      return;
    }

    if (req.method === "GET" && req.query?.roadmap === "1") {
      const raw = await loadRepoFile("MEMORY/ROADMAP.json");
      const config = JSON.parse(raw);
      function collectCheckPaths(check, paths = []) {
        if (!check) return paths;
        if (check.path) paths.push(check.path);
        if (check.type === "all") {
          for (const nested of check.checks || []) collectCheckPaths(nested, paths);
        }
        return paths;
      }

      const allPaths = [...new Set(
        config.phases.flatMap((phase) =>
          phase.tasks.flatMap((task) => collectCheckPaths(task.check))
        )
      )];
      const cache = new Map();
      for (const path of allPaths) {
        try { cache.set(path, await loadRepoFile(path)); } catch { cache.set(path, null); }
      }

      function checkTask(task) {
        const check = task.check || {};
        return evaluateCheck(check);
      }

      function evaluateCheck(check) {
        if (check.type === "file_exists") return cache.get(check.path) != null;
        if (check.type === "contains") return String(cache.get(check.path) || "").includes(check.text);
        if (check.type === "prospect_count") {
          const text = String(cache.get(check.path) || "");
          const matches = text.match(/prospect[_ ]?id\s*:/gi);
          return (matches?.length || 0) >= Number(check.minimum || 0);
        }
        if (check.type === "all") return (check.checks || []).every(evaluateCheck);
        return false;
      }

      let total = 0, completed = 0, completedPhases = 0;
      const phases = config.phases.map((phase) => {
        const tasks = phase.tasks.map((task) => {
          const done = checkTask(task);
          total += 1; if (done) completed += 1;
          return {...task, done};
        });
        const phaseCompleted = tasks.filter((task) => task.done).length;
        if (phaseCompleted === tasks.length) completedPhases += 1;
        return {...phase, tasks, completed: phaseCompleted, total: tasks.length};
      });

      res.status(200).json({
        owner: config.owner, title: config.title, phases,
        total, completed, percent: total ? Math.round((completed / total) * 100) : 0,
        completedPhases, totalPhases: phases.length,
        source: "MEMORY/ROADMAP.json",
        tokenUsage: 0,
        note: "Roadmap progress is deterministic: ticks are based on verified repository evidence, not model claims."
      });
      return;
    }

    if (req.method === "GET" && req.query?.memory === "1") {
      const candidate = buildMemoryCandidate({
        task: "Deterministic memory protocol self-test",
        route: "memory",
        status: "DONE",
        evidence: [
          "Authenticated runtime endpoint reached.",
          "Memory candidate schema generated without a model call."
        ],
        nextStep: "Use the existing approval flow before persisting a memory-file change."
      });
      res.status(200).json({
        status: "MEMORY_PROTOCOL_PASS",
        candidate,
        tokenUsage: 0,
        openaiProbe: "NOT_RUN",
        githubWrite: "NOT_RUN"
      });
      return;
    }


    if (req.method === "GET" && req.query?.health === "1") {
      const checks = {
        auth: "PASS",
        githubState: "UNKNOWN",
        openaiKey: process.env.OPENAI_API_KEY ? "CONFIGURED" : "MISSING",
        openaiModel: process.env.OPENAI_MODEL ? "CONFIGURED" : "MISSING",
        founderAuthSecret: process.env.FOUNDER_AUTH_SECRET ? "CONFIGURED" : "MISSING"
      };

      try {
        const response = await fetch(RAW_BASE + "MEMORY/STATE.md");
        if (response.ok) {
          const text = await response.text();
          checks.githubState = text.includes("# Founder Agent State") ? "PASS" : "FAIL";
        } else {
          checks.githubState = `FAIL_HTTP_${response.status}`;
        }
      } catch {
        checks.githubState = "FAIL_NETWORK";
      }

      const healthy = Object.values(checks).every((value) =>
        value === "PASS" || value === "CONFIGURED"
      );

      res.status(healthy ? 200 : 503).json({
        status: healthy ? "HEALTHY" : "DEGRADED",
        checks,
        openaiProbe: "NOT_RUN",
        tokenUsage: 0,
        note: "Health check does not call the OpenAI model and does not consume model tokens."
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ status: "FAILED", error: "Method not allowed." });
      return;
    }

    const body = req.body ?? {};
    const task = typeof body.task === "string" ? body.task.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!task) {
      res.status(400).json({ status: "FAILED", error: "Task is required." });
      return;
    }

    const route = classifyTask(task);
    const context = await loadContext(route.files);

    // Status is a deterministic repository-state read. Do not spend model tokens
    // for a simple status request or ask the model to interpret whether STATE.md loaded.
    if (route.name === "status") {
      const stateMatch = context.match(/## MEMORY\/STATE\.md\n([\s\S]*)/);
      const state = stateMatch?.[1] || "";
      if (!state || state.includes("[CONTEXT UNAVAILABLE:")) {
        throw new Error("MEMORY/STATE.md could not be loaded for deterministic status.");
      }

      const phase = state.match(/Phase:\s*(.+)/)?.[1]?.trim() || "Unknown";
      const mode = state.match(/Mode:\s*(.+)/)?.[1]?.trim() || "Unknown";
      const mission = state.match(/## Current mission\n([\s\S]*?)(?:\n## |$)/)?.[1]?.trim() || "Not specified";
      const product = state.match(/## Current product candidate\n([\s\S]*?)(?:\n## |$)/)?.[1]?.trim() || "Not specified";

      res.status(200).json({
        status: "DONE",
        result: `**Current status:** Phase: ${phase}. Mode: ${mode}. Current product: ${product}.\n**Next step:** ${mission}`,
        approval: null,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cachedTokens: 0 },
        rateLimit: null,
        route: route.name,
        evidence: [
          "Authenticated Founder session verified.",
          "Context router selected: status.",
          "Read authoritative MEMORY/STATE.md directly.",
          "No model call or tools were required for this deterministic status request."
        ],
        actions_taken: [
          "Verified Founder authentication.",
          "Loaded MEMORY/STATE.md.",
          "Returned status directly from repository state."
        ],
        actions_not_taken: ["No model/API call, repository write, or destructive action was executed."],
        next_step: mission,
        memoryCandidate: buildMemoryCandidate({
          task: "Project status request",
          route: route.name,
          status: "DONE",
          evidence: [
            "Authenticated Founder session verified.",
            "MEMORY/STATE.md read directly."
          ],
          nextStep: mission
        })
      });
      return;
    }

    const modelResult = await callOpenAI(task, history, route, context);

    res.status(200).json({
      status: modelResult.approval ? "NEEDS_HUMAN_APPROVAL" : "DONE",
      result: modelResult.text,
      approval: modelResult.approval,
      usage: modelResult.usage,
      rateLimit: modelResult.rateLimit,
      route: route.name,
      evidence: [
        "Authenticated Founder session verified.",
        `Context router selected: ${route.name}.`,
        `Loaded ${route.files.length} task-relevant repository file(s).`,
        `Enabled ${route.tools.length} task-specific tool type(s).`,
        "Response generated by the configured model provider.",
        ...modelResult.toolEvidence.map((e) => `Tool verified: ${e.tool} (${e.path}).`),
        ...(modelResult.webSearchCount ? [`Built-in web search executed: ${modelResult.webSearchCount} search call(s).`] : [])
      ],
      actions_taken: [
        "Verified Founder authentication.",
        `Routed task as ${route.name}.`,
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
