import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const starterMessages = [
  {
    role: "agent",
    text: "Hey founder 👋 I'm your Founder Agent. Authenticate, give me a task, and I'll use the repository brain and report exactly what is verified."
  }
];

function Login({ onAuthenticated }) {
  const [key, setKey] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event) {
    event.preventDefault();
    if (!key.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed.");
      setKey("");
      onAuthenticated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="orb">✦</div>
        <div className="brand auth-brand">FOUNDER<span>AGENT</span></div>
        <h1>Founder access</h1>
        <p>Private runtime access is required before the agent can execute tasks.</p>
        <form onSubmit={submit} className="auth-form">
          <input
            type="password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="Enter Founder key"
            autoComplete="current-password"
          />
          <button type="submit" disabled={busy || !key.trim()}>
            {busy ? "Checking…" : "Unlock Founder Agent"}
          </button>
        </form>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-note">Your key is checked server-side and is never stored in the repository.</div>
      </div>
    </main>
  );
}

function App() {
  const [authenticated, setAuthenticated] = React.useState(null);
  const [messages, setMessages] = React.useState(starterMessages);
  const [input, setInput] = React.useState("");
  const [status, setStatus] = React.useState("IDLE");
  const [approval, setApproval] = React.useState(null);
  const [approvalBusy, setApprovalBusy] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setAuthenticated(data.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAuthenticated(false);
    setMessages(starterMessages);
    setStatus("LOCKED");
  }

  async function sendMessage(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value || status === "WORKING" || !authenticated) return;

    const nextMessages = [...messages, { role: "user", text: value }];
    setMessages(nextMessages);
    setInput("");
    setStatus("WORKING");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: value,
          history: messages
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        setAuthenticated(false);
        throw new Error("Your Founder session expired. Unlock the agent again.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Runtime request failed.");
      }

      setMessages((items) => [
        ...items,
        {
          role: "agent",
          text: data.result || "The runtime completed without a text result."
        }
      ]);
      setApproval(data.approval || null);
      setStatus(data.status || "IDLE");
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          role: "agent",
          text: `Runtime status: BLOCKED/FAILED. ${error.message}`
        }
      ]);
      setStatus("BLOCKED");
    }
  }

  async function approveWrite() {
    if (!approval?.approvalToken || approvalBusy) return;

    setApprovalBusy(true);
    setStatus("WORKING");

    try {
      const response = await fetch("/api/approvals/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalToken: approval.approvalToken })
      });
      const data = await response.json();

      if (response.status === 401) {
        setAuthenticated(false);
        throw new Error("Your Founder session expired. Unlock the agent again.");
      }

      if (!response.ok) throw new Error(data.error || "Approval execution failed.");

      setMessages((items) => [
        ...items,
        {
          role: "agent",
          text: [
            data.result,
            "",
            "Commit: " + (data.commitSha || "unavailable"),
            "Verification: " + (data.verified ? "PASSED" : "FAILED")
          ].join("\n")
        }
      ]);
      setApproval(null);
      setStatus(data.status || "DONE");
    } catch (error) {
      setMessages((items) => [
        ...items,
        { role: "agent", text: "Approval status: BLOCKED/FAILED. " + error.message }
      ]);
      setStatus("BLOCKED");
    } finally {
      setApprovalBusy(false);
    }
  }

  if (authenticated === null) {
    return (
      <main className="auth-shell">
        <div className="loading-card">Checking Founder session…</div>
      </main>
    );
  }

  if (!authenticated) {
    return <Login onAuthenticated={() => {
      setAuthenticated(true);
      setStatus("IDLE");
    }} />;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="brand">FOUNDER<span>AGENT</span></div>
          <div className="sub">Personal AI operating system</div>
        </div>
        <div className="top-actions">
          <div className="status"><i /> {status}</div>
          <button className="lock-button" onClick={logout}>Lock</button>
        </div>
      </header>

      <section className="hero">
        <div className="orb">✦</div>
        <h1>What are we building today?</h1>
        <p>Research. Build. Verify. Grow.</p>
      </section>

      <section className="chat" aria-label="Founder Agent conversation">
        {messages.map((message, index) => (
          <div className={message.role === "user" ? "row user" : "row"} key={index}>
            <div className="avatar">{message.role === "user" ? "YOU" : "FA"}</div>
            <div className="bubble">{message.text}</div>
          </div>
        ))}
      </section>

      {approval && (
        <section className="approval-card" aria-label="Founder approval request">
          <div className="approval-head">
            <div>
              <div className="approval-kicker">ACTION REQUIRES APPROVAL</div>
              <h2>GitHub change ready</h2>
            </div>
            <span className="approval-timer">{Math.ceil((approval.expiresInSeconds || 600) / 60)} min</span>
          </div>
          <div className="approval-meta">
            <div><span>File</span><code>{approval.path}</code></div>
            <div><span>Commit</span><code>{approval.message}</code></div>
          </div>
          <details>
            <summary>Review proposed content</summary>
            <pre>{approval.contentPreview}</pre>
          </details>
          <div className="approval-warning">Nothing has been written yet. Approve only if this exact change is intended.</div>
          <div className="approval-actions">
            <button className="approve-button" onClick={approveWrite} disabled={approvalBusy}>
              {approvalBusy ? "Applying…" : "✓ Approve & Write"}
            </button>
            <button className="reject-button" onClick={() => { setApproval(null); setStatus("IDLE"); }} disabled={approvalBusy}>
              Cancel
            </button>
          </div>
        </section>
      )}

      <form className="composer" onSubmit={sendMessage}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Tell Founder Agent what you want done..."
          rows={1}
          disabled={status === "WORKING"}
        />
        <button type="submit" aria-label="Send task" disabled={status === "WORKING"}>↑</button>
      </form>

      <div className="quick">
        <button onClick={() => setInput("Start Mission 002.")}>Start Mission 002</button>
        <button onClick={() => setInput("Show me the current project status.")}>Project status</button>
      </div>
    </main>
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Founder Agent service worker registration failed:", error);
    });
  });
}

createRoot(document.getElementById("root")).render(<App />);
