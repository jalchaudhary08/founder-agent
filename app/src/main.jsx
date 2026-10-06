import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const starterMessages = [{
  role: "agent",
  text: "Welcome back, Jal 👋 I'm your Founder Agent. Your repository brain is connected and I'll report exactly what is verified."
}];

function formatTokens(value) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(value >= 10000 ? 0 : 1) + "K";
  return String(value);
}

function parseResetDuration(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\\d+$/.test(text)) {
    const numeric = Number(text);
    return numeric > 1000000000 ? numeric * 1000 : Date.now() + numeric * 1000;
  }
  let totalMs = 0;
  const pattern = /(\\d+(?:\\.\\d+)?)(ms|s|m|h|d)/gi;
  let match;
  while ((match = pattern.exec(text))) {
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    totalMs += amount * ({ms:1,s:1000,m:60000,h:3600000,d:86400000}[unit] || 0);
  }
  return totalMs > 0 ? Date.now() + totalMs : null;
}

function formatCountdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "READY";
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return hours + "h " + minutes + "m";
  if (minutes) return minutes + "m " + String(seconds).padStart(2, "0") + "s";
  return seconds + "s";
}

function Login({ onAuthenticated }) {
  const [key, setKey] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event) {
    event.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed.");
      setKey(""); onAuthenticated();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <div className="auth-card">
      <div className="boot-mark">✦</div>
      <div className="brand auth-brand">FOUNDER<span>AGENT</span></div>
      <div className="eyebrow">JAL CHAUDHARY / PRIVATE SYSTEM</div>
      <h1>Founder access</h1>
      <p>Your personal AI operating system is waiting for authentication.</p>
      <form onSubmit={submit} className="auth-form">
        <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Enter Founder key" autoComplete="current-password" />
        <button type="submit" disabled={busy || !key.trim()}>{busy ? "Checking…" : "Unlock Founder Agent"}</button>
      </form>
      {error && <div className="auth-error">{error}</div>}
      <div className="auth-note">Your key is checked server-side and is never stored in the repository.</div>
    </div>
  </main>;
}

function BootScreen({ onDone }) {
  React.useEffect(() => {
    const timer = setTimeout(onDone, 1100);
    return () => clearTimeout(timer);
  }, [onDone]);
  return <main className="boot-screen">
    <div className="boot-core"><span>✦</span></div>
    <div className="boot-brand">JAL CHAUDHARY</div>
    <div className="boot-title">FOUNDER<span>AGENT</span></div>
    <div className="boot-status"><i /> INITIALIZING SYSTEM</div>
    <div className="boot-lines"><span>Memory</span><b>READY</b><span>Runtime</span><b>READY</b><span>Security</span><b>READY</b></div>
  </main>;
}

function Roadmap({ roadmap, onRefresh, onStartTask }) {
  if (!roadmap) return <section className="panel"><div className="skeleton skeleton-lg" /><div className="skeleton" /><div className="skeleton" /></section>;
  return <section className="roadmap-panel">
    <div className="section-head">
      <div><div className="eyebrow">PERSONAL CONTROL BOARD</div><h2>MASTER ROADMAP</h2><p>Jal Chaudhary’s live build plan. Tap START on any unfinished task and we begin that exact task. Completed work ticks itself from verified repository evidence.</p></div>
      <button className="ghost-button" onClick={onRefresh}>↻ Refresh</button>
    </div>
    <div className="roadmap-summary">
      <div><span>OVERALL</span><strong>{roadmap.completed}/{roadmap.total}</strong></div>
      <div><span>PROGRESS</span><strong>{roadmap.percent}%</strong></div>
      <div><span>PHASES</span><strong>{roadmap.completedPhases}/{roadmap.totalPhases}</strong></div>
    </div>
    <div className="progress-track"><div style={{width: roadmap.percent + "%"}} /></div>
    <div className="phase-list">
      {roadmap.phases.map(phase => <div className="phase-card" key={phase.id}>
        <div className="phase-head">
          <div className="phase-title"><span className="phase-icon">{phase.icon}</span><div><h3>{phase.title}</h3><small>{phase.completed}/{phase.total} complete</small></div></div>
          <span className={"phase-badge " + (phase.completed === phase.total ? "done" : phase.completed ? "active" : "planned")}>{phase.completed === phase.total ? "DONE" : phase.completed ? "IN PROGRESS" : "PLANNED"}</span>
        </div>
        <div className="task-list">
          {phase.tasks.map(task => <div className={"task-row " + (task.done ? "task-done" : "")} key={task.id}>
            <span className="task-check">{task.done ? "✓" : "○"}</span>
            <span className="task-name">{task.title}</span>
            {!task.done && <button className="task-start" onClick={() => onStartTask(task, phase)}>START →</button>}
          </div>)}
        </div>
      </div>)}
    </div>
  </section>;
}

