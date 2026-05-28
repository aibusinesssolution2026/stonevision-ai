"use client";
import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 4777,
    period: "per month",
    scans: 200,
    highlight: false,
    badge: "",
    color: "#5b8dd9",
    features: [
      "200 AI scans / month",
      "PDF catalog export (EN)",
      "WhatsApp share link",
      "Dispute-proof timestamps",
      "Public catalog link",
      "1 user account",
      "Email support",
    ],
    cta: "Get Starter",
    action: "signup_starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: 9777,
    period: "per month",
    scans: 500,
    highlight: true,
    badge: "Most Popular",
    color: "#c9a84c",
    features: [
      "500 AI scans / month",
      "PDF in 5 languages (EN/TA/AR/ZH/PL)",
      "WhatsApp + Email share",
      "Stone Vault — PDF history",
      "Multi-block scanning",
      "Grade override & manual dims",
      "3 user accounts",
      "Priority WhatsApp support",
    ],
    cta: "Get Pro",
    action: "signup_pro",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: null,
    period: "custom pricing",
    scans: -1,
    highlight: false,
    badge: "Enterprise",
    color: "#2d9e6b",
    features: [
      "Unlimited AI scans",
      "Physical audit service included",
      "Custom PDF branding",
      "Dedicated auditor",
      "API access",
      "Unlimited users",
      "SLA guarantee",
      "Dedicated account manager",
    ],
    cta: "Contact Us",
    action: "whatsapp_unlimited",
  },
];

