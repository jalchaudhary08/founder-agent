import React from "react";

const sampleRows = [
  {id:"A-1042", shopify:"1", ads:"1", state:"MATCH"},
  {id:"A-1043", shopify:"1", ads:"2", state:"DRIFT"},
  {id:"A-1044", shopify:"1", ads:"0", state:"MISSING"},
  {id:"A-1045", shopify:"1", ads:"1", state:"MATCH"},
  {id:"A-1046", shopify:"0", ads:"1", state:"EXTRA_AD"}
];

export default function TrackingDriftExperiment({onBack}) {
  const [state,setState]=React.useState("sample");
  const [shopifyFile,setShopifyFile]=React.useState(null);
  const [adsFile,setAdsFile]=React.useState(null);
  const [error,setError]=React.useState("");
  const [result,setResult]=React.useState(null);

  async function analyzePaid() {
    if (!shopifyFile || !adsFile) return;
    setError("");
    setState("processing");
    try {
      const shopifyCsv=await shopifyFile.text();
      const adsCsv=await adsFile.text();
      const response=await fetch("/api/experiments/tracking-drift",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({shopifyCsv,adsCsv,mode:"paid_verified"})});
      const data=await response.json();
      if(response.status===402){setState("checkout");setError("Payment verification is not connected yet. No CSV was processed.");return;}
      if(!response.ok) throw new Error(data.error||"Drift check failed.");
      setResult(data);setState("result");
    } catch(e){setError(e.message||"Drift check failed.");setState("error");}
  }

  return <main className="drift-page">
    <header className="drift-nav">
      <button onClick={onBack} className="drift-wordmark">DRIFT<span>CHECK</span></button>
      <span>EXPERIMENT 02 · RECONCILIATION</span>
    </header>

    <section className="drift-hero">
      <div className="drift-copy">
        <small>SHOPIFY × ADS TRACKING DRIFT DETECTOR</small>
        <h1>When the numbers disagree,<br/><em>find out why.</em></h1>
        <p>Compare Shopify orders with ad-platform conversions and surface the mismatches worth investigating—before bad tracking turns into bad decisions.</p>
        <div className="drift-actions">
          <label className="drift-upload">
            <input type="file" accept=".csv,text/csv" onChange={e=>{setShopifyFile(e.target.files?.[0]||null);setState("ready")}} />
            {shopifyFile ? "Shopify CSV selected" : "Choose Shopify CSV"}
          </label>
          <label className="drift-upload"><input type="file" accept=".csv,text/csv" onChange={e=>{setAdsFile(e.target.files?.[0]||null);setState("ready")}} />{adsFile ? "Ads CSV selected" : "Choose Ads CSV"}</label><button className="drift-secondary" onClick={()=>setState("sample")}>See sample mismatch</button>
        </div>
        <p className="drift-note">Illustrative sample only. Real CSV data stays unprocessed until payment verification is connected; this prototype does not claim to charge you.</p>{shopifyFile && adsFile && <button className="drift-process" onClick={analyzePaid}>Process paid dataset</button>}{error && <span className="drift-error">{error}</span>}
      </div>

      <div className="drift-board">
        <div className="drift-board-head"><span>ILLUSTRATIVE DEMO DATA</span><b>5 ROWS</b></div>
        <div className="drift-ledgers"><strong>SHOPIFY ORDERS</strong><strong>ADS CONVERSIONS</strong></div>
        <div className="drift-summary">
          <div><small>SHOPIFY</small><b>{result?.summary?.shopCount ?? 4}</b></div>
          <div className="drift-delta"><small>DELTA</small><b>{result ? (result.summary.countDelta>0?"+":"")+result.summary.countDelta : "+1"}</b><span>{result?.summary?.driftPct ?? 25}% drift</span></div>
          <div><small>ADS</small><b>{result?.summary?.adsCount ?? 5}</b></div>
        </div>
        <div className="drift-rows">
          {(result?.rows || sampleRows).map(row=><div className={"drift-row "+row.state.toLowerCase()} key={row.id}>
            <code>{row.id}</code><span>{row.shopify ?? "—"}</span><i>↔</i><span>{row.ads ?? "—"}</span><b>{row.state}</b>
          </div>)}
        </div>
      </div>
    </section>

    <section className="drift-explain">
      <article><b>01</b><h2>Reconcile</h2><p>Normalize the two exports and compare conversion counts and value.</p></article>
      <article><b>02</b><h2>Explain</h2><p>Separate measurable drift from assumptions instead of guessing attribution.</p></article>
      <article><b>03</b><h2>Fix first</h2><p>Get a short priority list instead of another giant analytics dashboard.</p></article>
    </section>

    <section className="drift-offer">
      <div><small>SMALL PAID TEST</small><h2>Run the drift check for about $1.</h2><p>Get the mismatch summary, evidence, likely causes and a prioritized next-action sheet.</p></div>
      <button onClick={()=>setState("checkout")}>{state==="checkout"?"CHECKOUT NOT CONNECTED":"Run the $1 Drift Check"}</button>
      {state==="checkout" && <small>Payment provider is not connected yet. No charge is claimed.</small>}{state==="result" && <small>Analysis complete. Findings are based only on the supplied identifiers and values.</small>}
      {state==="ready" && <small>File selected. Payment must be verified before the real dataset is processed.</small>}
    </section>
  <section className="product-faq" id="faq">
    <div className="product-faq-heading"><small>FAQ & LIMITATIONS</small><h2>Reconciliation is a signal, not an attribution verdict.</h2></div>
    <details><summary>Which files does the sample use?</summary><p>The preview uses fixed illustrative rows. It does not read or upload your CSV files.</p></details>
    <details><summary>Can I process my actual exports now?</summary><p>Not yet. Payment verification is not connected, so the API blocks processing and no charge is taken.</p></details>
    <details><summary>Will this tell me which platform is right?</summary><p>It compares the fields present in the exports. Attribution windows, consent, time zones and platform rules may explain differences and need review.</p></details>
    <details><summary>Is the $1 check recurring?</summary><p>No recurring subscription is being sold in this prototype. The $1 offer is a one-time test.</p></details>
  </section>
  <footer className="product-footer"><b>DRIFTCHECK</b><span>Compare the exports you have. Review every flagged mismatch before changing budgets.</span><button onClick={onBack}>← Founder Agent</button></footer>
  </main>;
}
