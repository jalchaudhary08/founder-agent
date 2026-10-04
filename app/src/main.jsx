import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const starterMessages = [
  {
    role: "agent",
    text: "Hey founder 👋 I'm your Founder Agent. Give me a task and I'll plan it, show approvals when needed, execute through connected tools, and verify the result."
  }
];

function App() {
  const [messages, setMessages] = React.useState(starterMessages);
  const [input, setInput] = React.useState("");
  const [status, setStatus] = React.useState("IDLE");

  function sendMessage(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;

    setMessages((items) => [
      ...items,
      { role: "user", text: value },
      {
        role: "agent",
        text: "I received the task. Runtime connection is the next integration step; this prototype is ready for the real orchestrator."
      }
    ]);
    setStatus("WORKING");
    setInput("");
    window.setTimeout(() => setStatus("IDLE"), 1200);
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
        />
        <button type="submit" aria-label="Send task">↑</button>
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