const WHATSAPP_MSGS: Record<string, string> = {
  whatsapp_unlimited:
    "Hi StoneVision AI team, I am interested in the Unlimited Enterprise Plan for the Physical Audit and PDF generation tool. Please share pricing and onboarding details.",
  signup_starter:
    "Hi StoneVision AI team, I want to subscribe to the Starter Plan (Rs.4,777/mo, 200 scans). Please help me get started.",
  signup_pro:
    "Hi StoneVision AI team, I want to subscribe to the Pro Plan (Rs.9,777/mo, 500 scans). Please help me get started.",
};

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly"|"annual">("monthly");
  const [clicked, setClicked] = useState<string|null>(null);

  function handlePlan(plan: typeof PLANS[0]) {
    setClicked(plan.id);

    if (plan.action === "whatsapp_unlimited" || plan.action === "signup_starter" || plan.action === "signup_pro") {
      // For all plans send WhatsApp — admin activates manually
      const msg = WHATSAPP_MSGS[plan.action] || WHATSAPP_MSGS["whatsapp_unlimited"];
      const url = "https://wa.me/919655071432?text=" + encodeURIComponent(msg);
      window.open(url, "_blank");
      setTimeout(() => setClicked(null), 2000);
    }
  }

  const discount = billing === "annual" ? 0.8 : 1;

  return (
    <div style={{minHeight:"100vh",background:"#0a0908",color:"#f0ebe0",fontFamily:"sans-serif",paddingBottom:60}}>
      <style>{"@import url(\'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Playfair+Display:wght@400;600;700&display=swap\');"}</style>

      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(10,9,8,.97)",borderBottom:"1px solid #2a2620",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Link href="/dashboard" style={{color:"#c9a84c",textDecoration:"none",fontSize:20,marginRight:4}}>←</Link>
          <div style={{color:"#c9a84c",fontWeight:600,fontSize:14}}>Pricing Plans</div>
        </div>
        <Link href="/dashboard" style={{fontSize:11,color:"#6a6050",textDecoration:"none",border:"1px solid #2a2620",padding:"6px 12px",borderRadius:8}}>
          Dashboard
        </Link>
      </nav>

      <div style={{maxWidth:900,margin:"0 auto",padding:"40px 16px"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:10,color:"#c9a84c",letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>
            Simple, Transparent Pricing
          </div>
          <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(28px,5vw,44px)",color:"#f0ebe0",marginBottom:12,lineHeight:1.2}}>
            Start Free. Scale as You Grow.
          </h1>
          <p style={{fontSize:14,color:"#6a6050",maxWidth:480,margin:"0 auto 24px",lineHeight:1.7}}>
            Every plan includes AI granite analysis, multilingual PDFs, and WhatsApp sharing.
            No hidden fees. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div style={{display:"inline-flex",background:"#1a1814",border:"1px solid #2a2620",borderRadius:999,padding:4,gap:4}}>
            {(["monthly","annual"] as const).map(b=>(
              <button key={b} onClick={()=>setBilling(b)} style={{
                padding:"8px 20px",borderRadius:999,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",
                background:billing===b?"#c9a84c":"transparent",
                color:billing===b?"#0a0908":"#6a6050",transition:"all .2s"
              }}>
                {b==="monthly"?"Monthly":"Annual (20% off)"}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,marginBottom:40}}>
          {PLANS.map(plan=>{
            const price = plan.price ? Math.round(plan.price * discount) : null;
            const isClicked = clicked === plan.id;
            return (
              <div key={plan.id} style={{
                background:plan.highlight?"rgba(201,168,76,.06)":"#1a1814",
                border:`2px solid ${plan.highlight?"#c9a84c":"#2a2620"}`,
                borderRadius:20,padding:24,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"
              }}>
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position:"absolute",top:16,right:16,
                    background:plan.highlight?"#c9a84c":plan.color+"30",
                    color:plan.highlight?"#0a0908":plan.color,
                    padding:"3px 10px",borderRadius:999,fontSize:9,fontWeight:700,letterSpacing:1
                  }}>
                    {plan.badge.toUpperCase()}
                  </div>
                )}

                {/* Plan name */}
                <div style={{fontSize:11,color:plan.color,letterSpacing:2,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>{plan.name}</div>

                {/* Price */}
                <div style={{marginBottom:20}}>
                  {price ? (
                    <>
                      <span style={{fontFamily:"Playfair Display,serif",fontSize:36,color:"#f0ebe0",fontWeight:700}}>
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <span style={{fontSize:12,color:"#6a6050",marginLeft:6}}>{plan.period}</span>
                      {billing==="annual" && (
                        <div style={{fontSize:10,color:"#2d9e6b",marginTop:4}}>
                          Save ₹{Math.round(plan.price! * 0.2 * 12).toLocaleString("en-IN")}/year
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{fontFamily:"Playfair Display,serif",fontSize:28,color:"#f0ebe0",fontWeight:700}}>Custom</span>
                      <div style={{fontSize:11,color:"#6a6050",marginTop:4}}>Contact us for pricing</div>
                    </>
                  )}
                </div>

                {/* Scans */}
                <div style={{
                  background:`${plan.color}12`,border:`1px solid ${plan.color}30`,
                  borderRadius:10,padding:"8px 14px",fontSize:12,color:plan.color,
                  fontWeight:600,marginBottom:20,textAlign:"center"
                }}>
                  {plan.scans===-1?"Unlimited scans":plan.scans+" scans / month"}
                </div>

                {/* Features */}
                <ul style={{listStyle:"none",padding:0,margin:"0 0 24px",flex:1}}>
                  {plan.features.map(f=>(
                    <li key={f} style={{display:"flex",gap:10,marginBottom:10,fontSize:12,color:"#b8b09a",alignItems:"flex-start"}}>
                      <span style={{color:plan.color,flexShrink:0,marginTop:1}}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button onClick={()=>handlePlan(plan)} style={{
                  width:"100%",padding:"13px",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",
                  background:plan.highlight?"linear-gradient(135deg,#8a6820,#c9a84c,#e8c96a)":"transparent",
                  color:plan.highlight?"#0a0908":plan.color,
                  border:plan.highlight?"none":`2px solid ${plan.color}`,
                  opacity:isClicked?0.7:1,transition:"all .2s",
                  boxShadow:plan.highlight?"0 6px 24px rgba(201,168,76,.3)":"none",
                }}>
                  {isClicked?"Opening WhatsApp...":plan.cta}
                </button>

                {/* WhatsApp hint for enterprise */}
                {plan.action==="whatsapp_unlimited" && (
                  <div style={{fontSize:10,color:"#4a4438",textAlign:"center",marginTop:8}}>
                    💬 Opens WhatsApp chat directly
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Free trial banner */}
        <div style={{background:"rgba(45,158,107,.06)",border:"1px solid rgba(45,158,107,.2)",borderRadius:16,padding:20,textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:14,color:"#2d9e6b",fontWeight:600,marginBottom:6}}>
            🎉 Start with 100 free scans — no credit card required
          </div>
          <div style={{fontSize:12,color:"#6a6050",marginBottom:14}}>
            Your free trial includes all features for 30 days
          </div>
          <Link href="/signup" style={{display:"inline-block",background:"#2d9e6b",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:12,fontWeight:700,textDecoration:"none"}}>
            Start Free Trial
          </Link>
        </div>

        {/* FAQ */}
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <h3 style={{fontFamily:"Playfair Display,serif",fontSize:22,color:"#f0ebe0",marginBottom:20,textAlign:"center"}}>Common Questions</h3>
          {[
            {q:"How does payment work?",a:"We collect payment via UPI, bank transfer, or WhatsApp Pay. After confirming receipt, we activate your plan within 2 hours."},
            {q:"Can I upgrade or downgrade?",a:"Yes. Contact us on WhatsApp and we will adjust your plan immediately with prorated billing."},
            {q:"Is the AI accurate?",a:"Gemini Vision provides ±5-15% accuracy on dimensions. Every PDF includes a legal disclaimer. Physical audit service available for certified measurements."},
            {q:"What languages are supported?",a:"PDF catalogs can be generated in English, Tamil, Arabic, Chinese (Simplified), and Polish."},
          ].map(({q,a})=>(
            <div key={q} style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:12,padding:"16px 18px",marginBottom:10}}>
              <div style={{fontSize:13,color:"#f0ebe0",fontWeight:600,marginBottom:6}}>{q}</div>
              <div style={{fontSize:12,color:"#6a6050",lineHeight:1.6}}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky bottom nav */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,9,8,.97)",backdropFilter:"blur(20px)",borderTop:"1px solid #2a2620",display:"grid",gridTemplateColumns:"repeat(4,1fr)",zIndex:50}}>
        {[{href:"/dashboard",icon:"◈",label:"Home"},{href:"/scan",icon:"📷",label:"Scan",fab:true},{href:"/vault",icon:"📦",label:"Vault"},{href:"/pricing",icon:"💳",label:"Plans"}].map(({href,icon,label,fab})=>(
          <Link key={href} href={href} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"10px 0",color:href==="/pricing"?"#c9a84c":"#6a6050",textDecoration:"none"}}>
            {fab?<div style={{width:48,height:48,marginTop:-20,background:"linear-gradient(135deg,#8a6820,#c9a84c)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#0a0908"}}>{icon}</div>:<span style={{fontSize:20}}>{icon}</span>}
            <span style={{fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
