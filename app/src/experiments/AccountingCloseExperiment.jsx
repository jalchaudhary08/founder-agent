import React from "react";

const sampleExceptions=[
 {severity:"HIGH",rule:"DUPLICATE",title:"Duplicate-looking transaction pair",evidence:"2026-09-28 · ACME SUPPLY · 12,450.00 · same reference and account appear twice.",action:"Verify whether one entry is a legitimate split or duplicate posting."},
 {severity:"MEDIUM",rule:"MISSING FIELD",title:"Transaction has no account/category",evidence:"Row 1842 contains a date and amount but no account/category value.",action:"Assign the correct account before close."},
 {severity:"LOW",rule:"OUTLIER",title:"Amount is unusually large for this export",evidence:"18,900.00 is more than 20× the simple average of comparable numeric rows.",action:"Review the source document and confirm the amount/date."}
];

export default function AccountingCloseExperiment({onBack}){
 const[file,setFile]=React.useState(null),[state,setState]=React.useState("sample"),[result,setResult]=React.useState(null),[error,setError]=React.useState("");
 function runCheck(){
  setState("checkout");
  setError("Checkout and payment verification are not connected. Your transaction CSV has not been read or sent to the server.");
 }
 const exceptions=result?.exceptions||sampleExceptions;
 const summary=result?.summary||{rowsChecked:"SAMPLE",exceptionCount:3,highCount:1};
 const status=result?(summary.highCount?"REVIEW":"CLEAR"):"REVIEW";
 return <main className="closeline-page">
  <header className="closeline-nav"><button className="closeline-wordmark" onClick={onBack}>CLOSE<span>LINE</span></button><span>EXPERIMENT 05 · ACCOUNTING CLOSE</span></header>
    <nav className="product-subnav" aria-label="Page sections"><a href="#overview">Overview</a><a href="#method">Methodology</a><a href="#sample">Sample dossier</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav>

  <section className="closeline-hero" id="overview">
   <div className="closeline-copy"><small>MONTH-END CONTROL</small><h1>Close the books.<br/><em>Not your eyes.</em></h1><p>Find the transactions worth reviewing before month-end close. Evidence-first checks for duplicates, missing fields, unusual amounts and other observable exceptions.</p>
    <div className="closeline-upload"><label><span>{file?file.name:"Choose transaction CSV"}</span><input type="file" accept=".csv,text/csv" onChange={e=>{setFile(e.target.files?.[0]||null);setState("ready");setError("");}}/></label><button disabled={!file||state==="processing"} onClick={runCheck}>{state==="processing"?"CHECKING…":"Run $15 Close Check"}</button></div>
    <div className="closeline-note">Illustrative sample only—not a real client ledger. Real transaction data remains unprocessed until payment verification is connected.</div>
    {error&&<div className="closeline-error">{error}</div>}
   </div>
   <div className={"closeline-status "+status.toLowerCase()}><small>CLOSE STATUS</small><strong>{status}</strong><span>{result?summary.exceptionCount+" exception(s) found":"Illustrative demo queue · not customer results"}</span></div>
  </section>

  <section className="closeline-kpis"><div><small>ROWS CHECKED</small><b>{summary.rowsChecked}</b></div><div><small>EXCEPTIONS</small><b>{summary.exceptionCount}</b></div><div><small>HIGH PRIORITY</small><b>{summary.highCount}</b></div><div><small>DATA QUALITY</small><b>{result?result.summary.dataQuality:"SAMPLE"}</b></div></section>

  <section className="closeline-queue" id="sample"><div className="closeline-head"><div><small>EXCEPTION QUEUE</small><h2>REVIEW BEFORE CLOSE</h2></div><span>ILLUSTRATIVE DEMO · RULE → EVIDENCE → ACTION</span></div>
   <div className="closeline-list">{exceptions.map((x,i)=><article className={"closeline-row "+x.severity.toLowerCase()} key={i}><div className="closeline-sev">{x.severity}</div><div><small>{x.rule}</small><h3>{x.title}</h3><p>{x.evidence}</p></div><strong>{x.action}</strong></article>)}</div>
  </section>

  <section className="closeline-method" id="method"><article><b>01</b><h3>Detect</h3><p>Scan only the fields actually present in the export.</p></article><article><b>02</b><h3>Explain</h3><p>Every flag carries observable evidence and a review reason.</p></article><article><b>03</b><h3>Review</h3><p>An exception is not proof of fraud or error. A human makes the final call.</p></article></section>

  <section className="closeline-offer" id="pricing"><div><small>PAID PRODUCT TEST</small><h2>Run one close check for $15.</h2><p>Get a focused exception queue instead of manually scanning every transaction.</p></div><button onClick={()=>setState("checkout")}>{state==="checkout"?"CHECKOUT NOT CONNECTED":"Run the $15 Close Check"}</button>{state==="checkout"&&<small>Payment provider is not connected yet. No charge is claimed.</small>}</section>
   <section className="product-faq" id="faq">
   <div className="product-faq-heading"><small>FAQ & LIMITATIONS</small><h2>Exceptions to review, not automated accounting judgments.</h2></div>
   <details><summary>Is this a real ledger preview?</summary><p>No. The visible queue uses illustrative sample transactions and is not customer data.</p></details>
   <details><summary>Can I process my CSV now?</summary><p>Not yet. Payment verification is not connected, so the server blocks processing and no charge is taken.</p></details>
   <details><summary>Does an exception mean fraud?</summary><p>No. A duplicate-like row, missing field or outlier is a review signal. Confirm it against source documents and your accounting policy.</p></details>
   <details><summary>What does the $15 offer mean?</summary><p>It is the planned one-time close-check test. Checkout is not connected in this prototype, so it is not currently purchasable.</p></details>
  </section>
  <footer className="product-footer"><b>CLOSELINE</b><span>Evidence-first exception review. This tool does not issue an audit opinion.</span><button onClick={onBack}>← Founder Agent</button></footer>
</main>;
}
