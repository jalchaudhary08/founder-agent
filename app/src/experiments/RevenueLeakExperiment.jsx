import React from "react";

const leaks = [
  {label:"MESSAGE", title:"Your primary promise is unclear", evidence:"A first-time visitor has to infer the outcome before reaching the CTA.", impact:"HIGH", effort:"LOW"},
  {label:"TRUST", title:"Proof arrives too late", evidence:"The strongest trust signal is separated from the conversion action.", impact:"HIGH", effort:"LOW"},
  {label:"CTA", title:"The next action is competing with secondary actions", evidence:"Multiple competing actions dilute the intended conversion path.", impact:"MEDIUM", effort:"LOW"}
];

export default function RevenueLeakExperiment({ onBack }) {
  const [url, setUrl] = React.useState("");
  const [goal, setGoal] = React.useState("Get more leads");
  const [state, setState] = React.useState("idle");
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");

  async function runPreview(event) {
    event.preventDefault();
    const target = url.trim();
    if (!/^https?:\\/\\//i.test(target)) {
      setError("Enter a valid public website URL, including https://");
      return;
    }
    setError("");
    setResult(null);
    setState("scanning");
    try {
      const response = await fetch("/api/experiments/revenue-leak", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({url: target, goal})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Diagnosis failed.");
      setResult(data);
      setState("preview");
    } catch (err) {
      setState("error");
      setError(err.message || "Diagnosis failed.");
    }
  }

  return <main className="leak-page">
    <header className="leak-nav">
      <button className="leak-wordmark" onClick={onBack}>REVENUE<span>LEAK</span></button>
      <div className="leak-nav-note">EXPERIMENT 01 · DIAGNOSTIC</div>
    </header>

    <section className="leak-hero">
      <div className="leak-copy">
        <div className="leak-kicker">WEBSITE REVENUE-LEAK WATCHDOG</div>
        <h1>Find the leak.<br/><em>Fix the first three.</em></h1>
        <p>Paste a public website URL. Get a concise diagnosis of the conversion leaks most worth fixing—not a 200-item audit nobody reads.</p>
        <form className="leak-form" onSubmit={runPreview}>
          <label htmlFor="leak-url">PUBLIC WEBSITE URL</label>
          <div className="leak-input-row">
            <input id="leak-url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://yourwebsite.com" inputMode="url" />
            <button type="submit" disabled={state==="scanning"}>{state==="scanning" ? "Scanning…" : "Run diagnosis"}</button>
          </div>
          <div className="leak-goal">
            <label htmlFor="leak-goal">PRIMARY CONVERSION GOAL</label>
            <select id="leak-goal" value={goal} onChange={e=>setGoal(e.target.value)}>
              <option>Get more leads</option>
              <option>Book more demos</option>
              <option>Increase purchases</option>
              <option>Get more signups</option>
            </select>
          </div>
          <small>Public page only · no login required for the preview · findings are evidence-based, not guaranteed revenue forecasts.</small>
        {error && <div className="leak-error" role="alert">{error}</div>}
        </form>
      </div>

      <div className="leak-board" aria-label="Example diagnostic board">
        <div className="board-top"><span>EXAMPLE DIAGNOSTIC</span><b>3 PRIORITIES</b></div>
        <div className="board-path"><span>VISITOR</span><i>→</i><span>MESSAGE</span><i>→</i><span>TRUST</span><i>→</i><span>CTA</span></div>
        <div className="board-score"><div><small>CONVERSION HEALTH</small><strong>{result ? result.score : "—"}</strong><span>/100</span></div><div className="board-stamp">{state==="preview" ? "LIVE PREVIEW" : state==="error" ? "SCAN FAILED" : "WAITING FOR URL"}</div></div>
        <div className="board-leaks">
          {(result?.findings || leaks).map((leak,i)=><article key={leak.label} className="board-leak">
            <span>{String(i+1).padStart(2,"0")} · {leak.label}</span>
            <b>{result ? leak.title : "Priority finding appears here"}</b>
            <small>{result ? leak.evidence : "Run the preview to reveal evidence and recommended action."}</small>
            <div><i>{leak.impact} IMPACT</i><i>{leak.effort} EFFORT</i></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="leak-explain">
      <div><span>01</span><h2>Evidence before opinion.</h2><p>We inspect public page HTML and connect each finding to a concrete structural signal. Behavioral revenue loss still needs first-party data.</p></div>
      <div><span>02</span><h2>Priority before volume.</h2><p>You get the few fixes worth doing first, ranked by commercial impact and implementation effort.</p></div>
      <div><span>03</span><h2>Scenario, not fake certainty.</h2><p>When business numbers are unavailable, we do not invent lost-revenue figures. Assumptions stay visible.</p></div>
    </section>

    <section className="leak-offer">
      <div><span className="leak-kicker">SMALL PAID TEST</span><h2>See the full diagnosis for about $1.</h2><p>Unlock the complete finding set, evidence notes and a prioritized fix sheet. Recurring monitoring comes later—only if the diagnosis proves useful.</p></div>
      <button onClick={()=>setState("payment-pending")}>Unlock full diagnostic · ~$1</button>
      {state==="payment-pending" && <small>Payment integration is the next implementation step; this prototype does not claim to have charged you.</small>}
    </section>
  </main>;
}
