"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const SERVICES = [
  {id:"pre_shipment",icon:"🚢",title:"Pre-Shipment Inspection",price:4000,duration:"4-6 hours",color:"#5b8dd9"},
  {id:"full_audit",icon:"📋",title:"Full Quarry Audit",price:6000,duration:"Full day",color:"#c9a84c"},
  {id:"customs_docs",icon:"📜",title:"Customs Doc Verification",price:2500,duration:"2-3 hours",color:"#2d9e6b"},
];

const SLOTS = [
  {id:"morning",label:"Morning",time:"8AM-12PM",icon:"🌅"},
  {id:"afternoon",label:"Afternoon",time:"1PM-5PM",icon:"☀️"},
];

function BookForm() {
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [sid, setSid] = useState(params?.get("service") || "pre_shipment");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("morning");
  const [loc, setLoc] = useState("");
  const [blk, setBlk] = useState("");
  const [co, setCo] = useState("");
  const [cn, setCn] = useState("");
  const [ph, setPh] = useState("");
  const [nt, setNt] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const svc = SERVICES.find(s=>s.id===sid)||SERVICES[0];
  const slotObj = SLOTS.find(s=>s.id===slot)||SLOTS[0];
  const inp = {width:"100%",background:"#1a1814",border:"1px solid #2a2620",color:"#f0ebe0",borderRadius:10,padding:"12px 14px",fontSize:13,outline:"none",boxSizing:"border-box" as const,fontFamily:"sans-serif"};

  function send() {
    if (!co||!cn||!ph) { alert("Fill company, contact and WhatsApp"); return; }
    setBusy(true);
    const ref = "SV-"+Date.now().toString(36).toUpperCase();
    const msg = [
      "New Audit Booking - StoneVision AI",
      "Service: "+svc.title,
      "Price: Rs."+svc.price.toLocaleString("en-IN"),
      "Company: "+co,
      "Contact: "+cn,
      "WhatsApp: "+ph,
      "Location: "+loc,
      "Date: "+date,
      "Time: "+slotObj.label+" ("+slotObj.time+")",
      "Blocks: "+(blk||"Not specified"),
      nt?"Notes: "+nt:"",
      "Status: PENDING ASSIGNMENT",
      "Ref: "+ref,
    ].filter(Boolean).join("%0A");
    window.open("https://wa.me/919655071432?text="+msg,"_blank");
    setTimeout(()=>{setBusy(false);setDone(true);},1500);
  }

  if (done) return (
    <div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#1a1814",border:"1px solid rgba(45,158,107,.3)",borderRadius:24,padding:32,maxWidth:400,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>✅</div>
        <h2 style={{fontFamily:"serif",fontSize:22,color:"#f0ebe0",marginBottom:12}}>Booking Sent!</h2>
        <p style={{fontSize:13,color:"#8a8070",lineHeight:1.6,marginBottom:20}}>We will confirm via WhatsApp within 4 hours with auditor details.</p>
        <div style={{background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.2)",borderRadius:12,padding:16,marginBottom:20,textAlign:"left"}}>
          <div style={{fontSize:10,color:"#c9a84c",marginBottom:8}}>BOOKING SUMMARY</div>
          <div style={{fontSize:12,color:"#b8b09a",lineHeight:2}}>
            <div><b style={{color:"#f0ebe0"}}>Service:</b> {svc.title}</div>
            <div><b style={{color:"#f0ebe0"}}>Date:</b> {date}</div>
            <div><b style={{color:"#f0ebe0"}}>Time:</b> {slotObj.label}</div>
            <div><b style={{color:"#f0ebe0"}}>Price:</b> Rs.{svc.price.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div style={{fontSize:11,color:"#d4840a",marginBottom:20}}>Status: Pending Auditor Assignment</div>
        <Link href="/dashboard" style={{display:"block",background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",padding:"12px",borderRadius:12,fontSize:13,fontWeight:700,textDecoration:"none"}}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0a0908",color:"#f0ebe0",fontFamily:"sans-serif",paddingBottom:60}}>
      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(10,9,8,.97)",borderBottom:"1px solid #2a2620",padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}>
        <Link href="/audit" style={{color:"#c9a84c",textDecoration:"none",fontSize:20}}>←</Link>
        <div>
          <div style={{color:"#c9a84c",fontWeight:600,fontSize:14}}>Book Physical Audit</div>
          <div style={{color:"#4a4438",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>Step {step} of 3</div>
        </div>
      </nav>
      <div style={{height:3,background:"#2a2620"}}>
        <div style={{height:"100%",width:((step/3)*100)+"%",background:"linear-gradient(90deg,#8a6820,#c9a84c)",transition:"width .3s"}}/>
      </div>

      <div style={{maxWidth:520,margin:"0 auto",padding:"24px 16px"}}>

        {step===1 && (
          <div>
            <h2 style={{fontFamily:"serif",fontSize:22,color:"#f0ebe0",marginBottom:6}}>Select Service</h2>
            <p style={{fontSize:12,color:"#6a6050",marginBottom:20}}>Choose the audit type that fits your needs</p>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
              {SERVICES.map(s=>(
                <button key={s.id} onClick={()=>setSid(s.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:16,cursor:"pointer",textAlign:"left",background:sid===s.id?"rgba(201,168,76,.08)":"#1a1814",border:sid===s.id?"2px solid #c9a84c":"1px solid #2a2620",color:"#f0ebe0",width:"100%"}}>
                  <span style={{fontSize:32}}>{s.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600}}>{s.title}</div>
                    <div style={{fontSize:11,color:"#6a6050",marginTop:3}}>{s.duration}</div>
                  </div>
                  <div style={{color:s.color,fontWeight:700}}>Rs.{s.price.toLocaleString("en-IN")}</div>
                </button>
              ))}
            </div>
            <button onClick={()=>setStep(2)} style={{width:"100%",background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",borderRadius:12,padding:"14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Continue</button>
          </div>
        )}

        {step===2 && (
          <div>
            <h2 style={{fontFamily:"serif",fontSize:22,color:"#f0ebe0",marginBottom:6}}>Schedule</h2>
            <p style={{fontSize:12,color:"#6a6050",marginBottom:20}}>When and where should we visit?</p>
            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>PREFERRED DATE *</div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} min={new Date(Date.now()+86400000).toISOString().split("T")[0]} style={inp}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:8}}>TIME SLOT *</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {SLOTS.map(t=>(
                    <button key={t.id} onClick={()=>setSlot(t.id)} style={{padding:"14px",borderRadius:12,cursor:"pointer",background:slot===t.id?"rgba(201,168,76,.1)":"#1a1814",border:slot===t.id?"2px solid #c9a84c":"1px solid #2a2620",color:slot===t.id?"#c9a84c":"#b8b09a",textAlign:"center"}}>
                      <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
                      <div style={{fontSize:12,fontWeight:600}}>{t.label}</div>
                      <div style={{fontSize:10,color:"#6a6050",marginTop:2}}>{t.time}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>LOCATION *</div>
                <textarea value={loc} onChange={e=>setLoc(e.target.value)} placeholder="Quarry address..." rows={3} style={{...inp,resize:"vertical" as const}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>BLOCK COUNT</div>
                <input type="number" value={blk} onChange={e=>setBlk(e.target.value)} placeholder="e.g. 45" style={inp}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} style={{flex:1,background:"#1a1814",border:"1px solid #2a2620",color:"#6a6050",borderRadius:12,padding:"12px",cursor:"pointer"}}>Back</button>
              <button onClick={()=>{if(!date||!loc){alert("Fill date and location");return;}setStep(3);}} style={{flex:2,background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Continue</button>
            </div>
          </div>
        )}

        {step===3 && (
          <div>
            <h2 style={{fontFamily:"serif",fontSize:22,color:"#f0ebe0",marginBottom:6}}>Your Details</h2>
            <p style={{fontSize:12,color:"#6a6050",marginBottom:20}}>We confirm via WhatsApp within 4 hours</p>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>COMPANY NAME *</div>
                <input value={co} onChange={e=>setCo(e.target.value)} placeholder="Aryan Granites Pvt Ltd" style={inp}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>CONTACT NAME *</div>
                <input value={cn} onChange={e=>setCn(e.target.value)} placeholder="Your name" style={inp}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>WHATSAPP *</div>
                <input type="tel" value={ph} onChange={e=>setPh(e.target.value)} placeholder="+91 98765 43210" style={inp}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>NOTES</div>
                <textarea value={nt} onChange={e=>setNt(e.target.value)} placeholder="Any special requirements..." rows={2} style={{...inp,resize:"vertical" as const}}/>
              </div>
            </div>
            <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:12,padding:14,marginBottom:16}}>
              <div style={{fontSize:10,color:"#6a6050",marginBottom:10}}>BOOKING SUMMARY</div>
              {[["Service",svc.title],["Date",date],["Time",slotObj.label],["Price","Rs."+svc.price.toLocaleString("en-IN")]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #2a2620",fontSize:12}}>
                  <span style={{color:"#6a6050"}}>{k}</span>
                  <span style={{color:"#f0ebe0",fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(2)} style={{flex:1,background:"#1a1814",border:"1px solid #2a2620",color:"#6a6050",borderRadius:12,padding:"12px",cursor:"pointer"}}>Back</button>
              <button onClick={send} disabled={busy} style={{flex:2,background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",opacity:busy?0.6:1}}>
                {busy?"Sending...":"Confirm via WhatsApp"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#c9a84c"}}>Loading...</div></div>}>
      <BookForm/>
    </Suspense>
  );
}
