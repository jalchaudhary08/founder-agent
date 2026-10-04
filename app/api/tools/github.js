const REPO = "jalchaudhary08/founder-agent";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
const API_BASE = `https://api.github.com/repos/${REPO}/contents/`;

function requireToken() {
  if (!process.env.GITHUB_TOKEN) {
    const error = new Error("GITHUB_TOKEN is required for GitHub write actions.");
    error.code = "NEEDS_AUTH";
    throw error;
  }
}

function assertSafePath(path) {
  if (typeof path !== "string" || !path.trim()) throw new Error("Repository path is required.");
  const normalized = path.replace(/^\/+/, "");
  if (normalized.includes("..") || normalized.startsWith(".git/")) throw new Error("Unsafe repository path.");
  const blocked = /(^|\/)(\.env|\.env\.|.*\.pem$|.*\.key$|credentials?\.|secrets?\.)/i;
  if (blocked.test(normalized)) throw new Error("Secret-like files are blocked by the runtime tool layer.");
  return normalized;
}

function headers() {
  requireToken();
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
}

export async function readFile(path) {
  const safePath = assertSafePath(path);

  if (!process.env.GITHUB_TOKEN) {
    const response = await fetch(RAW_BASE + safePath);
    if (!response.ok) {
      const error = new Error(`GitHub public read failed for ${safePath}: ${response.status}`);
      if (response.status === 404) error.code = "NOT_FOUND";
      throw error;
    }
    return {
      path: safePath,
      content: await response.text(),
      verified: true,
      source: "public-raw"
    };
  }

  const url = API_BASE + encodeURIComponent(safePath).replace(/%2F/g, "/") + `?ref=${encodeURIComponent(BRANCH)}`;
  const response = await fetch(url, { headers: headers() });

  if (!response.ok) {
    const error = new Error(`GitHub read failed for ${safePath}: ${response.status}`);
    if (response.status === 404) error.code = "NOT_FOUND";
    throw error;
  }

  const data = await response.json();
  if (data.encoding !== "base64") throw new Error(`Unsupported GitHub encoding for ${safePath}`);

  return {
    path: safePath,
    content: Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8"),
    sha: data.sha,
    verified: true,
    source: "github-api"
  };
}

export async function writeFile({ path, content, expectedSha, message }) {
  const safePath = assertSafePath(path);
  if (typeof content !== "string") throw new Error("File content must be a string.");
  if (typeof expectedSha !== "string" || !expectedSha) throw new Error("expectedSha is required for safe repository writes.");
  if (typeof message !== "string" || !message.trim()) throw new Error("A commit message is required.");

  const current = await readFile(safePath);
  if (current.sha !== expectedSha) {
    const error = new Error("Repository changed since the read. Refusing blind overwrite.");
    error.code = "STALE_WRITE";
    throw error;
  }

  const response = await fetch(API_BASE + encodeURIComponent(safePath).replace(/%2F/g, "/"), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha: expectedSha,
      branch: BRANCH
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || `GitHub write failed: ${response.status}`);

  const verified = await readFile(safePath);
  if (verified.content !== content) throw new Error("Write completed but read-back verification failed.");

  return {
    path: safePath,
    commitSha: data?.commit?.sha ?? null,
    sha: verified.sha,
    verified: true
  };
}


export async function prepareWrite({ path, content, message }) {
  const safePath = assertSafePath(path);
  if (typeof content !== "string") throw new Error("File content must be a string.");
  if (typeof message !== "string" || !message.trim()) throw new Error("A commit message is required.");
  if (content.length > 200000) throw new Error("Proposed file is too large for the approval flow.");

  let current = null;
  let expectedSha = null;
  let operation = "create";

  try {
    current = await readFile(safePath);
    expectedSha = current.sha;
    operation = "update";
  } catch (error) {
    if (error?.code !== "NOT_FOUND") throw error;
  }

  const { createApprovalToken } = await import("../_lib/approval.js");
  const proposal = {
    path: safePath,
    content,
    expectedSha,
    operation,
    message: message.trim()
  };

  return {
    approvalToken: createApprovalToken(proposal),
    path: safePath,
    expectedSha: expectedSha,
    operation,
    message: proposal.message,
    contentPreview: content.length > 12000 ? content.slice(0, 12000) + "\n…[preview truncated]" : content,
    verified: true,
    requiresExplicitApproval: true,
    expiresInSeconds: 600
  };
}


export async function createFile({ path, content, message }) {
  const safePath = assertSafePath(path);
  if (typeof content !== "string") throw new Error("File content must be a string.");
  if (typeof message !== "string" || !message.trim()) throw new Error("A commit message is required.");

  let exists = false;
  try {
    await readFile(safePath);
    exists = true;
  } catch (error) {
    if (error?.code !== "NOT_FOUND") throw error;
  }
  if (exists) {
    const error = new Error("File already exists. A fresh update proposal is required.");
    error.code = "ALREADY_EXISTS";
    throw error;
  }

  const response = await fetch(API_BASE + encodeURIComponent(safePath).replace(/%2F/g, "/"), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: BRANCH
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || `GitHub create failed: ${response.status}`);

  const verified = await readFile(safePath);
  if (verified.content !== content) throw new Error("Create completed but read-back verification failed.");

  return {
    path: safePath,
    commitSha: data?.commit?.sha ?? null,
    sha: verified.sha,
    verified: true
  };
}
