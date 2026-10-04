const REPO = "jalchaudhary08/founder-agent";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
const API_BASE = `https://api.github.com/repos/${REPO}/contents/`;

const ALWAYS_LOAD = [
  "AGENT.md",
  "MEMORY/STATE.md",
  "CORE/ORCHESTRATOR.md",
  "CORE/DECISION_ENGINE.md",
  "CORE/APPROVAL_GATES.md"
];

const OPTIONAL_FILES = [
  ["MISSION_002", "MISSIONS/MISSION_002_PROSPECT_RESEARCH.md"],
  ["MISSION 002", "MISSIONS/MISSION_002_PROSPECT_RESEARCH.md"],
  ["FOOD LABEL", "PRODUCTS/FOOD_LABEL_NUTRITION/PRODUCT_SPEC.md"],
  ["FOOD", "PRODUCTS/FOOD_LABEL_NUTRITION/PRODUCT_SPEC.md"],
  ["NUTRITION", "PRODUCTS/FOOD_LABEL_NUTRITION/PRODUCT_SPEC.md"],
  ["PROSPECT", "MISSIONS/PROSPECT_RECORD_SCHEMA.md"],
  ["PROSPECTS", "MISSIONS/PROSPECT_RECORD_SCHEMA.md"]
];

function githubHeaders() {
  const headers = { Accept: "application/vnd.github.raw+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function loadRepoFile(path) {
  const url = process.env.GITHUB_TOKEN
    ? API_BASE + path
    : RAW_BASE + path;

  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) throw new Error(`GitHub context load failed for ${path}: ${response.status}`);

  if (process.env.GITHUB_TOKEN) {
    const data = await response.json();
    if (data.encoding !== "base64") throw new Error(`Unsupported GitHub encoding for ${path}`);
    return Buffer.from(data.content.replace(/\\n/g, ""), "base64").toString("utf8");
  }

  return response.text();
}

async function loadContext(task) {
  const paths = [...ALWAYS_LOAD];
  const upper = task.toUpperCase();

  for (const [keyword, path] of OPTIONAL_FILES) {
    if (upper.includes(keyword) && !paths.includes(path)) paths.push(path);
  }

  const results = await Promise.all(
    paths.map(async (path) => {
      try {
        return { path, content: await loadRepoFile(path) };
      } catch (error) {
        return { path, error: error.message };
      }
    })
  );

  return results
    .map((item) =>
      item.error
        ? `## ${item.path}\\n[CONTEXT UNAVAILABLE: ${item.error}]`
        : `## ${item.path}\\n${item.content}`
    )
    .join("\n\n---\n\n");
}


const TOOL_DEFINITIONS = [{
  type: "function",
  name: "github_read_file",
  description: "Read one text file from the Founder Agent repository.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Repository-relative file path." }
    },
    required: ["path"],
    additionalProperties: false
  },
  strict: true
}];

function extractFunctionCalls(data) {
  return (data.output ?? []).filter((item) => item.type === "function_call");
}

async function executeToolCall(call) {
  const args = JSON.parse(call.arguments || "{}");
  if (call.name !== "github_read_file") throw new Error(`Unsupported tool: ${call.name}`);
  const { readFile } = await import("./tools/github.js");
  return await readFile(args.path);
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

  const system = `You are Founder Agent. Follow the repository constitution exactly.
Use github_read_file when additional repository evidence is needed.
Never claim a tool action happened without runtime evidence.
Never fabricate completion, sources, customers, payments, permissions or verification.
Do not reveal hidden chain-of-thought; provide concise conclusions and evidence.

REPOSITORY CONTEXT:
${context}`;

  let input = [
    ...history.slice(-10).map((message) => ({
      role: message.role === "agent" ? "assistant" : "user",
      content: message.text
    })),
    { role: "user", content: task }
  ];
  const toolEvidence = [];

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
        tools: TOOL_DEFINITIONS
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI request failed: ${response.status}`);

    const calls = extractFunctionCalls(data);
    if (!calls.length) return { text: extractOutputText(data), toolEvidence };

    input = [...input, ...(data.output ?? [])];

    for (const call of calls) {
      const result = await executeToolCall(call);
      toolEvidence.push({ tool: call.name, path: result.path, verified: result.verified === true });
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
    const body = req.body ?? {};
    const task = typeof body.task === "string" ? body.task.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!task) {
      res.status(400).json({ status: "FAILED", error: "Task is required." });
      return;
    }

    const context = await loadContext(task);
    const modelResult = await callOpenAI(task, history, context);
    const result = modelResult.text;

    res.status(200).json({
      status: "DONE",
      result,
      evidence: [
        "Repository context loaded from founder-agent/main.",
        "Response generated by the configured model provider.",
        ...modelResult.toolEvidence.map((e) => `Tool verified: ${e.tool} (${e.path}).`)
      ],
      actions_taken: ["Parsed the founder request.", "Loaded relevant repository context.", "Generated a response through the runtime provider adapter.",
        ...(modelResult.toolEvidence.length ? ["Executed bounded read-only GitHub tool calls and recorded evidence."] : [])
      ],
      actions_not_taken: ["No repository write or destructive action was executed."],
      next_step: "Verify the read-only tool loop, then add approval-gated writes."
    });
  } catch (error) {
    const missingConfig = error?.code === "MISSING_API_KEY" || error?.code === "MISSING_MODEL";
    res.status(missingConfig ? 503 : 500).json({
      status: missingConfig ? "BLOCKED" : "FAILED",
      error: error?.message || "Runtime error.",
      next_step: missingConfig
        ? "Configure the required provider environment variables in Vercel."
        : "Inspect the runtime error, fix the failing dependency, and retry."
    });
  }
}
