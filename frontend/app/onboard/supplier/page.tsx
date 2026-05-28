"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface InviteData {
  token: string;
  exporter_name: string;
  exporter_company: string;
  supplier_company: string;
  contact_person: string;
  audit_type: string;
  audit_type_label: string;
  expires_at: string;
}

function SupplierLanding() {
  const params = useSearchParams();
  const token = params?.get("token") || "";
  const [invite, setInvite] = useState<InviteData|null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [step,    setStep]    = useState(1);
  const [booked,  setBooked]  = useState(false);
  const [date,    setDate]    = useState("");
  const [slot,    setSlot]    = useState("morning");
  const [phone,   setPhone]   = useState("");

  useEffect(() => {
    if (!token) { setError("Invalid invitation link"); setLoading(false); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invite/verify?token=${token}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.detail)))
      .then(d => { setInvite(d); setLoading(false); })
      .catch(e => { setError(typeof e==="string"?e:"Invitation not found or expired"); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:28,height:28,border:"2px solid #c9a84c",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"sans-serif"}}>
      <div style={{background:"#1a1814",border:"1px solid rgba(192,57,43,.3)",borderRadius:20,padding:32,maxWidth:400,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>❌</div>
        <div style={{fontSize:16,color:"#f0ebe0",marginBottom:8}}>Invalid Invitation</div>
        <div style={{fontSize:12,color:"#8a8070",lineHeight:1.6}}>{error}</div>
      </div>
    </div>
  );

  if (!invite) return null;

  if (booked) return (
    <div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"sans-serif"}}>
      <div style={{background:"#1a1814",border:"1px solid rgba(45,158,107,.3)",borderRadius:24,padding:32,maxWidth:440,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>✅</div>
        <h2 style={{fontSize:22,color:"#f0ebe0",marginBottom:8}}>Audit Scheduled!</h2>
        <p style={{fontSize:13,color:"#8a8070",lineHeight:1.6,marginBottom:20}}>
          Your audit has been booked. Our inspector will contact you on WhatsApp 24 hours before the visit.
        </p>
        <div style={{background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.2)",borderRadius:12,padding:16,textAlign:"left",marginBottom:20}}>
          <div style={{fontSize:10,color:"#c9a84c",marginBottom:8}}>BOOKING DETAILS</div>
          <div style={{fontSize:12,color:"#b8b09a",lineHeight:1.8}}>
            <div><b style={{color:"#f0ebe0"}}>Audit Type:</b> {invite.audit_type_label}</div>
            <div><b style={{color:"#f0ebe0"}}>Requested by:</b> {invite.exporter_name} ({invite.exporter_company})</div>
            <div><b style={{color:"#f0ebe0"}}>Date:</b> {date}</div>
            <div><b style={{color:"#f0ebe0"}}>Time:</b> {slot==="morning"?"8AM–12PM":"1PM–5PM"}</div>
          </div>
        </div>
        <div style={{fontSize:11,color:"#6a6050"}}>
          You will receive WhatsApp confirmation within 4 hours from +91 9655071432
        </div>
      </div>
    </div>
  );

  const inp = {width:"100%",background:"#1a1814",border:"1px solid #2a2620",color:"#f0ebe0",borderRadius:10,padding:"11px 14px",fontSize:13,outline:"none",boxSizing:"border-box" as const};

  return (
    <div style={{minHeight:"100vh",background:"#0a0908",color:"#f0ebe0",fontFamily:"sans-serif",paddingBottom:40}}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(180deg,rgba(201,168,76,.08) 0%,transparent 100%)",borderBottom:"1px solid #2a2620",padding:"20px 16px",textAlign:"center"}}>
        <div style={{fontSize:28,color:"#c9a84c",marginBottom:4}}>◈</div>
        <div style={{fontSize:10,color:"#4a4438",letterSpacing:3,textTransform:"uppercase"}}>StoneVision AI · Audit Invitation</div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"28px 16px"}}>

        {/* Exporter request card */}
        <div style={{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.2)",borderRadius:20,padding:22,marginBottom:28}}>
          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,#8a6820,#c9a84c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤝</div>
            <div>
              <div style={{fontSize:11,color:"#c9a84c",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Audit Request</div>
              <p style={{fontSize:14,color:"#f0ebe0",lineHeight:1.5,margin:"0 0 6px",fontWeight:500}}>
                <strong style={{color:"#c9a84c"}}>{invite.exporter_name}</strong> from{" "}
                <strong style={{color:"#c9a84c"}}>{invite.exporter_company}</strong> has requested a physical audit for your upcoming shipment.
              </p>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(45,158,107,.1)",border:"1px solid rgba(45,158,107,.3)",borderRadius:999,padding:"3px 12px",fontSize:10,color:"#2d9e6b"}}>
                📋 {invite.audit_type_label}
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{display:"flex",gap:8,marginBottom:24,alignItems:"center"}}>
          {[1,2,3].map(n=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:8,flex:n<3?1:0}}>
              <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:step>=n?"#c9a84c":"#1a1814",color:step>=n?"#0a0908":"#4a4438",border:`1px solid ${step>=n?"#c9a84c":"#2a2620"}`}}>
                {step>n?"✓":n}
              </div>
              <span style={{fontSize:10,color:step>=n?"#c9a84c":"#4a4438"}}>
                {n===1?"Confirm Details":n===2?"Choose Date":"Book Audit"}
              </span>
              {n<3 && <div style={{flex:1,height:1,background:step>n?"#c9a84c":"#2a2620"}}/>}
            </div>
          ))}
        </div>

        {/* Step 1: Confirm */}
        {step===1 && (
          <div>
            <h2 style={{fontSize:20,color:"#f0ebe0",marginBottom:6}}>Confirm Your Details</h2>
            <p style={{fontSize:12,color:"#6a6050",marginBottom:20,lineHeight:1.6}}>
              This audit has been requested by your buyer to verify your shipment meets international quality standards.
            </p>
            <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:14,overflow:"hidden",marginBottom:20}}>
              {[
                ["Your Company",invite.supplier_company],
                ["Contact Person",invite.contact_person],
                ["Audit Requested",invite.audit_type_label],
                ["Requested By",`${invite.exporter_name}, ${invite.exporter_company}`],
                ["Link Expires",new Date(invite.expires_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #2a2620",fontSize:12}}>
                  <span style={{color:"#6a6050"}}>{k}</span>
                  <span style={{color:"#f0ebe0",fontWeight:500,textAlign:"right",maxWidth:"55%"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>setStep(2)} style={{width:"100%",background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",borderRadius:12,padding:"13px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Yes, Schedule My Audit →
              </button>
              <a href={`https://wa.me/919655071432?text=${encodeURIComponent("Hi, I received an audit invitation from "+invite.exporter_company+". I have questions about the process.")}`}
                target="_blank" rel="noopener"
                style={{display:"block",textAlign:"center",fontSize:12,color:"#2d9e6b",textDecoration:"none"}}>
                💬 Have questions? Chat with us on WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Step 2: Date + Time */}
        {step===2 && (
          <div>
            <h2 style={{fontSize:20,color:"#f0ebe0",marginBottom:6}}>Choose Date & Time</h2>
            <p style={{fontSize:12,color:"#6a6050",marginBottom:20}}>Select when our inspector should visit your facility.</p>
            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>PREFERRED DATE</div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                  min={new Date(Date.now()+86400000).toISOString().split("T")[0]} style={inp}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:8}}>TIME SLOT</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[{id:"morning",icon:"🌅",label:"Morning",time:"8AM–12PM"},{id:"afternoon",icon:"☀️",label:"Afternoon",time:"1PM–5PM"}].map(t=>(
                    <button key={t.id} onClick={()=>setSlot(t.id)} style={{padding:"14px",borderRadius:12,cursor:"pointer",background:slot===t.id?"rgba(201,168,76,.1)":"#1a1814",border:slot===t.id?"2px solid #c9a84c":"1px solid #2a2620",color:slot===t.id?"#c9a84c":"#b8b09a",textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:5}}>{t.icon}</div>
                      <div style={{fontSize:12,fontWeight:600}}>{t.label}</div>
                      <div style={{fontSize:10,color:"#6a6050",marginTop:2}}>{t.time}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>YOUR WHATSAPP (for confirmation)</div>
                <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
                  placeholder="+91 98765 43210" style={inp}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} style={{flex:1,background:"#1a1814",border:"1px solid #2a2620",color:"#6a6050",borderRadius:12,padding:"12px",cursor:"pointer"}}>Back</button>
              <button onClick={()=>{if(!date){alert("Please select a date");return;}setStep(3);}} style={{flex:2,background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm booking */}
        {step===3 && (
          <div>
            <h2 style={{fontSize:20,color:"#f0ebe0",marginBottom:6}}>Confirm Booking</h2>
            <p style={{fontSize:12,color:"#6a6050",marginBottom:20}}>Review and confirm your audit appointment.</p>
            <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:14,overflow:"hidden",marginBottom:16}}>
              {[
                ["Audit Type",invite.audit_type_label],
                ["Date",date],
                ["Time",slot==="morning"?"8AM–12PM":"1PM–5PM"],
                ["Your WhatsApp",phone||"Not provided"],
                ["Requested By",invite.exporter_company],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #2a2620",fontSize:12}}>
                  <span style={{color:"#6a6050"}}>{k}</span>
                  <span style={{color:"#f0ebe0",fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.15)",borderRadius:12,padding:14,marginBottom:16,fontSize:11,color:"#b8a070",lineHeight:1.6}}>
              💡 Our inspector will call you on the provided WhatsApp number 1 hour before arrival. The audit takes 2-6 hours depending on type. Payment is collected after completion.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(2)} style={{flex:1,background:"#1a1814",border:"1px solid #2a2620",color:"#6a6050",borderRadius:12,padding:"12px",cursor:"pointer"}}>Back</button>
              <button onClick={()=>{
                const msg = "New supplier audit booking:%0AToken: "+token+"%0ADate: "+date+"%0ATime: "+slot+"%0AWhatsApp: "+phone+"%0AAudit: "+invite.audit_type_label+"%0ASupplier: "+invite.supplier_company;
                window.open("https://wa.me/919655071432?text="+msg,"_blank");
                setBooked(true);
              }} style={{flex:2,background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                ✓ Confirm Audit Booking
              </button>
            </div>
          </div>
        )}

        {/* Trust footer */}
        <div style={{marginTop:32,textAlign:"center",borderTop:"1px solid #1a1814",paddingTop:20}}>
          <div style={{fontSize:11,color:"#c9a84c",marginBottom:6}}>◈ StoneVision AI</div>
          <div style={{fontSize:10,color:"#3a3428",lineHeight:1.6}}>
            Trusted audit verification platform · Madurai, Tamil Nadu<br/>
            This invitation is valid for 7 days · Your data is encrypted and private
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupplierOnboardPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#c9a84c"}}>Loading invitation...</div></div>}>
      <SupplierLanding/>
    </Suspense>
  );
}
