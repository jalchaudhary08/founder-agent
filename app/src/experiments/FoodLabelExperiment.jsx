import React from "react";

const samplePack={
 product:"Cocoa Oat Bites",
 servings:null,
 nutrition:{calories:142,protein:4.2,carbs:19.6,fat:5.8},
 ingredients:"Oats, cocoa powder, peanut butter, dates, sunflower seeds, salt",
 allergens:["PEANUT"],
 flags:["Verify serving size before publication","Confirm ingredient order by formulation weight"]
};

export default function FoodLabelExperiment({onBack}){
 const [state,setState]=React.useState("sample");
 const [product,setProduct]=React.useState("");
 const [ingredients,setIngredients]=React.useState("");
 const [result,setResult]=React.useState(null);
 const [error,setError]=React.useState("");

 async function buildPack(){
  if(!product.trim()||!ingredients.trim())return;
  setError("");setState("processing");
  try{
   const response=await fetch("/api/experiments/food-label",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"paid_verified",product:product.trim(),ingredients:ingredients.trim()})});
   const data=await response.json();
   if(response.status===402){setState("checkout");setError("Payment verification is not connected yet. No real product data was processed.");return;}
   if(!response.ok)throw new Error(data.error||"Product pack failed.");
   setResult(data);setState("result");
  }catch(e){setError(e.message||"Product pack failed.");setState("error");}
 }

 const pack=result||samplePack;
 return <main className="labelkit-page">
  <header className="labelkit-nav"><button className="labelkit-wordmark" onClick={onBack}>LABEL<span>KIT</span></button><span>EXPERIMENT 04 · FOOD PRODUCT PACK</span></header>

  <section className="labelkit-hero">
   <div className="labelkit-copy">
    <small>FOOD PRODUCT PREPARATION</small>
    <h1>Turn product data into a <em>label-ready first draft.</em></h1>
    <p>Build a reviewable pack with nutrition, ingredients, allergen screening and a product-copy draft—without pretending a software check is regulatory approval.</p>
    <div className="labelkit-form">
     <label>PRODUCT NAME<input value={product} onChange={e=>setProduct(e.target.value)} placeholder="e.g. Cocoa Oat Bites"/></label>
     <label>INGREDIENTS / PRODUCT DATA<textarea value={ingredients} onChange={e=>setIngredients(e.target.value)} placeholder="e.g. oats, cocoa powder, peanut butter, dates"/></label>
     <button onClick={buildPack} disabled={!product.trim()||!ingredients.trim()||state==="processing"}>{state==="processing"?"BUILDING…":"Build $15 Product Pack"}</button>
    </div>
    <div className="labelkit-note">Illustrative nutrition values only—not verified product data. Real product data remains unprocessed until payment verification is connected.</div>
    {error&&<div className="labelkit-error">{error}</div>}
   </div>

   <div className="labelkit-proof">
    <div className="labelkit-proof-head"><span>PACKAGING PROOF</span><b>{result?"LIVE OUTPUT":"ILLUSTRATIVE DEMO"}</b></div>
    <div className="labelkit-label"><small>ILLUSTRATIVE PRODUCT EXAMPLE</small><h2>{pack.product}</h2><div className="labelkit-serving">{pack.servings ? pack.servings+" SERVINGS" : "SERVING SIZE NOT SET"} · REVIEW DRAFT</div><div className="labelkit-nutrition"><b>NUTRITION SNAPSHOT</b><strong>{pack.nutrition.calories} kcal</strong><div><span>PROTEIN <b>{pack.nutrition.protein}g</b></span><span>CARBS <b>{pack.nutrition.carbs}g</b></span><span>FAT <b>{pack.nutrition.fat}g</b></span></div></div><div className="labelkit-ingredients"><b>INGREDIENTS</b><p>{pack.ingredients}</p></div></div>
   </div>
  </section>

  <section className="labelkit-pack">
   <div><small>PACK CONTENTS</small><h2>One product. Four useful outputs.</h2></div>
   <div className="labelkit-cards">
    <article><b>01</b><h3>Nutrition</h3><p>Aggregated from supplied nutrition inputs. Missing values stay missing.</p></article>
    <article><b>02</b><h3>Ingredients</h3><p>A clean ingredient-list draft that remains editable before publication.</p></article>
    <article><b>03</b><h3>Allergen screen</h3><p>Flags declared common allergens as a review signal—not a legal certification.</p></article>
    <article><b>04</b><h3>Product copy</h3><p>Short packaging/e-commerce copy drafted from the supplied product information.</p></article>
   </div>
  </section>

  <section className="labelkit-flags">
   <div><small>HUMAN REVIEW RAIL</small><h2>Nothing gets a green stamp blindly.</h2><p>Before publishing, review formulation order, serving size, units, allergen declarations and the applicable local labeling rules.</p></div>
   <div>{(pack.flags||samplePack.flags).map((flag,i)=><div className="labelkit-flag" key={i}><span>REVIEW</span><b>{flag}</b></div>)}{(pack.allergens||samplePack.allergens).map((a,i)=><div className="labelkit-flag allergen" key={"a"+i}><span>ALLERGEN</span><b>{a}</b></div>)}</div>
  </section>

  <section className="labelkit-offer"><div><small>PAID PRODUCT TEST</small><h2>Build one product pack for $15.</h2><p>Structured outputs, visible assumptions and a human-review checklist. No compliance guarantee.</p></div><button onClick={()=>setState("checkout")}>{state==="checkout"?"CHECKOUT NOT CONNECTED":"Build the $15 Product Pack"}</button>{state==="checkout"&&<small>Payment provider is not connected yet. No charge is claimed.</small>}</section>
 </main>;
}
