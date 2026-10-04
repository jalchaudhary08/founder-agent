const MAX_RESULTS = 8;
const MAX_OPEN_BYTES = 500000;

function safeUrl(input) {
  if (typeof input !== "string" || !input.trim()) throw new Error("URL is required.");
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP(S) URLs are allowed.");
  const host = url.hostname.toLowerCase();
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254",
    "metadata.google.internal"
  ];
  if (blocked.includes(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Private/local destinations are blocked.");
  }
  return url;
}

function decodeHtml(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDuckResults(html) {
  const results = [];
  const pattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html)) && results.length < MAX_RESULTS) {
    let url = match[1];
    try {
      const parsed = new URL(url, "https://duckduckgo.com");
      if (parsed.hostname.includes("duckduckgo.com") && parsed.searchParams.has("uddg")) {
        url = parsed.searchParams.get("uddg");
      }
      const title = decodeHtml(match[2]);
      const block = html.slice(match.index, match.index + 2500);
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) || block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
      results.push({
        title,
        url,
        snippet: snippetMatch ? decodeHtml(snippetMatch[1]) : "",
        source: "DuckDuckGo discovery",
        verified: false
      });
    } catch {}
  }
  return results;
}

export async function searchWeb(query) {
  if (typeof query !== "string" || query.trim().length < 3) throw new Error("A meaningful search query is required.");
  const params = new URLSearchParams({ q: query.trim(), kl: "in-en" });
  const response = await fetch("https://html.duckduckgo.com/html/?" + params.toString(), {
    headers: { "User-Agent": "FounderAgent/0.1 research" }
  });
  if (!response.ok) throw new Error("Web search failed: " + response.status);
  const html = await response.text();
  const results = extractDuckResults(html);
  return {
    query: query.trim(),
    results,
    verified: true,
    note: "Search results are discovery evidence only. Open the source URL before treating a claim as verified."
  };
}

export async function openWeb(urlInput) {
  const url = safeUrl(urlInput);
  const response = await fetch(url, {
    headers: { "User-Agent": "FounderAgent/0.1 research" },
    redirect: "follow"
  });
  if (!response.ok) throw new Error("Web page fetch failed: " + response.status);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html") && !type.includes("text/plain") && !type.includes("application/json")) {
    throw new Error("Unsupported page type: " + type);
  }
  const text = await response.text();
  const content = text.length > MAX_OPEN_BYTES ? text.slice(0, MAX_OPEN_BYTES) + "\n[TRUNCATED]" : text;
  return {
    url: url.toString(),
    content,
    contentType: type,
    verified: true,
    source: "direct-page-fetch"
  };
}
