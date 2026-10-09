import React from "react";

const sampleFindings=[
 {severity:"HIGH",label:"ARITHMETIC",title:"Channel totals do not reconcile",evidence:"Paid Search detail totals 184 leads while the summary states 201.",fix:"Recalculate the summary from detail rows before sending."},
 {severity:"MEDIUM",label:"DATE RANGE",title:"One row falls outside the report period",evidence:"The report is labeled Sep 1–30, but one record is dated Oct 1.",fix:"Remove the out-of-range row or correct the report period."},
 {severity:"LOW",label:"FORMAT",title:"Conversion rate is missing for one row",evidence:"Clicks and conversions exist, but the rate cell is blank.",fix:"Fill the rate or explicitly mark the metric unavailable."}
];

export default function AgencyReportQAExperiment({onBack}){
 const[file,setFile]=React.useState(null),[state,setState]=React.useState("sample"),[result,setResult]=React.useState(null),[error,setError]=React.useState("");
 async function runCheck(){
  if(!file)return;setError("");setState("processing");
  try{
   const csv=await file.text();
   const response=await fetch("/api/experiments/agency-report-qa",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({csv,mode:"paid_verified"})});
   const data=await response.json();
   if(response.status===402){setState("checkout");setError("Payment verification is not connected yet. No report data was processed.");return;}
   if(!response.ok)throw new Error(data.error||"Report check failed.");
   setResult(data);setState("result");
  }catch(e){setError(e.message||"Report check failed.");setState("error");}
 }
 const findings=result?.findings||sampleFindings;
 const status=result?(result.summary.criticalCount?"HOLD":result.summary.issueCount?"REVIEW":"SEND"):"HOLD";
 return <main className="reportqa-page">
  <header className="reportqa-nav"><button className="reportqa-wordmark" onClick={onBack}>REPORT<span>CHECK</span></button><span>EXPERIMENT 03 · CLIENT REPORT QA</span></header>
  <section className="reportqa-hero">
   <div className="reportqa-copy"><small>AGENCY REPORT QUALITY CONTROL</small><h1>Catch the number<br/><em>before the client does.</em></h1><p>A pre-send QA pass for agency reports. Check arithmetic, dates, missing metrics, duplicates and suspicious changes before a polished report hides a small mistake. Preview findings are illustrative examples.</p>
    <div className="reportqa-upload"><label><span>{file?"CSV selected":"Choose report CSV"}</span><input type="file" accept=".csv,text/csv" onChange={e=>{setFile(e.target.files?.[0]||null);setState("ready");setError("");}}/></label><button onClick={runCheck} disabled={!file||state==="processing"}>{state==="processing"?"Checking…":"Run paid check"}</button></div>
    {file&&<div className="reportqa-file">{file.name} · real data stays unprocessed until payment is verified.</div>}{error&&<div className="reportqa-error">{error}</div>}
   </div>
   <div className={"reportqa-stamp "+status.toLowerCase()}><span>PRE-SEND STATUS</span><strong>{status}</strong><small>{result?result.summary.issueCount+" issue(s) found":"Illustrative demo data · not customer results"}</small></div>
  </section>
  <section className="reportqa-sheet"><div className="reportqa-sheet-head"><div><small>QA CHECKLIST</small><h2>REPORT PROOF</h2></div><b>{result?result.summary.rowsChecked+" ROWS CHECKED":"ILLUSTRATIVE DEMO REPORT"}</b></div><div className="reportqa-grid">{findings.map((f,i)=><article className={"reportqa-finding "+f.severity.toLowerCase()} key={i}><div className="reportqa-finding-top"><span>{f.severity}</span><b>{f.label}</b></div><h3>{f.title}</h3><p>{f.evidence}</p><small>FIX → {f.fix}</small></article>)}</div></section>
  <section className="reportqa-method"><article><b>01</b><h3>Arithmetic</h3><p>Find totals and relationships we can actually verify.</p></article><article><b>02</b><h3>Consistency</h3><p>Check dates, required fields, duplicates and suspicious rows.</p></article><article><b>03</b><h3>Prioritize</h3><p>Turn raw errors into a short HOLD / REVIEW / SEND decision.</p></article></section>
  <section className="reportqa-offer"><div><small>SMALL PAID TEST</small><h2>Run one report check for about $1.</h2><p>Get the issues, evidence and fixes that matter before the report leaves your inbox.</p></div><button onClick={()=>setState("checkout")}>{state==="checkout"?"CHECKOUT NOT CONNECTED":"Run the $1 Report Check"}</button>{state==="checkout"&&<small>Payment provider is not connected yet. No charge is claimed.</small>}</section>
   <section className="product-faq" id="faq">
   <div className="product-faq-heading"><small>FAQ & LIMITATIONS</small><h2>Proofread the report before it leaves your desk.</h2></div>
   <details><summary>Are the findings from a real agency report?</summary><p>No. The initial findings are illustrative examples, not customer data or customer results.</p></details>
   <details><summary>Can I upload and check a live report now?</summary><p>The interface accepts a CSV, but payment verification is not connected. The server blocks processing and no charge is taken.</p></details>
   <details><summary>Does SEND mean a report is guaranteed correct?</summary><p>No. It only reflects the checks this tool performed on the supplied rows. A human should review the final report.</p></details>
   <details><summary>Is this a recurring subscription?</summary><p>The current offer is a one-time $1 report check. A subscription is not available in this prototype.</p></details>
  </section>
  <footer className="product-footer"><b>REPORTCHECK</b><span>Catch report inconsistencies before sending; retain human review for final sign-off.</span><button onClick={onBack}>← Founder Agent</button></footer>
</main>;
}
