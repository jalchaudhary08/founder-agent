const MAX_BYTES = 900000;
const FETCH_TIMEOUT_MS = 9000;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function extractSignals(html, url) {
  const source = String(html || "");
  const text = cleanText(source.replace(/<script[\\s\\S]*?<\\/script>/gi, " ").replace(/<style[\\s\\S]*?<\\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  const title = cleanText((source.match(/<title[^>]*>([\\s\\S]*?)<\\/title>/i) || [,""])[1]);
  const h1 = cleanText((source.match(/<h1[^>]*>([\\s\\S]*?)<\\/h1>/i) || [,""])[1].replace(/<[^>]+>/g, " "));
  const h1Count = (source.match(/<h1\\b/gi) || []).length;
  const links = [...source.matchAll(/<a\\b[^>]*>([\\s\\S]*?)<\\/a>/gi)].map(m => cleanText(m[1].replace(/<[^>]+>/g, " "))).filter(Boolean);
  const buttons = (source.match(/<button\\b/gi) || []).length;
  const forms = (source.match(/<form\\b/gi) || []).length;
  const ctas = links.filter(t => /^(get started|start|buy|book|demo|sign up|signup|contact|learn more|try|free|subscribe|shop|order|download)/i.test(t));
  const trustWords = /testimonial|customer|client|case stud|review|trusted|security|guarantee|money.?back|rating/i.test(source);
  const navLike = /<nav\\b/i.test(source);
  const viewport = /<meta[^>]+name=["']viewport["'][^>]+content=/i.test(source);
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(source);
  return { url, title, h1, h1Count, linkCount: links.length, ctaCount: ctas.length, buttons, forms, trustWords, navLike, viewport, canonical, textLength: text.length };
}

function buildFindings(s, goal) {
  const findings = [];
  if (!s.h1) findings.push({label:"MESSAGE", title:"No clear primary headline was detected", evidence:"The page has no detectable H1, so the first-screen value proposition may be unclear to a new visitor.", impact:"HIGH", effort:"LOW", fix:"Add one outcome-led H1 that says who the page is for and what result it delivers."});
  else if (s.h1.length > 95 || s.h1.length < 12) findings.push({label:"MESSAGE", title:"The primary headline may not communicate the outcome sharply", evidence:`Detected H1: “${s.h1.slice(0,140)}”`, impact:"HIGH", effort:"LOW", fix:"Rewrite the headline around the visitor’s desired outcome, not internal product language."});
  if (s.ctaCount === 0 && s.buttons === 0) findings.push({label:"CTA", title:"No obvious conversion action was detected", evidence:"The page contains no link text or button matching common conversion actions.", impact:"HIGH", effort:"LOW", fix:`Add one dominant “${goal.toLowerCase()}” action near the primary value proposition.`});
  else if (s.ctaCount > 5) findings.push({label:"CTA", title:"Too many competing conversion actions may dilute intent", evidence:`Detected ${s.ctaCount} action-oriented links across the page.`, impact:"MEDIUM", effort:"LOW", fix:"Choose one primary conversion action and visually demote secondary actions."});
  if (!s.trustWords) findings.push({label:"TRUST", title:"Trust evidence was not detected in the page source", evidence:"No obvious testimonials, reviews, case studies, security, guarantee or customer-proof language was detected.", impact:"HIGH", effort:"MEDIUM", fix:"Place one credible proof element close to the main conversion action."});
  if (!s.forms && !s.ctaCount && !s.buttons) findings.push({label:"PATH", title:"The conversion path appears incomplete", evidence:"No form, button or common CTA link was detected in the fetched page.", impact:"HIGH", effort:"MEDIUM", fix:"Make the next step explicit and reachable without hunting through navigation."});
  if (!s.viewport) findings.push({label:"MOBILE", title:"Mobile viewport metadata was not detected", evidence:"The HTML did not include a standard viewport meta tag.", impact:"MEDIUM", effort:"LOW", fix:"Add the standard responsive viewport declaration and verify the first-screen CTA on mobile."});
  if (!s.canonical) findings.push({label:"DISCOVERY", title:"Canonical URL metadata was not detected", evidence:"No canonical link element was detected. This is not a conversion blocker, but it is a useful page-quality signal.", impact:"LOW", effort:"LOW", fix:"Add a canonical URL if this page is indexable and has a preferred URL."});
  if (s.h1Count > 1) findings.push({label:"MESSAGE", title:"Multiple H1 elements compete for page hierarchy", evidence:`Detected ${s.h1Count} H1 elements.`, impact:"MEDIUM", effort:"LOW", fix:"Keep one primary page headline and use lower-level headings for supporting sections."});
  if (findings.length === 0) findings.push({label:"FRICTION", title:"No high-confidence structural leak was detected", evidence:"The public HTML contains a clear headline, conversion action and trust signal.", impact:"LOW", effort:"MEDIUM", fix:"Use first-party analytics and session data to investigate behavioral leaks that public HTML cannot prove."});
  const weight = {HIGH:3, MEDIUM:2, LOW:1};
  findings.sort((a,b)=>weight[b.impact]-weight[a.impact]);
  return findings.slice(0,3);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ok:false,error:"Method not allowed."});
  try {
    const {url, goal="Get more leads"} = req.body || {};
    let parsed;
    try { parsed = new URL(String(url || "").trim()); } catch { return res.status(400).json({ok:false,error:"Enter a valid public http(s) URL."}); }
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return res.status(400).json({ok:false,error:"Only public http(s) websites are supported."});
    if (parsed.username || parsed.password) return res.status(400).json({ok:false,error:"URLs with embedded credentials are not supported."});
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(parsed.href, {redirect:"follow", signal:controller.signal, headers:{"user-agent":"RevenueLeakDiagnostic/0.1 (+public-page-analysis)","accept":"text/html,application/xhtml+xml"}});
    } finally { clearTimeout(timeout); }
    if (!response.ok) return res.status(502).json({ok:false,error:`Website returned HTTP ${response.status}.`});
    const type = response.headers.get("content-type") || "";
    if (!/text\\/html|application\\/xhtml\\+xml/i.test(type)) return res.status(415).json({ok:false,error:"The URL did not return an HTML page."});
    const text = await response.text();
    const html = text.slice(0, MAX_BYTES);
    const signals = extractSignals(html, parsed.href);
    const findings = buildFindings(signals, String(goal));
    const score = clamp(100 - findings.reduce((n,f)=>n + ({HIGH:18,MEDIUM:10,LOW:4}[f.impact] || 0),0), 35, 96);
    return res.status(200).json({ok:true, url:parsed.href, goal, score, findings, signals:{title:signals.title,h1:signals.h1,ctaCount:signals.ctaCount,forms:signals.forms,trustDetected:signals.trustWords}, limitation:"This diagnostic uses publicly accessible page HTML. It does not claim to measure actual lost revenue or conversion rate."});
  } catch (error) {
    const message = error?.name === "AbortError" ? "The website took too long to respond." : "We could not inspect that website safely.";
    return res.status(502).json({ok:false,error:message});
  }
}
