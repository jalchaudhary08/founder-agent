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

  const system = `You are Founder Agent, a trustworthy personal AI operating system.

Follow the repository constitution exactly. You are currently in Runtime Phase 1: reasoning + repository context. Do not claim that external tools were used or that external actions happened unless the runtime provides evidence.

For every task:
1. Understand the objective and constraints.
2. Use the supplied repository context.
3. Produce a concise executable plan.
4. Distinguish FACT, SOURCE_DERIVED, ASSUMPTION, ESTIMATE and HYPOTHESIS when relevant.
5. Identify approval gates before consequential actions.
6. Report what you can do now and what requires the next runtime/tool integration.
7. Never fabricate completion, sources, customers, payments, tool access or verification.

Return a useful answer to the founder, not internal chain-of-thought.

REPOSITORY CONTEXT:
${context}`;

  const input = [
    ...history.slice(-10).map((message) => ({
      role: message.role === "agent" ? "assistant" : "user",
      content: message.text
    })),
    { role: "user", content: task }
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL,
      instructions: system,
      input
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = data?.error?.message || `OpenAI request failed: ${response.status}`;
    throw new Error(detail);
  }

  const text = extractOutputText(data);
  if (!text) throw new Error("Model returned no text output.");

  return text;
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
    const result = await callOpenAI(task, history, context);

    res.status(200).json({
      status: "DONE",
      result,
      evidence: [
        "Repository context loaded from founder-agent/main.",
        "Response generated by the configured model provider."
      ],
      actions_taken: ["Parsed the founder request.", "Loaded relevant repository context.", "Generated a response through the runtime provider adapter."],
      actions_not_taken: ["No external side-effecting tool action was executed in Runtime Phase 1."],
      next_step: "Add authenticated tool adapters and durable task state for real execution."
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
