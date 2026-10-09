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

  function startCheckout() {
    setState("checkout");
    setError("");
  }

  const sampleResult = {
    score: 62,
    findings: leaks,
    remainingFindings: 4,
    reportMeta:{methodologyCount:4,limitationCount:3}
  };

  return <main className="leak-page">
    <header className="leak-nav">
      <button className="leak-wordmark" onClick={onBack}>REVENUE<span>LEAK</span></button>
      <div className="leak-nav-note">EXPERIMENT 01 · DIAGNOSTIC</div>
    </header>

    <section className="leak-hero">
      <div className="leak-copy">
        <div className="leak-kicker">WEBSITE REVENUE-LEAK WATCHDOG</div>
        <h1>Find the leak.<br/><em>Fix the first three.</em></h1>
        <p>See exactly what a revenue-leak diagnosis looks like, then pay only when you want us to scan your real website. No free scans. No account required.</p>
        <div className="leak-form">
          <label htmlFor="leak-url">PUBLIC WEBSITE URL</label>
          <div className="leak-input-row">
            <input id="leak-url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://yourwebsite.com" inputMode="url" />
            <button type="button" onClick={startCheckout}>Get my report · ~$1</button>
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
          <small>Your URL is not fetched. Payment verification is not connected yet. The sample below uses fixed illustrative data.</small>
        {error && <div className="leak-error" role="alert">{error}</div>}
        </div>
      </div>

      <div className="leak-board" aria-label="Example diagnostic board">
        <div className="board-top"><span>ILLUSTRATIVE DEMO DATA</span><b>3 EXAMPLE PRIORITIES</b></div>
        <div className="board-path"><span>VISITOR</span><i>→</i><span>MESSAGE</span><i>→</i><span>TRUST</span><i>→</i><span>CTA</span></div>
        <div className="board-score"><div><small>CONVERSION HEALTH</small><strong>{sampleResult.score}</strong><span>/100</span></div><div className="board-stamp">{state==="checkout" ? "CHECKOUT NEXT" : "SAMPLE REPORT"}</div></div>
        <div className="board-leaks">
          {sampleResult.findings.map((leak,i)=><article key={leak.label} className="board-leak">
            <span>{String(i+1).padStart(2,"0")} · {leak.label}</span>
            <b>{leak.title}</b>
            <small>{leak.evidence}</small>
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

    <section className="leak-report-preview">
      <div>
        <span className="leak-kicker">REPORT ARCHITECTURE</span>
        <h2>The paid report goes deeper.</h2>
        <p>Illustrative demo output only; not a customer result. The real URL scan remains locked until payment verification is connected.</p>
      </div>
      <div className="leak-report-grid">
        <article><b>EXAMPLE FINDINGS</b><span>{sampleResult.remainingFindings + 3}</span><small>illustrative count, not a performance claim</small></article>
        <article><b>EVIDENCE</b><span>✓</span><small>scan signals + source context</small></article>
        <article><b>METHODOLOGY</b><span>{sampleResult.reportMeta.methodologyCount}</span><small>transparent scan steps</small></article>
        <article><b>LIMITATIONS</b><span>{sampleResult.reportMeta.limitationCount}</span><small>what this scan cannot prove</small></article>
      </div>
    </section>

    <section className="leak-offer">
      <div><span className="leak-kicker">SMALL PAID TEST</span><h2>See the full diagnosis for about $1.</h2><p>Unlock the complete finding set, evidence notes and a prioritized fix sheet. Recurring monitoring comes later—only if the diagnosis proves useful.</p></div>
      <button onClick={()=>setState("payment-pending")}>Unlock full diagnostic · ~$1</button>
      {state==="payment-pending" && <small>Payment integration is the next implementation step; this prototype does not claim to have charged you.</small>}
    </section>
  </main>;
}
