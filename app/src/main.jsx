import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const starterMessages = [
  {
    role: "agent",
    text: "Hey founder 👋 I'm your Founder Agent. Give me a task and I'll plan it, use the repository brain, and report exactly what is verified."
  }
];

function App() {
  const [messages, setMessages] = React.useState(starterMessages);
  const [input, setInput] = React.useState("");
  const [status, setStatus] = React.useState("IDLE");

  async function sendMessage(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value || status === "WORKING") return;

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

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="brand">FOUNDER<span>AGENT</span></div>
          <div className="sub">Personal AI operating system</div>
        </div>
        <div className="status"><i /> {status}</div>
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