function App() {
  const [authenticated, setAuthenticated] = React.useState(null);
  const [booting, setBooting] = React.useState(false);
  const [messages, setMessages] = React.useState(starterMessages);
  const [input, setInput] = React.useState("");
  const [status, setStatus] = React.useState("IDLE");
  const [approval, setApproval] = React.useState(null);
  const [approvalBusy, setApprovalBusy] = React.useState(false);
  const [activeView, setActiveView] = React.useState("home");
  const [roadmap, setRoadmap] = React.useState(null);
  const [focusTask, setFocusTask] = React.useState(null);
  const [agentActivated, setAgentActivated] = React.useState(false);
  const [telemetry, setTelemetry] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("founder_agent_telemetry") || "null");
      const stale = !Number.isFinite(saved?.observedAt) || (Date.now() - saved.observedAt > 120000);
      const staleLimit = stale && Number.isFinite(saved?.remainingTokens) && saved.remainingTokens < 6000;
      return { sessionTokens: 0, lastTokens: 0, cachedTokens: 0,
        rateLimitTokens: Number.isFinite(saved?.rateLimitTokens) ? saved.rateLimitTokens : null,
        remainingTokens: staleLimit ? null : (Number.isFinite(saved?.remainingTokens) ? saved.remainingTokens : null),
        resetTokens: staleLimit ? null : (saved?.resetTokens || null),
        resetAt: staleLimit ? 0 : (Number.isFinite(saved?.resetAt)
          ? saved.resetAt
          : (parseResetDuration(saved?.resetTokens) || (Number.isFinite(saved?.blockedUntil) ? saved.blockedUntil : 0))),
        blockedUntil: staleLimit ? 0 : (Number.isFinite(saved?.blockedUntil) ? saved.blockedUntil : 0),
        observedAt: Number.isFinite(saved?.observedAt) ? saved.observedAt : 0 };
    } catch { return { sessionTokens:0,lastTokens:0,cachedTokens:0,rateLimitTokens:null,remainingTokens:null,resetTokens:null,resetAt:0,blockedUntil:0 }; }
  });
  const [resetNow, setResetNow] = React.useState(Date.now());

  React.useEffect(() => {
    try { localStorage.setItem("founder_agent_telemetry", JSON.stringify({
      rateLimitTokens: telemetry.rateLimitTokens, remainingTokens: telemetry.remainingTokens,
      resetTokens: telemetry.resetTokens, resetAt: telemetry.resetAt, blockedUntil: telemetry.blockedUntil,
      observedAt: telemetry.observedAt
    })); } catch {}
  }, [telemetry.rateLimitTokens, telemetry.remainingTokens, telemetry.resetTokens, telemetry.blockedUntil]);

  React.useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      setAuthenticated(data.authenticated === true);
    }).catch(() => setAuthenticated(false));
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => setResetNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadRoadmap = React.useCallback(async () => {
    try {
      const response = await fetch("/api/chat?roadmap=1", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setRoadmap(data);
    } catch {}
  }, []);

  React.useEffect(() => { if (authenticated) loadRoadmap(); }, [authenticated, loadRoadmap]);

  function applyTelemetry(data) {
    if (!data) return;
    setTelemetry(current => ({
      sessionTokens: current.sessionTokens + Number(data.usage?.totalTokens || 0),
      lastTokens: Number(data.usage?.totalTokens || 0),
      cachedTokens: Number(data.usage?.cachedTokens || 0),
      rateLimitTokens: data.rateLimit?.limitTokens ?? current.rateLimitTokens,
      remainingTokens: data.rateLimit?.remainingTokens ?? current.remainingTokens,
      resetTokens: data.rateLimit?.resetTokens ?? current.resetTokens,
      resetAt: data.rateLimit?.resetTokens
        ? (parseResetDuration(data.rateLimit.resetTokens) || current.resetAt)
        : (data.rateLimit?.retryAfter ? (parseResetDuration(data.rateLimit.retryAfter) || current.resetAt) : current.resetAt),
      blockedUntil: data.rateLimit?.retryAfter ? Date.now() + Number(data.rateLimit.retryAfter) * 1000 : current.blockedUntil,
      observedAt: Date.now()
    }));
  }


  function activateAgent() {
    setAgentActivated(true);
    setStatus("ACTIVE");
    window.setTimeout(() => setAgentActivated(false), 4200);
  }

  function startRoadmapTask(task, phase) {
    setFocusTask({title: task.title, phase: phase.title});
    setActiveView("chat");
    if (task.id === "recovery_test") {
      recoveryCheck();
      return;
    }
    const command = "Work on roadmap task: " + task.title + ". Phase: " + phase.title + ". Inspect the current repository state first, then do the next safe step. Do not mark this task complete unless the required work is actually verified.";
    setInput(command);
  }

  async function logout() {
    await fetch("/api/auth/logout", {method:"POST"}).catch(()=>{});
    setAuthenticated(false); setMessages(starterMessages); setStatus("LOCKED"); setRoadmap(null);
  }

  async function sendMessage(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value || status === "WORKING" || !authenticated) return;
    const isStatusRequest = /^(project )?status|current (project )?status|show me the current project status/i.test(value);
    const now = Date.now(), minimumAiTokens = 6000;

    if (!isStatusRequest) {
      if (telemetry.blockedUntil > now) {
        setMessages(items => [...items,{role:"agent",text:"Rate-limit guard: AI request not sent. Wait for the runtime reset. No model tokens were consumed."}]);
        setStatus("RATE_LIMITED"); return;
      }
      if (Number.isFinite(telemetry.remainingTokens) && telemetry.remainingTokens < minimumAiTokens) {
        setMessages(items => [...items,{role:"agent",text:"Rate-limit guard: available TPM is below the safety threshold. Request was not sent and no model tokens were consumed."}]);
        setStatus("RATE_LIMITED"); return;
      }
    }

    const nextMessages = [...messages,{role:"user",text:value}];
    setMessages(nextMessages); setInput(""); setStatus("WORKING");
    try {
      const response = await fetch("/api/chat", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task:value,history:messages})});
      const data = await response.json(); applyTelemetry(data);
      if (response.status === 401) { setAuthenticated(false); throw new Error("Your Founder session expired. Unlock the agent again."); }
      if (!response.ok) throw new Error((data.error || "Runtime request failed.") + (data.rateLimit?.remainingTokens != null ? " Remaining TPM: " + formatTokens(data.rateLimit.remainingTokens) + "." : ""));
      setMessages(items => [...items,{role:"agent",text:data.result || "Runtime completed without a text result."}]);
      setApproval(data.approval || null); setStatus(data.status || "IDLE"); loadRoadmap();
    } catch (error) {
      setMessages(items => [...items,{role:"agent",text:"Runtime status: BLOCKED/FAILED. " + error.message}]); setStatus("BLOCKED");
    }
  }

  async function approveWrite() {
    if (!approval?.approvalToken || approvalBusy) return;
    setApprovalBusy(true); setStatus("WORKING");
    try {
      const response = await fetch("/api/approvals/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({approvalToken:approval.approvalToken})});
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); throw new Error("Your Founder session expired. Unlock the agent again."); }
      if (!response.ok) throw new Error(data.error || "Approval execution failed.");
      setMessages(items => [...items,{role:"agent",text:[data.result,"","Commit: "+(data.commitSha||"unavailable"),"Verification: "+(data.verified?"PASSED":"FAILED")].join("\n")}]);
      setApproval(null); setStatus(data.status || "DONE"); loadRoadmap();
    } catch (error) { setMessages(items => [...items,{role:"agent",text:"Approval status: BLOCKED/FAILED. "+error.message}]); setStatus("BLOCKED"); }
    finally { setApprovalBusy(false); }
  }



  async function recoveryCheck() {
    try {
      const response = await fetch("/api/chat?recovery=1");
      const data = await response.json();
      const trace = (data.trace || []).map(item => item.step + ": " + item.state).join("\n");
      setMessages(items => [...items, {role:"agent", text:"Runtime recovery test: " + data.status + "\n\n" + trace + "\n\nFailure detected: " + (data.failureDetected ? "YES" : "NO") + " | Recovered: " + (data.recovered ? "YES" : "NO") + " | Tokens: " + (data.tokenUsage ?? 0)}]);
      setStatus(data.status === "RECOVERY_TEST_PASS" ? "DONE" : "BLOCKED");
      loadRoadmap();
    } catch(error) {
      setMessages(items => [...items, {role:"agent", text:"Runtime recovery test failed: " + error.message}]);
      setStatus("BLOCKED");
    }
  }

  async function diagnosticsCheck() {
    try {
      const response = await fetch("/api/chat?diagnostics=1");
      const data = await response.json();
      const lines = (data.checks || []).map(check => (check.status === "PASS" ? "✓ " : "✕ ") + check.name);
      setMessages(items => [...items, {role:"agent", text:"Runtime self-test: " + data.status + " (" + (data.passed ?? 0) + "/" + (data.total ?? 0) + ")\\n\\n" + lines.join("\\n") + "\\n\\nOpenAI probe: " + (data.openaiProbe || "NOT_RUN") + " | Tokens: " + (data.tokenUsage ?? 0)}]);
      setStatus(data.status === "SELF_TEST_PASS" ? "DONE" : "BLOCKED");
    } catch(error) {
      setMessages(items => [...items, {role:"agent", text:"Runtime self-test failed: " + error.message}]);
      setStatus("BLOCKED");
    }
  }

  async function healthCheck() {
    try {
      const response = await fetch("/api/chat?health=1"), data = await response.json(), checks = data.checks || {};
      setMessages(items => [...items,{role:"agent",text:"Health: "+data.status+". Auth: "+(checks.auth||"—")+" | GitHub state: "+(checks.githubState||"—")+" | OpenAI config: "+(checks.openaiKey||"—")+" / "+(checks.openaiModel||"—")+" | Tokens used: "+(data.tokenUsage??"—")+"."}]);
      setStatus(data.status === "HEALTHY" ? "DONE" : "BLOCKED");
    } catch(error) { setMessages(items => [...items,{role:"agent",text:"Health check failed: "+error.message}]); setStatus("BLOCKED"); }
  }

  if (authenticated === null) return <main className="auth-shell"><div className="loading-card"><div className="spinner" />Checking Founder session…</div></main>;
  if (!authenticated) return <Login onAuthenticated={() => {setAuthenticated(true);setBooting(true);setStatus("IDLE");}} />;
  if (booting) return <BootScreen onDone={() => setBooting(false)} />;

  const nav = [
    ["home","HOME"],["chat","CHAT"],["missions","MISSIONS"],["projects","PROJECTS"],["roadmap","ROADMAP"],["memory","MEMORY"],["tools","TOOLS"],["activity","ACTIVITY"],["settings","SETTINGS"]
  ];

  return <main className="app-shell">
    <header className="topbar">
      <button className="identity" onClick={() => setActiveView("home")}>
        <div className="mini-orb">✦</div>
        <div><div className="brand">FOUNDER<span>AGENT</span></div><div className="sub">Jal Chaudhary’s personal AI operating system</div></div>
      </button>
      <div className="top-actions"><div className="status"><i /> {status}</div><button className="lock-button" onClick={logout}>Lock</button></div>
    </header>

    <nav className="nav-scroll" aria-label="Main navigation">
      {nav.map(([id,label]) => <button key={id} className={activeView===id?"nav-item active":"nav-item"} onClick={()=>setActiveView(id)}>{label}</button>)}
    </nav>

    <section className="token-bar">
      <div className="token-card"><span>TPM LIMIT</span><strong>{formatTokens(telemetry.rateLimitTokens)}</strong></div>
      <div className="token-card"><span>REMAINING</span><strong>{formatTokens(telemetry.remainingTokens)}</strong></div>
      <div className="token-card"><span>RESET IN</span><strong>{telemetry.resetAt > resetNow ? formatCountdown(telemetry.resetAt - resetNow) : (Number.isFinite(telemetry.remainingTokens) && telemetry.remainingTokens < 6000 ? "WAITING" : "READY")}</strong></div>
      <div className="token-card"><span>SESSION</span><strong>{formatTokens(telemetry.sessionTokens)}</strong></div>
      <div className="token-card"><span>LAST CALL</span><strong>{formatTokens(telemetry.lastTokens)}</strong></div>
    </section>

    {activeView === "home" && <section className="home-grid">
      <div className="hero-card">
        <div className="hero-copy"><div className="eyebrow">GOOD MORNING, JAL</div>
        <h1>Your agent is ready.</h1>
        <p>Research. Build. Verify. Grow. One verified step at a time.</p>
        <div className="hero-actions"><button onClick={()=>setActiveView("chat")}>Talk to Agent</button><button className="secondary" onClick={()=>setActiveView("roadmap")}>View Roadmap</button></div></div>
        <div className={"hero-core-wrap " + (agentActivated ? "agent-activated" : "")}>
          <button className="hero-core-button" onClick={activateAgent} aria-label="Activate Founder Agent">
            <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
            <div className="hero-core"><div className="core-symbol">✦</div><span>FOUNDER</span><b>AGENT</b><small>{agentActivated ? "ACTIVE" : "ONLINE"}</small></div>
          </button>
          <div className="core-hint">{agentActivated ? "JAL CHAUDHARY • AGENT ACTIVE" : "TAP TO ACTIVATE"}</div>
          {agentActivated && <div className="activation-reply"><i/> <strong>JAL CHAUDHARY</strong><span>Founder Agent is active.</span></div>}
        </div>
        <div className="hero-metrics"><div><span>MISSION</span><b>002</b></div><div><span>STATE</span><b>BUILDING</b></div><div><span>TRUST</span><b>VERIFIED</b></div></div>
      </div>
      <div className="overview-card"><div className="eyebrow">FOUNDER OVERVIEW</div><div className="overview-row"><span>Current project</span><b>AI Food Label & Nutrition Pack</b></div><div className="overview-row"><span>Current mission</span><b>Mission 002 — Prospect Validation</b></div><div className="overview-row"><span>Runtime</span><b className="good">● HEALTHY CHECK AVAILABLE</b></div></div>
      <div className="quick-grid">
        <button onClick={()=>setActiveView("missions")}><b>🔎</b><span>Mission Center</span><small>Run and review missions</small></button>
        <button onClick={()=>setActiveView("roadmap")}><b>☑</b><span>Master Roadmap</span><small>Pick the next task & build it</small></button>
        <button onClick={diagnosticsCheck}><b>✓</b><span>Diagnostics</span><small>Zero model tokens</small></button>
        <button onClick={()=>setActiveView("tools")}><b>⚙</b><span>System</span><small>Tools & security</small></button>
      </div>
      <div className="recent-card"><div className="section-mini"><span>RECENT ACTIVITY</span><button onClick={()=>setActiveView("activity")}>View all →</button></div><div className="activity-item"><i className="dot good-dot"/><span>Runtime health verified</span><time>Today</time></div><div className="activity-item"><i className="dot"/><span>Personal roadmap added</span><time>Today</time></div><div className="activity-item"><i className="dot"/><span>Approval flow verified</span><time>Done</time></div></div>
    </section>}

    {activeView === "roadmap" && <Roadmap roadmap={roadmap} onRefresh={loadRoadmap} onStartTask={startRoadmapTask} />}

    {activeView === "missions" && <section className="panel"><div className="section-head"><div><div className="eyebrow">EXECUTION CENTER</div><h2>MISSION CENTER</h2><p>Long-running work is tracked here and grounded in repository state.</p></div></div><div className="mission-card"><div><span className="mission-status">IN PROGRESS</span><h3>Mission 002 — Prospect Validation</h3><p>Validate the Food Label & Nutrition Pack before building the full MVP.</p></div><button onClick={()=>{setActiveView("chat");setInput("Start Mission 002.");}}>Open Mission →</button></div><div className="mission-card muted"><div><span className="mission-status">COMPLETE</span><h3>Mission 001 — Food Label Validation</h3><p>Foundation research and product specification.</p></div></div></section>}

    {activeView === "projects" && <section className="panel"><div className="section-head"><div><div className="eyebrow">PROJECTS</div><h2>AI FOOD LABEL</h2><p>Current SaaS candidate and validation gate.</p></div></div><div className="project-progress"><div><span>VALIDATION PROGRESS</span><strong>Early stage</strong></div><div className="progress-track"><div style={{width:"25%"}}/></div></div><div className="project-stats"><div><span>PROSPECTS</span><b>0 / 30</b></div><div><span>PAYMENTS</span><b>0 / 3</b></div><div><span>MVP</span><b>NOT STARTED</b></div></div></section>}

    {activeView === "memory" && <section className="panel"><div className="section-head"><div><div className="eyebrow">REPOSITORY BRAIN</div><h2>AGENT MEMORY</h2><p>The GitHub repository is the durable source of truth.</p></div></div><div className="memory-grid">{[["STATE","MEMORY/STATE.md"],["DECISIONS","MEMORY/DECISIONS.md"],["PROJECTS","MEMORY/PROJECTS.md"],["LEARNINGS","MEMORY/LEARNINGS.md"]].map(x=><div className="memory-card" key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><em>CONNECTED</em></div>)}</div></section>}

    {activeView === "tools" && <section className="panel"><div className="section-head"><div><div className="eyebrow">SYSTEM</div><h2>CONNECTED TOOLS</h2><p>Capabilities the runtime can use, with secrets kept outside the repository.</p></div></div><div className="tool-grid">{["GitHub","Vercel","Web Research","OpenAI","Approval Engine","Memory"].map((x,i)=><div className="tool-card" key={x}><span>{["⌘","▲","⌕","✦","✓","◈"][i]}</span><div><b>{x}</b><small>{i===3 ? "Configured • rate-limited" : "Connected / ready"}</small></div><i>●</i></div>)}</div><div className="security-note">🔐 Founder approval is required before protected repository writes.</div></section>}

    {activeView === "activity" && <section className="panel"><div className="section-head"><div><div className="eyebrow">AUDIT TRAIL</div><h2>ACTIVITY</h2><p>Recent verified runtime events.</p></div></div><div className="timeline"><div><b>Health check</b><span>HEALTHY · 0 tokens</span></div><div><b>Approval flow</b><span>VERIFIED · GitHub write + read-back</span></div><div><b>Context Router 2.0</b><span>DEPLOYED · token-aware routing</span></div><div><b>Founder Agent PWA</b><span>INSTALLED · mobile ready</span></div></div></section>}

    {activeView === "settings" && <section className="panel"><div className="section-head"><div><div className="eyebrow">FOUNDER PROFILE</div><h2>SETTINGS</h2><p>Personal controls for Jal Chaudhary’s agent.</p></div></div><div className="settings-list"><div><span>Founder</span><b>Jal Chaudhary</b></div><div><span>Agent</span><b>Founder Agent</b></div><div><span>Theme</span><b>Midnight / Neon Purple</b></div><div><span>Repository</span><b>jalchaudhary08/founder-agent</b></div><div><span>Security</span><b>Authenticated + approval gated</b></div></div></section>}

    {activeView === "chat" && <section className="chat-view">
      {focusTask && <div className="focus-task"><div><span>ACTIVE ROADMAP TASK</span><b>{focusTask.title}</b><small>{focusTask.phase}</small></div><button onClick={() => setFocusTask(null)}>Clear</button></div>}
      <div className="chat-title"><div><div className="eyebrow">FOUNDER AGENT</div><h2>What are we building today?</h2></div><span className="live-pill"><i/> LIVE</span></div>
      <section className="chat">{messages.map((message,index)=><div className={message.role==="user"?"row user":"row"} key={index}><div className="avatar">{message.role==="user"?"YOU":"FA"}</div><div className="bubble"><div className="bubble-label">{message.role==="user"?"JAL CHAUDHARY":"AGENT RESPONSE"}</div>{message.text}</div></div>)}</section>
      {approval && <section className="approval-card"><div className="approval-head"><div><div className="approval-kicker">ACTION REQUIRES APPROVAL</div><h2>GitHub change ready</h2></div><span className="approval-timer">{Math.ceil((approval.expiresInSeconds||600)/60)} min</span></div><div className="approval-meta"><div><span>File</span><code>{approval.path}</code></div><div><span>Commit</span><code>{approval.message}</code></div></div><details><summary>Review proposed content</summary><pre>{approval.contentPreview}</pre></details><div className="approval-warning">Nothing has been written yet. Approve only if this exact change is intended.</div><div className="approval-actions"><button className="approve-button" onClick={approveWrite} disabled={approvalBusy}>{approvalBusy?"Applying…":"✓ Approve & Write"}</button><button className="reject-button" onClick={()=>{setApproval(null);setStatus("IDLE");}} disabled={approvalBusy}>Cancel</button></div></section>}
      <form className="composer" onSubmit={sendMessage}><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Tell Founder Agent what you want done…" rows={1} disabled={status==="WORKING"}/><button type="submit" disabled={status==="WORKING"}>↑</button></form>
      <div className="quick"><button onClick={()=>setInput("Start Mission 002.")}>Start Mission 002</button><button onClick={()=>setInput("Show me the current project status.")}>Project status</button><button onClick={healthCheck}>Health check</button><button onClick={diagnosticsCheck}>Diagnostics</button></div>
    </section>}
  </main>;
}

if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
createRoot(document.getElementById("root")).render(<App />);
