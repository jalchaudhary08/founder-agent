const MAX_TEXT=12000;
const allergenRules=[
 [/peanut|groundnut/i,"PEANUT"],[/milk|whey|casein|butter(?!nut)/i,"MILK"],[/egg/i,"EGG"],[/soy|soya/i,"SOY"],[/sesame|til/i,"SESAME"],[/almond|cashew|walnut|pistachio|hazelnut|pecan/i,"TREE NUTS"],[/wheat|barley|rye/i,"GLUTEN-GRAINS"]
];
function clean(s){return String(s||"").replace(/\s+/g," ").trim();}
function detectAllergens(ingredients){return allergenRules.filter(([r])=>r.test(ingredients)).map(([,name])=>name);}
function draftNutrition(ingredients){
 // Only deterministic sample estimates when explicitly supplied as key:value data.
 const out={calories:0,protein:0,carbs:0,fat:0},parts=ingredients.split(/[;\n]+/).map(clean).filter(Boolean);
 let supplied=0;
 for(const part of parts){
  const m=part.match(/(?:calories|kcal)\s*[:=]\s*([0-9.]+)/i);if(m){out.calories+=Number(m[1]);supplied++;}
  const p=part.match(/protein\s*[:=]\s*([0-9.]+)/i);if(p)out.protein+=Number(p[1]);
  const c=part.match(/carb(?:s|ohydrates)?\s*[:=]\s*([0-9.]+)/i);if(c)out.carbs+=Number(c[1]);
  const f=part.match(/fat\s*[:=]\s*([0-9.]+)/i);if(f)out.fat+=Number(f[1]);
 }
 return {values:{calories:Math.round(out.calories),protein:Number(out.protein.toFixed(1)),carbs:Number(out.carbs.toFixed(1)),fat:Number(out.fat.toFixed(1))},hasSuppliedNutrition:supplied>0};
}
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({ok:false,error:"Method not allowed."});
 try{
  const {mode="preview",product="",ingredients=""}=req.body||{};
  if(mode!=="paid_verified")return res.status(402).json({ok:false,code:"PAYMENT_REQUIRED",error:"Payment must be verified before real product data is processed."});
  if(!clean(product)||!clean(ingredients))return res.status(400).json({ok:false,error:"Provide product name and ingredient/product data."});
  if(product.length+ingredients.length>MAX_TEXT)return res.status(413).json({ok:false,error:"Product input is too large for this MVP."});
  const allergy=detectAllergens(ingredients),nutrition=draftNutrition(ingredients);
  const items=clean(ingredients).split(/[,;\n]+/).map(clean).filter(Boolean);
  const flags=["Verify ingredient order by formulation weight","Confirm serving size and units","Review applicable local labeling rules"];
  if(!nutrition.hasSuppliedNutrition)flags.unshift("Nutrition values were not supplied; no nutrition numbers were invented.");
  return res.status(200).json({ok:true,mode:"paid_verified",product:clean(product),servings:null,nutrition:nutrition.values,ingredients:items.join(", "),allergens:allergy,flags,productCopy:clean(product)+" — product description draft based only on supplied product information.",limitations:["Nutrition is calculated only from explicitly supplied key:value inputs in this MVP.","Allergen detection is a screening signal based on ingredient text and is not legal certification.","Final label content must be reviewed against applicable local requirements."]});
 }catch(error){return res.status(400).json({ok:false,error:error.message||"Could not build product pack."});}
}
